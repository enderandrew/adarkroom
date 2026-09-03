(function() {
	var Engine = window.Engine = {

		SITE_URL: encodeURIComponent("https://enderandrew.com/adarkerroom/"),
		VERSION: 1.6,
		MAX_STORE: 99999999999999,
		SAVE_DISPLAY: 30 * 1000,
		GAME_OVER: false,

		//object event types
		topics: {},

		Perks: {
			'boxer': {
				name: _('boxer'),
				desc: _('punches do more damage'),
				/// TRANSLATORS : means with more force.
				notify: _('learned to throw punches with purpose')
			},
			'martial artist': {
				name: _('martial artist'),
				desc: _('punches do even more damage.'),
				notify: _('learned to fight quite effectively without weapons')
			},
			'unarmed master': {
				/// TRANSLATORS : master of unarmed combat
				name: _('unarmed master'),
				desc: _('punch twice as fast, and with even more force'),
				notify: _('learned to strike faster without weapons')
			},
			'barbarian': {
				name: _('barbarian'),
				desc: _('melee weapons deal more damage'),
				notify: _('learned to swing weapons with force')
			},
			'slow metabolism': {
				name: _('slow metabolism'),
				desc: _('go twice as far without eating'),
				notify: _('learned how to ignore the hunger')
			},
			'desert rat': {
				name: _('desert rat'),
				desc: _('go twice as far without drinking'),
				notify: _('learned to love the dry air')
			},
			'evasive': {
				name: _('evasive'),
				desc: _('dodge attacks more effectively'),
				notify: _("learned to be where they're not")
			},
			'precise': {
				name: _('precise'),
				desc: _('land blows more often'),
				notify: _('learned to predict their movement')
			},
			'scout': {
				name: _('scout'),
				desc: _('see farther'),
				notify: _('learned to look ahead')
			},
			'stealthy': {
				name: _('stealthy'),
				desc: _('better avoid conflict in the wild'),
				notify: _('learned how not to be seen')
			},
			'gastronome': {
				name: _('gastronome'),
				desc: _('restore more health when eating'),
				notify: _('learned to make the most of food')
			},
			'light feet': {
				name: _('light feet'),
				desc: _('walk any distance without losing food and water'),
				notify: _('learned that conserving resources and moving fast can increase distance traveled')
			},
		},

		options: {
			state: null,
			debug: false,
			log: false,
			//dropbox: false,
			dropbox: true,
			doubleTime: false,
			hardcore: false,
			dark: true,
		},

		init: function(options) {
			this.options = $.extend(
				this.options,
				options
			);
			this._debug = this.options.debug;
			this._log = this.options.log;

			// Check for HTML5 support
			if(!Engine.browserValid()) {
				window.location = 'browserWarning.html';
			}

			/* Mobile gets a dedicated page, not a warning and not a
			 * responsive squeeze of this one.
			 *
			 * Three rounds of responsive CSS against this layout did not
			 * work: the desktop UI is absolutely-positioned columns sized to
			 * a fixed 700px stage plus a position:fixed corner menu, and
			 * every mobile rule had to fight that with overrides. mobile.html
			 * loads the same scripts and the same save data with its own
			 * single-column presentation layer instead.
			 *
			 * ?desktop=1 escapes it, for anyone who would rather have the
			 * full layout on a tablet. */
			if(Engine.isMobile() && location.search.indexOf('desktop=1') < 0 &&
				location.pathname.indexOf('mobile.html') < 0) {
				window.location = 'mobile.html' + location.search;
				return;
			}

			/* The old redirect went to mobileWarning.html.
			 *
			 * That page told players to come back on a desktop, and was
			 * never copied into dist/ either, so it 404'd in any real
			 * deployment.
			 *
			 * It was also broken in the built output regardless:
			 * mobileWarning.html was never copied into dist/, so on a real
			 * deployment a phone user got redirected to a 404 rather than to
			 * the warning. Reported directly.
			 *
			 * browserWarning.html above is left alone -- that one is a
			 * genuine capability check (no HTML5 support means the game
			 * cannot run), not a form-factor judgement. */

			Engine.disableSelection();

			if(this.options.state != null) {
				window.State = this.options.state;
			} else {
				Engine.loadGame();
			}

			/* Start the run clock for this session. Must come after the save
			 * is loaded, since it folds into a total that lives in it. */
			if(typeof Achievements !== 'undefined') {
				Achievements.startSession();
			}

			// start loading music and events early
			for (var key in AudioLibrary) {
				if (
					key.toString().indexOf('MUSIC_') > -1 ||
					key.toString().indexOf('EVENT_') > -1) {
						AudioEngine.loadAudioFile(AudioLibrary[key]);
				}
			}

			$('<div>').attr('id', 'locationSlider').appendTo('#main');

			var menu = $('<div>')
				.addClass('menu')
				.appendTo('body');

			if(typeof langs != 'undefined'){
				var customSelect = $('<span>')
					.addClass('customSelect')
					.addClass('menuBtn')
					.appendTo(menu);
				var selectOptions = $('<span>')
					.addClass('customSelectOptions')
					.appendTo(customSelect);
				var optionsList = $('<ul>')
					.appendTo(selectOptions);
				$('<li>')
					.text("language.")
					.appendTo(optionsList);

				$.each(langs, function(name,display){
					$('<li>')
						.text(display)
						.attr('data-language', name)
						.on("click", function() { Engine.switchLanguage(this); })
						.appendTo(optionsList);
				});
			}

			$('<span>')
				.addClass('volume menuBtn')
				.text(_('sound on.'))
				.click(() => Engine.toggleVolume())
				.appendTo(menu);

			$('<span>')								   
				.addClass('appStore menuBtn')
				.text(_('get the app.'))
				.click(Engine.getApp)
				.appendTo(menu);
				
			$('<span>')
				.addClass('lightsOff menuBtn')
				.text(_('lights off.'))
				.click(Engine.turnLightsOff)
				.appendTo(menu);

			$('<span>')
				.addClass('distressBtn menuBtn')
				.text(_('distress off.'))
				.click(function() { Distress.toggle(); })
				.appendTo(menu);

			$('<span>')
				.addClass('hardcore menuBtn')
				.text(_('hardcore.'))
				.click(Engine.confirmHardcoreMode)
				.appendTo(menu);

			$('<span>')
				.addClass('hyper menuBtn')
				.text(_('hyper.'))
				.click(Engine.confirmHyperMode)
				.appendTo(menu);

			$('<span>')
				.addClass('menuBtn')
				.text(_('restart.'))
				.click(Engine.confirmDelete)
				.appendTo(menu);

			$('<span>')
				.addClass('menuBtn')
				.text(_('share.'))
				.click(Engine.share)
				.appendTo(menu);

			$('<span>')
				.addClass('menuBtn')
				.text(_('save.'))
				.click(Engine.exportImport)
				.appendTo(menu);

			/* Dropbox link removed: the integration is not currently working,
			 * and a menu entry that fails when tapped is worse than no entry.
			 * Engine.Dropbox and script/dropbox.js are left in place and
			 * still initialise below if the option is on, so this is one line
			 * to restore rather than a rewrite, whenever it is fixed. */
			if(this.options.dropbox && Engine.Dropbox) {
				this.dropbox = Engine.Dropbox.init();
			}

			$('<span>')
				.addClass('menuBtn')
				.text(_('github.'))
				.click(function() { window.open('https://github.com/enderandrew/adarkroom'); })
				.appendTo(menu);

			// Register keypress handlers
			$('body').off('keydown').keydown(Engine.keyDown);
			$('body').off('keyup').keyup(Engine.keyUp);

			/* The Konami code triggers Engine.enableGodMode().
			 *
			 * enableGodMode() has existed with no caller anywhere in the
			 * codebase -- there was no way to reach it at all. Bound with
			 * .on() rather than folded into Engine.keyDown above: that handler
			 * gates on !Engine.keyPressed && !Engine.keyLock for movement
			 * debounce, which would drop keystrokes partway through the
			 * sequence depending on what else is happening on screen. A
			 * separate listener has no interaction with movement state and
			 * works identically regardless of which module is active -- which
			 * matters here, since god mode is exactly the kind of thing you
			 * would want to reach from any screen, not only from the Room. */
			$('body').off('keydown.konami').on('keydown.konami', Engine.checkKonamiCode);

			/* Register swipe handlers.
			 *
			 * The bindings are unchanged -- Swipe (script/swipe.js) emits the
			 * same four jQuery events the old jquery.event.swipe plugin did.
			 * Only the source of those events changed, from two unmaintained
			 * plugins hooking jQuery internals to native Pointer Events. */
			var swipeElement = $('#outerSlider');
			Swipe.attach(swipeElement);
			swipeElement.on('swipeleft', Engine.swipeLeft);
			swipeElement.on('swiperight', Engine.swipeRight);
			swipeElement.on('swipeup', Engine.swipeUp);
			swipeElement.on('swipedown', Engine.swipeDown);

			// Size the panels to the viewport, and keep them sized as it changes.
			Engine.updateLayout();
			$(window).on('resize orientationchange', function() {
				clearTimeout(Engine._resizeTimer);
				Engine._resizeTimer = setTimeout(Engine.updateLayout, 100);
			});

			// subscribe to stateUpdates
			$.Dispatch('stateUpdate').subscribe(Engine.handleStateUpdates);

			$SM.init();
			AudioEngine.init();			 
			Notifications.init();
			Events.init();
			Room.init();

			if(typeof $SM.get('stores.wood') != 'undefined') {
				Outside.init();
			}
			if($SM.get('stores.compass', true) > 0) {
				Path.init();
			}
			if ($SM.get('features.location.fabricator')) {
				Fabricator.init();
			}
			if($SM.get('features.location.spaceShip')) {
				Ship.init();
			}

			if($SM.get('config.lightsOff', true)){
					Engine.turnLightsOff();
			}

			if($SM.get('config.hyperMode', true)){
					Engine.triggerHyperMode();
			}

			/* After turnLightsOff() so the overlay's dark-mode rules apply
			 * from the first frame, and after the menu exists so setEnabled()
			 * can label the toggle. Guarded because distress is purely
			 * cosmetic -- if the file fails to load the game must still run. */
			if(typeof Distress !== 'undefined') {
				Distress.init();
			}


			Engine.toggleVolume(Boolean($SM.get('config.soundOn')));
			if(!AudioEngine.isAudioContextRunning()) {
				document.addEventListener('click', Engine.resumeAudioContext, true);
			}
			
			if($SM.get('config.hardcoreMode', true)){
					Engine.triggerHardcoreMode();
			}

			Engine.saveLanguage();

			// Every panel exists now, so re-run the layout to get the slider
			// widths right before we slide to the first one.
			Engine.updateLayout();
			Engine.travelTo(Room);

			setTimeout(notifyAboutSound, 3000);

		},
		resumeAudioContext: function () {
			AudioEngine.tryResumingAudioContext();

			// turn on music!
				AudioEngine.setMasterVolume($SM.get('config.soundOn') ? 1.0 : 0.0, 0);

			document.removeEventListener('click', Engine.resumeAudioContext);
		},
		browserValid: function() {
			return ( location.search.indexOf( 'ignorebrowser=true' ) >= 0 || ( typeof Storage != 'undefined' && !oldIE ) );
		},

		/* Narrower than this and the desktop layout does not fit, whatever
		 * device is claiming to render it. Matches the point where the
		 * notification gutter can no longer sit beside a 700px panel. */
		MOBILE_MAX_WIDTH: 900,

		isMobile: function() {
			if(location.search.indexOf('ignorebrowser=true') >= 0) { return false; }

			/* User agent OR viewport width -- not user agent alone.
			 *
			 * A UA-only test misses every case where the screen is small but
			 * the browser still says desktop: Chrome DevTools' "Responsive"
			 * mode does not spoof the UA at all, so device emulation showed
			 * the DESKTOP page squeezed into a phone-width viewport, which
			 * is exactly the broken layout that was reported. It also misses
			 * a genuinely narrow desktop window, and newer iPads that
			 * deliberately report a Mac UA.
			 *
			 * Width is the thing that actually determines whether the
			 * desktop layout fits, so it is the thing to test. The UA check
			 * is kept alongside it for real phones held in landscape, where
			 * the viewport can be wider than the cutoff. */
			var narrow = typeof window !== 'undefined' &&
				(window.innerWidth || document.documentElement.clientWidth || 0) > 0 &&
				(window.innerWidth || document.documentElement.clientWidth) <= Engine.MOBILE_MAX_WIDTH;

			var mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);

			return narrow || mobileUA;
		},

		saveGame: function() {
			/* Fold the current session's elapsed time into the stored total
			 * before writing, so a closed tab never inflates or discards it. */
			if(typeof Achievements !== 'undefined') {
				Achievements.flush();
			}
			if(typeof Storage != 'undefined' && localStorage) {
				if(Engine._saveTimer != null) {
					clearTimeout(Engine._saveTimer);
				}
				if(typeof Engine._lastNotify == 'undefined' || Date.now() - Engine._lastNotify > Engine.SAVE_DISPLAY){
					$('#saveNotify').css('opacity', 1).animate({opacity: 0}, 1000, 'linear');
					Engine._lastNotify = Date.now();
				}
				localStorage.gameState = JSON.stringify(State);
			}
		},

		loadGame: function() {
			try {
				var savedState = JSON.parse(localStorage.gameState);
				if(savedState) {
					State = savedState;
					$SM.updateOldState();
					Engine.log("loaded save!");
				}
			} catch(e) {
				State = {};
				$SM.set('version', Engine.VERSION);
				Engine.event('progress', 'new game');
			}
		},

		exportImport: function() {
			Events.startEvent({
				title: _('Export / Import'),
				scenes: {
					start: {
						text: [
							_('export or import save data, for backing up'),
							_('or migrating computers')
						],
						buttons: {
							'export': {
								text: _('export'),
								nextScene: {1: 'inputExport'}
							},
							'import': {
								text: _('import'),
								nextScene: {1: 'confirm'}
							},
							'cancel': {
								text: _('cancel'),
								nextScene: 'end'
							}
						}
					},
					'inputExport': {
						text: [_('save this, or download it as a file.')],
						textarea: Engine.export64(),
						onLoad: function() { Engine.event('progress', 'export'); },
						readonly: true,
						/* onRender (see Events.startStory) runs after the
						 * textarea and buttons above already exist in the DOM,
						 * so the download link can be appended alongside them
						 * without fighting loadScene's own render order. */
						onRender: function() {
							Engine.addDownloadLink(Events.eventPanel().find('#description'), Engine.export64());
						},
						buttons: {
							'done': {
								text: _('got it'),
								nextScene: 'end',
								onChoose: Engine.disableSelection
							}
						}
					},
					'confirm': {
						text: [
							_('are you sure?'),
							_('if the save is invalid, nothing will be changed.'),
							_('if it is valid, this will replace your current game. that part is irreversible.')
						],
						buttons: {
							'yes': {
								text: _('yes'),
								nextScene: {1: 'inputImport'},
								onChoose: Engine.enableSelection
							},
							'no': {
								text: _('no'),
								nextScene: {1: 'start'}
							}
						}
					},
					'inputImport': {
						text: [_('paste the save code here, or choose a file below.')],
						textarea: '',
						onRender: function() {
							Engine.addUploadControl(Events.eventPanel().find('#description'));
						},
						buttons: {
							'okay': {
								text: _('import'),
								nextScene: function() {
									var textarea = Events.eventPanel().find('textarea');
									var pasted = textarea.length > 0 ? textarea.val() : '';
									/* A file chosen via addUploadControl takes
									 * priority over pasted text if both are
									 * present -- see Engine._pendingImportText. */
									var text = Engine._pendingImportText || pasted;
									Engine._pendingImportText = null;
									return Engine.import64(text) ? 'end' : 'invalidSave';
								}
							},
							'cancel': {
								text: _('cancel'),
								nextScene: 'end'
							}
						}
					},
					'invalidSave': {
						text: [
							_('that save data could not be read.'),
							_('nothing has been changed. your current game is untouched.')
						],
						buttons: {
							'retry': {
								text: _('try again'),
								nextScene: 'end',
								onChoose: Engine.exportImport
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

		/* Appends a "download as file" link next to the export textarea.
		 * Builds a Blob in memory and drives the download via a throwaway
		 * <a download> element -- no server round-trip, works entirely
		 * client-side, and the object URL is revoked immediately after the
		 * click is dispatched so it doesn't linger. */
		addDownloadLink: function(container, contents) {
			var filename = 'a-dark-room-save-' + Engine.saveFileDate() + '.txt';
			var link = $('<a>')
				.addClass('menuBtn')
				.css({display: 'block', 'margin-top': '10px'})
				.text(_('download as file'))
				.attr('download', filename)
				.click(function() {
					var blob = new Blob([contents], {type: 'text/plain'});
					var url = URL.createObjectURL(blob);
					this.href = url;
					Engine.setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
				});
			container.append(link);
		},

		saveFileDate: function() {
			var d = new Date();
			function pad(n) { return (n < 10 ? '0' : '') + n; }
			return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
		},

		/* Appends a file picker next to the import textarea. Reading the file
		 * just populates Engine._pendingImportText for the 'okay' button's
		 * nextScene to pick up above -- it does not import anything itself,
		 * so choosing a file and then hitting cancel is a safe no-op. */
		addUploadControl: function(container) {
			Engine._pendingImportText = null;
			var status = $('<div>').addClass('menuBtn').css('margin-top', '10px');
			var input = $('<input>')
				.attr('type', 'file')
				.attr('accept', '.txt,.json,text/plain,application/json')
				.css('display', 'block')
				.change(function(e) {
					var file = e.target.files && e.target.files[0];
					if(!file) { return; }
					/* A save file should be a small base64 blob (see
					 * MAX_IMPORT_BYTES below for the same cap applied to
					 * pasted text) -- refuse anything wildly larger up front
					 * rather than handing a huge read to FileReader. */
					if(file.size > Engine.MAX_IMPORT_BYTES) {
						status.text(_('that file is too large to be a save.'));
						return;
					}
					var reader = new FileReader();
					reader.onload = function() {
						Engine._pendingImportText = reader.result;
						status.text(_('loaded: ') + file.name);
					};
					reader.onerror = function() {
						status.text(_('could not read that file.'));
					};
					reader.readAsText(file);
				});
			container.append($('<div>').css('margin-top', '10px').append(input)).append(status);
		},

		generateExport64: function(){
			var string64 = Base64.encode(localStorage.gameState);
			string64 = string64.replace(/\s/g, '');
			string64 = string64.replace(/\./g, '');
			string64 = string64.replace(/\n/g, '');

			return string64;
		},

		export64: function() {
			Engine.saveGame();
			Engine.enableSelection();
			return Engine.generateExport64();
		},

		// A save this size decodes to roughly 7.5MB of JSON, which is already
		// enormous for this game's state -- well past a sanity cap, not a
		// realistic-but-large save.
		MAX_IMPORT_BYTES: 10 * 1024 * 1024,

		/* Keys that must never be accepted as literal properties of imported
		 * state. JSON.parse cannot itself corrupt Object.prototype -- it only
		 * ever creates OWN properties, even one literally named "__proto__" --
		 * but that own property would still sit in State from then on, and
		 * anything downstream that later does a naive recursive copy (a
		 * future feature, a library update, a $.extend(true, ...) somewhere)
		 * could turn it into real prototype pollution. Stripped here, once,
		 * at the only place untrusted data enters the game, rather than
		 * trusted forever after by every consumer of State. */
		DANGEROUS_KEYS: ['__proto__', 'constructor', 'prototype'],

		/* Recursively strips DANGEROUS_KEYS from a parsed save and rejects
		 * anything that isn't plain JSON data (functions, DOM nodes, etc. are
		 * impossible to get out of JSON.parse, but this stays defensive about
		 * unexpected shapes rather than assuming).
		 *
		 * ctx.tooDeep is how a depth-bomb fails the WHOLE import rather than
		 * just truncating one branch to null. null is already a legitimate
		 * value partway through a real save, so using it as the depth-limit
		 * signal too would make an over-deep branch indistinguishable from a
		 * branch that was genuinely null -- the caller could accept a
		 * silently truncated save instead of rejecting it outright. ctx is
		 * shared across the whole recursion and checked once at the end by
		 * import64, rather than threaded through every return value. */
		sanitizeImportedState: function(value, depth, ctx) {
			depth = depth || 0;
			ctx = ctx || {tooDeep: false};
			if(depth > 64) {
				// A legitimate save has nowhere near this much nesting.
				ctx.tooDeep = true;
				return null;
			}
			if(value === null || typeof value === 'undefined') {
				return null;
			}
			if(typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
				return value;
			}
			if(Array.isArray(value)) {
				var arr = [];
				for(var i = 0; i < value.length; i++) {
					arr.push(Engine.sanitizeImportedState(value[i], depth + 1, ctx));
				}
				return arr;
			}
			if(typeof value === 'object') {
				var out = {};
				for(var k in value) {
					if(!Object.prototype.hasOwnProperty.call(value, k)) { continue; }
					if(Engine.DANGEROUS_KEYS.indexOf(k) !== -1) { continue; }
					out[k] = Engine.sanitizeImportedState(value[k], depth + 1, ctx);
				}
				return out;
			}
			// Functions, symbols, etc. -- not valid save data.
			return null;
		},

		/* Validates and applies an imported save. Returns true and reloads on
		 * success; returns false and leaves the current game completely
		 * untouched on any failure. Nothing is written to localStorage until
		 * every check has passed.
		 *
		 * This replaces a version that wrote decoded input to
		 * localStorage.gameState unconditionally, before even checking it was
		 * JSON. A malformed paste didn't corrupt anything immediately --
		 * loadGame()'s JSON.parse is wrapped in try/catch -- but it silently
		 * discarded the player's real save and started a new game with no
		 * indication that the import had failed, which reads as data loss
		 * either way. */
		import64: function(string64) {
			if(typeof string64 !== 'string') {
				return false;
			}
			string64 = string64.replace(/\s/g, '');
			string64 = string64.replace(/\./g, '');
			string64 = string64.replace(/\n/g, '');
			if(string64.length === 0 || string64.length > Engine.MAX_IMPORT_BYTES) {
				return false;
			}

			var decoded;
			try {
				decoded = Base64.decode(string64);
			} catch(e) {
				return false;
			}

			var parsed;
			try {
				parsed = JSON.parse(decoded);
			} catch(e) {
				return false;
			}

			// Reject anything that isn't a plain, non-array object -- a
			// string, a number, an array, null are all valid JSON but none of
			// them are a game state.
			if(typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
				return false;
			}

			var ctx = {tooDeep: false};
			var sanitized = Engine.sanitizeImportedState(parsed, 0, ctx);
			if(sanitized === null || ctx.tooDeep) {
				return false;
			}

			/* Marks this save as having entered play through an import
			 * rather than continuous real-time play, covering all three
			 * import paths (paste, file, Dropbox) in one place since
			 * Engine.import64 is the single funnel all of them use.
			 *
			 * Achievements.isSpeedRun() reads this and refuses regardless of
			 * what game.runTime says. Reported directly: importing a save
			 * that had no runTime recorded (an old save, or one from before
			 * this feature existed) defaulted to 0 elapsed time, and
			 * finishing moments later trivially "beat" a 150-minute clock
			 * that was never actually run. Baked into the sanitized state
			 * itself -- not set via $SM -- because the page reloads
			 * immediately after this and $SM's live State is about to be
			 * discarded in favour of whatever gets written to localStorage
			 * here. */
			sanitized.game = sanitized.game || {};
			sanitized.game.imported = true;

			Engine.event('progress', 'import');
			Engine.disableSelection();
			localStorage.gameState = JSON.stringify(sanitized);
			Engine._doReload();
			return true;
		},

		// The only call to location.reload() in the import path, kept as its
		// own function so it's a single overridable seam rather than a direct
		// call buried in import64.
		_doReload: function() {
			location.reload();
		},

		/* Analytics.
		 *
		 * index.html loads GA4's gtag(), not Universal Analytics' ga() -- UA
		 * was shut down in 2024. The old `if(typeof ga === 'function')` guard
		 * always failed, so every Engine.event() call was silently a no-op.
		 *
		 * GA4's event shape is gtag('event', <action>, { event_category, ... }),
		 * not ga's positional ('send','event',category,action). cat/act names
		 * are kept as the public signature since ~150 call sites across the
		 * codebase use them; only the translation to gtag's shape changes here.
		 */
		event: function(cat, act) {
			if(typeof gtag === 'function') {
				gtag('event', act, { event_category: cat });
			}
		},

		confirmDelete: function() {
			Events.startEvent({
				title: _('Restart?'),
				scenes: {
					start: {
						text: [_('restart the game?')],
						buttons: {
							'yes': {
								text: _('yes'),
								nextScene: 'end',
								onChoose: Engine.deleteSave
							},
							'no': {
								text: _('no'),
								nextScene: 'end'
							}
						}
					}
				}
			});
		},

		deleteSave: function(noReload) {
			if(typeof Storage != 'undefined' && localStorage) {
				var prestige = Prestige.get();
				window.State = {};
				localStorage.clear();
				Prestige.set(prestige);
			}
			if(!noReload) {
				location.reload();
			}
		},

		getApp: function() {
			Events.startEvent({
				title: _('Get the App'),
				scenes: {
					start: {
						text: [_('bring the room with you.')],
						buttons: {
							/* Steam folded in here from its own menu entry.
							 * It is the same question -- where do you want to
							 * play this -- and the menu had two links asking
							 * it. */
							'steam': {
								text: _('steam'),
								nextScene: 'end',
								onChoose: function() {
									window.open('https://store.steampowered.com/app/2460660/A_Dark_Room/');
								}
							},
							'ios': {
								text: _('ios'),
								nextScene: 'end',
								onChoose: function () {
									window.open('https://itunes.apple.com/app/apple-store/id736683061?pt=2073437&ct=adrproper&mt=8');
								}
							},
							'android': {
								text: _('android'),
								nextScene: 'end',
								onChoose: function() {
									window.open('https://play.google.com/store/apps/details?id=com.yourcompany.adarkroom');
								}
							},
							'close': {
								text: _('close'),
								nextScene: 'end'
							}
						}
					}
				}
			});
		},

		share: function() {
			Events.startEvent({
				title: _('Share'),
				scenes: {
					start: {
						text: [_('bring your friends.')],
						buttons: {
							'facebook': {
								text: _('facebook'),
								nextScene: 'end',
								onChoose: function() {
									window.open('https://www.facebook.com/sharer/sharer.php?u=' + Engine.SITE_URL, 'sharer', 'width=626,height=436,location=no,menubar=no,resizable=no,scrollbars=no,status=no,toolbar=no');
								}
							},
							'reddit': {
								text: _('reddit'),
								nextScene: 'end',
								onChoose: function() {
									window.open('http://www.reddit.com/submit?url=' + Engine.SITE_URL, 'sharer', 'width=960,height=700,location=no,menubar=no,resizable=no,scrollbars=yes,status=no,toolbar=no');
								}
							},
							'twitter': {
								text: _('twitter'),
								nextScene: 'end',
								onChoose: function() {
									window.open('https://twitter.com/intent/tweet?text=A%20Dark%20Room&url=' + Engine.SITE_URL, 'sharer', 'width=660,height=460,location=no,menubar=no,resizable=no,scrollbars=yes,status=no,toolbar=no');
								}
							},
							'tumblr': {
								text: _('tumblr'),
								nextScene: 'end',
								onChoose: function() {
									window.open('https://www.tumblr.com/widgets/share/tool?canonicalUrl=' + Engine.SITE_URL + '&title=A Darker Room, a Minimalist Text Adventure', 'sharer', 'width=660,height=460,location=no,menubar=no,resizable=no,scrollbars=yes,status=no,toolbar=no');
								}
							},
							'pinterest': {
								text:_('pinterest'),
								nextScene: 'end',
								onChoose: function() {
									window.open('http://pinterest.com/pin/create/button/?url=' + Engine.SITE_URL + '&description=A Darker Room, a minimalist text adventure', 'sharer', 'width=480,height=436,location=no,menubar=no,resizable=no,scrollbars=no,status=no,toolbar=no');
								}
							},
							'wordpress': {
								text:_('wordpress'),
								nextScene: 'end',
								onChoose: function() {
									window.open('https://wordpress.com/press-this.php?u=' + Engine.SITE_URL + '&t=A Darker Room, a Minimalist Text Adventure', 'sharer', 'width=700,height=600,location=no,menubar=no,resizable=no,scrollbars=no,status=no,toolbar=no');
								}
							},
							'whatsapp': {
								text:_('whatsapp'),
								nextScene: 'end',
								onChoose: function() {
									window.open('https://api.whatsapp.com/send?text=' + Engine.SITE_URL, 'sharer', 'width=480,height=436,location=no,menubar=no,resizable=no,scrollbars=no,status=no,toolbar=no');
								}
							},
							'threads': {
								text: _('threads'),
								nextScene: 'end',
								onChoose: function() {
									/* Threads' share intent takes one combined
									 * text param rather than separate text/url
									 * fields (unlike Twitter/X above) -- the
									 * URL has to be concatenated into it. */
									var text = encodeURIComponent('A Darker Room, a Minimalist Text Adventure') + '%20' + Engine.SITE_URL;
									window.open('https://www.threads.net/intent/post?text=' + text, 'sharer', 'width=660,height=460,location=no,menubar=no,resizable=no,scrollbars=yes,status=no,toolbar=no');
								}
							},
							'bluesky': {
								text: _('bluesky'),
								nextScene: 'end',
								onChoose: function() {
									// Same single-field intent shape as Threads.
									var text = encodeURIComponent('A Darker Room, a Minimalist Text Adventure') + '%20' + Engine.SITE_URL;
									window.open('https://bsky.app/intent/compose?text=' + text, 'sharer', 'width=660,height=460,location=no,menubar=no,resizable=no,scrollbars=yes,status=no,toolbar=no');
								}
							},
							'close': {
								text: _('close'),
								nextScene: 'end'
							}
						}
					}
				}
			},
			{
				width: '400px'
			});
		},

		findStylesheet: function(title) {
			for(var i=0; i<document.styleSheets.length; i++) {
				var sheet = document.styleSheets[i];
				if(sheet.title == title) {
					return sheet;
				}
			}
			return null;
		},

		isLightsOff: function() {
			var darkCss = Engine.findStylesheet('darkenLights');
			if ( darkCss != null && !darkCss.disabled ) {
				return true;
			}
			return false;
		},

		turnLightsOff: function() {
			/* Keep the mobile colour variables in step with the desktop
			 * sheet. dark.css still does the work for desktop-shaped
			 * selectors; this only tells the mobile override layer to flip
			 * its own --ink/--paper so the two cannot disagree. Deferred to
			 * the end of this function via setTimeout would race the state
			 * write, so it is re-synced after each branch below. */
			var syncMobile = function() {
				if(typeof MobileUI !== 'undefined' && typeof MobileUI.syncDark === 'function') {
					MobileUI.syncDark();
				}
			};

			var darkCss = Engine.findStylesheet('darkenLights');
			if (darkCss == null) {
				$('head').append('<link rel="stylesheet" href="css/dark.css" type="text/css" title="darkenLights" />');
				$('.lightsOff').text(_('lights on.'));
				//$SM.set('config.lightsOff', true, true);
				$SM.set('config.lightsOff', Engine.options.dark, true);
			} else if (darkCss.disabled) {
				darkCss.disabled = false;
				$('.lightsOff').text(_('lights on.'));
				//$SM.set('config.lightsOff', true, true);
				$SM.set('config.lightsOff', Engine.options.dark, true);
			} else {
				$("#darkenLights").attr("disabled", "disabled");
				darkCss.disabled = true;
				$('.lightsOff').text(_('lights off.'));
				$SM.set('config.lightsOff', false, true);
			}
			syncMobile();
		},

		confirmHyperMode: function(){
			if (!Engine.options.doubleTime) {
				Events.startEvent({
					title: _('Go Hyper?'),
					scenes: {
						start: {
							text: [_('turning hyper mode speeds up the game to x2 speed. do you want to do that?')],
							buttons: {
								'yes': {
									text: _('yes'),
									nextScene: 'end',
									onChoose: Engine.triggerHyperMode
								},
								'no': {
									text: _('no'),
									nextScene: 'end'
								}
							}
						}
					}
				});
			} else {
				Engine.triggerHyperMode();
			}
		},

		confirmHardcoreMode: function(){
			if (!Engine.options.hardcore) {
				Events.startEvent({
					title: _('Go Hardcore?'),
					scenes: {
						start: {
							text: [_('turning hardcore mode on slows down the game by x2 speed and makes all enemies x2 stronger. do you want to do that?')],
							buttons: {
								'yes': {
									text: _('yes'),
									nextScene: 'end',
									onChoose: Engine.triggerHardcoreMode
								},
								'no': {
									text: _('no'),
									nextScene: 'end'
								}
							}
						}
					}
				});
			} else {
				Engine.triggerHardcoreMode();
			}
		},

		promptChangelog: function() {
			Events.startEvent({
				title: _('Changelog'),
				scenes: {
					start: {
						text: [_("changelog: This is a fork that both changes features, and the story from original game. Go support the original!"),
						_(" "),
						_("In the mean time this is what has changed: Ruins, Temple, Graveyard, Lab, Prison, easter eggs, 14 endings, mobile, Hardcore mode, uber traps, new perk, new weapons, new upgrades, expanded story, new enemies, April Fool's mode, key controls in combat, visual tweaks, bugfixes, and more to come!")
						],
						buttons: {
							'yes': {
								text: _('ok'),
								nextScene: 'end',
							}
						}
					}
				}
			});
		},

		triggerHyperMode: function() {
			Engine.options.doubleTime = !Engine.options.doubleTime;
			Engine.options.hardcore = false;
			if(Engine.options.doubleTime){
				$('.hyper').text(_('classic.'));
				$('.hardcore').text(_('hardcore.'));
			} else {
				$('.hyper').text(_('hyper.'));
			}

			$SM.set('config.hyperMode', Engine.options.doubleTime, false);
			$SM.set('config.hardcore', Engine.options.hardcore, false);
		},

		triggerHardcoreMode: function() {
			Engine.options.hardcore = !Engine.options.hardcore;
			Engine.options.doubleTime = false;
			if(Engine.options.hardcore){
				$('.hardcore').text(_('classic.'));
				$('.hyper').text(_('hyper.'));
			}
			else{
				$('.hardcore').text(_('hardcore.'));
			}
			$SM.set('config.hardcore', Engine.options.hardcore, false);
			$SM.set('config.hyperMode', Engine.options.hardcore, false);
		},

		// Gets a guid
		getGuid: function() {
			return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
				var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
				return v.toString(16);
			});
		},

		activeModule: null,

		travelTo: function(module) {
			if(Engine.activeModule != module) {
				var currentIndex = Engine.activeModule ? $('.location').index(Engine.activeModule.panel) : 1;
				$('div.headerButton').removeClass('selected');
				module.tab.addClass('selected');

				var slider = $('#locationSlider');
				var stores = $('#storesContainer');
				var panelIndex = $('.location').index(module.panel);
				var diff = Math.abs(panelIndex - currentIndex);
				var panelWidth = Engine.getPanelWidth();
				slider.animate({left: -(panelIndex * panelWidth) + 'px'}, 300 * diff);

				if($SM.get('stores.wood') !== undefined) {
				// FIXME Why does this work if there's an animation queue...?
					stores.animate({right: -(panelIndex * panelWidth) + 'px'}, 300 * diff);
				}

				if(Engine.activeModule == Room || Engine.activeModule == Path || Engine.activeModule == Fabricator) {
					// Don't fade out the weapons if we're switching to a module
					// where we're going to keep showing them anyway.
					if (module != Room && module != Path && module != Fabricator) {
						$('div#weapons').animate({opacity: 0}, 300);
					}
				}

				if(module == Room || module == Path || module == Fabricator) {
					$('div#weapons').animate({opacity: 1}, 300);
				}

				Engine.activeModule = module;
				module.onArrival(diff);
				Notifications.printQueue(module);

			}
		},

		/* Move the stores panel beneath top_container (or to top: 0px if top_container
		 * either hasn't been filled in or is null) using transition_diff to sync with
		 * the animation in Engine.travelTo().
		 */
		moveStoresView: function(top_container, transition_diff) {
			var stores = $('#storesContainer');

			// If we don't have a storesContainer yet, leave.
			if(typeof(stores) === 'undefined') return;

			if(typeof(transition_diff) === 'undefined') transition_diff = 1;

			if(top_container === null) {
				stores.animate({top: '0px'}, {queue: false, duration: 300 * transition_diff});
			}
			else if(!top_container.length) {
				stores.animate({top: '0px'}, {queue: false, duration: 300 * transition_diff});
			}
			else {
				stores.animate({
						top: top_container.height() + 26 + 'px'
					},
					{
						queue: false,
						duration: 300 * transition_diff
				});
			}
		},

		log: function(msg) {
			if(this._log) {
				console.log(msg);
			}
		},

		/* The game is laid out as a grid of fixed-size panels that slide in and out
		 * of view. On a desktop that panel is PANEL_MAX_WIDTH wide; on smaller
		 * screens it shrinks to fit the viewport. Everything that positions a panel
		 * must go through getPanelWidth()/getPanelHeight() rather than hardcoding a
		 * size, or the slider offsets drift out of sync with the CSS. */
		PANEL_MAX_WIDTH: 700,
		PANEL_MAX_HEIGHT: 700,
		PANEL_MIN_WIDTH: 280,
		LAYOUT_MARGIN: 24, // wrapper padding + room for a scrollbar
		_panelWidth: 700,
		_panelHeight: 700,
		_resizeTimer: null,

		getPanelWidth: function() {
			if ($('html').hasClass('mobileUI')) {
				return $(window).width();
			}
			var rootWidth = parseInt($(':root').css('--panel-width'), 10);
			return rootWidth || 700;
		},
		
		getPanelHeight: function() {
			if ($('html').hasClass('mobileUI')) {
				return $(window).height();
			}
			var rootHeight = parseInt($(':root').css('--panel-height'), 10);
			return rootHeight || 700;
		},

		/* Recalculates the panel size from the viewport, publishes it to CSS as
		 * --panel-width / --panel-height, and re-snaps every slider so the active
		 * panel stays in view. Safe to call at any time. */
		updateLayout: function() {
			var root = document.documentElement;

			/* Measure against the viewport, never against #wrapper or #content --
			 * those are sized *from* --panel-width, so reading them back would be
			 * circular. --notification-gutter is set by the media queries in
			 * responsive.css, which is how the breakpoint reaches the JS. */
			var gutter = 0;
			if(window.getComputedStyle) {
				gutter = parseInt(window.getComputedStyle(root).getPropertyValue('--notification-gutter'), 10);
				if(isNaN(gutter)) gutter = 0;
			}

			var available = $(window).width() - gutter - Engine.LAYOUT_MARGIN;
			var width = Math.max(Engine.PANEL_MIN_WIDTH, Math.min(Engine.PANEL_MAX_WIDTH, Math.floor(available)));
			var height = Math.min(Engine.PANEL_MAX_HEIGHT, Math.floor($('#content').height() || $(window).height()));

			var changed = (width !== Engine._panelWidth || height !== Engine._panelHeight);
			Engine._panelWidth = width;
			Engine._panelHeight = height;

			if(root && root.style && root.style.setProperty) {
				root.style.setProperty('--panel-width', width + 'px');
				root.style.setProperty('--panel-height', height + 'px');
			}

			Engine.updateSlider();
			Engine.updateOuterSlider();

			if(changed) {
				// Re-snap the sliders without animating, so a resize mid-game doesn't
				// leave the player looking at the gap between two panels.
				Engine.snapSliders();
			}
		},

		/* Jumps the sliders to the offsets implied by the current panel width. */
		snapSliders: function() {
			var width = Engine.getPanelWidth();

			if(Engine.activeModule && Engine.activeModule.panel) {
				var panelIndex = $('.location').index(Engine.activeModule.panel);
				if(panelIndex >= 0) {
					if(Engine.activeModule === World) {
						// World lives on the outer slider, one panel to the right.
						$('#outerSlider').stop(true, true).css('left', -width + 'px');
					} else if(Engine.activeModule !== Space) {
						$('#outerSlider').stop(true, true).css('left', '0px');
						$('#locationSlider').stop(true, true).css('left', -(panelIndex * width) + 'px');
						if($SM.get('stores.wood') !== undefined) {
							$('#storesContainer').stop(true, true).css('right', -(panelIndex * width) + 'px');
						}
					}
				}
			}

			if(Engine.activeModule === Space) {
				$('#outerSlider').stop(true, true).css('top', Engine.getPanelHeight() + 'px');
			}
		},

		updateSlider: function() {
			var slider = $('#locationSlider');
			slider.width((slider.children().length * Engine.getPanelWidth()) + 'px');
		},

		updateOuterSlider: function() {
			var slider = $('#outerSlider');
			slider.width((slider.children().length * Engine.getPanelWidth()) + 'px');
		},

		getIncomeMsg: function(num, delay) {
			return _("{0} per {1}s", (num > 0 ? "+" : "") + num, delay);
			//return (num > 0 ? "+" : "") + num + " per " + delay + "s";
		},

		keyLock: false,
		tabNavigation: true,
		restoreNavigation: false,

		keyDown: function(e) {
			e = e || window.event;
			if(!Engine.keyPressed && !Engine.keyLock) {
				Engine.pressed = true;
				if(Engine.activeModule.keyDown) {
					Engine.activeModule.keyDown(e);
				}
			}
			return jQuery.inArray(e.keycode, [37,38,39,40]) < 0;
		},

		keyUp: function(e) {
			Engine.pressed = false;
			if(Engine.activeModule.keyUp) {
				Engine.activeModule.keyUp(e);
			} else {
				switch(e.which) {
					case 38: // Up
					case 87:
						if(Engine.activeModule == Outside || Engine.activeModule == Path) {
							Engine.activeModule.scrollSidebar('up');
						}
						Engine.log('up');
						break;
					case 40: // Down
					case 83:
						if (Engine.activeModule == Outside || Engine.activeModule == Path) {
							Engine.activeModule.scrollSidebar('down');
						}
						Engine.log('down');
						break;
					case 37: // Left
					case 65:
						if (Engine.tabNavigation) {
							if (Engine.activeModule == Ship && Fabricator.tab) {
								Engine.travelTo(Fabricator);
							}
							else if ((Engine.activeModule == Ship || Engine.activeModule == Fabricator) && Path.tab) {
								Engine.travelTo(Path);
							}
							else if(Engine.activeModule == Path && Outside.tab) {
								Engine.activeModule.scrollSidebar('left', true);
								Engine.travelTo(Outside);
							}
							else if(Engine.activeModule == Outside && Room.tab) {
								Engine.activeModule.scrollSidebar('left', true);
								Engine.travelTo(Room);
							}
						}
						Engine.log('left');
						break;
					case 39: // Right
					case 68:
						if(Engine.tabNavigation){
							if(Engine.activeModule == Room && Outside.tab) {
								Engine.travelTo(Outside);
							}
							else if(Engine.activeModule == Outside && Path.tab) {
								Engine.activeModule.scrollSidebar('right', true);
								Engine.travelTo(Path);
							}
							else if(Engine.activeModule == Path && Fabricator.tab) {
								Engine.travelTo(Fabricator);
							}
							else if ((Engine.activeModule == Path || Engine.activeModule == Fabricator) && Ship.tab){
								Engine.travelTo(Ship);
							}
						}
						Engine.log('right');
						break;
				}
			}
			if(Engine.restoreNavigation){
				Engine.tabNavigation = true;
				Engine.restoreNavigation = false;
			}
			return false;
		},

		swipeLeft: function(e) {
			if(Engine.activeModule.swipeLeft) {
				Engine.activeModule.swipeLeft(e);
			}
		},

		swipeRight: function(e) {
			if(Engine.activeModule.swipeRight) {
				Engine.activeModule.swipeRight(e);
			}
		},

		swipeUp: function(e) {
			if(Engine.activeModule.swipeUp) {
				Engine.activeModule.swipeUp(e);
			}
		},

		swipeDown: function(e) {
			if(Engine.activeModule.swipeDown) {
				Engine.activeModule.swipeDown(e);
			}
		},

		disableSelection: function() {
			document.onselectstart = eventNullifier; // this is for IE
			document.onmousedown = eventNullifier; // this is for the rest
		},

		enableSelection: function() {
			document.onselectstart = eventPassthrough;
			document.onmousedown = eventPassthrough;
		},

		autoSelect: function(selector) {
			$(selector).focus().select();
		},

		handleStateUpdates: function(e){

		},

		switchLanguage: function(dom){
			var lang = $(dom).data("language");
			if(document.location.href.search(/[\?\&]lang=[a-z_]+/) != -1){
				document.location.href = document.location.href.replace( /([\?\&]lang=)([a-z_]+)/gi , "$1"+lang );
			}else{
				document.location.href = document.location.href + ( (document.location.href.search(/\?/) != -1 )?"&":"?") + "lang="+lang;
			}
		},

		saveLanguage: function(){
			/* `[,""]` is the standard querystring fallback idiom: index 0 is
			 * intentionally a hole so [1] reads as "" when the regex misses. */
			// eslint-disable-next-line no-sparse-arrays
			var lang = decodeURIComponent((new RegExp('[?|&]lang=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
			if(lang && typeof Storage != 'undefined' && localStorage) {
				localStorage.lang = lang;
			}
		},

		toggleVolume: function(enabled /* optional */) {
			if (enabled == null) {
				enabled = !$SM.get('config.soundOn');
			}
			if (!enabled) {
				$('.volume').text(_('sound on.'));
				$SM.set('config.soundOn', false);
				AudioEngine.setMasterVolume(0.0);
			} else {
				$('.volume').text(_('sound off.'));
				$SM.set('config.soundOn', true);
				AudioEngine.setMasterVolume(1.0);
			}
		},
			
		setInterval: function(callback, interval, skipDouble){
			if( Engine.options.doubleTime && !skipDouble ){
				Engine.log('Double time, cutting interval in half');
				//interval /= 2;
				interval /= Engine._debug ? 32 : 2;
			}
			if( Engine.options.hardcore && !skipDouble ){
				Engine.log('Negative double time, stitching interval plus a half');
				interval *= 2;
			}

			return setInterval(callback, interval);

		},

		setTimeout: function(callback, timeout, skipDouble){

			if( Engine.options.doubleTime && !skipDouble ){
				Engine.log('Double time, cutting timeout in half');
				//timeout /= 2;
				timeout /= Engine._debug ? 32 : 2;
			}
			if( Engine.options.hardcore && !skipDouble ){
				Engine.log('Negative double time, stitching timeout plus a half');
				timeout *= 2;
			}

			return setTimeout(callback, timeout);

		},
		
		/* Up Up Down Down Left Right Left Right B A.
		 *
		 * e.which is used rather than e.code/e.key: the rest of this file's
		 * key handling (Engine.keyDown/keyUp just above, the movement
		 * switch below it) is all e.which-based, including the same arrow
		 * key codes this sequence needs, so matching that convention means
		 * one consistent way to read a key in this file rather than two. */
		KONAMI_CODE: [38, 38, 40, 40, 37, 39, 37, 39, 66, 65],
		_konamiProgress: 0,

		checkKonamiCode: function(e) {
			e = e || window.event;
			var expected = Engine.KONAMI_CODE[Engine._konamiProgress];

			if(e.which === expected) {
				Engine._konamiProgress++;
				if(Engine._konamiProgress === Engine.KONAMI_CODE.length) {
					Engine._konamiProgress = 0;
					Engine.enableGodMode();
				}
			} else {
				/* Not a hard reset to 0: if the wrong key restarts the
				 * sequence, typing the real thing with any stray keystroke
				 * anywhere in the middle -- entirely plausible over ten
				 * keys -- throws the whole attempt away. Re-checking against
				 * the FIRST key lets a false start still count as the start
				 * of a new attempt instead of losing it. */
				Engine._konamiProgress = (e.which === Engine.KONAMI_CODE[0]) ? 1 : 0;
			}
		},

		enableGodMode: function() {
			// add all remaining craftables and goods
			var buildSection = $('#buildBtns');
			if (buildSection.length === 0) {
				buildSection = $('<div>').attr({ 'id': 'buildBtns', 'data-legend': _('build:') }).css('opacity', 0);
				buildSection.appendTo('div#roomPanel').animate({ opacity: 1 }, 300, 'linear');
			}
			var craftSection = $('#craftBtns');
			if (craftSection.length === 0) {
				craftSection = $('<div>').attr({ 'id': 'craftBtns', 'data-legend': _('craft:') }).css('opacity', 0);
				craftSection.appendTo('div#roomPanel').animate({ opacity: 1 }, 300, 'linear');
			}

			var buySection = $('#buyBtns');
			if (buySection.length === 0) {
				buySection = $('<div>').attr({ 'id': 'buyBtns', 'data-legend': _('buy:') }).css('opacity', 0);
				buySection.appendTo('div#roomPanel').animate({ opacity: 1 }, 300, 'linear');
			}

			for (var k in Room.Craftables) {
				var craftable = Room.Craftables[k];
				if (craftable.button == null) {
					var loc = Room.needsWorkshop(craftable.type) ? craftSection : buildSection;
					craftable.button = new Button.Button({
						id: 'build_' + k,
						cost: craftable.cost(),
						text: _(k),
						click: Room.build,
						width: '80px',
						ttPos: loc.children().length > 10 ? 'top right' : 'bottom right'
					}).css('opacity', 0).attr('buildThing', k).appendTo(loc).animate({ opacity: 1 }, 300, 'linear');
				}

				var max = $SM.num(k, craftable) + 1 > craftable.maximum;
				if (max) {
					Button.setDisabled(craftable.button, true);
				} else {
					Button.setDisabled(craftable.button, false);
				}
			}

			for (var g in Room.TradeGoods) {
				var good = Room.TradeGoods[g];
				if (good.button == null) {
					good.button = new Button.Button({
						id: 'build_' + g,
						cost: good.cost(),
						text: _(g),
						click: Room.buy,
						width: '80px',
						ttPos: buySection.children().length > 10 ? 'top right' : 'bottom right'
					}).css('opacity', 0).attr('buildThing', g).appendTo(buySection).animate({ opacity: 1 }, 300, 'linear');
				}

				var goodsMax = $SM.num(g, good) + 1 > good.maximum;
				if (goodsMax) {
					Button.setDisabled(good.button, true);
				} else {
					Button.setDisabled(good.button, false);
				}
			}

			// set water/health
			Path.DEFAULT_BAG_SPACE = 1000;
			World.BASE_WATER = 1000;
			World.BASE_HEALTH = 1000;
			World.setHp(1000);
			
			// add all perks
			for (var key in Engine.Perks) {
				$SM.addPerk(key);
			}

			// give 100000 of all stores
			for (var i = 0; i < Prestige.storesMap.length; i++) {
				State.stores[Prestige.storesMap[i].store] = 100000;

			}
			for (var key in Room.TradeGoods) {
				State.stores[key] = 100000;
			}

			// open up all section
			if(!Outside.tab) {
				Outside.init();
			}

			if(!Path.tab) {
				Path.init();
			}
			
			if(!Ship.tab) {
				Ship.init();
			}

			// set world map mask to reveal entire map
			for(var j = 0; j <= World.RADIUS * 2; j++) {
				for(var i = 0; i <= World.RADIUS * 2; i++) {
					State.game.world.mask[i][j] = true;
				}
			}

			// remove all cooldowns
			$('.button').each(function (i, el) {
				$(el).off('click');
				$(el).click(function() {
					$(this).data("handler")($(this));
				})
			});

		}

	};

	function eventNullifier(e) {
		return $(e.target).hasClass('menuBtn');
	}

	function eventPassthrough(e) {
		return true;
	}

	function notifyAboutSound() {
		if ($SM.get('playStats.audioAlertShown')) {
			return;
	}

		// Tell new users that there's sound now!
		$SM.set('playStats.audioAlertShown', true);
		Events.startEvent({
			title: _('Sound Available!'),
			scenes: {
				start: {
					text: [
						_('ears flooded with new sensations.'),
						_('perhaps silence is safer?')
					],
					buttons: {
						'yes': {
						text: _('enable audio'),
						nextScene: 'end',
						onChoose: () => Engine.toggleVolume(true)
					},
						'no': {
						text: _('disable audio'),
						nextScene: 'end',
						onChoose: () => Engine.toggleVolume(false)
						}
					}
				}
			}
		});
	}
})();

function inView(dir, elem){

		var scTop = $('#main').offset().top;
		var scBot = scTop + $('#main').height();

		var elTop = elem.offset().top;
		var elBot = elTop + elem.height();

		if( dir == 'up' ){
				// STOP MOVING IF BOTTOM OF ELEMENT IS VISIBLE IN SCREEN
				return ( elBot < scBot );
		}else if( dir == 'down' ){
				return ( elTop > scTop );
		}else{
				return ( ( elBot <= scBot ) && ( elTop >= scTop ) );
		}

}

function scrollByX(elem, x){

		var elTop = parseInt( elem.css('top'), 10 );
		elem.css( 'top', ( elTop + x ) + "px" );

}


//create jQuery Callbacks() to handle object events
$.Dispatch = function( id ) {
	var callbacks, topic = id && Engine.topics[ id ];
	if ( !topic ) {
		callbacks = jQuery.Callbacks();
		topic = {
				publish: callbacks.fire,
				subscribe: callbacks.add,
				unsubscribe: callbacks.remove
		};
		if ( id ) {
			Engine.topics[ id ] = topic;
		}
	}
	return topic;
};

// APRIL FOOLS!
var april = function() {

	if(document.location.href.search(/[\?\&]april=1/) == -1){
		/* The `if (april == null)` guard that used to read this was
		 * commented out below at some point, which left the block running
		 * unconditionally and this lookup's result never read by anything.
		 * Engine.findStylesheet() is a pure query (just walks
		 * document.styleSheets), so removing the call changes nothing. */
		//if (april == null) {
			
			$('head').append('<link rel="stylesheet" href="css/april.css" type="text/css" title="aprilFools" />');
			$('.lightsOff').text(_('april fools.')).on('click', function() {
				/* location.pathname rather than a hardcoded './index.html' -- the
				 * same class of bug just found in loadAudioFile(). This runs on
				 * mobile.html too (april() has no page check), and a hardcoded
				 * index.html would bounce a mobile player onto the desktop page
				 * to see a joke that has nothing to do with which page they
				 * were on. */
				window.location = location.pathname + "?april=1";
			});
			document.head.insertAdjacentHTML(
				'beforeend',
				'<link rel="stylesheet" href="css/april.css" />');

			/* The actual, load-bearing signal that April Fools content is
			 * live -- see Achievements.inAprilMode() for why this replaced
			 * the ?april=1 URL check, which nothing in this function's real
			 * trigger path (the date check at the bottom of this file) ever
			 * sets. A plain runtime property rather than $SM state: this is
			 * a fact about the current session's environment, re-evaluated
			 * fresh on every load, not something that should persist into a
			 * save file or survive across days. */
			Engine.aprilFoolsActive = true;

		//}
		
		$('body').append($('<a>').addClass("counter")
								 .attr('href','http://www.hitwebcounter.com/')
								 .attr('target','_blank').append($('<img>').attr('src','http://hitwebcounter.com/counter/counter.php?page=6031127&style=0015&nbdigits=6&type=page&initCount=0')));
		$('body').append($('<div>').addClass('construction'));
		$('body').append($('<div>').addClass('cute'));

		$('.cute').toggleClass("move");
		setInterval(function() {
    		$('.cute').toggleClass("move");
		}, 3030);

		setTimeout(function() { 
			alert('This Geocities website is under construction!'); 
			setTimeout(function() { alert('Please join our webring and sign our guestbook!'); }, 2000);
		}, 1000);
	}

	else {
		Events.startEvent({
				title: _('Update'),
				scenes: {
					start: {
						text: [
							_('there is a new layout, would you like to use it?')
						],
						buttons: {
							'ok': {
								text: _('check it out.'),
								onChoose: function() {
									window.location = location.pathname;
								}
							},
							'no': {
								text: _('no thanks.'),
								nextScene: 'end'
							}
						}
					},
				}
			});
	}
}

$(function() {
	Engine.init();
	
	/* Check if it is april fools day */
	var aprilFools = {
		month: 3,
		date: 1
	}
	
	function isItAprilFoolDay() {
		var now = new Date();
		return (now.getMonth() == aprilFools.month && now.getDate() == aprilFools.date);
	}

	if(isItAprilFoolDay()){
		april();
	}
});
