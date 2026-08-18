/**
 * Module that registers spaaaaaaaaace!
 */
var Space = {	
	// Upstream easter egg: autoplaying video over the ending on 1 April. Opt in.
	ENABLE_APRIL_FOOLS: false,
	SHIP_SPEED: 3,
	BASE_ASTEROID_DELAY: 500,
	BASE_ASTEROID_SPEED: 1500,
	FTB_SPEED: 60000,
	STAR_WIDTH: 3000,
	STAR_HEIGHT: 3000,
	NUM_STARS: 200,
	STAR_SPEED: 60000,
	FRAME_DELAY: 100,
	
	stars: null,
	backStars: null,
	ship: null,
	lastMove: null,
	done: false,
	shipX: null,
	shipY: null,
	
	hull: 0,
	
	name: "Space",
	init: function(options) {
		this.options = $.extend(
			this.options,
			options
		);
		
		// Create the Space panel
		this.panel = $('<div>').attr('id', "spacePanel")
			.addClass('location')
			.appendTo('#outerSlider');
		
		// Create the ship
		Space.ship = $('<div>').text("@").attr('id', 'ship').appendTo(this.panel);
		
		// Create the hull display
		var h = $('<div>').attr('id', 'hullRemaining').appendTo(this.panel);
		$('<div>').addClass('row_key').text(_('hull: ')).appendTo(h);
		$('<div>').addClass('row_val').appendTo(h);
		
		//subscribe to stateUpdates
		$.Dispatch('stateUpdate').subscribe(Space.handleStateUpdates);
	},
	
	options: {}, // Nothing for now
	
	onArrival: function() {
		Space.done = false;
		Engine.keyLock = false;
		Space.hull = Ship.getMaxHull();
		Space.altitude = 0;
		Space.setTitle();
		AudioEngine.playBackgroundMusic(AudioLibrary.MUSIC_SPACE);
		Space.updateHull();
		
		Space.up = 
		Space.down = 
		Space.left = 
		Space.right = false;
		
		Space.ship.css({
			top: '350px',
			left: '350px'
		});
		Space.startAscent();
		Space._shipTimer = setInterval(Space.moveShip, 33);
		Space._volumeTimer = setInterval(Space.lowerVolume, 1000);
		AudioEngine.playBackgroundMusic(AudioLibrary.MUSIC_SPACE);
		
		/* Check if it is april fools day.
		 *
		 * Date#getMonth() is zero-indexed, so the old `month: 4` fired this on
		 * 1 May, not 1 April. Left disabled by default -- flip ENABLE_APRIL_FOOLS
		 * to true if you want the upstream gag back. It injects an autoplaying
		 * YouTube embed over the ending, which is worth an explicit decision
		 * rather than a surprise. */
		var aprilFools = {
			month: 3, // 3 === April
			date: 1
		};

		function isItAprilFoolDay() {
			var now = new Date();
			return (now.getMonth() == aprilFools.month && now.getDate() == aprilFools.date);
		}

		if(Space.ENABLE_APRIL_FOOLS && isItAprilFoolDay()){
			$('body').append($('<iframe>').attr('src','https://www.youtube.com/embed/ZZ5LpwO-An4?autoplay=1').attr('frameborder',0));
		}

	},
	
	setTitle: function() {
		if(Engine.activeModule == this) {
			var t;
			if(Space.altitude < 10) {
				t = _("Troposphere");
			} else if(Space.altitude < 20) {
				t = _("Stratosphere");
			} else if(Space.altitude < 30) {
				t = _("Mesosphere");
			} else if(Space.altitude < 45) {
				t = _("Thermosphere");
			} else if(Space.altitude < 60){
				t = _("Exosphere");
			} else {
				t = _("Space");
			}
			document.title = t;
		}
	},
	
	getSpeed: function() {
		return Space.SHIP_SPEED + $SM.get('game.spaceShip.thrusters');
	},
	
	updateHull: function() {
		$('div#hullRemaining div.row_val', Space.panel).text(Space.hull + '/' + Ship.getMaxHull());
	},
	
	createAsteroid: function(noNext) {
		var r = Math.random();
		var c;
		if(r < 0.2)
			c = '#';
		else if(r < 0.4)
			c = '$';
		else if(r < 0.6)
			c = '%';
		else if(r < 0.8)
			c = '&';
		else
			c = 'H';
		
		var x = Math.floor(Math.random() * 700);
		var a = $('<div>').addClass('asteroid').text(c).appendTo('#spacePanel').css('left', x + 'px');
		a.data({
			xMin: x,
			xMax: x + a.width(),
			height: a.height()
		});
		a.animate({
			top: '740px'
		}, {
			duration: Space.BASE_ASTEROID_SPEED - Math.floor(Math.random() * (Space.BASE_ASTEROID_SPEED * 0.65)),
			easing: 'linear', 
			progress: function() {
				// Collision detection
				var t = $(this);
				if(t.data('xMin') <= Space.shipX && t.data('xMax') >= Space.shipX) {
					var aY = t.css('top');
					aY = parseFloat(aY.substring(0, aY.length - 2));
					
					if(aY <= Space.shipY && aY + t.data('height') >= Space.shipY) {
						// Collision
						Engine.log('collision');
						t.remove();
						Space.hull--;
						Space.updateHull();

						// play audio on asteroid hit
						// higher altitudes play higher frequency hits
						var r = Math.floor(Math.random() * 2);
						if(Space.altitude > 40) {
							r += 6;
							AudioEngine.playSound(AudioLibrary['ASTEROID_HIT_' + r]);
						} else if(Space.altitude > 20) {
							r += 4;
							AudioEngine.playSound(AudioLibrary['ASTEROID_HIT_' + r]);
						} else  {
							r += 1;
							AudioEngine.playSound(AudioLibrary['ASTEROID_HIT_' + r]);
						}
						
						if(Space.hull === 0) {
							Space.crash();
						}
					}
				}
			},
			complete: function() {
				$(this).remove();
			}
		});
		if(!noNext) {
			
			// Harder
			if(Space.altitude > 10) {
				Space.createAsteroid(true);
			}
			
			// HARDER
			if(Space.altitude > 20) {
				Space.createAsteroid(true);
				Space.createAsteroid(true);
			}
			
			// HAAAAAARDERRRRR!!!!1
			if(Space.altitude > 40) {
				Space.createAsteroid(true);
				Space.createAsteroid(true);
			}
			
			if(!Space.done) {
				Engine.setTimeout(Space.createAsteroid, 1000 - (Space.altitude * 10), true);
			}
		}
	},
	
	moveShip: function() {
		var x = Space.ship.css('left');
		x = parseFloat(x.substring(0, x.length - 2));
		var y = Space.ship.css('top');
		y = parseFloat(y.substring(0, y.length - 2));
		
		var dx = 0, dy = 0;
		
		if(Space.up) {
			dy -= Space.getSpeed();
		} else if(Space.down) {
			dy += Space.getSpeed();
		}
		if(Space.left) {
			dx -= Space.getSpeed();
		} else if(Space.right) {
			dx += Space.getSpeed();
		}
		
		if(dx !== 0 && dy !== 0) {
			dx = dx / Math.sqrt(2);
			dy = dy / Math.sqrt(2);
		}
		
		if(Space.lastMove != null) {
			var dt = Date.now() - Space.lastMove;
			dx *= dt / 33;
			dy *= dt / 33;
		}
		
		x = x + dx;
		y = y + dy;
		if(x < 10) {
			x = 10;
		} else if(x > 690) {
			x = 690;
		}
		if(y < 10) {
			y = 10;
		} else if(y > 690) {
			y = 690;
		}
		
		Space.shipX = x;
		Space.shipY = y;
		
		Space.ship.css({
			left: x + 'px',
			top: y + 'px'
		});
		
		Space.lastMove = Date.now();
	},
	
	startAscent: function() {
		var body_color;
		var to_color;
		if (Engine.isLightsOff()) {
			body_color = '#272823';
			to_color = '#EEEEEE';
		}
		else {
			body_color = '#FFFFFF';
			to_color = '#000000';
		}
	
		// Safely check if jQuery Color plugin animation is supported
		try {
			$('body').addClass('noMask').css({backgroundColor: body_color}).animate({
				backgroundColor: to_color
			}, {
				duration: Space.FTB_SPEED, 
				easing: 'linear',
				progress: function() {
					var cur = $('body').css('background-color');
					var s = 'linear-gradient(rgba' + cur.substring(3, cur.length - 1) + ', 0) 0%, rgba' + 
						cur.substring(3, cur.length - 1) + ', 1) 100%)';
					$('#notifyGradient').attr('style', 'background-color:'+cur+';background:-webkit-' + s + ';background:' + s);
				},
				complete: Space.endGame
			});
		} catch (e) {
			console.warn('jQuery Color animation failed, falling back to CSS transition:', e);
			$('body').addClass('noMask').css({
				backgroundColor: body_color,
				transition: 'background-color ' + (Space.FTB_SPEED / 1000) + 's linear'
			});
			setTimeout(function() {
				$('body').css({backgroundColor: to_color});
			}, 50);
			setTimeout(Space.endGame, Space.FTB_SPEED);
		}
		Space.drawStars();
		Space._timer = setInterval(function() {
			Space.altitude += 1;
			if(Space.altitude % 10 === 0) {
				Space.setTitle();
			}
			if(Space.altitude > 60) {
				clearInterval(Space._timer);
			}
		}, 1000);
		
		Space._panelTimeout = Engine.setTimeout(function() {
			if (Engine.isLightsOff())
				$('#spacePanel, .menu, select.menuBtn').animate({color: '#272823'}, 500, 'linear');
			else
				$('#spacePanel, .menu, select.menuBtn').animate({color: 'white'}, 500, 'linear');
		}, Space.FTB_SPEED / 2, true);
		
		Space.createAsteroid();
	},

	drawStars: function(duration) {
		var starsContainer = $('<div>').attr('id', 'starsContainer').appendTo('body');
		Space.stars = $('<div>').css('bottom', '0px').attr('id', 'stars').appendTo(starsContainer);
		var s1 = $('<div>').css({
			width: Space.STAR_WIDTH + 'px',
			height: Space.STAR_HEIGHT + 'px'
		});
		var s2 = s1.clone();
		Space.stars.append(s1).append(s2);
		Space.drawStarAsync(s1, s2, 0);
		Space.stars.data('speed', Space.STAR_SPEED);
		Space.startAnimation(Space.stars);
		
		Space.starsBack = $('<div>').css('bottom', '0px').attr('id', 'starsBack').appendTo(starsContainer);
		s1 = $('<div>').css({
			width: Space.STAR_WIDTH + 'px',
			height: Space.STAR_HEIGHT + 'px'
		});
		s2 = s1.clone();
		Space.starsBack.append(s1).append(s2);
		Space.drawStarAsync(s1, s2, 0);
		Space.starsBack.data('speed', Space.STAR_SPEED * 2);
		Space.startAnimation(Space.starsBack);
	},
	
	startAnimation: function(el) {
		el.animate({bottom: '-3000px'}, el.data('speed'), 'linear', function() {
			$(this).css('bottom', '0px');
			Space.startAnimation($(this));
		});
	},
	
	drawStarAsync: function(el, el2, num) {
		var top = Math.floor(Math.random() * Space.STAR_HEIGHT) + 'px';
		var left = Math.floor(Math.random() * Space.STAR_WIDTH) + 'px';
		$('<div>').text('.').addClass('star').css({
			top: top,
			left: left
		}).appendTo(el);
		$('<div>').text('.').addClass('star').css({
			top: top,
			left: left
		}).appendTo(el2);
		if(num < Space.NUM_STARS) {
			Engine.setTimeout(function() { Space.drawStarAsync(el, el2, num + 1); }, 100);
		}
	},
	
	crash: function() {
		if(Space.done) return;
		Engine.keyLock = true;
		Space.done = true;
		clearInterval(Space._timer);
		clearInterval(Space._shipTimer);
		clearInterval(Space._volumeTimer);
		clearTimeout(Space._panelTimeout);
		var body_color;
		if (Engine.isLightsOff())
			body_color = '#272823';
		else
			body_color = '#FFFFFF';
		// Craaaaash!
		$('body').removeClass('noMask').stop().animate({
			backgroundColor: body_color
		}, {
			duration: 300, 
			progress: function() {
				var cur = $('body').css('background-color');
				var s = 'linear-gradient(rgba' + cur.substring(3, cur.length - 1) + ', 0) 0%, rgba' + 
					cur.substring(3, cur.length - 1) + ', 1) 100%)';
				$('#notifyGradient').attr('style', 'background-color:'+cur+';background:-webkit-' + s + ';background:' + s);
			},
			complete: function() {
				Space.stars.remove();
				Space.starsBack.remove();
				Space.stars = Space.starsBack = null;
				$('#starsContainer').remove();
				$('body').attr('style', '');
				$('#notifyGradient').attr('style', '');	
				$('#spacePanel').attr('style', '');			
			}
		});
		$('.menu, select.menuBtn').animate({color: '#666'}, 300, 'linear');
		$('#outerSlider').animate({top: '0px'}, 300, 'linear');
		Engine.activeModule = Ship;
		Ship.onArrival();
		Button.cooldown($('#liftoffButton'));
		Engine.event('progress', 'crash');
		AudioEngine.playSound(AudioLibrary.CRASH);
		clearInterval(Space._volumeTimer);
	},
	
	endGame: function() {
		AudioEngine.playBackgroundMusic(AudioLibrary.MUSIC_ENDING);
		if(Space.done) return;
		Engine.event('progress', 'win');
		Space.done = true;
		clearInterval(Space._timer);
		clearInterval(Space._shipTimer);
		clearInterval(Space._volumeTimer);
		clearTimeout(Engine._saveTimer);
		clearTimeout(Outside._popTimeout);
		clearTimeout(Engine._incomeTimeout);
		clearTimeout(Events._eventTimeout);
		clearTimeout(Room._fireTimer);
		clearTimeout(Room._tempTimer);
		for(var j in Room.Craftables) {
			Room.Craftables[j].button = null;
		}
		for(var k in Room.TradeGoods) {
			Room.TradeGoods[k].button = null;
		}
		delete Outside._popTimeout;
		
		clearInterval(Space._volumeTimer);
		
		$('#hullRemaining', Space.panel).animate({opacity: 0}, 500, 'linear');
		Space.ship.animate({
			top: '350px',
			left: '240px'
		}, 3000, 'linear', function() {
			Engine.setTimeout(function() {
				Space.ship.animate({
					top: '-100px'
				}, 200, 'linear', function() {
					// Restart everything! Play FOREVER!
					$('#outerSlider').css({'left': '0px', 'top': '0px'});
					$('#locationSlider, #worldPanel, #spacePanel, #notifications').remove();
					$('#header').empty();
					Engine.setTimeout(function() {
						$('body').stop();
						var container_color;
						if (Engine.isLightsOff())
							container_color = '#EEE';
						else
							container_color = '#000';
						$('#starsContainer').animate({
							opacity: 0,
							'background-color': container_color
						}, {
							duration: 2000, 
							progress: function() {
								var cur = $('body').css('background-color');
								var s = 'linear-gradient(rgba' + cur.substring(3, cur.length - 1) + ', 0) 0%, rgba' + 
									cur.substring(3, cur.length - 1) + ', 1) 100%)';
								$('#notifyGradient').attr('style', 'background-color:'+cur+';background:-webkit-' + s + ';background:' + s);
							},
							complete: function() {
								Engine.GAME_OVER = true;
								Score.save();
								Prestige.save();
								$('#starsContainer').remove();
								$('#content, #notifications').remove();
								Space.showExpansionEnding().then(() => {
									Space.showEndingOptions();
									Engine.options = {};
									Engine.deleteSave(true);
								});
							}
						});
					}, 2000);
				});
			}, 2000);
		});
	},

	/* Karma threshold for the "redeemed" variants of both endings.
	 *
	 * character.karma starts at -10 -- the Exile's unpaid debt -- so reaching
	 * zero is not the default state. It takes a run's worth of small decent
	 * choices to get there, and a player who simply plays efficiently and
	 * never engages with anyone ends the game below it. That's deliberate:
	 * the good endings are earned, not granted for showing up. Actively cruel
	 * play drives it much further down, but the split is binary here -- the
	 * five-band gradient belongs to The Master's insight, not to an ending. */
	GOOD_KARMA_THRESHOLD: 0,

	isRedeemed: () => {
		return $SM.get('character.karma', true) >= Space.GOOD_KARMA_THRESHOLD;
	},

	/* True for a run in which the player never built a hut and nobody ever
	 * came. Reads the doctrine rather than counting buildings: a player can
	 * choose 'solitary' and simply never be offered a hut again, so the
	 * doctrine is the durable fact, while a building count of zero could also
	 * just mean "hasn't got round to it yet". */
	wentAlone: () => {
		return $SM.get('game.doctrine') === 'solitary';
	},

	/* Fades one line of outro text in at a fixed offset from the sequence
	 * start. Extracted because the four ending variants below are otherwise
	 * the same twelve lines of jQuery over and over. */
	/* Translates here rather than at the ~100 call sites.
	 *
	 * Every ending line is passed to this as an English literal, and none of
	 * them were wrapped in _() -- so the entire endgame, including all of the
	 * fork's new endings, was untranslatable no matter how complete a
	 * language file was. Doing it in the helper covers every existing call
	 * and every future one, which matters because new endings get added
	 * regularly and remembering to wrap each line would not survive.
	 *
	 * The strings still need extracting, so build/i18n.mjs treats
	 * Space.outroLine's callers as a translatable source -- see EXTRA_CALLS
	 * there. */
	outroLine: (container, html, delay) => {
		const translated = (typeof _ === 'function') ? _(html) : html;
		setTimeout(() => {
			$('<div>')
				.addClass('outro')
				.html(translated)
				.appendTo(container)
				.animate({ opacity: 1}, 500);
		}, delay);
	},

	showExpansionEnding: () => {
		return new Promise((resolve) => {
			const c = $('<div>')
				.addClass('outroContainer')
				.appendTo('body');
			const line = (html, delay) => Space.outroLine(c, html, delay);
			const redeemed = Space.isRedeemed();
			const alone = Space.wentAlone();
			const crystal = (typeof Prison !== 'undefined') && Prison.hasFinalCrystal();

			/* ---- April Fools ----
			 *
			 * Replaces everything. Requires BOTH the ?april=1 joke build AND
			 * the actual date -- the URL parameter alone would make this a
			 * feature somebody could look up rather than a joke they had to
			 * be there for.
			 *
			 * A parody of Silent Hill 2's dog ending, which is itself the
			 * canonical example of a game undercutting its own bleakness on
			 * purpose. The absurdity is the entire content: nothing here is
			 * a claim about anything, and it is gated behind a date and an
			 * opt-in CSS joke build so it cannot be stumbled into by anybody
			 * taking the game seriously. */
			if (typeof Achievements !== 'undefined' && Achievements.isAprilEnding()) {
				line('the ship clears the debris field. the controls go dead.<br>something else has them.', 2000);
				line('a hatch you have never seen opens in the console housing.', 6000);
				line('there is a shiba inu inside it. it is sitting in front of a bank of equipment<br>that is very obviously the thing that has been running all of this.', 10000);
				line('it is wearing a small headset. it has been wearing it the entire time.', 14000);
                line('the vats. the cycle. the fire that goes out every twenty minutes.<br>the wanderer fleet. the profane. the door you opened.', 18000);
				line('all of it. the dog. it was the dog.', 23000);
				line('it also did 9/11.', 27000);
				line('it looks at you with the total lack of remorse available only to a dog<br>that has never once been told no.', 31000);
				line('it barks once, politely, and the drives come up.', 36000);
				line('...', 40000);
				line('happy april fools. the door out of here still works and none of this happened.', 44000);
				setTimeout(resolve, 49000);
				return;
			}

			/* ---- Flawless: no deaths this run, with the Lab seen ----
			 *
			 * A PREFIX rather than an ending. It changes what the player is
			 * bringing to whatever ending they earned, without replacing it,
			 * so it composes with all eleven of the others.
			 *
			 * Requires the Lab because the whole beat is a flashback to the
			 * vats -- a player who never saw them has no nightmare to flash
			 * back to, and the text would be describing something that never
			 * happened to them. */
			/* ---- Speed run ----
			 *
			 * The second prefix, and it stacks with the flawless one -- a
			 * player who did both has earned both. Prestige-gated: on a blind
			 * first run, 150 minutes would be a fluke rather than the mastery
			 * this text describes.
			 *
			 * Runs BEFORE the flawless flashback (how you got here, then what
			 * you brought), and both prefixes contribute their own duration to
			 * a single running offset rather than each hardcoding a guess
			 * about the other. */
			const speedy = (typeof Achievements !== 'undefined') && Achievements.isSpeedRun();
			let prefix = 0;
			if (speedy) {
				line('you have done this quickly. quicker than last time, and last time was quicker than the one before.', 1000);
				line('there is a route through it now. you did not work it out so much as stop having to.', 4500);
				line('you are getting better at this.<br>you are not sure that is the same thing as getting free of it.', 8000);
				prefix += 11000;
			}

			/* ---- Flawless: no deaths this run, with the Lab seen ----
			 *
			 * A PREFIX rather than an ending: it changes what the player is
			 * bringing to whatever ending they earned, without replacing it,
			 * so it composes with all eleven of the others.
			 *
			 * Requires the Lab, because the whole beat is a flashback to the
			 * vats -- a player who never saw them has no nightmare to flash
			 * back to, and the text would be describing something that never
			 * happened to them. */
			const flawless = (typeof Achievements !== 'undefined') && Achievements.isFlawless();
			if (flawless) {
				line('you have not died once. not this time.', prefix + 1000);
				line('and it comes back anyway, the way it has been coming back since you saw it:<br>the room, and the rows, and the lights going off past where you could see.', prefix + 4000);
				line('they will try again. they are very good at it and they have had a great deal of practice.<br>but whatever comes up out of that glass will not have been out here. it will not have carried this.', prefix + 8000);
				line('it will be you the way a copy of a page is the page.', prefix + 12000);
				line('you find that you are not prepared for this version of you to die.<br>you have never once minded before.', prefix + 16000);
				prefix += 19000;
			}

			/* Every subsequent line sits after whatever prefixes ran. */
			const t = (ms) => ms + prefix;

			/* ---- The last crystal ----
			 *
			 * Checked before everything else. A player carrying the thing
			 * out of the Profane's cell has one question left and no reason
			 * left not to answer it, and that outranks how they got off the
			 * rock. Karma still splits it, because what they find in there
			 * depends on who they turned out to be this time.
			 *
			 * The crystal is deliberately NOT resolved -- the player learns
			 * what the Profane showed them and the game stops there. What
			 * was on it is the one thing the game does not say. */
			if (crystal) {
				line('the rock falls away. the sky goes from blue to black without appearing to change.', t(2000));
				line('there is nothing left to do for a while, and nowhere left to go, and nothing left to reach for.', t(7000));
				line('and the thing at the bottom of the pack is still there.', t(11000));
				line('you take the gloves off.', t(15000));

				const hasBeacon = !!$SM.get('stores["fleet beacon"]');
				const withWanderer = $SM.get('game.metOldWanderer') === true;

				/* ---- The best ending in the game ----
				 *
				 * The narrowest intersection possible: redeemed, alone,
				 * carrying the crystal, AND the beacon actually connects to
				 * a fleet. Every other ending in the file is some version of
				 * a cost paid. This is the one where nothing is owed.
				 *
				 * Deliberately mirrors the ordinary Beacon+alone ending's
				 * beats -- the pulse, the worldships, the arrival -- and
				 * inverts every one of them: empty ships become crewed
				 * ones, "you are no use to her" becomes a fleet that does
				 * not need saving, and ends on the same two questions every
				 * crystal ending ends on, just with better answers. */
				if (redeemed && alone && hasBeacon) {
					line('it is not a memory. the others were memories.<br>this is a thing somebody made, deliberately, to be handed to one person.', t(19000));
					line('four hundred centuries ago somebody sat in a shielded room, holding this, waiting for you to come and ask.', t(24000));
					line('you see what they saw. it is exactly as impossible as it was the first time.<br>and it is exactly as true.', t(29000));
					line('the difference is that this time you already know what it costs to act on it.', t(34000));

					line('the beacon pulses. coordinates are locked. the fleet is expecting you.', t(39000));
					line('the worldships come into view exactly where they should be, and this time they are not running empty.<br>there are people on the rails, working, the way a ship is worked when there is a reason to keep it.', t(44000));

					/* The Watcher is three eyes, three ears, no mouth -- it
					 * cannot proclaim in the ordinary sense, and the payoff
					 * has to be written through that, not around it. What
					 * gets observed is felt rather than announced, which is
					 * the only kind of blessing something with no mouth can
					 * give. */
					line('something with three eyes and no mouth is watching, and for once it does not look away.', t(49000));
					line('it does not say anything. it has never had anything to say anything with. but you understand, the way you understood the crystal, that what is being observed is not a judgement.<br>it is a redemption. and it is being witnessed, which is the only ceremony the watchers know how to hold.', t(54000));

					if (withWanderer) {
						line('and on the bridge, at a station that had no reason to have anybody standing at it, somebody is standing at it.', t(59000));
						line('"i told you i had made my peace with never leaving," he says. "i would like to formally revise that."', t(64000));
						line('says the terms were never as fixed as he let you believe. says he stayed because he had nowhere he would rather be broken, and that this, apparently, is not that any more.', t(69000));
						line('says he is prepared to follow you again, if you will have him. says the last time did not go especially well and that he has had four hundred centuries to think about what he would do differently.', t(74000));

						line('the builder has followed you through all of it, and you never once asked her to.', t(79000));
						line('lovingly, she has given you everything. she asks for one thing back.<br>"why did you do it?"', t(84000));
						line('"to know someone is to love someone. you cannot help who you love."', t(89000));
						setTimeout(resolve, t(94000));
					} else {
						line('the builder has followed you through all of it, and you never once asked her to.', t(59000));
						line('lovingly, she has given you everything. she asks for one thing back.<br>"why did you do it?"', t(64000));
						line('"to know someone is to love someone. you cannot help who you love."', t(69000));
						setTimeout(resolve, t(74000));
					}
					return;
				}

				if (redeemed) {
					line('it is not a memory. the others were memories.<br>this is a thing somebody made, deliberately, to be handed to one person.', t(19000));
					line('four hundred centuries ago somebody sat in a shielded room, holding this, waiting for you to come and ask.', t(24000));
					line('you see what they saw. it is exactly as impossible as it was the first time.<br>and it is exactly as true.', t(29000));
					line('the difference is that this time you already know what it costs to act on it.', t(34000));
					line('you put it down. you do not put it away.<br>the fleet goes on climbing.', t(39000));

					/* The love reveal, held back from every other scene that
					 * touched it -- the vats, the temple's "another way",
					 * the cell -- for exactly this moment. She has followed
					 * every version of this through, without once being
					 * asked to, and the one thing she asks for in return is
					 * the one thing the player has never had to give anyone:
					 * an honest answer to a direct question. */
					line('the builder has followed you through all of it, and you never once asked her to.', t(44000));
					line('lovingly, she has given you everything. she asks for one thing back.<br>"why did you do it?"', t(49000));
					line('"to know someone is to love someone. you cannot help who you love."', t(54000));
					setTimeout(resolve, t(59000));
				} else {
					line('it is not a memory. the others were memories.<br>this is a thing somebody made, deliberately, to be handed to one person.', t(19000));
					line('you see what they saw.', t(24000));
					line('it is still true. that is the part nobody ever believes and it has never once stopped being the part that matters.', t(28000));
					line('and you understand, finally and completely, why you opened that door --<br>and that you would open it again, and that this is not remorse, and never was.', t(33000));
					line('somewhere behind you the rock keeps turning. there is a room on it with a fire in it.<br>you do not look back at it.', t(39000));

					/* Same devotion, met with the same evasion the player has
					 * been running the whole game. Not a lie -- both halves
					 * of the line are true -- but it answers a different
					 * question than the one she asked, and they both know
					 * it, and she does not press. */
					line('the builder has followed you through all of it, and you never once asked her to.', t(44000));
					line('devotedly, she has given you everything. she asks for one thing back.<br>"why did you do it?"', t(49000));
					line('"i could never have done any of this without you. but you would never understand."', t(54000));
					setTimeout(resolve, t(59000));
				}
				return;
			}

			/* ---- Solitary endings: nobody ever followed you ----
			 *
			 * Checked first, because going alone changes the ending more than
			 * anything else does. Four of them: with and without the fleet
			 * beacon, crossed with karma. In every one the builder turns out
			 * to be something the player has no explanation for -- which is
			 * the payoff for a run where she was the only other person in it.
			 */
			if (alone) {
				if (!$SM.get('stores["fleet beacon"]')) {
					line('so much debris of dead ships from long lost wars.<br>the sky opens out, and there is nobody aboard but the two of you.', t(2000));
					line('there is something else out here.<br>rings of it, vast and old, held close around the planet.', t(7000));
					line('they are not aimed outward.<br>they are aimed down. at the ground. at the room.', t(12000));

					if (redeemed) {
						line('the stations turn. they find the ship. they hold there, and do not fire.', t(17000));
						line('nothing explains it. the ship goes on climbing and nothing comes after it.', t(22000));
						line('some part of you wonders whether you escaped at all,<br>or whether this is only the part where you get to leave.', t(27000));
						line('the builder says nothing. the cabin is warm.<br>you drift off to sleep...', t(32000));
						setTimeout(resolve, t(36000));
					} else {
						line('the stations turn. they find the ship. they fire.', t(17000));
						line('the builder does not move. she does not reach for anything.', t(21000));
						line('the light stops a long way short of the hull, bends, and goes back the way it came.<br>one station, then another, then the rest of the ring.', t(25000));
						line('she has never mentioned being able to do that.<br>you have never seen her do anything like it.', t(30000));
						line('there are things about her you do not remember and do not understand.<br>you drift off to sleep...', t(35000));
						setTimeout(resolve, t(39000));
					}
					return;
				}

				/* Beacon + alone: the fleet answers, and there is nobody on it. */
				line('the beacon pulses. coordinates are locked. the fleet is expecting you.', t(2000));
				line('the worldships come into view exactly where they should be, and they are running,<br>and there is not one living soul aboard any of them.', t(7000));
				line('the builder goes to the controls. all of them.', t(12000));
				line('she is working eight stations at once and touching none of them.<br>readouts move. locks release. the drives come up.', t(16000));
				line('you should know how to do this. you are certain you should know how to do this.<br>nothing comes. you stand there and you are no use to her at all.', t(21000));
				line('the stations around the planet find the fleet and open fire.', t(26000));

				if (redeemed) {
					line('she holds it together long enough. the drives catch.', t(30000));
					line('the sky folds over and the firing stops mattering.', t(34000));
					line('there are things about her you do not remember and do not understand.<br>you drift off to sleep, in hyperspace...', t(38000));
					setTimeout(resolve, t(42000));
				} else {
					line('she is doing too much at once and you can see the moment it starts to come apart.', t(30000));
					line('the jump takes. it takes wrong.', t(34000));
					line('the whole fleet comes out somewhere with nothing in it but a weight,<br>and the weight has already got hold of them.', t(38000));
					line('you wake from that nightmare in a dark room...', t(43000));
					setTimeout(resolve, t(47000));
				}
				return;
			}

			/* ---- Ship ending: escaped, but never reached the fleet ---- */
			if (!$SM.get('stores["fleet beacon"]')) {
				line('so much debris of dead ships from long lost wars.<br>some wanderer ships. some others.<br>sky begins to clear into an endless expanse.', t(2000));
				line('there is something else out here.<br>rings of it, vast and old, held close around the planet.', t(7000));
				line('they are not aimed outward.<br>nothing out here was ever what they were built to stop.', t(12000));

				if (redeemed) {
					line('they are aimed down. at the ground. at the room.<br>maybe this is why the builder seemed resigned to staying.', t(17000));
					line('the defenses turn. they find the ship.', t(22000));
					line('they pause.', t(25000));
					line('long enough.', t(27000));
					line('escape...', t(30000));
					/* Resolve after the last line rather than immediately, so
					 * the ending options don't appear over the top of the
					 * sequence the player is still reading. */
					setTimeout(resolve, t(33000));
				} else {
					line('they are aimed down. at the ground. at the room.<br>the builder never mentioned them. the builder never prepared you for this.', t(17000));
					line('the defenses turn. they find the ship.', t(22000));
					line('there is no time to evade.', t(25000));
					line('....', t(28000));
					setTimeout(resolve, t(31000));
				}
				return;
			}

			/* ---- Fleet beacon ending: reached the homefleet ---- */
			line('the beacon pulses gently as the ship glides through space.<br>coordinates are locked.', t(2000));
			line('time to rejoin the other wanderers, alone no more.<br>the fleet knows the way home. nothing to do but wait.', t(7000));
			line('the beacon glows a solid blue, and then goes dim. the ship slows.<br>gradually, the vast wanderer homefleet comes into view.<br>massive worldships drift unnaturally through clouds of debris, scarred and dead. no crew respond', t(14000));
			line('the air is running out.', t(17000));
			line('the capsule is cold.', t(20000));
			line('there is no fire to light.', t(23000));

			if (redeemed) {
				line('the builder wonders if they can bring villagers up as a skeleton crew. deep down you know there is even more you could have done.', t(26000));
			} else {
				line('you have never felt so alone...', t(26000));
			}

			/* Moved from 19500ms to after the karma line. The button used to
			 * appear while three more lines were still to come, so a player
			 * who clicked promptly never saw the end of the sequence -- and
			 * would now miss the karma variant entirely, which is the whole
			 * point of this change. */
			setTimeout(() => {
				Button.Button({
					id: 'wait-btn',
					text: _('wait'),
					click: (btn) => {
						btn.addClass('disabled');
						c.animate({ opacity: 0 }, 5000, 'linear', () => {
							c.remove();
							setTimeout(resolve, t(3000));
						})
					}
				}).animate({ opacity: 1 }, 500).appendTo(c);
			}, 29500)
		});
	},

	showEndingOptions: () => {
		$('<center>')
			.addClass('centerCont')
			.appendTo('body');
		$('<span>')
			.addClass('endGame')
			.text(_('score for this game: {0}', Score.calculateScore()))
			.appendTo('.centerCont')
			.animate({opacity:1},1500);
		$('<br />')
			.appendTo('.centerCont');
		$('<span>')
			.addClass('endGame')
			.text(_('total score: {0}', Prestige.get().score))
			.appendTo('.centerCont')
			.animate({opacity:1},1500);
		$('<br />')
			.appendTo('.centerCont');
		$('<br />')
			.appendTo('.centerCont');
		$('<span>')
			.addClass('endGame endGameOption')
			.text(_('restart.'))
			.click(Engine.confirmDelete)
			.appendTo('.centerCont')
			.animate({opacity:1},1500);
		$('<br />')
			.appendTo('.centerCont');
		$('<br />')
				.appendTo('.centerCont');
		$('<span>')
				.addClass('endGame')
				.text(_('expanded story. alternate ending. behind the scenes commentary. get the app.'))
				.appendTo('.centerCont')
				.animate({opacity:1}, 1500);
		$('<br />')
				.appendTo('.centerCont');
		$('<br />')
				.appendTo('.centerCont');
		$('<span>')
			.addClass('endGame endGameOption')
			.text(_('iOS.'))
			.click(function() { window.open('https://itunes.apple.com/app/apple-store/id736683061?pt=2073437&ct=gameover&mt=8'); })
			.appendTo('.centerCont')
			.animate({opacity:1},1500);
		$('<br />')
				.appendTo('.centerCont');
		$('<span>')
				.addClass('endGame endGameOption')
				.text(_('android.'))
				.click(function() { window.open('https://play.google.com/store/apps/details?id=com.yourcompany.adarkroom'); })
				.appendTo('.centerCont')
				.animate({opacity:1},1500);
	},

	keyDown: function(event) {
		switch(event.which) {
			case 38: // Up
			case 87:
				Space.up = true;
				Engine.log('up on');
				break;
			case 40: // Down
			case 83:
				Space.down = true;
				Engine.log('down on');
				break;
			case 37: // Left
			case 65:
				Space.left = true;
				Engine.log('left on');
				break;
			case 39: // Right
			case 68:
				Space.right = true;
				Engine.log('right on');
				break;
		}
	},
	
	keyUp: function(event) {
		switch(event.which) {
			case 38: // Up
			case 87:
				Space.up = false;
				Engine.log('up off');
				break;
			case 40: // Down
			case 83:
				Space.down = false;
				Engine.log('down off');
				break;
			case 37: // Left
			case 65:
				Space.left = false;
				Engine.log('left off');
				break;
			case 39: // Right
			case 68:
				Space.right = false;
				Engine.log('right off');
				break;
		}
	},
	
	handleStateUpdates: function(e){

	},
	
	lowerVolume: function () {
		if (Space.done) return;
		
		// lower audio as ship gets further into space
		var progress = Space.altitude / 60;
		var newVolume = 1.0 - progress;
		AudioEngine.setBackgroundMusicVolume(newVolume, 0.3);		
	}
};
