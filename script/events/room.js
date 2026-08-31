/**
 * Events that can occur when the Room module is active
 **/
Events.Room = [
	{ /* The Nomad  --  Merchant */
		title: _('The Nomad'),
		isAvailable: function() {
			return Engine.activeModule == Room && Room.hasBasicProgress() && $SM.get('stores.fur', true) > 0;
		},
		scenes: {
			'start': {
				text: [
					_('a nomad shuffles into view, laden with makeshift bags bound with rough twine.'),
					_("won't say from where he came, but it's clear that he's not staying.")
				],
				notification: _('a nomad arrives, looking to trade'),
				blink: true,
				buttons: {
					'buy25Scales': {
						text: _('buy 25 scales'),
						cost: { 'fur': 2500 },
						reward: { 'scales': 25 }
					},
					'buy15Teeth': {
						text: _('buy 15 teeth'),
						cost: { 'fur': 3000 },
						reward: { 'teeth': 15 }
					},
					'buyScales': {
						text: _('buy scales'),
						cost: { 'fur': 100 },
						reward: { 'scales': 1 }
					},
					'buyTeeth': {
						text: _('buy teeth'),
						cost: { 'fur': 200 },
						reward: { 'teeth': 1 }
					},
					'buyBait': {
						text: _('buy bait'),
						cost: { 'fur': 5 },
						reward: { 'bait': 1 },
						notification: _('traps are more effective with bait.')
					},
					'buyCompass': {
						available: function() {
							return $SM.get('stores.compass', true) < 1;
						},
						text: _('buy compass'),
						cost: { fur: 300, scales: 15, teeth: 5 },
						reward: { 'compass': 1 },
						notification: _('there is a larger world outside these walls, dangerous as it is. wanderers without direction get lost. a compass can point the way in the wilds. the old compass is dented and dusty, but it looks to work.')
					},
					/* Charity. Costs real food and gives nothing back
					 * mechanically beyond karma and a better price -- which is
					 * the point: the reward for decency here is that the world
					 * becomes slightly less hostile later. */
					'feed': {
						text: _('share a meal'),
						cost: { 'cured meat': 20 },
						available: function() {
							return $SM.get('stores["cured meat"]', true) >= 20;
						},
						onChoose: function() { $SM.add('character.karma', 2); },
						notification: _('he eats like he has not in days. leaves a token behind.'),
						reward: { 'scales': 5, 'teeth': 3 }
					},
					/* He is alone, unarmed, and carrying everything he owns. */
					'rob': {
						text: _('take his bags'),
						onChoose: function() { $SM.add('character.karma', -5); },
						/* No longer free loot. He travels this route for a
						 * living and does not always travel it alone. The
						 * karma is charged on the attempt either way -- the
						 * choice is the sin, not the outcome. */
						nextScene: function() {
							return Events.karmaOdds(0.35, 'robBad', 'rob');
						}
					},
					'goodbye': {
						text: _('say goodbye'),
						nextScene: 'end'
					}
				}
			},
			'robBad': {
				text: function() {
					return [
						Events.pick([
							_('he does not fight, but the two who were walking a hundred paces behind him do.'),
							_('the bags come off easily. that is because there is nothing in them worth carrying, and he knew that when he set them down.'),
							_('he is slower than he looks right up until he is not.')
						]),
						_('what is taken is not worth what it cost to take.')
					];
				},
				notification: _('the robbery goes badly'),
				onLoad: function() {
					var numKilled = Math.floor(Math.random() * 3) + 1;
					Outside.killVillagers(numKilled);
				},
				reward: { 'cloth': 5 },
				buttons: {
					'end': {
						text: _('go inside'),
						nextScene: 'end'
					}
				}
			},
			'rob': {
				text: function() {
					return [
						Events.pick([
							_('he does not fight. he watches, while the bags are cut from his shoulders.'),
							_('he sets the bags down himself, before anybody asks him to, and steps back from them.'),
							_('he says one sentence in a language nobody here speaks, and then does not say anything else.')
						]),
						_('he walks back the way he came, with nothing.'),
						Events.pick([
							_('word of this will reach wherever he came from.'),
							_('he knows this route better than anyone here. he will not be walking it again.'),
							_('nobody in the village watches him go. that takes some arranging.')
						])
					];
				},
				notification: _('the nomad is robbed'),
				reward: { 'scales': 30, 'teeth': 20, 'cloth': 15 },
				buttons: {
					'end': {
						text: _('go inside'),
						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.EVENT_NOMAD
	},
	{ /* Noises Outside  --  gain wood/fur */
		title: _('Noises'),
		isAvailable: function() {
			return Engine.activeModule == Room && Room.hasBasicProgress() && $SM.get('stores.wood');
		},
		scenes: {
			'start': {
				text: [
					_('through the walls, shuffling noises can be heard.'),
					_("can't tell what they're up to.")
				],
				notification: _('strange noises can be heard through the walls'),
				blink: true,
				buttons: {
					'investigate': {
						text: _('investigate'),
						/* 30% base chance of finding the gift. Karma shifts it:
						 * whoever is out there in the dark is deciding whether
						 * to leave something or take something. */
						nextScene: function() {
							return Events.karmaOdds(0.7, 'nothing', 'stuff');
						}
					},
					'ignore': {
						text: _('ignore them'),
						nextScene: 'end'
					}
				}
			},
			'nothing': {
				text: [
					_('vague shapes move, just out of sight.'),
					_('the sounds stop.')
				],
				buttons: {
					'backinside': {
						text: _('go back inside'),
						nextScene: 'end'
					}
				}
			},
			'stuff': {
				text: function() {
					return [
						Events.pick([
							_('a bundle of sticks lies just beyond the threshold, wrapped in coarse furs.'),
							_('there is firewood stacked against the door, cut short enough for this stove specifically.'),
							_('a bundle sits just outside, tied with a knot that took somebody a while.')
						]),
						_('someone left this. someone with less than this to spare.'),
						Events.pick([
							_('the night is silent.'),
							_('there are no tracks. the ground is soft enough that there should be.'),
							_('whatever left it is still close enough to be watching, and is not coming in.')
						])
					];
				},
				buttons: {
					'take': {
						text: _('take it inside'),
						reward: { wood: 100, fur: 10 },
						nextScene: 'end'
					},
					/* Leaving it costs a real, immediate 110 resources. The
					 * karma is worth more later, but the player has to choose
					 * that without being told the exchange rate. */
					'leaveit': {
						text: _('leave it for them'),
						onChoose: function() { $SM.add('character.karma', 3); },
						notification: _('the bundle is gone by morning. so are the noises.'),
						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.EVENT_NOISES_OUTSIDE
	},
	{ /* Noises Inside  --  trade wood for better good */
		title: _('Noises'),
		isAvailable: function() {
			return Engine.activeModule == Room && Room.hasBasicProgress() && $SM.get('stores.wood');
		},
		scenes: {
			start: {
				text: [
					_('scratching noises can be heard from the store room.'),
					_('something\'s in there.')
				],
				notification: _('something\'s in the store room'),
				blink: true,
				buttons: {
					'investigate': {
						text: _('investigate'),
						nextScene: { 0.5: 'scales', 0.8: 'teeth', 1: 'cloth' }
					},
					/* The creature is cornered, small, and eating wood.
					 * Killing it is free resources and costs only karma. */
					'kill': {
						text: _('kill it'),
						onChoose: function() { $SM.add('character.karma', -2); },
						nextScene: { 1: 'killed' }
					},
					'ignore': {
						text: _('ignore them'),
						nextScene: 'end'
					}
				}
			},
			killed: {
				text: [
					_('it is small, and it does not run.'),
					_('it was only ever hungry.')
				],
				notification: _('the thing in the store room is dead'),
				reward: { 'meat': 10, 'fur': 5 },
				buttons: {
					'leave': {
						text: _('leave'),
						nextScene: 'end'
					}
				}
			},
			scales: {
				text: [
					_('some wood is missing.'),
					_('the ground is littered with small scales')
				],
				onLoad: function() {
					var numWood = $SM.get('stores.wood', true);
					numWood = Math.floor(numWood * 0.1);
					if(numWood === 0) numWood = 1;
					var numScales = Math.floor(numWood / 5);
					if(numScales === 0) numScales = 1;
					$SM.addM('stores', {'wood': -numWood, 'scales': numScales});
				},
				buttons: {
					'leave': {
						text: _('leave'),
						nextScene: 'end'
					}
				}
			},
			teeth: {
				text: [
					_('some wood is missing.'),
					_('the ground is littered with small teeth')
				],
				onLoad: function() {
					var numWood = $SM.get('stores.wood', true);
					numWood = Math.floor(numWood * 0.1);
					if(numWood === 0) numWood = 1;
					var numTeeth = Math.floor(numWood / 5);
					if(numTeeth === 0) numTeeth = 1;
					$SM.addM('stores', {'wood': -numWood, 'teeth': numTeeth});
				},
				buttons: {
					'leave': {
						text: _('leave'),
						nextScene: 'end'
					}
				}
			},
			cloth: {
				text: [
					_('some wood is missing.'),
					_('the ground is littered with scraps of cloth')
				],
				onLoad: function() {
					var numWood = $SM.get('stores.wood', true);
					numWood = Math.floor(numWood * 0.1);
					if(numWood === 0) numWood = 1;
					var numCloth = Math.floor(numWood / 5);
					if(numCloth === 0) numCloth = 1;
					$SM.addM('stores', {'wood': -numWood, 'cloth': numCloth});
				},
				buttons: {
					'leave': {
						text: _('leave'),
						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.EVENT_NOISES_INSIDE
	},
	{ /* The Beggar  --  trade fur for better good */
		title: _('The Beggar'),
		isAvailable: function() {
			return Engine.activeModule == Room && Room.hasBasicProgress() && $SM.get('stores.fur');
		},
		scenes: {
			start: {
				text: [
					_('a beggar arrives.'),
					_('asks for any spare furs to keep him warm at night.')
				],
				notification: _('a beggar arrives'),
				blink: true,
				buttons: {
					'50furs': {
						text: _('give 50'),
						cost: {fur: 50},
						onChoose: function() { $SM.add('character.karma', 1); },
						nextScene: { 0.5: 'scales', 0.8: 'teeth', 1: 'cloth' }
					},
					'100furs': {
						text: _('give 100'),
						cost: {fur: 100},
						onChoose: function() { $SM.add('character.karma', 1); },
						nextScene: { 0.5: 'teeth', 0.8: 'scales', 1: 'cloth' }
					},
					/* A gift large enough to actually cost something. Whether
					 * he has anything worth giving back is karma-weighted --
					 * a beggar who has been treated well in this village before
					 * has had the chance to accumulate something to repay it with. */
					'250furs': {
						text: _('give 250'),
						cost: {fur: 250},
						available: function() {
							return $SM.get('stores.fur', true) >= 250;
						},
						onChoose: function() { $SM.add('character.karma', 3); },
						nextScene: function() {
							return Events.karmaOdds(0.5, 'cloth', 'generous');
						}
					},
					'deny': {
						text: _('turn him away'),
						onChoose: function() { $SM.add('character.karma', -1); },
						nextScene: 'end'
					}
				}
			},
			scales: {
				reward: { scales: 20 },
				text: [
					_('the beggar expresses his thanks.'),
					_('leaves a pile of small scales behind.')
				],
				buttons: {
					'leave': {
						text: _('say goodbye'),
						nextScene: 'end'
					}
				}
			},
			teeth: {
				reward: { teeth: 20 },
				text: [
					_('the beggar expresses his thanks.'),
					_('leaves a pile of small teeth behind.')
				],
				buttons: {
					'leave': {
						text: _('say goodbye'),
						nextScene: 'end'
					}
				}
			},
			generous: {
				reward: { scales: 40, teeth: 30, cloth: 30 },
				text: [
					_('the beggar does not say thank you.'),
					_('he comes back three days later with a sack, and leaves it at the door.'),
					_('it is worth considerably more than the furs were.')
				],
				buttons: {
					'leave': {
						text: _('say goodbye'),
						nextScene: 'end'
					}
				}
			},
			cloth: {
				reward: { cloth: 20 },
				text: [
					_('the beggar expresses his thanks.'),
					_('leaves some scraps of cloth behind.')
				],
				buttons: {
					'leave': {
						text: _('say goodbye'),
						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.EVENT_BEGGAR
	},
	{/* The Shady Builder */
		title: _('The Shady Builder'),
		isAvailable: function() {
			/* Room, not solitary, and there is actually room for the hut he
			 * is offering to build.
			 *
			 * This used to check game.buildings["hut"] < 20 directly -- a
			 * hardcoded number that both ignored steel huts and didn't match
			 * the real cap of 25. Steel hut conversion decrements the
			 * wood-hut count without freeing any capacity (see
			 * Room.Craftables.hut.isAvailable, fixed for the same reason),
			 * so a player who had, say, 5 wooden huts left after converting
			 * 20 to steel -- population already fully capped -- would still
			 * see this event offer to build a hut it could never place.
			 * Delegating to the real gate means there is exactly one place
			 * that knows what "room for a hut" means.
			 *
			 * Also newly excludes solitary players. Nothing about that
			 * choice should be reversible by a random encounter -- the hut
			 * gate is permanently closed once the player has told the
			 * builder the journey belongs to two people, and this event was
			 * the one path that ignored that. */
			return Engine.activeModule == Room &&
				$SM.get('game.buildings["hut"]', true) >= 5 &&
				Room.Craftables.hut.isAvailable();
		},
		scenes: {
			'start':{
				text: [
					_('a shady builder passes through'),
					_('says he can build you a hut for less wood')
				],
				notification: _('a shady builder passes through'),
				buttons: {
					/* Pay up front: cheap, and the base 60% theft chance is
					 * shifted by karma. A village whose leader is known to
					 * deal fairly attracts fewer people looking for a mark. */
					'build': {
						text: _('300 wood, paid up front'),
						cost: { 'wood' : 300 },
						nextScene: function() {
							return Events.karmaOdds(0.6, 'steal', 'build');
						}
					},
					/* Pay on completion: costs substantially more wood, but
					 * he cannot walk off with it. The safe option should be
					 * available to everyone regardless of karma -- karma tilts
					 * the gamble, it shouldn't be the only way out of it. */
					'buildSafe': {
						text: _('500 wood, paid on completion'),
						cost: { 'wood' : 500 },
						available: function() {
							return $SM.get('stores.wood', true) >= 500;
						},
						nextScene: { 1: 'build' }
					},
					'deny': {
						text: _('say goodbye'),
						nextScene: 'end'
					}
				}
			},
			'steal': {
				text:[
					_("the shady builder has made off with your wood")
				],
				notification: _('the shady builder has made off with your wood'),
				buttons: {
					'end': {
						text: _('go home'),
						nextScene: 'end'
					}
				}
			},
			'build': {
				text:[
					_("the shady builder builds a hut")
				],
				notification: _('the shady builder builds a hut'),
				onLoad: function() {
					/* Re-checked at build time, not just at trigger time.
					 *
					 * isAvailable() only gates whether the encounter can START; the
					 * player still has to click through a scene before the hut is
					 * actually placed, and could in principle convert a hut to
					 * steel in the meantime, so capacity is worth confirming again
					 * here rather than trusting a check from a screen ago. Same
					 * hardcoded-20 bug as isAvailable() otherwise had -- see the
					 * note there. */
					if(Room.Craftables.hut.isAvailable()) {
						var n = $SM.get('game.buildings["hut"]', true);
						$SM.set('game.buildings["hut"]', n + 1);
					}
				},
				buttons: {
					'end': {
						text: _('go home'),
						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.EVENT_SHADY_BUILDER
	},

	{ /* Mysterious Wanderer  --  wood gambling */
		title: _('The Mysterious Wanderer'),
		isAvailable: function() {
			return Engine.activeModule == Room && Room.hasBasicProgress() && $SM.get('stores.wood');
		},
		scenes: {
			start: {
				text: [
					_('a wanderer arrives with an empty cart. says if he leaves with wood, he\'ll be back with more.'),
					_("builder's not sure he's to be trusted.")
				],
				notification: _('a mysterious wanderer arrives'),
				blink: true,
				buttons: {
					'wood100': {
						text: _('give 100'),
						cost: {wood: 100},
						nextScene: { 1: 'wood100'}
					},
					'wood500': {
						text: _('give 500'),
						cost: {wood: 500},
						nextScene: { 1: 'wood500' }
					},
					'deny': {
						text: _('turn him away'),
						nextScene: 'end'
					}
				}
			},
			'wood100': {
				text: [
					_('the wanderer leaves, cart loaded with wood')
				],
				action: function(inputDelay) {
					var delay = inputDelay || false;
					Events.saveDelay(function() {
						$SM.add('stores.wood', 300);
						Notifications.notify(Room, _('the mysterious wanderer returns, cart piled high with wood.'));
					}, 'Room[4].scenes.wood100.action', delay);
				},
				onLoad: function() {
					/* Base 50% chance she comes back. Karma shifts it: people
					 * keep their word more often to someone with a reputation
					 * worth keeping it for. */
					if(Math.random() < 0.5 + Events.karmaLuck()) {
						this.action(60);
					}
				},
				buttons: {
					'leave': {
						text: _('say goodbye'),
						nextScene: 'end'
					}
				}
			},
			'wood500': {
				text: [
					_('the wanderer leaves, cart loaded with wood')
				],
				action: function(inputDelay) {
					var delay = inputDelay || false;
					Events.saveDelay(function() {
						$SM.add('stores.wood', 1500);
						Notifications.notify(Room, _('the mysterious wanderer returns, cart piled high with wood.'));
					}, 'Room[4].scenes.wood500.action', delay);
				},
				onLoad: function() {
					// Larger stake, longer odds -- same karma bias applies.
					if(Math.random() < 0.3 + Events.karmaLuck()) {
						this.action(60);
					}
				},
				buttons: {
					'leave': {
						text: _('say goodbye'),
						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.EVENT_MYSTERIOUS_WANDERER
	},

	{ /* Mysterious Wanderer  --  fur gambling */
		title: _('The Mysterious Wanderer'),
		isAvailable: function() {
			return Engine.activeModule == Room && Room.hasBasicProgress() && $SM.get('stores.fur');
		},
		scenes: {
			start: {
				text: [
					_('a wanderer arrives with an empty cart. says if she leaves with furs, she\'ll be back with more.'),
					_("builder's not sure she's to be trusted.")
				],
				notification: _('a mysterious wanderer arrives'),
				blink: true,
				buttons: {
					'fur100': {
						text: _('give 100'),
						cost: {fur: 100},
						nextScene: { 1: 'fur100'}
					},
					'fur500': {
						text: _('give 500'),
						cost: {fur: 500},
						nextScene: { 1: 'fur500' }
					},
					'deny': {
						text: _('turn her away'),
						nextScene: 'end'
					}
				}
			},
			'fur100': {
				text: [
					_('the wanderer leaves, cart loaded with furs')
				],
				action: function(inputDelay) {
					var delay = inputDelay || false;
					Events.saveDelay(function() {
						$SM.add('stores.fur', 300);
						Notifications.notify(Room, _('the mysterious wanderer returns, cart piled high with furs.'));
					}, 'Room[5].scenes.fur100.action', delay);
				},
				onLoad: function() {
					/* Base 50% chance she comes back. Karma shifts it: people
					 * keep their word more often to someone with a reputation
					 * worth keeping it for. */
					if(Math.random() < 0.5 + Events.karmaLuck()) {
						this.action(60);
					}
				},
				buttons: {
					'leave': {
						text: _('say goodbye'),
						nextScene: 'end'
					}
				}
			},
			'fur500': {
				text: [
					_('the wanderer leaves, cart loaded with furs')
				],
				action: function(inputDelay) {
					var delay = inputDelay || false;
					Events.saveDelay(function() {
						$SM.add('stores.fur', 1500);
						Notifications.notify(Room, _('the mysterious wanderer returns, cart piled high with furs.'));
					}, 'Room[5].scenes.fur500.action', delay);
				},
				onLoad: function() {
					// Larger stake, longer odds -- same karma bias applies.
					if(Math.random() < 0.3 + Events.karmaLuck()) {
						this.action(60);
					}
				},
				buttons: {
					'leave': {
						text: _('say goodbye'),
						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.EVENT_MYSTERIOUS_WANDERER
	},

	{ /* The Scout  --  Map Merchant */
		title: _('The Scout'),
		isAvailable: function() {
			return Engine.activeModule == Room && $SM.get('features.location.world');
		},
		scenes: {
			'start': {
				text: [
					_("the scout says she's been all over."),
					_("willing to talk about it, for a price.")
				],
				notification: _('a scout stops for the night'),
				blink: true,
				buttons: {
					'buyMap': {
						text: _('buy map'),
						cost: { 'fur': 200, 'scales': 10 },
						available: function() {
							return !World.seenAll;
						},
						notification: _('the map uncovers a bit of the world'),
						onChoose: World.applyMap
					},
					'learn': {
						text: _('learn scouting'),
						cost: { 'fur': 1000, 'scales': 50, 'teeth': 20 },
						available: function() {
							return !$SM.hasPerk('scout');
						},
						onChoose: function() {
							$SM.addPerk('scout');
						}
					},
					/* She travels alone, and she has already told you she has
					 * been everywhere -- which means nobody is expecting her
					 * anywhere in particular. */
					'rob': {
						text: _('take her maps'),
						onChoose: function() {
							$SM.add('character.karma', -5);
							World.applyMap();
						},
						notification: _('the maps are taken. she is left with nothing to sell.'),
						reward: { 'fur': 100, 'cured meat': 50 },
						nextScene: 'end'
					},
					'leave': {
						text: _('say goodbye'),
						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.EVENT_SCOUT
	},

	{ /* The Wandering Master */
		title: _('The Master'),
		isAvailable: function() {
			return Engine.activeModule == Room && $SM.get('features.location.world');
		},
		scenes: {
			'start': {
				text: [
					_('an old wanderer arrives.'),
					_('he smiles warmly and asks for lodgings for the night.')
				],
				notification: _('an old wanderer arrives'),
				blink: true,
				buttons: {
					'agree': {
						text: _('agree'),
						cost: {
							'cured meat': 100,
							'fur': 100,
							'torch': 1
						},
						nextScene: {1: 'agree'}
					},
					'deny': {
						text: _('turn him away'),
						onChoose: function() { $SM.add('character.karma', -1); },
						nextScene: 'end'
					}
				}
			},
			'agree': {
				text: [
					_('in exchange, the wanderer offers his wisdom.')
				],
				/* The only place in the game that reflects karma back at the
				 * player. Karma is otherwise invisible -- it silently tilts
				 * odds -- so without some feedback the whole system is
				 * unreadable. He reads the player rather than reporting a
				 * number, which keeps it in the game's voice. */
				onLoad: function() {
					$SM.add('character.karma', 1);
					// Remembered so his trunk can turn up later (see 'What the
					// Old Man Left'), which is where the hint about what he
					// used to be actually lands.
					$SM.set('game.masterVisited', true);
					// Same man as the wanderer in the swamp cabin.
					$SM.set('game.metOldWanderer', true);
					var k = Events.karma();
					var read;
					if (k >= 25) {
						read = _('he looks at you a while. says whatever you are carrying, you have been setting it down.');
					} else if (k >= 5) {
						read = _('he looks at you a while. says you are lighter than when you got here.');
					} else if (k >= -5) {
						read = _('he looks at you a while. says nothing about what he sees.');
					} else if (k >= -25) {
						read = _('he looks at you a while. says you are carrying something you have not put down.');
					} else {
						read = _('he looks at you a while. does not finish the meal. says some debts are not the kind that get paid.');
					}
					Notifications.notify(Room, read);
				},
				buttons: {
					'evasion': {
						text: _('evasion'),
						available: function() {
							return !$SM.hasPerk('evasive');
						},
						onChoose: function() {
							$SM.addPerk('evasive');
						},
						nextScene: 'end'
					},
					'precision': {
						text: _('precision'),
						available: function() {
							return !$SM.hasPerk('precise');
						},
						onChoose: function() {
							$SM.addPerk('precise');
						},
						nextScene: 'end'
					},
					'force': {
						text: _('force'),
						available: function() {
							return !$SM.hasPerk('barbarian');
						},
						onChoose: function() {
							$SM.addPerk('barbarian');
						},
						nextScene: 'end'
					},
					/* Unlocked only once all three of his teachings are held --
					 * before that the perks are the reason to host him, and
					 * this would compete with them. Afterwards the scene had
					 * three permanently-disabled buttons and 'nothing', so
					 * this also gives a repeat visit something to offer. */
					'wisdom': {
						text: _('ask for insight'),
						available: function() {
							return $SM.hasPerk('evasive') && $SM.hasPerk('precise') && $SM.hasPerk('barbarian');
						},
						nextScene: function() {
							var k = Events.karma();
							if (k >= 25) return 'wisdomHigh';
							if (k >= 5) return 'wisdomGood';
							if (k >= -5) return 'wisdomNeutral';
							if (k >= -25) return 'wisdomLow';
							return 'wisdomWorst';
						}
					},
					'nothing': {
						text: _('nothing'),
						nextScene: 'end'
					}
				}
			},
			/* Five karma bands. The upper two give him room to say something
			 * about what is actually going on; the lower three are the same
			 * warning delivered with progressively less patience -- that what
			 * the player has done is known, and that the world has started
			 * treating them accordingly. */
			'wisdomHigh': {
				text: [
					_('he thinks about it for a long time before he says anything.'),
					_('says that people out here talk, and that what they say about this village has started arriving before you do.'),
					_('says that is worth more than any of the three things he taught you, and that it took longer to earn.'),
					_('then says: whatever you are here for, you are further along than you think. keep setting it down.')
				],
				notification: _('the old wanderer says your name arrives before you do'),
				buttons: {
					'end': {
						text: _('thank him'),
						nextScene: 'end'
					}
				}
			},
			'wisdomGood': {
				text: [
					_('he says the trick is not surviving out here. anyone can do that for a while.'),
					_('says the trick is what you are still willing to do by the time you have.'),
					_('says you are doing better at that than most, and that most is not a high bar, and that he means it kindly.')
				],
				notification: _('the old wanderer offers a measured compliment'),
				buttons: {
					'end': {
						text: _('thank him'),
						nextScene: 'end'
					}
				}
			},
			'wisdomNeutral': {
				text: [
					_('he says nothing for a while, and then says he will give you something more useful than a technique.'),
					_('says everything you do out here is done in front of somebody, and that they carry it further than you do.'),
					_('says you have a reputation. says it is not a bad one yet, and that yet is doing a great deal of work in that sentence.'),
					_('says the wild is not the thing that decides how this goes.')
				],
				notification: _('the old wanderer warns you that you have a reputation'),
				buttons: {
					'end': {
						text: _('consider it'),
						nextScene: 'end'
					}
				}
			},
			'wisdomLow': {
				text: [
					_('he does not answer straight away, and when he does he is not warm about it.'),
					_('says he has been to three settlements this season and your name came up at two of them, and not well.'),
					_('says actions out here have consequences, and that the consequences do not arrive as punishment. they arrive as doors that are already shut when you get to them.'),
					_('says you still have time to change what people say. says it will take longer than earning it did.')
				],
				notification: _('the old wanderer says your name comes up, and not well'),
				buttons: {
					'end': {
						text: _('say nothing'),
						nextScene: 'end'
					}
				}
			},
			'wisdomWorst': {
				text: [
					_('he puts the cup down and looks at you properly for the first time all evening.'),
					_('says he knows what you have been doing. says everyone between here and the flats knows what you have been doing.'),
					_('says consequences are not a threat he is making. they are a thing that has already started, and you will feel it as luck turning against you, and you will call it luck.'),
					_('says he has seen someone do all of this before, at a scale you would not believe, and that they are still paying for it.'),
					_('he does not say who. he leaves before first light.')
				],
				notification: _('the old wanderer has heard what you have been doing'),
				buttons: {
					'end': {
						text: _('say nothing'),
						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.EVENT_WANDERING_MASTER
	},

	{ /* The Sick Man */
		title: _('The Sick Man'),
		isAvailable: function() {
			return Engine.activeModule == Room && $SM.get('stores.medicine', true) > 0;
		},
		scenes: {
			'start': {
				text: [
					_("a man hobbles up, coughing."),
					_("he begs for medicine.")
				],
				notification: _('a sick man hobbles up'),
				blink: true,
				buttons: {
					'help': {
						text: _('give 1 medicine'),
						cost: { 'medicine': 1 },
						notification: _('the man swallows the medicine eagerly'),
						onChoose: function() { $SM.add('character.karma', 2); },
						nextScene: { 0.1: 'alloy', 0.3: 'cells', 0.5: 'scales', 1.0: 'nothing' }
					},
					'kill': {
						 text: _('kill man, take supplies'),
						 cost: { 'bullets': 5 },
						 notification: _('the man fights back, however dies in the end'),
						 /* This is the game's most explicit scripted moral choice --
						  * the outcome text itself asks "was it worth it" and "regret
						  * your actions" -- so it's weighted well past the ±1 nudges
						  * used for the ambiguous builder-relationship beats. Applied
						  * once here rather than duplicated across all three loot
						  * outcomes below, since the moral weight is in the choice to
						  * kill, not in what he happened to be carrying. */
						 onChoose: function() {
							$SM.add('character.karma', -5);
							if(!$SM.get('character.kills')) $SM.set('character.kills', 0);
							$SM.add('character.kills', 1);
						 },
						 /* nextScene thresholds are cumulative and must reach 1.0.
						  * This read { 0.3: 'killman', 0.3: 'killmanlots', 0.4: ... }:
						  * the repeated 0.3 key discarded 'killman' entirely, and the
						  * table topped out at 0.4, so 60% of rolls matched nothing
						  * and the event just ended after charging 5 bullets. */
						 nextScene: { 0.3: 'killman', 0.6: 'killmanlots', 1.0: 'killmannothing' }
					},
					'ignore': {
						text: _('tell him to leave'),
						onChoose: function() { $SM.add('character.karma', -1); },
						nextScene: 'end'
					}
				}
			},
			'alloy': {
				text: [
					_("the man is thankful."),
					_('he leaves a reward.'),
					_('some weird metal he picked up on his travels.')
				],
				onLoad: function() {
					$SM.add('stores["alien alloy"]', 1);
				},
				buttons: {
					'bye': {
						text: _('say goodbye'),
						nextScene: 'end'
					}
				}
			},
			'cells': {
				text: [
					_("the man is thankful."),
					_('he leaves a reward.'),
					_('some weird glowing boxes he picked up on his travels.')
				],
				onLoad: function() {
					$SM.add('stores["energy cell"]', 3);
				},
				buttons: {
					'bye': {
						text: _('say goodbye'),
						nextScene: 'end'
					}
				}
			},
			'killman': {
				text: function() {
					return [
						Events.pick([
							_("beaten to a pulp"),
							_("it takes longer than it should have"),
							_("he stops fighting well before he stops moving")
						]),
						Events.pick([
							_("the man had very little"),
							_("what he was carrying was portioned out for somebody smaller than him"),
							_("there is nothing on him worth five bullets")
						]),
						_("others cower in the distance"),
						Events.pick([
							_("was it worth it"),
							_("nobody in the village asks what happened"),
							_("the distance the others keep is new")
						])
					];
				},
				buttons: {
					'bye': {
						text: _('shamefully gather goods'),
						nextScene: 'end'
					}
				}
			},
			'killmanlots': {
				text: [
					_("a life brutally ended"),
					_("the man carried lots"),
					_("still, was it worth more than a life?")
				],
				buttons: {
					'bye': {
						text: _('gather goods'),
						nextScene: 'end'
					}
				}
			},
			'killmannothing': {
				text: [
					_("the man lays there."),
					_('he had nothing to give'),
					_('is it really worth it?')
				],
				buttons: {
					'bye': {
						text: _('regret your actions'),
						nextScene: 'end'
					}
				}
			},
			'scales': {
				text: [
					_("the man is thankful."),
					_('he leaves a reward.'),
					_('all he has are some scales.')
				],
				onLoad: function() {
					$SM.add('stores.scales', 5);
				},
				buttons: {
					'bye': {
						text: _('say goodbye'),
						nextScene: 'end'
					}
				}
			},
			'nothing': {
				text: [
					_("the man expresses his thanks and hobbles off.")
				],
				buttons: {
					'bye': {
						text: _('say goodbye'),
						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.EVENT_SICK_MAN
	},

	{ /* The Cartographer  --  what is this place called? */
		title: _('The Cartographer'),
		isAvailable: function() {
			return Engine.activeModule == Room && $SM.get('features.location.world');
		},
		scenes: {
			'start': {
				text: [
					_('a woman arrives with a satchel of paper and a brass instrument on a strap.'),
					_('says she is making a register of settlements. asks what this one is called.'),
					_('then asks what the world is called.')
				],
				notification: _('a cartographer is making a register'),
				blink: true,
				buttons: {
					'name': {
						text: _('give her a name for it'),
						nextScene: { 1: 'name' }
					},
					'truth': {
						text: _('say nobody knows'),
						nextScene: { 1: 'truth' }
					},
					'rob': {
						text: _('take the instrument'),
						onChoose: function() { $SM.add('character.karma', -4); },
						nextScene: { 1: 'rob' }
					},
					'deny': {
						text: _('send her on'),
						onChoose: function() { $SM.add('character.karma', -1); },
						nextScene: 'end'
					}
				}
			},
			/* Layer two: she has done this before, and the answer is always
			 * different. Nobody who arrived here brought the same name with
			 * them, because nobody arrived here from the same place or the
			 * same century. */
			'name': {
				text: [
					_('she writes it down without looking up. asks how long that has been the name.'),
					_('a while, she is told.'),
					_('she turns the page. there are forty names on it, in nine hands, and none of them agree.'),
					_('at the bottom someone has written: the barren world. it is the only entry not crossed out.')
				],
				notification: _('the register has forty names for this place'),
				buttons: {
					'ask': {
						text: _('ask who wrote the last one'),
						nextScene: { 1: 'lastEntry' }
					},
					'add': {
						text: _('let her keep yours'),
						onChoose: function() { $SM.add('character.karma', 1); },
						reward: { 'cloth': 15, 'scales': 10 },
						nextScene: 'end'
					}
				}
			},
			'truth': {
				text: [
					_('she nods like she expected it, and does not write anything.'),
					_('says every settlement gives her a different name, and the older the settlement, the less certain they are.'),
					_('says the oldest ones do not give a name at all. they just point at the ground.')
				],
				notification: _('nobody agrees on what this world is called'),
				onLoad: function() { $SM.add('character.karma', 1); },
				buttons: {
					'ask': {
						text: _('ask who the oldest are'),
						nextScene: { 1: 'lastEntry' }
					},
					'feed': {
						text: _('feed her before she goes'),
						cost: { 'cured meat': 30 },
						available: function() {
							return $SM.get('stores["cured meat"]', true) >= 30;
						},
						onChoose: function() { $SM.add('character.karma', 2); },
						/* Whether she has anything worth trading back is
						 * karma-weighted -- a cartographer who has been fed in
						 * this village before travels with more to spare. */
						nextScene: function() {
							return Events.karmaOdds(0.5, 'thanks', 'maps');
						}
					}
				}
			},
			'lastEntry': {
				text: function() {
					var lines = [
						_('she says the entry is not hers. it was already in the book when the book came to her.'),
						_('the hand is narrow and very even, and it does not use any alphabet she can read.'),
						_('somebody translated it underneath, a long time after.')
					];
					if(Prestige.hasCompletedRun()) {
						lines.push(_('under the translation, in the margin, somebody has written a single word in a hand that is not narrow and not even.'));
						lines.push(_('it is your handwriting. the ink is older than this settlement.'));
						lines.push(_('you have never seen this book before.'));
					} else {
						lines.push(_('she says whoever wrote it had been here long enough to stop expecting to leave.'));
					}
					return lines;
				},
				notification: function() {
					return Prestige.hasCompletedRun() ?
						_('there is a word in the margin in your handwriting') :
						_('the oldest entry in the register is not in any human hand');
				},
				buttons: {
					'end': {
						text: _('say goodbye'),
						nextScene: 'end'
					}
				}
			},
			'maps': {
				text: [
					_('she leaves three pages behind, torn out at the spine.'),
					_('they are not of anywhere near here. she says she has no use for them any more.')
				],
				notification: _('the cartographer leaves pages behind'),
				onLoad: function() {
					World.applyMap();
				},
				buttons: {
					'end': {
						text: _('say goodbye'),
						nextScene: 'end'
					}
				}
			},
			'thanks': {
				text: [
					_('she eats, and thanks the village, and has nothing to leave behind but the thanks.')
				],
				buttons: {
					'end': {
						text: _('say goodbye'),
						nextScene: 'end'
					}
				}
			},
			'rob': {
				text: [
					_('the instrument is brass, and heavy, and older than it looks.'),
					_('she does not argue. she writes something in the book, closes it, and walks.'),
					_('this settlement will be in the register. it will have a note beside it.')
				],
				notification: _('the cartographer is robbed'),
				reward: { 'steel': 8, 'iron': 15 },
				buttons: {
					'end': {
						text: _('go inside'),
						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.EVENT_SCOUT
	},

	{ /* The Signal  --  a dead fleet still calling muster */
		title: _('The Signal'),
		isAvailable: function() {
			return Engine.activeModule == Room && $SM.get('game.buildings["workshop"]', true) > 0 &&
				$SM.get('stores["alien alloy"]', true) > 0;
		},
		scenes: {
			'start': {
				text: [
					_('someone in the village has got an old receiver working.'),
					_('it is not made of anything the village knows how to make.'),
					_('it has been repeating the same eleven seconds since it was switched on.')
				],
				notification: _('an old receiver has started speaking'),
				blink: true,
				buttons: {
					'listen': {
						text: _('listen to it'),
						/* Scene text is a static array, so recognising the voice
						 * is done by routing to a different scene rather than
						 * rewriting the text in place. */
						nextScene: function() {
							return $SM.get('game.metOldWanderer') ? 'listenKnown' : 'listen';
						}
					},
					'smash': {
						text: _('smash it'),
						onChoose: function() { $SM.add('character.karma', -1); },
						notification: _('the receiver is broken up for parts'),
						reward: { 'alien alloy': 1, 'steel': 5 },
						nextScene: 'end'
					},
					'ignore': {
						text: _('leave it running'),
						nextScene: 'end'
					}
				}
			},
			/* Recognition variant: only reachable once the player has actually
			 * met the old wanderer, in the swamp cabin or as the guest in the
			 * room. Same choices as 'listen' below -- what changes is that the
			 * player now knows whose voice is giving the order, and that he is
			 * still walking around out there. */
			'listenKnown': {
				text: [
					_('it is a muster order. a fleet designation, a rally point, and a countdown that finished a long time ago.'),
					_('the voice is calm, and patient, and has been saying this to nobody for longer than the village has existed.'),
					_('it is a voice from this room. it asked for lodgings, and ate at that table, and thanked everybody for the trouble.'),
					_('at the end it gives the name of the officer expecting the reply. it is giving its own name.')
				],
				notification: _('the voice on the recording is the old wanderer'),
				buttons: {
					'answer': {
						text: _('answer it'),
						nextScene: function() {
							return Events.karmaOdds(0.5, 'noAnswer', 'answered');
						}
					},
					'silence': {
						text: _('say nothing'),
						nextScene: { 1: 'silence' }
					},
					'keep': {
						text: _('write the name down'),
						onChoose: function() { $SM.add('character.karma', 1); },
						nextScene: { 1: 'wroteNameKnown' }
					}
				}
			},
			'wroteNameKnown': {
				text: [
					_('the name goes on the inside of the store room door, where the tallies go.'),
					_('it is not a name anybody here can pronounce, and it belongs to a man who slept in this room and would not give it.'),
					_('he has been walking a long time. he has not once mentioned that anything is still calling him.')
				],
				notification: _("the old wanderer's name is written down"),
				buttons: {
					'end': {
						text: _('go inside'),
						nextScene: 'end'
					}
				}
			},
			/* Layer two. The recording is a muster order. Everything it is
			 * calling has been gone for a very long time. */
			'listen': {
				text: [
					_('it is a muster order. a fleet designation, a rally point, and a countdown that finished a long time ago.'),
					_('the voice is calm, and patient, and has been saying this to nobody for longer than the village has existed.'),
					_('at the end it gives the name of the officer expecting the reply.')
				],
				notification: _('the signal is a muster order for a fleet'),
				buttons: {
					'answer': {
						text: _('answer it'),
						nextScene: function() {
							return Events.karmaOdds(0.5, 'noAnswer', 'answered');
						}
					},
					'silence': {
						text: _('say nothing'),
						nextScene: { 1: 'silence' }
					},
					'keep': {
						text: _('write the name down'),
						onChoose: function() { $SM.add('character.karma', 1); },
						nextScene: { 1: 'wroteName' }
					}
				}
			},
			'answered': {
				text: [
					_('the village answers it for six nights, in turns, reading the reply off a scrap of paper.'),
					_('on the seventh, something answers back.'),
					_('it is not a voice. it is a position, and a heading, and a supply manifest for a ship that is not coming.'),
					_('it is still transmitting. it has always been still transmitting.')
				],
				notification: _('something answered'),
				reward: { 'alien alloy': 2, 'energy cell': 10 },
				buttons: {
					'end': {
						text: _('go inside'),
						nextScene: 'end'
					}
				}
			},
			'noAnswer': {
				text: [
					_('the village answers it for six nights, in turns, reading the reply off a scrap of paper.'),
					_('nothing answers back. nothing was ever going to.'),
					_('the receiver goes quiet on the eighth night and does not start again.')
				],
				notification: _('nothing answered'),
				buttons: {
					'end': {
						text: _('go inside'),
						nextScene: 'end'
					}
				}
			},
			'silence': {
				text: [
					_('the receiver is left where it is, saying its eleven seconds to the roof beams.'),
					_('after a while nobody in the village hears it any more.'),
					_('it is still asking.')
				],
				buttons: {
					'end': {
						text: _('go inside'),
						nextScene: 'end'
					}
				}
			},
			'wroteName': {
				text: function() {
					if(Prestige.hasCompletedRun()) {
						return [
							_('the name is written on the inside of the store room door, where the tallies go.'),
							_('there is not much clean wood left on that door. the name is already there, four times, in the same hand as the fifth.'),
							_('nobody in the village put them there. the village is not old enough.'),
							_('you do not remember writing any of them, and you have just written another.')
						];
					}
					return [
						_('the name is written on the inside of the store room door, where the tallies go.'),
						_('nobody in the village can pronounce it. nobody in the village knows who it belonged to.'),
						_('it stays there. it is the only part of that fleet that is anywhere any more.')
					];
				},
				notification: function() {
					return Prestige.hasCompletedRun() ?
						_('the name is already on that door four times') :
						_("the officer's name is written down");
				},
				buttons: {
					'end': {
						text: _('go inside'),
						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.EVENT_HMMM
	},

	{ /* What the Old Man Left  --  the Master's trunk */
		title: _('The Trunk'),
		isAvailable: function() {
			return Engine.activeModule == Room && $SM.get('game.masterVisited') &&
				!$SM.get('game.trunkOpened');
		},
		scenes: {
			'start': {
				text: [
					_('the old wanderer who stayed the night left a trunk under the cot.'),
					_('it is not locked. it has been carried a very long way, and repaired more than once, badly.')
				],
				notification: _('the old wanderer left a trunk behind'),
				blink: true,
				buttons: {
					'open': {
						text: _('open it'),
						nextScene: { 1: 'open' }
					},
					'burn': {
						text: _('burn it unopened'),
						onChoose: function() {
							$SM.add('character.karma', -1);
							$SM.set('game.trunkOpened', true);
						},
						notification: _('the trunk is burned'),
						reward: { 'wood': 30 },
						nextScene: 'end'
					},
					'keep': {
						text: _('put it aside for him'),
						onChoose: function() {
							$SM.add('character.karma', 2);
							$SM.set('game.trunkOpened', true);
						},
						notification: _('the trunk is set aside. he does not come back for it'),
						nextScene: 'end'
					}
				}
			},
			/* Layer two: what's inside says what he used to be, without ever
			 * saying it outright. */
			'open': {
				text: [
					_('folded cloth. a ration tin with no markings left on it. a bundle of flat grey cards.'),
					_('the cards are orders. hundreds of them, in the same narrow even hand, all countersigned by the same person.'),
					_('the signature is his.'),
					_('the last one is a withdrawal order for eleven fleets. it was never sent.')
				],
				notification: _('the trunk is full of unsent orders'),
				onLoad: function() {
					$SM.set('game.trunkOpened', true);
				},
				buttons: {
					'burnOrders': {
						text: _('burn the cards'),
						onChoose: function() { $SM.add('character.karma', -2); },
						nextScene: { 1: 'burnedOrders' }
					},
					'readAll': {
						text: _('read all of them'),
						nextScene: { 1: 'readAll' }
					},
					'return': {
						text: _('close it and put it back'),
						onChoose: function() { $SM.add('character.karma', 3); },
						nextScene: { 1: 'putBack' }
					}
				}
			},
			'readAll': {
				text: function() {
					var lines = [
						_('it takes most of a night.'),
						_('they are all withdrawals. every one. pull back, hold position, do not engage, wait for me.'),
						_('the dates run for two hundred years and then stop in the middle of a sentence.')
					];
					if(Prestige.hasCompletedRun()) {
						lines.push(_('the last card is not an order. it is a list of names, and it has been added to in more than one hand.'));
						lines.push(_('one of the hands is yours. the name it wrote is not one you have given anybody here.'));
						lines.push(_('whatever he was waiting for, it did not arrive. he has been walking ever since, and he has been keeping a list.'));
					} else {
						lines.push(_('whatever he was waiting for, it did not arrive, and he has been walking ever since.'));
					}
					return lines;
				},
				notification: function() {
					return Prestige.hasCompletedRun() ?
						_('the last card is a list of names, and one entry is yours') :
						_('two hundred years of orders, all of them withdrawals');
				},
				reward: { 'alien alloy': 1 },
				buttons: {
					'end': {
						text: _('close the trunk'),
						nextScene: 'end'
					}
				}
			},
			'burnedOrders': {
				text: [
					_('they do not burn like paper. they curl, and go grey, and stop.'),
					_('the fire is warm for a long time afterwards.'),
					_('nobody will ever know what he was ordering, or who he was ordering it of.')
				],
				notification: _('the orders are destroyed'),
				buttons: {
					'end': {
						text: _('go inside'),
						nextScene: 'end'
					}
				}
			},
			'putBack': {
				text: [
					_('the trunk goes back under the cot, exactly where it was.'),
					_('it is gone within the week. nobody sees it go.'),
					_('in its place there is a ration tin, full, and a card with nothing written on it at all.')
				],
				notification: _('the trunk is gone by the end of the week'),
				reward: { 'cured meat': 100, 'alien alloy': 1 },
				buttons: {
					'end': {
						text: _('go inside'),
						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.EVENT_WANDERING_MASTER
	},

	/* ---- solitary-run threats -------------------------------------------
	 *
	 * A hutless player has no villagers to lose, so every event in
	 * Events.Outside is permanently irrelevant to them. Without these, the
	 * exploit is simply inverted: choosing "there is another way" would mean
	 * nothing at home can ever threaten you again.
	 *
	 * These threaten the two of you directly instead -- the fire, the
	 * stores, and her. They are deliberately smaller in scale than a raid on
	 * a settlement, because two people are a smaller target, and that is the
	 * bargain the player made.
	 */
	{ /* Something circles the room at night */
		title: _('Something Outside'),
		isAvailable: function() {
			return Engine.activeModule === Room && Outside.isSolitary() &&
				$SM.get('game.fire.value', true) > 0;
		},
		scenes: {
			'start': {
				text: [
					_('something is walking the perimeter of the room, slowly, and it has been for a while.'),
					_('it does not try the door. it goes round, and round, and the sound of it does not change.'),
					_('the builder does not reach for anything. she says that whatever it is has already decided, and that we will find out which way when the fire drops.')
				],
				notification: _('something is circling the room'),
				blink: true,
				buttons: {
					'stoke': {
						text: _('build the fire up'),
						cost: { 'wood': 20 },
						available: function() {
							return $SM.get('stores.wood', true) >= 20;
						},
						nextScene: { 1: 'held' }
					},
					'wait': {
						text: _('sit with it'),
						nextScene: { 1: 'waited' }
					}
				}
			},
			'held': {
				text: [
					_('the fire goes up and the circling stops mid-round, as though something has been recalculated.'),
					_('by morning there are prints outside, deep ones, and they lead away.')
				],
				notification: _('the fire holds it off'),
				buttons: {
					'end': { text: _('sleep'), nextScene: 'end' }
				}
			},
			'waited': {
				text: [
					_('it comes as far as the door and stays there long enough that you can hear it breathing through the wood.'),
					_('then it goes. nothing is taken and nothing is broken and neither of you sleeps.')
				],
				notification: _('it comes as far as the door'),
				onLoad: function() {
					/* No villagers to kill, so the cost is what two people
					 * can afford to lose: sleep, and some of the stores. */
					var meat = $SM.get('stores["cured meat"]', true);
					if(meat > 0) {
						$SM.add('stores["cured meat"]', -Math.ceil(meat * 0.25));
					}
				},
				buttons: {
					'end': { text: _('wait for light'), nextScene: 'end' }
				}
			}
		},
		audio: AudioLibrary.EVENT_BEAST_ATTACK
	},

	{ /* Scavengers, who find two people instead of a settlement */
		title: _('Two Sets of Prints'),
		isAvailable: function() {
			return Engine.activeModule === Room && Outside.isSolitary() &&
				$SM.get('stores.wood', true) > 100;
		},
		scenes: {
			'start': {
				text: [
					_('three of them, at the treeline, and they have been watching long enough to have counted.'),
					_('two sets of prints. one fire. no fence, no huts, nobody else coming.'),
					_('they are not in a hurry, which is the part that should worry you.')
				],
				notification: _('somebody has been counting the prints'),
				blink: true,
				buttons: {
					'give': {
						text: _('give them something and hope'),
						cost: { 'cured meat': 20 },
						available: function() {
							return $SM.get('stores["cured meat"]', true) >= 20;
						},
						nextScene: { 1: 'paid' }
					},
					'stand': {
						text: _('stand in the doorway where they can see you'),
						nextScene: { 1: 'stood' }
					}
				}
			},
			'paid': {
				text: [
					_('they take it and go, and they take their time going, and one of them looks back twice.'),
					_('the builder says they will tell somebody. she does not say it as a reproach.')
				],
				notification: _('they take it and go'),
				buttons: {
					'end': { text: _('bar the door'), nextScene: 'end' }
				}
			},
			'stood': {
				text: function() {
					var lines = [
						_('you stand in the light where the shape of you is unambiguous, and you do not say anything.'),
						_('after a while the middle one says something to the other two and they leave.')
					];
					if($SM.get('character.karma', true) < 0) {
						lines.push(_('the builder watches you do it and does not comment on how easily it came.'));
					} else {
						lines.push(_('nothing happens. it is the loudest nothing you have stood through in a long time.'));
					}
					return lines;
				},
				notification: _('they decide against it'),
				buttons: {
					'end': { text: _('go back inside'), nextScene: 'end' }
				}
			}
		},
		audio: AudioLibrary.EVENT_SOLDIER_ATTACK
	},

	{ /* She gets hurt, and there is nobody else to do the work */
		title: _('Her Hands'),
		isAvailable: function() {
			return Engine.activeModule === Room && Outside.isSolitary() &&
				$SM.get('game.builder.level', true) >= 4;
		},
		scenes: {
			'start': {
				text: [
					_('she has done something to her hand and has not mentioned it, and has been working one-handed for long enough that you only notice now.'),
					_('there is nobody else here to take the work off her. that was the arrangement.'),
					_('she says it is fine. it is visibly not fine.')
				],
				notification: _('she has hurt her hand and said nothing'),
				buttons: {
					'medicine': {
						text: _('use medicine on it'),
						cost: { 'medicine': 1 },
						available: function() {
							return $SM.get('stores.medicine', true) >= 1;
						},
						nextScene: { 1: 'treated' }
					},
					'rest': {
						text: _('do the work yourself for a few days'),
						nextScene: { 1: 'rested' }
					},
					'ignore': {
						text: _('take her at her word'),
						nextScene: { 1: 'ignored' }
					}
				}
			},
			'treated': {
				text: [
					_('she lets you do it, which takes longer than the doing.'),
					_('says thank you once, plainly, and then talks about something else for the rest of the evening.')
				],
				notification: _('the hand is treated'),
				onLoad: function() { $SM.add('character.karma', 2); },
				buttons: {
					'end': { text: _('let her change the subject'), nextScene: 'end' }
				}
			},
			'rested': {
				text: [
					_('you are not good at any of it and she watches you be bad at it with visible restraint.'),
					_('the meat gets salted late and some of it is wasted. the hand gets better.')
				],
				notification: _('the work gets done badly'),
				onLoad: function() {
					$SM.add('character.karma', 1);
					var meat = $SM.get('stores["cured meat"]', true);
					if(meat > 0) {
						$SM.add('stores["cured meat"]', -Math.ceil(meat * 0.15));
					}
				},
				buttons: {
					'end': { text: _('keep at it'), nextScene: 'end' }
				}
			},
			'ignored': {
				text: [
					_('she says it is fine and you agree that it is fine and the subject is closed.'),
					_('it takes three weeks longer than it needed to, and the salting is slower for all of them.')
				],
				notification: _('the subject is closed'),
				onLoad: function() {
					$SM.add('character.karma', -2);
					var meat2 = $SM.get('stores["cured meat"]', true);
					if(meat2 > 0) {
						$SM.add('stores["cured meat"]', -Math.ceil(meat2 * 0.3));
					}
				},
				buttons: {
					'end': { text: _('let it be closed'), nextScene: 'end' }
				}
			}
		},
		audio: AudioLibrary.EVENT_HMMM

	}
];
