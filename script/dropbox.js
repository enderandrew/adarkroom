 /* Dropbox save sync.
 *
 * To make this work, in https://www.dropbox.com/developers/apps :
 *
 *   1. Open your app (the existing key below was registered for the old
 *      Datastore API, so double check its settings) or create a new one.
 *   2. Permissions tab: enable "App folder" access under Files and folders,
 *      unless you deliberately want Full Dropbox access. App folder is the
 *      minimum needed here -- the game only ever touches its own folder,
 *      never anything else in your Dropbox.
 *   3. If it's a "scoped app" (anything created recently is), tick
 *      files.content.write and files.content.read under Permissions, then
 *      save -- Dropbox makes you re-authorize existing connections after
 *      changing scopes, which is expected.
 *   4. Settings tab -> OAuth 2 -> Redirect URIs: add the EXACT URL this game
 *      is served from, including the trailing slash if your server has one,
 *      e.g. https://enderandrew.com/adarkroom/ . This has to match
 *      character-for-character what getRedirectUri() below sends, which is
 *      the current page URL with any ?query or #hash stripped -- if you
 *      serve the game from more than one URL (with/without trailing slash,
 *      a custom domain and a github.io fallback, etc.) add all of them as
 *      separate Redirect URIs.
 *   5. Copy the app key from the Settings tab into CLIENT_ID below if it
 *      isn't already the one you want to use.
 *
 * Saves are stored as plain files (adarkroom-save-0.txt .. -4.txt) in the
 * App Folder, in the same base64 format Engine.export64()/import64() already
 * use for manual copy-paste export -- so a save downloaded from Dropbox goes
 * through the exact same validation as a pasted or uploaded one (see
 * Engine.import64 in engine.js). Nothing from Dropbox is trusted any more
 * than a stranger's pasted text would be.
 */
(function (Engine, Events, Notifications, Button, $) {

	'use strict';

	if (!Engine) { return; }

	var DropboxConnector = {

		// See setup step 5 above.
		CLIENT_ID: 'a4gruy9ol789f14',

		AUTH_URL: 'https://www.dropbox.com/oauth2/authorize',
		TOKEN_URL: 'https://api.dropboxapi.com/oauth2/token',
		UPLOAD_URL: 'https://content.dropboxapi.com/2/files/upload',
		DOWNLOAD_URL: 'https://content.dropboxapi.com/2/files/download',
		LIST_URL: 'https://api.dropboxapi.com/2/files/list_folder',
		REVOKE_URL: 'https://api.dropboxapi.com/2/auth/token/revoke',

		// localStorage key for the token record. Deliberately separate from
		// localStorage.gameState -- this is credentials, not save data, and
		// the two should never be able to collide or be confused for one
		// another by anything that later iterates localStorage keys.
		STORAGE_KEY: 'dropboxAuth',
		// sessionStorage rather than localStorage: the PKCE verifier only
		// needs to survive the redirect out to Dropbox and back, in the same
		// tab, and should not linger in the profile indefinitely once used.
		VERIFIER_KEY: 'dropboxPkceVerifier',

		SLOT_COUNT: 5,
		_slots: null,
		_log: false,

		init: function (options) {
			options = options || {};
			this._log = !!options.log;
			// If this load IS the redirect back from Dropbox, this both
			// completes the token exchange and scrubs ?code=... from the
			// address bar so a page refresh can't resubmit a spent code.
			DropboxConnector.handleRedirect();
			return this;
		},

		/* ------------------------------------------------------------------
		 * PKCE
		 * ------------------------------------------------------------------ */

		base64UrlEncode: function (bytes) {
			var str = '';
			for (var i = 0; i < bytes.length; i++) {
				str += String.fromCharCode(bytes[i]);
			}
			return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
		},

		generateCodeVerifier: function () {
			var arr = new Uint8Array(64);
			crypto.getRandomValues(arr);
			return DropboxConnector.base64UrlEncode(arr);
		},

		generateCodeChallenge: function (verifier) {
			var bytes = new TextEncoder().encode(verifier);
			return crypto.subtle.digest('SHA-256', bytes).then(function (digest) {
				return DropboxConnector.base64UrlEncode(new Uint8Array(digest));
			});
		},

		/* ------------------------------------------------------------------
		 * Auth flow
		 * ------------------------------------------------------------------ */

		// The redirect URI Dropbox sends the browser back to must match,
		// character for character, an entry in the app's Redirect URIs list
		// (setup step 4). Stripping the query/hash makes this stable across
		// however the game happened to be linked to (with a stray #fragment,
		// a lang= query param, etc.) rather than depending on the exact URL
		// the player's browser tab had at the moment they clicked "connect".
		getRedirectUri: function () {
			var url = window.location.href;
			var idx = url.indexOf('#');
			if (idx !== -1) { url = url.substring(0, idx); }
			idx = url.indexOf('?');
			if (idx !== -1) { url = url.substring(0, idx); }
			return url;
		},

		buildQuery: function (params) {
			var parts = [];
			for (var k in params) {
				if (Object.prototype.hasOwnProperty.call(params, k) && params[k] != null) {
					parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(params[k]));
				}
			}
			return parts.join('&');
		},

		parseQueryParams: function (search) {
			var out = {};
			if (!search || search.charAt(0) !== '?') { return out; }
			search.substring(1).split('&').forEach(function (pair) {
				if (!pair) { return; }
				var eq = pair.indexOf('=');
				var k = eq === -1 ? pair : pair.substring(0, eq);
				var v = eq === -1 ? '' : pair.substring(eq + 1);
				out[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' '));
			});
			return out;
		},

		// Kicks off the redirect to Dropbox. There is nothing to await here
		// on this side -- the browser navigates away and, on success, comes
		// straight back to getRedirectUri() with ?code=... in the URL, which
		// handleRedirect() picks up on the next page load.
		startAuth: function () {
			var verifier = DropboxConnector.generateCodeVerifier();
			sessionStorage.setItem(DropboxConnector.VERIFIER_KEY, verifier);
			DropboxConnector.generateCodeChallenge(verifier).then(function (challenge) {
				var url = DropboxConnector.AUTH_URL + '?' + DropboxConnector.buildQuery({
					client_id: DropboxConnector.CLIENT_ID,
					response_type: 'code',
					code_challenge: challenge,
					code_challenge_method: 'S256',
					redirect_uri: DropboxConnector.getRedirectUri(),
					// Grants a refresh_token alongside the access_token, so
					// the player doesn't have to re-authorize every few
					// hours when the short-lived access_token expires.
					token_access_type: 'offline'
				});
				window.location.assign(url);
			});
		},

		handleRedirect: function () {
			var params = DropboxConnector.parseQueryParams(window.location.search);
			if (!params.code && !params.error) { return; }

			// Scrub the query string immediately, before the async exchange
			// even starts -- a reload mid-exchange must not resend a code
			// Dropbox will already consider used.
			if (window.history && window.history.replaceState) {
				window.history.replaceState({}, document.title, DropboxConnector.getRedirectUri());
			}

			if (params.error) {
				DropboxConnector.log('Dropbox auth error: ' + params.error);
				return;
			}

			var verifier = sessionStorage.getItem(DropboxConnector.VERIFIER_KEY);
			sessionStorage.removeItem(DropboxConnector.VERIFIER_KEY);
			if (!verifier) {
				// Most likely the redirect landed in a different tab/session
				// than the one that started it. Nothing recoverable to do.
				DropboxConnector.log('Dropbox auth: missing PKCE verifier on return');
				return;
			}

			DropboxConnector.exchangeCodeForToken(params.code, verifier);
		},

		exchangeCodeForToken: function (code, verifier) {
			var body = DropboxConnector.buildQuery({
				code: code,
				grant_type: 'authorization_code',
				client_id: DropboxConnector.CLIENT_ID,
				code_verifier: verifier,
				redirect_uri: DropboxConnector.getRedirectUri()
			});
			return fetch(DropboxConnector.TOKEN_URL, {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: body
			}).then(function (r) { return r.json(); })
				.then(function (data) {
					if (data.access_token) {
						DropboxConnector.saveTokens(data);
					} else {
						DropboxConnector.log('Dropbox token exchange failed: ' + JSON.stringify(data));
					}
				})
				.catch(function (e) { DropboxConnector.log('Dropbox token exchange error: ' + e); });
		},

		/* ------------------------------------------------------------------
		 * Token storage / refresh
		 * ------------------------------------------------------------------ */

		saveTokens: function (data) {
			var existing = DropboxConnector.loadTokens();
			var record = {
				access_token: data.access_token,
				// A refresh grant doesn't repeat the refresh_token, so keep
				// the one already on file if this response didn't include a
				// new one.
				refresh_token: data.refresh_token || existing.refresh_token,
				expires_at: Date.now() + (Number(data.expires_in || 0) * 1000)
			};
			localStorage.setItem(DropboxConnector.STORAGE_KEY, JSON.stringify(record));
		},

		loadTokens: function () {
			try {
				return JSON.parse(localStorage.getItem(DropboxConnector.STORAGE_KEY)) || {};
			} catch (e) {
				return {};
			}
		},

		isConnected: function () {
			var t = DropboxConnector.loadTokens();
			return !!(t.access_token || t.refresh_token);
		},

		// Resolves to a currently-valid access token, transparently
		// refreshing if the cached one has expired (or is about to, inside a
		// minute -- avoids a request landing right on the boundary).
		ensureFreshToken: function () {
			var t = DropboxConnector.loadTokens();
			if (t.access_token && t.expires_at && Date.now() < t.expires_at - 60000) {
				return Promise.resolve(t.access_token);
			}
			if (!t.refresh_token) {
				return Promise.reject(new Error('not connected to dropbox'));
			}
			var body = DropboxConnector.buildQuery({
				grant_type: 'refresh_token',
				refresh_token: t.refresh_token,
				client_id: DropboxConnector.CLIENT_ID
			});
			return fetch(DropboxConnector.TOKEN_URL, {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: body
			}).then(function (r) { return r.json(); })
				.then(function (data) {
					if (!data.access_token) {
						throw new Error('token refresh failed');
					}
					DropboxConnector.saveTokens(data);
					return data.access_token;
				});
		},

		signout: function () {
			var t = DropboxConnector.loadTokens();
			localStorage.removeItem(DropboxConnector.STORAGE_KEY);
			DropboxConnector._slots = null;
			if (t.access_token) {
				// Best-effort -- the local record is already gone either way.
				fetch(DropboxConnector.REVOKE_URL, {
					method: 'POST',
					headers: { 'Authorization': 'Bearer ' + t.access_token }
				}).catch(function () {});
			}
		},

		/* ------------------------------------------------------------------
		 * File operations -- App Folder scope, so these paths are relative to
		 * the game's own dedicated folder, never anywhere else in Dropbox.
		 * ------------------------------------------------------------------ */

		slotPath: function (slot) {
			return '/adarkroom-save-' + slot + '.txt';
		},

		uploadSave: function (slot, contents) {
			return DropboxConnector.ensureFreshToken().then(function (token) {
				return fetch(DropboxConnector.UPLOAD_URL, {
					method: 'POST',
					headers: {
						'Authorization': 'Bearer ' + token,
						'Dropbox-API-Arg': JSON.stringify({
							path: DropboxConnector.slotPath(slot),
							mode: 'overwrite',
							mute: true
						}),
						'Content-Type': 'application/octet-stream'
					},
					body: contents
				});
			}).then(function (r) {
				if (!r.ok) { throw new Error('upload failed: ' + r.status); }
				return r.json();
			});
		},

		downloadSave: function (slot) {
			return DropboxConnector.ensureFreshToken().then(function (token) {
				return fetch(DropboxConnector.DOWNLOAD_URL, {
					method: 'POST',
					headers: {
						'Authorization': 'Bearer ' + token,
						'Dropbox-API-Arg': JSON.stringify({ path: DropboxConnector.slotPath(slot) })
					}
				});
			}).then(function (r) {
				if (!r.ok) { throw new Error('download failed: ' + r.status); }
				return r.text();
			});
		},

		// Maps slot number -> {client_modified} for whichever save files
		// currently exist, so the menu can show real dates instead of
		// guessing. A brand new App Folder with nothing in it yet is a
		// perfectly normal, successful response here, not an error.
		listSaves: function () {
			return DropboxConnector.ensureFreshToken().then(function (token) {
				return fetch(DropboxConnector.LIST_URL, {
					method: 'POST',
					headers: {
						'Authorization': 'Bearer ' + token,
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ path: '' })
				});
			}).then(function (r) {
				if (!r.ok) { throw new Error('list_folder failed: ' + r.status); }
				return r.json();
			}).then(function (data) {
				var found = {};
				(data.entries || []).forEach(function (entry) {
					var m = /^\/adarkroom-save-(\d+)\.txt$/i.exec(entry.path_lower);
					if (m) { found[m[1]] = entry; }
				});
				return found;
			});
		},

		/* ------------------------------------------------------------------
		 * UI
		 * ------------------------------------------------------------------ */

		startDropbox: function () {
			if (!DropboxConnector.isConnected()) {
				DropboxConnector.startConnectEvent();
			} else {
				DropboxConnector.startMainEvent();
			}
		},

		startConnectEvent: function () {
			Events.startEvent({
				title: _('Dropbox'),
				scenes: {
					start: {
						text: [
							_('connect this game to your dropbox account?'),
							_('saves are kept in a dedicated app folder dropbox creates for this game. nothing else in your dropbox is read or touched.')
						],
						buttons: {
							'connect': {
								text: _('connect'),
								nextScene: 'end',
								onChoose: DropboxConnector.startAuth
							},
							'cancel': {
								text: _('cancel'),
								nextScene: 'end'
							}
						}
					}
				}
			});
		},

		// Fetches the current slot listing before opening the menu, so the
		// slot buttons can show real "last saved" dates rather than a
		// generic placeholder that would need a second round trip to fill in
		// after the event is already on screen.
		startMainEvent: function () {
			Notifications.notify(null, _('checking dropbox...'));
			DropboxConnector.listSaves().then(function (slots) {
				DropboxConnector._slots = slots;
				Events.startEvent(DropboxConnector.buildMainEvent());
			}).catch(function (e) {
				DropboxConnector.log('Dropbox list failed: ' + e);
				DropboxConnector.startErrorEvent(_('could not reach dropbox. check your connection and try again.'));
			});
		},

		buildMainEvent: function () {
			return {
				title: _('Dropbox'),
				scenes: {
					start: {
						text: [_('export or import your save via dropbox.')],
						buttons: {
							'save': { text: _('save'), nextScene: { 1: 'saveToSlot' } },
							'load': { text: _('load'), nextScene: { 1: 'loadFromSlot' } },
							'disconnect': {
								text: _('disconnect'),
								nextScene: 'end',
								onChoose: DropboxConnector.signout
							},
							'cancel': { text: _('cancel'), nextScene: 'end' }
						}
					},
					'saveToSlot': {
						text: [_('choose a slot to save to. this will overwrite anything already there.')],
						buttons: DropboxConnector.buildSlotButtons('save')
					},
					'loadFromSlot': {
						text: [_('choose a slot to load. this will replace your current game.')],
						buttons: DropboxConnector.buildSlotButtons('load')
					}
				}
			};
		},

		buildSlotButtons: function (mode) {
			var buttons = {};
			for (var n = 0; n < DropboxConnector.SLOT_COUNT; n++) {
				var entry = DropboxConnector._slots && DropboxConnector._slots[n];
				// The load menu only offers slots that actually have
				// something in them -- nothing to load from an empty one.
				if (mode === 'load' && !entry) { continue; }
				buttons['slot' + n] = {
					text: entry ?
						_('slot {0}: {1}', n, DropboxConnector.formatDate(entry.client_modified)) :
						_('slot {0}: empty', n),
					nextScene: 'end',
					onChoose: (function (slot) {
						return function () {
							if (mode === 'save') {
								DropboxConnector.doSave(slot);
							} else {
								DropboxConnector.doLoad(slot);
							}
						};
					})(n)
				};
			}
			buttons.cancel = { text: _('cancel'), nextScene: 'end' };
			return buttons;
		},

		doSave: function (slot) {
			Notifications.notify(null, _('saving to dropbox...'));
			DropboxConnector.uploadSave(slot, Engine.export64())
				.then(function () {
					Notifications.notify(null, _('saved to dropbox'));
				})
				.catch(function (e) {
					DropboxConnector.log('Dropbox save failed: ' + e);
					DropboxConnector.startErrorEvent(_('could not save to dropbox. nothing was lost -- your local game is unaffected.'));
				});
		},

		doLoad: function (slot) {
			Notifications.notify(null, _('loading from dropbox...'));
			DropboxConnector.downloadSave(slot)
				.then(function (text) {
					/* Routed through Engine.import64() rather than writing
					 * localStorage directly -- a file that came out of
					 * Dropbox gets exactly the same base64/JSON/prototype-
					 * pollution/size validation as a pasted or uploaded save
					 * (see engine.js). Nothing from the network is trusted
					 * any further than that. import64() itself handles the
					 * reload on success and leaves the current game
					 * untouched on failure. */
					if (!Engine.import64(text)) {
						DropboxConnector.startErrorEvent(_('that save could not be read. nothing has been changed.'));
					}
				})
				.catch(function (e) {
					DropboxConnector.log('Dropbox load failed: ' + e);
					DropboxConnector.startErrorEvent(_('could not load from dropbox. your current game is unaffected.'));
				});
		},

		startErrorEvent: function (message) {
			Events.startEvent({
				title: _('Dropbox'),
				scenes: {
					start: {
						text: [message],
						buttons: {
							'ok': { text: _('ok'), nextScene: 'end' }
						}
					}
				}
			});
		},

		/* ------------------------------------------------------------------
		 * Helpers
		 * ------------------------------------------------------------------ */

		formatDate: function (iso) {
			var d = new Date(iso);
			if (isNaN(d.getTime())) { return iso; }
			return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
		},

		log: function (msg) {
			if (this._log && typeof console !== 'undefined') {
				console.log('[Dropbox]', msg);
			}
		}
	};

	Engine.Dropbox = DropboxConnector;

})(Engine, Events, Notifications, Button, jQuery);
