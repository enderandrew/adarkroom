(function() {
	var Engine = window.Engine = {

		SITE_URL: encodeURIComponent("https://adr.enderandrew.com"),
		VERSION: 1.3,
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

			// Check for mobile
			if(Engine.isMobile()) {
				window.location = 'mobileWarning.html';
			}

			Engine.disableSelection();

			if(this.options.state != null) {
				window.State = this.options.state;
			} else {
				Engine.loadGame();
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
				.addClass('changelog menuBtn')
				.text(_('changelog.'))
				.click(Engine.promptChangelog)
				.appendTo(menu);

			$('<span>')								   
				.addClass('appStore menuBtn')
				.text(_('get the app.'))
				.click(Engine.getApp)
				.appendTo(menu);
				
			$('<span>')								   
				.addClass('appStore menuBtn')
				.text(_('buy on steam.'))
				.click(function() { window.open('https://store.steampowered.com/app/2460660/A_Dark_Room/'); })
				.appendTo(menu);

			$('<span>')
				.addClass('lightsOff menuBtn')
				.text(_('lights off.'))
				.click(Engine.turnLightsOff)
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

			if(this.options.dropbox && Engine.Dropbox) {
				this.dropbox = Engine.Dropbox.init();

				$('<span>')
					.addClass('menuBtn')
					.text(_('dropbox.'))
					.click(Engine.Dropbox.startDropbox)
					.appendTo(menu);
			}

			$('<span>')
				.addClass('menuBtn')
				.text(_('github.'))
				.click(function() { window.open('https://github.com/doublespeakgames/adarkroom'); })
				.appendTo(menu);

			// Register keypress handlers
			$('body').off('keydown').keydown(Engine.keyDown);
			$('body').off('keyup').keyup(Engine.keyUp);

			// Register swipe handlers
			swipeElement = $('#outerSlider');
			swipeElement.on('swipeleft', Engine.swipeLeft);
			swipeElement.on('swiperight', Engine.swipeRight);
			swipeElement.on('swipeup', Engine.swipeUp);
			swipeElement.on('swipedown', Engine.swipeDown);

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

			Engine.toggleVolume(Boolean($SM.get('config.soundOn')));
			if(!AudioEngine.isAudioContextRunning()) {
				document.addEventListener('click', Engine.resumeAudioContext, true);
			}
			
			if($SM.get('config.hardcoreMode', true)){
					Engine.triggerHardcoreMode();
			}

			Engine.saveLanguage();
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

		isMobile: function() {
			return ( location.search.indexOf( 'ignorebrowser=true' ) < 0 && /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test( navigator.userAgent ) );
		},

		saveGame: function() {
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
						text: [_('save this.')],
						textarea: Engine.export64(),
						onLoad: function() { Engine.event('progress', 'export'); },
						readonly: true,
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
							_('if the code is invalid, all data will be lost.'),
							_('this is irreversible.')
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
						text: [_('put the save code here.')],
						textarea: '',
						buttons: {
							'okay': {
								text: _('import'),
								nextScene: 'end',
								onChoose: Engine.import64
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

		import64: function(string64) {
			Engine.event('progress', 'import');
			Engine.disableSelection();
			string64 = string64.replace(/\s/g, '');
			string64 = string64.replace(/\./g, '');
			string64 = string64.replace(/\n/g, '');
			var decodedSave = Base64.decode(string64);
			localStorage.gameState = decodedSave;
			location.reload();
		},

		event: function(cat, act) {
			if(typeof ga === 'function') {
				ga('send', 'event', cat, act);
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
									window.open('https://www.tumblr.com/widgets/share/tool?canonicalUrl=' + Engine.SITE_URL + '&title=A Dark Room, a Minimalist Text Adventure', 'sharer', 'width=660,height=460,location=no,menubar=no,resizable=no,scrollbars=yes,status=no,toolbar=no');
								}
							},
							'pinterest': {
								text:_('pinterest'),
								nextScene: 'end',
								onChoose: function() {
									window.open('http://pinterest.com/pin/create/button/?url=' + Engine.SITE_URL + '&description=A Dark Room, a minimalist text adventure', 'sharer', 'width=480,height=436,location=no,menubar=no,resizable=no,scrollbars=no,status=no,toolbar=no');
								}
							},
							'wordpress': {
								text:_('wordpress'),
								nextScene: 'end',
								onChoose: function() {
									window.open('https://wordpress.com/press-this.php?u=' + Engine.SITE_URL + '&t=A Dark Room, a Minimalist Text Adventure', 'sharer', 'width=700,height=600,location=no,menubar=no,resizable=no,scrollbars=no,status=no,toolbar=no');
								}
							},
							'whatsapp': {
								text:_('whatsapp'),
								nextScene: 'end',
								onChoose: function() {
									window.open('https://api.whatsapp.com/send?text=' + Engine.SITE_URL, 'sharer', 'width=480,height=436,location=no,menubar=no,resizable=no,scrollbars=no,status=no,toolbar=no');
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
						_("In the mean time this is what has changed: The Executioner, The Fabricator, new ending, Hardcore mode, uber traps, new perk, new weapons, new upgrades, exapnded story, more enemies to encounter, more huts can be made on replays, April Fool's mode, key controls in combat, visual tweaks, bugfixes, and more to come!")
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
				slider.animate({left: -(panelIndex * 700) + 'px'}, 300 * diff);

				if($SM.get('stores.wood') !== undefined) {
				// FIXME Why does this work if there's an animation queue...?
					stores.animate({right: -(panelIndex * 700) + 'px'}, 300 * diff);
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

		updateSlider: function() {
			var slider = $('#locationSlider');
			slider.width((slider.children().length * 700) + 'px');
		},

		updateOuterSlider: function() {
			var slider = $('#outerSlider');
			slider.width((slider.children().length * 700) + 'px');
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
				craftable = Room.Craftables[k];
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
				good = Room.TradeGoods[g];
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
		var april = Engine.findStylesheet('aprilFools');
		if (april == null) {
			
			$('head').append('<link rel="stylesheet" href="css/april.css" type="text/css" title="aprilFools" />');
			$('.lightsOff').text(_('april fools.')).on('click', function() { window.location = "./index.html?april=1"});
			
		}
		
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
			alert('Welcome to the Web Site!'); 
			setTimeout(function() { alert('Hope you enjoy your time!'); }, 2000);
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
								onChoose: function() { window.location = './index.html' }
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
