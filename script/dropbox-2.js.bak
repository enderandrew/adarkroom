(function (Engine, Events, $) {

  'use strict';

  if (!Engine) { return false; }

  var CLIENT_ID = 'a4gruy9ol789f14'; // Replace with your Dropbox App Key
  var REDIRECT_URI = 'https://enderandrew.com/adarkerroom/';

  var DropboxConnector = {
    dbx: null,
    dropboxAccount: null,
    savegames: { 0: null, 1: null, 2: null, 3: null, 4: null },

    init: function () {
      // Initialize Dropbox client with App Key
      this.dbx = new Dropbox.Dropbox({ clientId: CLIENT_ID });

      // Check if returning from OAuth PKCE redirect
      if (this.hasRedirectCode()) {
        this.handleRedirect();
      } else {
        this.checkExistingToken();
      }

      return this;
    },

    // Check URL parameters for OAuth authorization code
    hasRedirectCode: function () {
      var params = new URLSearchParams(window.location.search);
      return params.has('code');
    },

    // Complete OAuth 2 PKCE login flow after redirect
    handleRedirect: function () {
      var self = this;
      var params = new URLSearchParams(window.location.search);
      var code = params.get('code');

      this.dbx.auth.getAccessTokenFromCode(REDIRECT_URI, code)
        .then(function (response) {
          var accessToken = response.result.access_token;
          localStorage.setItem('dbx_access_token', accessToken);
          self.dbx.auth.setAccessToken(accessToken);

          // Clean code parameter from browser address bar
          window.history.replaceState({}, document.title, window.location.pathname);

          self.onAuthenticated();
        })
        .catch(function (error) {
          console.error('Dropbox Authentication Error:', error);
        });
    },

    // Check if an access token is stored in localStorage
    checkExistingToken: function () {
      var token = localStorage.getItem('dbx_access_token');
      if (token) {
        this.dbx.auth.setAccessToken(token);
        this.onAuthenticated();
      }
    },

    // Start OAuth 2 PKCE redirect flow
    connectToDropbox: function () {
      this.dbx.auth.getAuthenticationUrl(REDIRECT_URI, null, 'code', 'offline', null, 'none', true)
        .then(function (authUrl) {
          window.location.href = authUrl;
        });
    },

    onAuthenticated: function () {
      var self = this;
      this.dbx.usersGetCurrentAccount()
        .then(function (response) {
          self.dropboxAccount = response.result.email;
          self.loadGamesFromDropbox();
        })
        .catch(function (error) {
          // Token expired or invalid
          self.signout();
        });
    },

    startDropbox: function () {
      if (!this.dropboxAccount) {
        this.startDropboxConnectEvent();
      } else {
        this.startDropboxImportEvent();
      }
    },

    /**
     * UI Event Menus
     */
    startDropboxConnectEvent: function () {
      var self = this;
      Events.startEvent({
        title: _('Dropbox connection'),
        scenes: {
          start: {
            text: [_('connect game to dropbox local storage')],
            buttons: {
              'connect': {
                text: _('connect'),
                nextScene: 'end',
                onChoose: function () {
                  self.connectToDropbox();
                }
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

    startDropboxImportEvent: function () {
      var self = this;
      Events.startEvent({
        title: _('Dropbox Export / Import'),
        scenes: {
          start: {
            text: [
              _('export or import save data to dropbox storage'),
              _('you are connected to dropbox with account ') + self.dropboxAccount
            ],
            buttons: {
              'save': {
                text: _('save'),
                nextScene: { 1: 'saveToSlot' }
              },
              'load': {
                text: _('load'),
                nextScene: { 1: 'loadFromSlot' },
                onChoose: function () { self.loadGamesFromDropbox(); }
              },
              'signout': {
                text: _('signout'),
                nextScene: 'end',
                onChoose: function () { self.signout(); }
              },
              'cancel': {
                text: _('cancel'),
                nextScene: 'end'
              }
            }
          },
          saveToSlot: {
            text: [_('choose one slot to save to')],
            buttons: (function () {
              var buttons = {};
              $.each(self.savegames, function (n, savegame) {
                buttons['savegame' + n] = {
                  text: _('save to slot') + ' ' + n + ' ' + (savegame ? self.prepareSaveDate(savegame.timestamp) : 'empty'),
                  nextScene: 'end',
                  onChoose: function () {
                    Engine.setTimeout(function () {
                      self.saveGameToDropbox(n, self.savedtoDropboxEvent);
                    }, 1000);
                  }
                };
              });
              buttons.cancel = { text: _('cancel'), nextScene: 'end' };
              return buttons;
            }())
          },
          loadFromSlot: {
            text: [_('choose one slot to load from')],
            buttons: (function () {
              var buttons = {};
              $.each(self.savegames, function (n, savegame) {
                if (savegame) {
                  buttons['savegame' + n] = {
                    text: _('load from slot') + ' ' + n + ' ' + self.prepareSaveDate(savegame.timestamp),
                    nextScene: 'end',
                    onChoose: function () {
                      Engine.setTimeout(function () {
                        self.loadGameFromDropbox(n);
                      }, 1000);
                    }
                  };
                }
              });
              buttons.cancel = { text: _('cancel'), nextScene: 'end' };
              return buttons;
            }())
          }
        }
      });
    },

    savedtoDropboxEvent: function (success) {
      Events.startEvent({
        title: _('Dropbox Export / Import'),
        scenes: {
          start: {
            text: success ? [_('successfully saved to dropbox storage')] : [_('error while saving to dropbox storage')],
            buttons: {
              'ok': { text: _('ok'), nextScene: 'end' }
            }
          }
        }
      });
    },

    /**
     * File Operations (v2 Files API)
     */
    saveGameToDropbox: function (slotnumber, callback) {
      var self = this;
      var fileName = '/savegame_' + slotnumber + '.json';
      var saveData = JSON.stringify({
        gameState: Engine.generateExport64(),
        timestamp: new Date().getTime()
      });

      this.dbx.filesUpload({
        path: fileName,
        contents: saveData,
        mode: 'overwrite'
      })
      .then(function (response) {
        self.savegames[slotnumber] = JSON.parse(saveData);
        if (typeof callback === 'function') callback(true);
      })
      .catch(function (error) {
        console.error('Save error:', error);
        if (typeof callback === 'function') callback(false);
      });
    },

    loadGamesFromDropbox: function () {
      var self = this;
      // List all existing save files in the app folder
      this.dbx.filesListFolder({ path: '' })
        .then(function (response) {
          var entries = response.result.entries;
          entries.forEach(function (entry) {
            var match = entry.name.match(/^savegame_(\d+)\.json$/);
            if (match) {
              var slot = match[1];
              self.downloadSaveFile(slot, entry.path_lower);
            }
          });
        })
        .catch(function (error) {
          console.error('Error fetching file list:', error);
        });
    },

    downloadSaveFile: function (slotnumber, path) {
      var self = this;
      this.dbx.filesDownload({ path: path })
        .then(function (response) {
          var reader = new FileReader();
          reader.onload = function () {
            try {
              self.savegames[slotnumber] = JSON.parse(reader.result);
            } catch (e) {
              console.error('Parsing save file failed', e);
            }
          };
          reader.readAsText(response.result.fileBlob);
        });
    },

    loadGameFromDropbox: function (slotnumber) {
      var record = this.savegames[slotnumber];
      if (record && record.gameState) {
        Engine.import64(record.gameState);
      }
    },

    signout: function () {
      localStorage.removeItem('dbx_access_token');
      this.dbx = new Dropbox.Dropbox({ clientId: CLIENT_ID });
      this.dropboxAccount = null;
      this.savegames = { 0: null, 1: null, 2: null, 3: null, 4: null };
      alert('Successfully signed out.');
    },

    prepareSaveDate: function (timestamp) {
      if (!timestamp) return '';
      var date = new Date(timestamp);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }
  };

  Engine.Dropbox = DropboxConnector;

})(Engine, Events, jQuery);