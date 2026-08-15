/**
 * Events that can occur when the Outside module is active
 **/
Events.Outside = [
	{ /* Ruined traps */
	title: _('A Ruined Trap'),
		isAvailable: function() {
			return Engine.activeModule == Outside && $SM.get('game.buildings["trap"]', true) > 0;
		},
		scenes: {
			'start': {
				text: [
					_('some of the traps have been torn apart.'),
					_('large prints lead away, into the forest.')
				],
				onLoad: function() {
					var numWrecked = Math.floor(Math.random() * $SM.get('game.buildings["trap"]', true)) + 1;
					$SM.add('game.buildings["trap"]', -numWrecked);
					Outside.updateVillage();
					Outside.updateTrapButton();
				},
				notification: _('some traps have been destroyed'),
				blink: true,
				buttons: {
					'track': {
						text: _('track them'),
						nextScene: function() {
							return Events.karmaOdds(0.5, 'nothing', 'catch');
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
					_('the tracks disappear after just a few minutes.'),
					_('the forest is silent.')
				],
				notification: _('nothing was found'),
				buttons: {
					'end': {
						text: _('go home'),
						nextScene: 'end'
					}
				}
			},
			'catch': {
				text: [
					_('not far from the village lies a large beast, its fur matted with blood.'),
					_('it is already dying. it does not get up.')
				],
				notification: _('the beast is found'),
				buttons: {
					'kill': {
						text: _('use the knife'),
						notification: _('it puts up little resistance before the knife'),
						reward: {
							fur: 100,
							meat: 100,
							teeth: 10
						},
						nextScene: 'end'
					},
					/* Walking away from 210 resources because the animal is
					 * already beaten. It took the traps because it was starving. */
					'spare': {
						text: _('leave it be'),
						onChoose: function() { $SM.add('character.karma', 2); },
						notification: _('it is left where it lies. the traps can be rebuilt'),
						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.EVENT_RUINED_TRAP
	},
	{ /* Hut fire */
		title: _('Fire'),
		isAvailable: function() {
			/* Two independent conditions. A settlement run: wooden huts
			 * specifically -- one rebuilt entirely in steel has nothing left
			 * here to burn, which is the whole point of paying for it. A
			 * solitary run: whether the player has built anything that
			 * COULD burn (see Village.SOLITARY_BURNABLE). Never both --
			 * isSolitary() and having huts are mutually exclusive. */
			if(Outside.isSolitary()) {
				return Village.canReachPlayer() && Village.hasBurnable();
			}
			return Village.canReachPlayer() && $SM.get('game.buildings["hut"]', true) > 0 && $SM.get('game.population', true) > 50;
		},
		scenes: {
			'start': {
				text: function() {
					if(Outside.isSolitary()) {
						return Village.frame([
							Village.lastBurnedText(),
							_('there was no one to raise an alarm, and no one else it could have spread to.')
						]);
					}
					return Village.frame([
						_('a fire rampages through one of the huts, destroying it.'),
						_('no one made it out in time.'),
						_('so dependent on fire for warmth and life until it takes it away.')
					]);
				},
				notification: _('a fire has started'),
				blink: true,
				onLoad: function() {
					if(Outside.isSolitary()) {
						Village.burnBuilding();
						return;
					}
					// Outside.destroyHuts(1);
					Outside.destroyHuts(Math.floor(Math.random() * $SM.get('game.buildings["hut"] * 0.5', true)) + 1);
				},
				buttons: {
					/* Giving up your own stores to the burned-out survivors.
					 * Costs real resources and saves villagers you would
					 * otherwise lose -- the population is the point, not the wood. */
					'shelter': {
						text: _('open the stores'),
						cost: { 'wood': 200, 'cured meat': 50 },
						available: function() {
							return !Outside.isSolitary() &&
								$SM.get('stores.wood', true) >= 200 &&
								$SM.get('stores["cured meat"]', true) >= 50;
						},
						onChoose: function() { $SM.add('character.karma', 3); },
						nextScene: { 1: 'shelter' }
					},
					'mourn': {
						text: _('mourn'),
						available: function() { return !Outside.isSolitary(); },
						notification: function() { return _('some {0} have died', Outside.villagerNoun()); },
						nextScene: { 1: 'mourn' }
					},
					/* Actively making it worse: the huts are gone either way,
					 * but the survivors are competing for what's left. */
					'turnout': {
						text: _('turn the survivors out'),
						available: function() { return !Outside.isSolitary(); },
						onChoose: function() { $SM.add('character.karma', -4); },
						nextScene: { 1: 'turnout' }
					},
					/* Solitary path: nobody else to shelter, mourn or turn
					 * out -- it is just the two of them and one less
					 * building. */
					'rebuild': {
						text: _('start clearing the ash'),
						available: function() { return Outside.isSolitary(); },
						nextScene: { 1: 'soloRebuild' }
					}
				}
			},
			'soloRebuild': {
				text: [
					_('the builder is already sorting the wreckage into what can be saved and what cannot, before you have said anything.'),
					_('says it is not the first thing she has had to rebuild. says that is not much comfort and offers it anyway.')
				],
				notification: _('there is less standing than there was'),
				buttons: {
					'end': {
						text: _('help her sort it'),
						nextScene: 'end'
					}
				}
			},
			'shelter': {
				text: [
					_('the burned-out families are taken in and fed.'),
					_('it costs. the village is smaller and colder for a while.'),
					_('but in the morning everyone who woke up is still here.')
				],
				notification: _('the survivors are taken in'),
				buttons: {
					'end': {
						text: _('go inside'),
						nextScene: 'end'
					}
				}
			},
			'mourn': {
				text: [
					_('the dead are counted and buried.'),
					_('the living find somewhere to sleep.')
				],
				buttons: {
					'end': {
						text: _('go inside'),
						nextScene: 'end'
					}
				}
			},
			'turnout': {
				text: [
					_('they are told there is no room. it is not true.'),
					_('some of them are still outside the wall in the morning.'),
					_('some of them are not anywhere.')
				],
				notification: _('the survivors are turned out'),
				onLoad: function() {
					var numKilled = Math.floor(Math.random() * 8) + 3;
					Outside.killVillagers(numKilled);
				},
				buttons: {
					'end': {
						text: _('go inside'),
						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.EVENT_HUT_FIRE
	},
	{ /* Sickness */
		title: _('Sickness'),
		isAvailable: function() {
			return Village.canReachPlayer() && $SM.get('game.population', true) > 10 && $SM.get('game.population', true) < 50 && $SM.get('stores.medicine', true) > 0;
		},
		scenes: {
			'start': {
				text: [
					_('a sickness is spreading through the village.'),
					_('medicine is needed immediately.')
				],
				notification: function() { return _('some {0} are ill', Outside.villagerNoun()); },
				blink: true,
				buttons: {
					'heal': {
						text: _('1 medicine'),
						cost: { 'medicine' : 1 },
						onChoose: function() { $SM.add('character.karma', 1); },
						/* Spending the medicine used to be a guaranteed cure,
						 * which made this the obviously correct button and the
						 * event a formality. It is now a strong bet rather than
						 * a certainty -- the karma is still earned either way,
						 * because the decision to spend it is the moral act,
						 * not the outcome. */
						nextScene: function() {
							return Events.karmaOdds(0.25, 'partial', 'healed');
						}
					},
					/* Triage: spend nothing, separate the sick, and hope. The
					 * outcome is a genuine gamble weighted by karma -- villagers
					 * who trust their leader cooperate with a quarantine, and
					 * villagers who don't, don't. */
					'quarantine': {
						text: _('separate the sick'),
						nextScene: function() {
							return Events.karmaOdds(0.5, 'partial', 'healed');
						}
					},
					'ignore': {
						text: _('ignore it'),
						onChoose: function() { $SM.add('character.karma', -2); },
						nextScene: {1: 'death'}
					}
				}
			},
			'healed': {
				text: [
					_('the sickness is cured in time.')
				],
				notification: _('sufferers are healed'),
				buttons: {
					'end': {
						text: _('go home'),
						nextScene: 'end'
					}
				}
			},
			'partial': {
				text: [
					_('the sick are moved to the edge of the village.'),
					_('most of them come back. not all of them.')
				],
				notification: _('the sickness is contained, at a cost'),
				onLoad: function() {
					var numKilled = Math.floor(Math.random() * 4) + 1;
					Outside.killVillagers(numKilled);
				},
				buttons: {
					'end': {
						text: _('go home'),
						nextScene: 'end'
					}
				}
			},
			'death': {
				text: [
					_('the sickness spreads through the village.'),
					_('the days are spent with burials.'),
					_('the nights are rent with screams.')
				],
				notification: _('sufferers are left to die'),
				onLoad: function() {
					var numKilled = Math.floor(Math.random() * Math.floor($SM.get('game.population', true)/2)) + 1;
					Outside.killVillagers(numKilled);
				},
				buttons: {
					'end': {
						text: _('go home'),
						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.EVENT_SICKNESS
	},

	{ /* Plague */
		title: _('Plague'),
		isAvailable: function() {
			return Village.canReachPlayer() && $SM.get('game.population', true) > 50 && $SM.get('stores.medicine', true) > 0;
		},
		scenes: {
			'start': {
				text: [
					_('a terrible plague is fast spreading through the village.'),
					_('medicine is needed immediately.')
				],
				notification: _('a plague afflicts the village'),
				blink: true,
				buttons: {
					/* Because there is a serious need for medicine, the price is raised. */
					'buyMedicine': {
						text: _('buy medicine'),
						cost: { 'scales': 70,
								'teeth': 50 },
						reward: { 'medicine': 1 }
					},
					'heal': {
						text: _('3 medicine'),
						cost: { 'medicine' : 3 },
						onChoose: function() { $SM.add('character.karma', 2); },
						nextScene: function() {
							return Events.karmaOdds(0.3, 'partialPlague', 'healed');
						}
					},
					/* Burning the infected huts with people still inside. It
					 * genuinely works better than doing nothing, which is what
					 * makes it a real choice rather than a trap option. */
					'burn': {
						text: _('burn the infected huts'),
						onChoose: function() { $SM.add('character.karma', -6); },
						nextScene: {1: 'burn'}
					},
					'ignore': {
						text: _('do nothing'),
						onChoose: function() { $SM.add('character.karma', -3); },
						nextScene: {1: 'death'}
					}
				}
			},
			'healed': {
				text: [
					_('the plague is kept from spreading.'),
					_('only a few die.'),
					_('the rest bury them.')
				],
				notification: _('epidemic is eradicated eventually'),
				onLoad: function() {
					var numKilled = Math.floor(Math.random() * 5) + 2;
					Outside.killVillagers(numKilled);
				},
				buttons: {
					'end': {
						text: _('go home'),
						nextScene: 'end'
					}
				}
			},
			'partialPlague': {
				text: function() {
					return [
						Events.pick([
							_('the medicine goes to the worst of them first, which is the wrong order and the only bearable one.'),
							_('there is enough for most of the huts. the arithmetic of which most is done quickly and not out loud.'),
							_('it works, mostly, and the mostly is a row of graves at the treeline.')
						]),
						_('the plague stops. it does not stop everywhere at once.')
					];
				},
				notification: _('the plague is halted, but not everywhere'),
				onLoad: function() {
					var numKilled = Math.floor(Math.random() * 8) + 2;
					Outside.killVillagers(numKilled);
				},
				buttons: {
					'end': {
						text: _('go home'),
						nextScene: 'end'
					}
				}
			},
			'burn': {
				text: [
					_('the huts are fired at both ends, in the night, while it is quiet.'),
					_('it stops there. it does stop there.'),
					_('nobody asks who gave the order. everybody knows.')
				],
				notification: _('the infected huts are burned'),
				onLoad: function() {
					var numKilled = Math.floor(Math.random() * 15) + 5;
					Outside.killVillagers(numKilled);
					Outside.destroyHuts(Math.floor(Math.random() * 2) + 1);
				},
				buttons: {
					'end': {
						text: _('go home'),
						nextScene: 'end'
					}
				}
			},
			'death': {
				text: [
					_('the plague rips through the village.'),
					_('the nights are rent with screams.'),
					_('the only hope is a quick death.')
				],
				notification: _('population is almost exterminated'),
				onLoad: function() {
					var numKilled = Math.floor(Math.random() * 80) + 10;
					Outside.killVillagers(numKilled);
				},
				buttons: {
					'end': {
						text: _('go home'),
						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.EVENT_PLAGUE
	},

	{ /* Beast attack */
		title: _('A Beast Attack'),
		isAvailable: function() {
			return Village.canReachPlayer() && $SM.get('game.population', true) > 0;
		},
		scenes: {
			'start': {
				/* Which beast comes is drawn from creatures the player meets
				 * out on the map, tiered by population -- see
				 * Village.BEASTS. A raid on the village should read as the
				 * same ecology, not a generic pack every time.
				 *
				 * Village.frame() prefixes the news arriving when the player
				 * is indoors, since this can now fire from the Room. */
				text: function() {
					var v = Village.pickVariant(Village.BEASTS);
					return Village.frame([
						v.name(),
						v.after(),
						_('the {0} retreat to mourn the dead.', Outside.villagerNoun())
					]);
				},
				notification: function() { return _('wild beasts attack the {0}', Outside.villagerNoun()); },
				onLoad: function() {
					var numKilled = Math.floor(Math.random() * 10) + 1;
					Outside.killVillagers(numKilled);
				},
				blink: true,
				buttons: {
					/* Butcher the dead beasts and go back inside -- the
					 * original behaviour, now an explicit choice rather than
					 * the only button on the screen. */
					'butcher': {
						text: _('butcher the dead'),
						notification: _('predators become prey. price is unfair'),
						reward: {
							fur: 100,
							meat: 100,
							teeth: 10
						},
						nextScene: 'end'
					},
					/* Follow them back. More resources if it works, more dead
					 * villagers if it doesn't -- and karma tilts which. */
					'hunt': {
						text: _('hunt the pack down'),
						nextScene: function() {
							return Events.karmaOdds(0.5, 'huntFailed', 'huntWon');
						}
					},
					/* Spend the effort on the wounded instead of the carcasses.
					 * Gives up the entire 210-resource reward to save people. */
					'tend': {
						text: _('tend the wounded'),
						onChoose: function() { $SM.add('character.karma', 3); },
						nextScene: { 1: 'tend' }
					}
				}
			},
			'huntWon': {
				text: [
					_('the pack is run down before dark, in a dry creek bed.'),
					_('it is not a fight so much as a conclusion.')
				],
				notification: _('the pack is destroyed'),
				reward: {
					fur: 250,
					meat: 250,
					teeth: 30
				},
				buttons: {
					'end': {
						text: _('go home'),
						nextScene: 'end'
					}
				}
			},
			'huntFailed': {
				text: [
					_('the pack knows the ground better than the hunters do.'),
					_('the ones who come back come back with less than they left with.')
				],
				notification: _('the hunt goes badly'),
				onLoad: function() {
					var numKilled = Math.floor(Math.random() * 8) + 2;
					Outside.killVillagers(numKilled);
				},
				buttons: {
					'end': {
						text: _('go home'),
						nextScene: 'end'
					}
				}
			},
			'tend': {
				text: [
					_('the carcasses are left where they fell.'),
					_('the night is spent holding wounds closed instead.'),
					_('more of them see the morning than would have.')
				],
				notification: _('the wounded are tended'),
				buttons: {
					'end': {
						text: _('go home'),
						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.EVENT_BEAST_ATTACK
	},

	{ /* Soldier attack */
		title: _('A Military Raid'),
		isAvailable: function() {
			return Village.canReachPlayer() && $SM.get('game.population', true) > 0 && $SM.get('game.cityCleared');
		},
		scenes: {
			'start': {
				/* Who comes is drawn from factions the player fights out in
				 * the world -- see Village.RAIDERS -- tiered by population,
				 * so what turns up scales with what the settlement is worth
				 * attacking. */
				text: function() {
					var v = Village.pickVariant(Village.RAIDERS);
					return Village.frame([
						_('a gunshot rings through the trees.'),
						v.name(),
						v.after()
					]);
				},
				notification: _('troops storm the village'),
				onLoad: function() {
					var numKilled = Math.floor(Math.random() * 40) + 1;
					Outside.killVillagers(numKilled);
				},
				reward: {
					bullets: 10,
					'cured meat': 50
				},

				blink: true,
				buttons: {
					'prisoners': {
						text: _('two of them are still alive'),
						nextScene: { 1: 'prisoners' }
					},
					/* Walking away is its own decision, not an absence of one:
					 * the wounded are left in the mud overnight and the
					 * question answers itself by morning. */
					'ignore': {
						text: _('see to our own dead first'),
						onChoose: function() { $SM.add('character.karma', -2); },
						notification: _('by morning the wounded raiders are not a problem any more'),
						nextScene: 'end'
					}
				}
			},
			/* The raid's dead and loot are already resolved above; this is
			 * purely about what happens to two disarmed men. They are soldiers
			 * of an empire that no longer exists, still following orders from
			 * a chain of command that ended centuries ago. */
			'prisoners': {
				text: [
					_('two of them are dragged out of the mud, disarmed.'),
					_('they give a unit designation and a rank. both belong to an army that has no one left to report to.'),
					_('they do not seem to know that.')
				],
				buttons: {
					'execute': {
						text: _('execute them'),
						onChoose: function() { $SM.add('character.karma', -5); },
						nextScene: { 1: 'execute' }
					},
					'release': {
						text: _('let them go'),
						onChoose: function() { $SM.add('character.karma', 3); },
						nextScene: function() {
							return Events.karmaOdds(0.45, 'releaseBad', 'releaseGood');
						}
					},
					'question': {
						text: _('ask them who sent them'),
						onChoose: function() { $SM.add('character.karma', 1); },
						nextScene: { 1: 'question' }
					}
				}
			},
			'execute': {
				text: [
					_('it is done against the wall of the store room.'),
					function() { return _('the {0} take their boots, and their belts, and their ammunition.', Outside.villagerNoun()); },
					_('nobody objects. that is the part worth noticing.')
				],
				notification: _('the prisoners are executed'),
				reward: {
					bullets: 20,
					cloth: 20,
					steel: 5
				},
				buttons: {
					'end': {
						text: _('go home'),
						nextScene: 'end'
					}
				}
			},
			'releaseGood': {
				text: [
					_('they are walked to the treeline and pointed away from the village.'),
					_('weeks later a bundle is left at the wall. ammunition, and a hand-drawn map of where not to go.'),
					_('no message with it.')
				],
				notification: _('the prisoners are released'),
				reward: {
					bullets: 30,
					'cured meat': 40
				},
				buttons: {
					'end': {
						text: _('go home'),
						nextScene: 'end'
					}
				}
			},
			'releaseBad': {
				text: [
					_('they are walked to the treeline and pointed away from the village.'),
					_('they come back before the month is out, and they bring more of themselves.'),
					_('mercy is not always repaid. it is still worth extending.')
				],
				notification: _('the released soldiers return'),
				onLoad: function() {
					var numKilled = Math.floor(Math.random() * 15) + 5;
					Outside.killVillagers(numKilled);
				},
				buttons: {
					'end': {
						text: _('go home'),
						nextScene: 'end'
					}
				}
			},
			'question': {
				text: [
					_('they answer readily. they have been waiting a long time for someone to ask.'),
					_('they name a garrison, a supply line, and a commanding officer.'),
					_('none of the three have existed for a very long time. they are told so.'),
					_('they do not believe it. they are given food and sent back to their post.')
				],
				notification: _('the prisoners are questioned'),
				reward: {
					bullets: 10,
					steel: 3
				},
				buttons: {
					'end': {
						text: _('go home'),
						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.EVENT_SOLDIER_ATTACK
	},

	{ /* Two Camps  --  arrivals from different worlds and different centuries */
		title: _('Two Camps'),
		isAvailable: function() {
			return Engine.activeModule == Outside && $SM.get('game.population', true) > 20 &&
				$SM.get('game.buildings["hut"]', true) >= 4;
		},
		scenes: {
			'start': {
				text: [
					_('two groups come out of the trees within an hour of each other, from opposite directions.'),
					_('the first are carrying iron tools and a dead goat. the second are carrying nothing, and one of them has a lamp that needs no fuel.'),
					_('they will not share a fire. each says the other cannot possibly be here.')
				],
				notification: _('two groups arrive, and will not share a fire'),
				blink: true,
				buttons: {
					'iron': {
						text: _('take in the ones with iron'),
						onChoose: function() { $SM.add('character.karma', 1); },
						nextScene: { 1: 'iron' }
					},
					'lamp': {
						text: _('take in the ones with the lamp'),
						onChoose: function() { $SM.add('character.karma', 1); },
						nextScene: { 1: 'lamp' }
					},
					'both': {
						text: _('take in both'),
						cost: { 'cured meat': 60, 'wood': 100 },
						available: function() {
							return $SM.get('stores["cured meat"]', true) >= 60 &&
								$SM.get('stores.wood', true) >= 100;
						},
						onChoose: function() { $SM.add('character.karma', 4); },
						/* Housing two groups who each believe the other is
						 * impossible is a gamble. Karma-weighted: a village
						 * with a reputation for fairness has an easier time
						 * making the arrangement hold. */
						nextScene: function() {
							return Events.karmaOdds(0.5, 'bothBad', 'bothGood');
						}
					},
					'neither': {
						text: _('turn both away'),
						onChoose: function() { $SM.add('character.karma', -3); },
						nextScene: { 1: 'neither' }
					}
				}
			},
			/* Layer two: whichever group is taken in, the interesting part is
			 * what they say about the other one. */
			'iron': {
				text: function() {
					return [
						Events.pick([
							_('they are good workers and they are grateful, and they eat a great deal.'),
							_('they work without being asked and go quiet whenever anybody thanks them.'),
							_('they set up exactly the way people set up who have done this several times already.')
						]),
						_('they say the others are liars. say the lamp is a trick, and that nothing like it exists.'),
						Events.pick([
							_('they are certain of this. they name a year to prove it. it is not this year.'),
							_('one of them offers to prove it and then cannot remember what the proof was.'),
							_('they are not lying. that is what makes it difficult.')
						])
					];
				},
				notification: _('the first group joins the village'),
				onLoad: function() {
					Outside.addVillagers(Math.floor(Math.random() * 6) + 4);
				},
				buttons: {
					'press': {
						text: _('ask them what year they think it is'),
						nextScene: { 1: 'year' }
					},
					'end': {
						text: _('leave it'),
						nextScene: 'end'
					}
				}
			},
			'lamp': {
				text: function() {
					return [
						Events.pick([
							_('they are quiet and they keep to themselves, and they do not eat much at all.'),
							_('they take the smallest hut without being offered it and do not come out of it much.'),
							_('they are polite in a way that suggests a great deal of practice at being new somewhere.')
						]),
						_('they say the others are a long way from home and do not know it yet.'),
						Events.pick([
							_('asked how they know, one of them says: because we were, and we did not either.'),
							_('asked how they know, one of them looks at the lamp instead of answering.'),
							_('asked how long ago they worked it out, one of them says it is not the kind of thing you work out once.')
						])
					];
				},
				notification: _('the second group joins the village'),
				onLoad: function() {
					Outside.addVillagers(Math.floor(Math.random() * 4) + 2);
				},
				reward: { 'energy cell': 5 },
				buttons: {
					'press': {
						text: _('ask them where home was'),
						nextScene: { 1: 'home' }
					},
					'end': {
						text: _('leave it'),
						nextScene: 'end'
					}
				}
			},
			'year': {
				text: [
					_('they give a year, and a month, and the name of a harvest festival that was two weeks out when they left.'),
					_('the other group, asked the same question, gives a different year.'),
					_('the gap between the two answers is four hundred and eleven years.'),
					_('both groups walked here. neither of them has aged a day more than the walk.')
				],
				notification: _('the two groups are four hundred years apart'),
				buttons: {
					'end': {
						text: _('go home'),
						nextScene: 'end'
					}
				}
			},
			'home': {
				text: [
					_('the one with the lamp does not answer for a while.'),
					_('then says: it does not matter. says the fleets came through, and after the fleets came through there was not a home to be from.'),
					_('says this world is the only one that never got a name, and that is why they are all still on it.')
				],
				notification: _('the barren world is the only one that never got a name'),
				buttons: {
					'end': {
						text: _('go home'),
						nextScene: 'end'
					}
				}
			},
			'bothGood': {
				text: [
					_('it takes a month and most of the stores.'),
					_('they do not become friends. they do become neighbours, which is harder and worth more.'),
					_('the lamp is still burning. the goat is long eaten. nobody has settled what year it is.')
				],
				notification: _('both groups are taken in'),
				onLoad: function() {
					Outside.addVillagers(Math.floor(Math.random() * 10) + 8);
				},
				reward: { 'energy cell': 8, 'iron': 30 },
				buttons: {
					'end': {
						text: _('go home'),
						nextScene: 'end'
					}
				}
			},
			'bothBad': {
				text: [
					_('it lasts nine days.'),
					_('on the tenth there is a fight at the store room over whose turn it was, and it does not stop at the store room.'),
					_('what is left of both groups leaves in the same direction, separately.')
				],
				notification: _('the two groups cannot be housed together'),
				onLoad: function() {
					var numKilled = Math.floor(Math.random() * 8) + 2;
					Outside.killVillagers(numKilled);
				},
				buttons: {
					'end': {
						text: _('go home'),
						nextScene: 'end'
					}
				}
			},
			'neither': {
				text: [
					_('both groups are told there is no room.'),
					_('they go back into the trees in opposite directions, still arguing.'),
					_('the lamp is visible for a long time after the rest of them are not.')
				],
				notification: _('both groups are turned away'),
				buttons: {
					'end': {
						text: _('go home'),
						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.EVENT_HMMM
	},

	{ /* The Marker  --  a grave that predates every settlement here */
		title: _('The Marker'),
		isAvailable: function() {
			return Engine.activeModule == Outside && $SM.get('game.buildings["hut"]', true) >= 3;
		},
		scenes: {
			'start': {
				text: [
					_('a foundation trench at the edge of the village turns up a marker stone, set upright and deliberate.'),
					_('the script on it is narrow and very even. nobody here can read it.'),
					_('the trench needs to go through where it stands.')
				],
				notification: _('a grave marker is found under the village'),
				blink: true,
				buttons: {
					'dig': {
						text: _('dig it out'),
						onChoose: function() { $SM.add('character.karma', -3); },
						nextScene: { 1: 'dig' }
					},
					'move': {
						text: _('move the trench'),
						cost: { 'wood': 100 },
						available: function() {
							return $SM.get('stores.wood', true) >= 100;
						},
						onChoose: function() { $SM.add('character.karma', 3); },
						nextScene: { 1: 'move' }
					},
					'ask': {
						text: _('ask if anyone can read it'),
						nextScene: function() {
							return Events.karmaOdds(0.5, 'noReader', 'reader');
						}
					}
				}
			},
			'dig': {
				text: function() {
					return [
						Events.pick([
							_('there is nothing under it. no box, no bones, no ash.'),
							_('there is a hollow under it, lined and sealed and completely empty.'),
							_('there is nothing under it, and the ground below has never been broken. the marker was set, not buried.')
						]),
						_('the stone goes into the wall of the new hut, script inward, where it will not have to be looked at.'),
						Events.pick([
							_('it is very good stone. it is not from here.'),
							_('it cuts the mortar rather than the other way round.'),
							_('it is the only part of that hut that will still be standing in a hundred years.')
						])
					];
				},
				notification: _('the marker is dug out'),
				reward: { 'iron': 20, 'steel': 5 },
				buttons: {
					'end': {
						text: _('go home'),
						nextScene: 'end'
					}
				}
			},
			'move': {
				text: [
					_('the trench goes around. it costs a week and a great deal of wood.'),
					_('the marker stays where it was put, by whoever put it there, for whoever it was put there for.'),
					_('the village builds around it and after a while stops noticing it.')
				],
				notification: _('the trench is moved around the marker'),
				buttons: {
					'end': {
						text: _('go home'),
						nextScene: 'end'
					}
				}
			},
			/* Layer two: someone can read it, and what it says is the hint. */
			'reader': {
				text: function() {
					var lines = [
						_('one of the newer arrivals can. she reads it twice before she says anything.'),
						_('it is not a name. it is a rank, a fleet number, and a date of loss.'),
						_('the date of loss is before the date the stone was cut. somebody put this here for someone they had not lost yet.')
					];
					if(Prestige.hasCompletedRun()) {
						lines.push(_('she turns the stone over looking for a mason\'s mark and finds one, scratched rather than cut.'));
						lines.push(_('you have made that mark. you make it without thinking, on things you want to find again.'));
						lines.push(_('you have never been here, and the scratch has been under that stone longer than the village has stood.'));
					} else {
						lines.push(_('she says there are a great many of these. she says she has been walking past them her whole life.'));
					}
					return lines;
				},
				notification: function() {
					return Prestige.hasCompletedRun() ?
						_('the mark under the stone is one you make without thinking') :
						_('the marker is a fleet loss record');
				},
				buttons: {
					'moveIt': {
						text: _('move the trench anyway'),
						cost: { 'wood': 100 },
						available: function() {
							return $SM.get('stores.wood', true) >= 100;
						},
						onChoose: function() { $SM.add('character.karma', 4); },
						nextScene: { 1: 'move' }
					},
					'digIt': {
						text: _('dig it out anyway'),
						onChoose: function() { $SM.add('character.karma', -4); },
						nextScene: { 1: 'dig' }
					}
				}
			},
			'noReader': {
				text: [
					_('nobody in the village can read it, and nobody who comes through that season can either.'),
					_('the trench waits. the marker waits. it has waited longer than this.')
				],
				buttons: {
					'moveIt': {
						text: _('move the trench'),
						cost: { 'wood': 100 },
						available: function() {
							return $SM.get('stores.wood', true) >= 100;
						},
						onChoose: function() { $SM.add('character.karma', 3); },
						nextScene: { 1: 'move' }
					},
					'digIt': {
						text: _('dig it out'),
						onChoose: function() { $SM.add('character.karma', -3); },
						nextScene: { 1: 'dig' }
					}
				}
			}
		},
		audio: AudioLibrary.EVENT_GUILT
	}

];
