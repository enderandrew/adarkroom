/**
 * Events that can occur when the Path module is active.
 *
 * The Dusty Path is the staging ground at the edge of the village: where
 * expeditions are packed, where people who have been walking arrive, and
 * where the weather gets at you first. Nothing fired here before -- every
 * other event pool gates on Room or Outside -- so this is the one place in
 * the game where the planet itself gets to be a character.
 *
 * Costs and rewards here go through village stores, not Path.outfit, because
 * Events.buttonClick only routes to the outfit when Engine.activeModule is
 * World. That's correct for the Path: you are still standing at the village.
 **/
Events.Path = [
	{ /* The Wind Turns  --  climate, two layers */
		title: _('The Wind Turns'),
		isAvailable: function() {
			return Engine.activeModule == Path;
		},
		scenes: {
			'start': {
				text: [
					_('the wind changes while the packs are being filled.'),
					_('it comes off the flats with nothing in the way of it, and it does not gust. it just leans.'),
					_('inside an hour the exposed skin on the packing crew has gone the colour of ash.')
				],
				notification: _('the wind turns'),
				blink: true,
				buttons: {
					'wait': {
						text: _('wait it out'),
						nextScene: { 1: 'wait' }
					},
					'push': {
						text: _('pack through it'),
						nextScene: function() {
							return Events.karmaOdds(0.5, 'pushBad', 'pushGood');
						}
					},
					/* Somebody else is out in it. Costs cloth and a delay. */
					'shelter': {
						text: _('bring in whoever is still out there'),
						cost: { 'cloth': 20 },
						available: function() {
							return $SM.get('stores.cloth', true) >= 20;
						},
						onChoose: function() { $SM.add('character.karma', 3); },
						nextScene: { 1: 'shelter' }
					}
				}
			},
			'wait': {
				text: [
					_('it takes most of a day to pass, and it takes the day with it.'),
					_('nothing is lost. nothing is gained. the flats look exactly the same afterwards.')
				],
				buttons: {
					'end': {
						text: _('get back to it'),
						nextScene: 'end'
					}
				}
			},
			'pushGood': {
				text: [
					_('the packs get filled with numb hands and a great deal of swearing.'),
					_('one of the crew says her grandmother called this a lean wind, on a world she will not name.'),
					_('asked why she will not name it, she says naming it has never once helped.')
				],
				notification: _('the packing is finished in the wind'),
				buttons: {
					'end': {
						text: _('get back to it'),
						nextScene: 'end'
					}
				}
			},
			'pushBad': {
				text: [
					_('the packs get filled. two of the crew do not get warm again for a week.'),
					_('a bale goes over and is halfway to the treeline before anyone can get to it.')
				],
				notification: _('supplies are lost to the wind'),
				onLoad: function() {
					var loss = {};
					['cloth', 'fur', 'cured meat'].forEach(function(k) {
						var have = $SM.get('stores["' + k + '"]', true);
						if(have > 0) loss[k] = -Math.max(1, Math.floor(have * 0.08));
					});
					$SM.addM('stores', loss);
				},
				buttons: {
					'end': {
						text: _('get back to it'),
						nextScene: 'end'
					}
				}
			},
			/* Layer two: who was actually out there. */
			'shelter': {
				text: [
					_('there are three of them, sitting down, which is the wrong thing to do in this.'),
					_('they are wrapped in cloth that is not warm and was never meant to be. it is the wrong weight entirely.'),
					_('one of them keeps saying they only meant to be out for the afternoon.')
				],
				notification: _('three are brought in out of the wind'),
				buttons: {
					'ask': {
						text: _('ask how long they have been out'),
						nextScene: { 1: 'howLong' }
					},
					'end': {
						text: _('let them sleep'),
						nextScene: 'end'
					}
				}
			},
			'howLong': {
				text: [
					_('the afternoon, they say. they are quite certain.'),
					_('their cloth has been mended forty or fifty times, in a lot of different thread.'),
					_('nobody points this out to them.')
				],
				notification: _('they say they have been out since the afternoon'),
				buttons: {
					'end': {
						text: _('let them sleep'),
						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.EVENT_HMMM
	},

	{ /* Ash Fall  --  climate, two layers */
		title: _('Ash Fall'),
		isAvailable: function() {
			return Engine.activeModule == Path && $SM.get('stores.wood', true) > 0;
		},
		scenes: {
			'start': {
				text: [
					_('grey falls out of a clear sky for two days.'),
					_('it is not ash from anything burning. it has no smell, and it tastes faintly of metal, and it does not stop.'),
					_('it settles on the water barrels in a skin thick enough to lift off whole.')
				],
				notification: _('grey ash falls out of a clear sky'),
				blink: true,
				buttons: {
					'cover': {
						text: _('cover the barrels'),
						cost: { 'cloth': 30 },
						available: function() {
							return $SM.get('stores.cloth', true) >= 30;
						},
						onChoose: function() { $SM.add('character.karma', 1); },
						nextScene: { 1: 'covered' }
					},
					'collect': {
						text: _('collect some of it'),
						nextScene: { 1: 'collect' }
					},
					'ignore': {
						text: _('let it fall'),
						nextScene: { 1: 'ignored' }
					}
				}
			},
			'covered': {
				text: [
					_('the barrels are covered and the water stays clean.'),
					_('everything else in the village is grey by the second morning, including everyone in it.')
				],
				buttons: {
					'end': {
						text: _('get back to it'),
						nextScene: 'end'
					}
				}
			},
			'ignored': {
				text: [
					_('the water is undrinkable for a week and has to be thrown out.'),
					_('the ash stops on the third day, as suddenly as it started.')
				],
				notification: _('the water is fouled'),
				onLoad: function() {
					var have = $SM.get('stores["cured meat"]', true);
					if(have > 0) {
						$SM.add('stores["cured meat"]', -Math.max(1, Math.floor(have * 0.1)));
					}
				},
				buttons: {
					'end': {
						text: _('get back to it'),
						nextScene: 'end'
					}
				}
			},
			/* Layer two: it is not ash. */
			'collect': {
				text: [
					_('a sack of it is scraped off the barrel lids and taken inside.'),
					_('dry, it is nothing. wet, it holds a shape and will not let go of it.'),
					_('somebody presses a thumb into a handful of it and the print is still there in the morning, perfect.')
				],
				notification: _('the ash holds a shape'),
				buttons: {
					'work': {
						text: _('work it'),
						nextScene: function() {
							return Events.karmaOdds(0.5, 'workNothing', 'workSomething');
						}
					},
					'dump': {
						text: _('throw it out'),
						nextScene: 'end'
					}
				}
			},
			'workSomething': {
				text: [
					_('fired, it comes out closer to metal than to pottery, and lighter than either.'),
					_('nobody in the village worked out how to do this. one of the newer arrivals already knew.'),
					_('asked where she learned it, she says it is what the ash is for.')
				],
				notification: _('the ash fires into something like metal'),
				reward: { 'steel': 15, 'iron': 20 },
				buttons: {
					'end': {
						text: _('get back to it'),
						nextScene: 'end'
					}
				}
			},
			'workNothing': {
				text: [
					_('fired, it cracks. wet, it sags. left alone, it goes back to dust.'),
					_('a week of trying gets a handful of grey nothing and a lot of wasted wood.')
				],
				notification: _('nothing can be made of the ash'),
				onLoad: function() {
					var have = $SM.get('stores.wood', true);
					if(have > 0) {
						$SM.add('stores.wood', -Math.max(1, Math.floor(have * 0.1)));
					}
				},
				buttons: {
					'end': {
						text: _('get back to it'),
						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.EVENT_SKY
	},

	{ /* The Line of Stones  --  people, two layers, prison hint */
		title: _('The Line of Stones'),
		isAvailable: function() {
			return Engine.activeModule == Path;
		},
		scenes: {
			'start': {
				text: [
					_('somebody has laid a line of stones along the edge of the path, running out towards the flats.'),
					_('they are spaced evenly, and every so often one is set upright with a mark scratched into it.'),
					_('the marks are distances. the line goes further out than anybody in the village has been.')
				],
				notification: _('a line of marked stones runs out towards the flats'),
				blink: true,
				buttons: {
					'follow': {
						text: _('follow it out'),
						nextScene: { 1: 'follow' }
					},
					'clear': {
						text: _('clear it off the path'),
						onChoose: function() { $SM.add('character.karma', -2); },
						nextScene: { 1: 'cleared' }
					},
					'add': {
						text: _('add a stone to the end'),
						onChoose: function() { $SM.add('character.karma', 2); },
						nextScene: { 1: 'added' }
					}
				}
			},
			/* Layer two: what the line is actually counting. */
			'follow': {
				text: [
					_('it takes a day and a half to reach the end of it.'),
					_('the last upright stone is worn almost smooth. the mark on it is not a distance.'),
					_('it is a count. and further back down the line, once you know to look, so are all the others.')
				],
				notification: _('the marks are a count, not a distance'),
				buttons: {
					'countIt': {
						text: _('count the uprights'),
						nextScene: { 1: 'counted' }
					},
					'back': {
						text: _('turn back'),
						nextScene: 'end'
					}
				}
			},
			'counted': {
				text: [
					_('there are more than four hundred uprights.'),
					_('whoever set them was walking out, stopping, and coming back. over and over.'),
					_('the line does not point anywhere. it does not reach anything. it just stops, and the last stone faces back the way it came.')
				],
				notification: _('four hundred attempts, all of them turned back'),
				buttons: {
					'end': {
						text: _('go home'),
						nextScene: 'end'
					}
				}
			},
			'cleared': {
				text: [
					_('the stones go into the path bed, mark side down, and the path is flatter for it.'),
					_('within a month there is a new line, a little further along, in the same hand.')
				],
				notification: _('the line is cleared. a new one appears'),
				reward: { 'iron': 10 },
				buttons: {
					'end': {
						text: _('get back to it'),
						nextScene: 'end'
					}
				}
			},
			'added': {
				text: [
					_('a stone is set upright at the end of the line, unmarked.'),
					_('it is gone the next morning, and the line is one stone longer than it was, and the new one has a mark on it.'),
					_('nobody sees who does this.')
				],
				notification: _('the line is one stone longer'),
				buttons: {
					'end': {
						text: _('get back to it'),
						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.EVENT_GUILT
	},

	{ /* The Returning Party  --  people, two layers */
		title: _('The Returning Party'),
		isAvailable: function() {
			return Engine.activeModule == Path && $SM.get('game.population', true) > 15;
		},
		scenes: {
			'start': {
				text: [
					_('four come up the path from the wrong direction, walking slowly.'),
					_('one of them is being carried, and has been for a while, judging by the other three.'),
					_('they are asking to come in. the one being carried is not asking anything.')
				],
				notification: _('a party comes up the path, carrying one of their own'),
				blink: true,
				buttons: {
					'all': {
						text: _('take all four'),
						cost: { 'cured meat': 40, 'medicine': 1 },
						available: function() {
							return $SM.get('stores.medicine', true) >= 1 &&
								$SM.get('stores["cured meat"]', true) >= 40;
						},
						onChoose: function() { $SM.add('character.karma', 4); },
						nextScene: function() {
							return Events.karmaOdds(0.4, 'allDied', 'allLived');
						}
					},
					'healthy': {
						text: _('take the three who can walk'),
						onChoose: function() { $SM.add('character.karma', -3); },
						nextScene: { 1: 'healthy' }
					},
					'supplies': {
						text: _('give them supplies and send them on'),
						cost: { 'cured meat': 30 },
						available: function() {
							return $SM.get('stores["cured meat"]', true) >= 30;
						},
						nextScene: { 1: 'supplies' }
					},
					'none': {
						text: _('turn them back'),
						onChoose: function() { $SM.add('character.karma', -4); },
						nextScene: { 1: 'none' }
					}
				}
			},
			'allLived': {
				text: [
					_('the one who was carried is walking inside a fortnight, badly, and then less badly.'),
					_('all four stay. the three who did the carrying never mention it again.')
				],
				notification: _('all four join the village'),
				onLoad: function() {
					Outside.addVillagers(4);
				},
				buttons: {
					'end': {
						text: _('get back to it'),
						nextScene: 'end'
					}
				}
			},
			'allDied': {
				text: [
					_('the one who was carried does not last the week. the medicine was spent on someone already too far gone.'),
					_('the other three stay. they were always going to stay. they just wanted somebody to try.')
				],
				notification: _('three of the four join the village'),
				onLoad: function() {
					Outside.addVillagers(3);
				},
				buttons: {
					'end': {
						text: _('get back to it'),
						nextScene: 'end'
					}
				}
			},
			/* Layer two: they take the offer, and what it costs them. */
			'healthy': {
				text: [
					_('the three are told they can come in, and the fourth cannot.'),
					_('they talk it over at the bottom of the path for a long time, out of earshot.'),
					_('then two of them come up, and one of them stays down there.')
				],
				notification: _('two come in. two do not'),
				onLoad: function() {
					Outside.addVillagers(2);
				},
				buttons: {
					'watch': {
						text: _('watch what happens to the two below'),
						nextScene: { 1: 'watched' }
					},
					'end': {
						text: _('go inside'),
						nextScene: 'end'
					}
				}
			},
			'watched': {
				text: [
					_('the one who stayed sits with the one who was carried until the wind gets up.'),
					_('then picks them up again and starts walking, in no particular direction.'),
					_('they are still going when the light goes. the two who came in do not go to the wall to look.')
				],
				notification: _('the last two walk on'),
				buttons: {
					'end': {
						text: _('go inside'),
						nextScene: 'end'
					}
				}
			},
			'supplies': {
				text: [
					_('they take the food, and they are grateful for it, and they keep walking.'),
					_('there is nowhere on this path that is closer to anywhere than here is.'),
					_('they know that. they go anyway.')
				],
				notification: _('the party is given supplies and moves on'),
				buttons: {
					'end': {
						text: _('get back to it'),
						nextScene: 'end'
					}
				}
			},
			'none': {
				text: [
					_('they are turned back at the bottom of the path.'),
					_('they do not argue. that is the part that stays with the people who watched.')
				],
				notification: _('the party is turned away'),
				buttons: {
					'end': {
						text: _('go inside'),
						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.EVENT_SICK_MAN
	},

	{ /* A Man Going Out  --  people, two layers, the prison hint */
		title: _('A Man Going Out'),
		isAvailable: function() {
			return Engine.activeModule == Path && $SM.get('game.population', true) > 10;
		},
		scenes: {
			'start': {
				text: [
					_('one of the villagers is at the bottom of the path with no pack and no water.'),
					_('says he is going to walk until he reaches the edge of it. says he has worked out that there has to be one.'),
					_('he is not raving. he has clearly thought about this a great deal.')
				],
				notification: _('a villager means to walk to the edge of the world'),
				blink: true,
				buttons: {
					'stop': {
						text: _('stop him'),
						onChoose: function() { $SM.add('character.karma', 1); },
						nextScene: { 1: 'stopped' }
					},
					'equip': {
						text: _('give him what he needs'),
						cost: { 'cured meat': 50, 'cloth': 20 },
						available: function() {
							return $SM.get('stores["cured meat"]', true) >= 50 &&
								$SM.get('stores.cloth', true) >= 20;
						},
						onChoose: function() { $SM.add('character.karma', 2); },
						nextScene: function() {
							return Events.karmaOdds(0.5, 'equippedGone', 'equippedBack');
						}
					},
					'let': {
						text: _('let him go with nothing'),
						onChoose: function() { $SM.add('character.karma', -3); },
						nextScene: { 1: 'letGo' }
					}
				}
			},
			/* Layer two: whether anybody has done this before. */
			'stopped': {
				text: [
					_('he is talked down at the bottom of the path and goes back to his hut.'),
					_('an older villager waits until he is out of earshot, then says that is the fourth this year.'),
					_('says two of them went anyway.')
				],
				notification: _('he is talked down'),
				buttons: {
					'ask': {
						text: _('ask about the two who went'),
						nextScene: { 1: 'theTwo' }
					},
					'end': {
						text: _('leave it'),
						nextScene: 'end'
					}
				}
			},
			'theTwo': {
				text: [
					_('one came back after nine days, having walked in what he was certain was a straight line.'),
					_('he came back up the same path he left by, from the same direction.'),
					_('the other has not come back. the older villager says that one is still going, and says it like it is a fact and not a hope.')
				],
				notification: _('one walked straight and came back the way he left'),
				buttons: {
					'end': {
						text: _('go inside'),
						nextScene: 'end'
					}
				}
			},
			'equippedBack': {
				text: [
					_('he is gone eleven days.'),
					_('he comes back up the path from the opposite direction to the one he left in, and he will not talk about it.'),
					_('he gives back what is left of the food. it is most of it. he says he stopped being hungry somewhere out there.')
				],
				notification: _('he comes back from the other direction'),
				reward: { 'cured meat': 30 },
				buttons: {
					'end': {
						text: _('get back to it'),
						nextScene: 'end'
					}
				}
			},
			'equippedGone': {
				text: [
					_('he does not come back.'),
					_('the food and cloth go with him, which is what they were for.'),
					_('for a while people watch the flats in the evening. then they stop.')
				],
				notification: _('he does not come back'),
				buttons: {
					'end': {
						text: _('get back to it'),
						nextScene: 'end'
					}
				}
			},
			'letGo': {
				text: [
					_('he walks out at first light with nothing at all.'),
					_('he is visible for most of the morning, getting smaller, and then he is not.'),
					_('the village goes back to work. nobody says anything about it, then or afterwards.')
				],
				notification: _('he walks out with nothing'),
				onLoad: function() {
					Outside.killVillagers(1);
				},
				buttons: {
					'end': {
						text: _('get back to it'),
						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.EVENT_NIGHTMARE
	},

	{ /* The Cold Snap  --  climate */
		title: _('The Cold Snap'),
		isAvailable: function() {
			return Engine.activeModule == Path && $SM.get('game.population', true) > 5 &&
				$SM.get('stores.wood', true) > 100;
		},
		scenes: {
			'start': {
				text: [
					_('the temperature goes through the floor overnight, with no weather to explain it.'),
					_('the water in the barrels is solid to the bottom by morning. the barrels are ruined.'),
					_('there is not enough burning in the village to keep everyone in it.')
				],
				notification: _('the cold comes down overnight'),
				blink: true,
				buttons: {
					'burn': {
						text: _('burn whatever burns'),
						cost: { 'wood': 400 },
						available: function() {
							return $SM.get('stores.wood', true) >= 400;
						},
						onChoose: function() { $SM.add('character.karma', 2); },
						nextScene: { 1: 'burned' }
					},
					'ration': {
						text: _('ration the fires'),
						nextScene: function() {
							return Events.karmaOdds(0.5, 'rationBad', 'rationGood');
						}
					},
					'newcomers': {
						text: _('the newest arrivals can wait outside'),
						onChoose: function() { $SM.add('character.karma', -5); },
						nextScene: { 1: 'newcomers' }
					}
				}
			},
			'burned': {
				text: [
					_('everything that burns goes into the fires, including two of the hut frames.'),
					_('it costs most of a season of gathering.'),
					_('everybody who went to sleep wakes up.')
				],
				notification: _('the village burns through its wood, and everyone lives'),
				buttons: {
					'salvage': {
						text: _('go through what is left of the frames'),
						nextScene: { 1: 'salvage' }
					},
					'end': {
						text: _('get back to it'),
						nextScene: 'end'
					}
				}
			},
			/* Layer two: the hut frames were not built by this village, and
			 * whatever they were cut for was not huts. */
			'salvage': {
				text: [
					_('the frames did not burn evenly. the outer timber went and the cores did not.'),
					_('the cores are not timber. they are sections of something longer, cut down and reused, and the cut ends are machined.'),
					_('somebody built these huts out of a thing that came down here. a long time before anybody in this village did.')
				],
				notification: _('the hut frames were built out of something that came down here'),
				reward: { 'steel': 20, 'alien alloy': 1 },
				buttons: {
					'end': {
						text: _('get back to it'),
						nextScene: 'end'
					}
				}
			},
			'rationGood': {
				text: [
					_('the fires are kept small and everybody sleeps in three huts.'),
					_('it is unpleasant and it works. the cold lifts on the fourth day, as unaccountably as it came.')
				],
				notification: _('the cold is waited out'),
				buttons: {
					'end': {
						text: _('get back to it'),
						nextScene: 'end'
					}
				}
			},
			'rationBad': {
				text: [
					_('the fires are kept small. it is not enough, and it is not close to enough.'),
					_('the cold lifts on the fourth day. some of the huts stay quiet after it does.')
				],
				notification: _('the cold takes some of the village'),
				onLoad: function() {
					var numKilled = Math.floor(Math.random() * 6) + 2;
					Outside.killVillagers(numKilled);
				},
				buttons: {
					'end': {
						text: _('get back to it'),
						nextScene: 'end'
					}
				}
			},
			'newcomers': {
				text: [
					_('the ones who arrived most recently are put outside the huts, which is the same as a decision about who lives.'),
					_('the wood lasts. the village survives the cold in good order.'),
					_('in the spring nobody can quite agree on how many people were here before it.')
				],
				notification: _('the newest arrivals are put out in the cold'),
				onLoad: function() {
					var numKilled = Math.floor(Math.random() * 10) + 4;
					Outside.killVillagers(numKilled);
				},
				buttons: {
					'end': {
						text: _('get back to it'),
						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.EVENT_HUT_FIRE
	}
];
