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
	outroLine: (container, html, delay) => {
		setTimeout(() => {
			$('<div>')
				.addClass('outro')
				.html(html)
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
				line('the rock falls away. the sky goes from blue to black without appearing to change.', 2000);
				line('there is nothing left to do for a while, and nowhere left to go, and nothing left to reach for.', 7000);
				line('and the thing at the bottom of the pack is still there.', 11000);
				line('you take the gloves off.', 15000);

				if (redeemed) {
					line('it is not a memory. the others were memories.<br>this is a thing somebody made, deliberately, to be handed to one person.', 19000);
					line('four hundred centuries ago somebody sat in a shielded room, holding this, waiting for you to come and ask.', 24000);
					line('you see what they saw. it is exactly as impossible as it was the first time.<br>and it is exactly as true.', 29000);
					line('the difference is that this time you already know what it costs to act on it.', 34000);
					line('you put it down. you do not put it away.<br>the fleet goes on climbing.', 39000);

					/* The love reveal, held back from every other scene that
					 * touched it -- the vats, the temple's "another way",
					 * the cell -- for exactly this moment. She has followed
					 * every version of this through, without once being
					 * asked to, and the one thing she asks for in return is
					 * the one thing the player has never had to give anyone:
					 * an honest answer to a direct question. */
					line('the builder has followed you through all of it, and you never once asked her to.', 44000);
					line('lovingly, she has given you everything. she asks for one thing back.<br>"why did you do it?"', 49000);
					line('"to know someone is to love someone. you cannot help who you love."', 54000);
					setTimeout(resolve, 59000);
				} else {
					line('it is not a memory. the others were memories.<br>this is a thing somebody made, deliberately, to be handed to one person.', 19000);
					line('you see what they saw.', 24000);
					line('it is still true. that is the part nobody ever believes and it has never once stopped being the part that matters.', 28000);
					line('and you understand, finally and completely, why you opened that door --<br>and that you would open it again, and that this is not remorse, and never was.', 33000);
					line('somewhere behind you the rock keeps turning. there is a room on it with a fire in it.<br>you do not look back at it.', 39000);

					/* Same devotion, met with the same evasion the player has
					 * been running the whole game. Not a lie -- both halves
					 * of the line are true -- but it answers a different
					 * question than the one she asked, and they both know
					 * it, and she does not press. */
					line('the builder has followed you through all of it, and you never once asked her to.', 44000);
					line('devotedly, she has given you everything. she asks for one thing back.<br>"why did you do it?"', 49000);
					line('"i could never have done any of this without you. but you would never understand."', 54000);
					setTimeout(resolve, 59000);
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
					line('so much debris of dead ships from long lost wars.<br>the sky opens out, and there is nobody aboard but the two of you.', 2000);
					line('there is something else out here.<br>rings of it, vast and old, held close around the planet.', 7000);
					line('they are not aimed outward.<br>they are aimed down. at the ground. at the room.', 12000);

					if (redeemed) {
						line('the stations turn. they find the ship. they hold there, and do not fire.', 17000);
						line('nothing explains it. the ship goes on climbing and nothing comes after it.', 22000);
						line('some part of you wonders whether you escaped at all,<br>or whether this is only the part where you get to leave.', 27000);
						line('the builder says nothing. the cabin is warm.<br>you drift off to sleep...', 32000);
						setTimeout(resolve, 36000);
					} else {
						line('the stations turn. they find the ship. they fire.', 17000);
						line('the builder does not move. she does not reach for anything.', 21000);
						line('the light stops a long way short of the hull, bends, and goes back the way it came.<br>one station, then another, then the rest of the ring.', 25000);
						line('she has never mentioned being able to do that.<br>you have never seen her do anything like it.', 30000);
						line('there are things about her you do not remember and do not understand.<br>you drift off to sleep...', 35000);
						setTimeout(resolve, 39000);
					}
					return;
				}

				/* Beacon + alone: the fleet answers, and there is nobody on it. */
				line('the beacon pulses. coordinates are locked. the fleet is expecting you.', 2000);
				line('the worldships come into view exactly where they should be, and they are running,<br>and there is not one living soul aboard any of them.', 7000);
				line('the builder goes to the controls. all of them.', 12000);
				line('she is working eight stations at once and touching none of them.<br>readouts move. locks release. the drives come up.', 16000);
				line('you should know how to do this. you are certain you should know how to do this.<br>nothing comes. you stand there and you are no use to her at all.', 21000);
				line('the stations around the planet find the fleet and open fire.', 26000);

				if (redeemed) {
					line('she holds it together long enough. the drives catch.', 30000);
					line('the sky folds over and the firing stops mattering.', 34000);
					line('there are things about her you do not remember and do not understand.<br>you drift off to sleep, in hyperspace...', 38000);
					setTimeout(resolve, 42000);
				} else {
					line('she is doing too much at once and you can see the moment it starts to come apart.', 30000);
					line('the jump takes. it takes wrong.', 34000);
					line('the whole fleet comes out somewhere with nothing in it but a weight,<br>and the weight has already got hold of them.', 38000);
					line('you wake from that nightmare in a dark room...', 43000);
					setTimeout(resolve, 47000);
				}
				return;
			}

			/* ---- Ship ending: escaped, but never reached the fleet ---- */
			if (!$SM.get('stores["fleet beacon"]')) {
				line('so much debris of dead ships from long lost wars.<br>some wanderer ships. some others.<br>sky begins to clear into an endless expanse.', 2000);
				line('there is something else out here.<br>rings of it, vast and old, held close around the planet.', 7000);
				line('they are not aimed outward.<br>nothing out here was ever what they were built to stop.', 12000);

				if (redeemed) {
					line('they are aimed down. at the ground. at the room.<br>maybe this is why the builder seemed resigned to staying.', 17000);
					line('the defenses turn. they find the ship.', 22000);
					line('they pause.', 25000);
					line('long enough.', 27000);
					line('escape...', 30000);
					/* Resolve after the last line rather than immediately, so
					 * the ending options don't appear over the top of the
					 * sequence the player is still reading. */
					setTimeout(resolve, 33000);
				} else {
					line('they are aimed down. at the ground. at the room.<br>the builder never mentioned them. the builder never prepared you for this.', 17000);
					line('the defenses turn. they find the ship.', 22000);
					line('there is no time to evade.', 25000);
					line('....', 28000);
					setTimeout(resolve, 31000);
				}
				return;
			}

			/* ---- Fleet beacon ending: reached the homefleet ---- */
			line('the beacon pulses gently as the ship glides through space.<br>coordinates are locked.', 2000);
			line('time to rejoin the other wanderers, alone no more.<br>the fleet knows the way home. nothing to do but wait.', 7000);
			line('the beacon glows a solid blue, and then goes dim. the ship slows.<br>gradually, the vast wanderer homefleet comes into view.<br>massive worldships drift unnaturally through clouds of debris, scarred and dead. no crew respond', 14000);
			line('the air is running out.', 17000);
			line('the capsule is cold.', 20000);
			line('there is no fire to light.', 23000);

			if (redeemed) {
				line('the builder wonders if they can bring villagers up as a skeleton crew. deep down you know there is even more you could have done.', 26000);
			} else {
				line('you have never felt so alone...', 26000);
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
							setTimeout(resolve, 3000);
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
