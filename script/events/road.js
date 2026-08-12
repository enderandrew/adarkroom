/**
 * Roadside events -- non-combat things found while travelling.
 *
 * Tiered by distance from the village exactly the way Events.Encounters is,
 * so what you run into gets stranger and older the further out you go:
 *
 *   tier 1   getDistance() <= 10   things people left recently
 *   tier 2   getDistance() >  10   things people left and did not come back for
 *   tier 3   getDistance() >  20   things that did not come from here at all
 *   tier 4   getDistance() >  29   things that were already old when the
 *                                  oldest arrivals got here
 *
 * These fire from World.checkRoadEvent() on movement rather than from
 * Events.EventPool: the pool runs on a global timer and everything in it
 * gates on Engine.activeModule being Room, Outside or Path, so nothing in it
 * can reach the world map -- and a timer-driven event has no idea how far out
 * the player is, which is the whole point of the tiers.
 *
 * Rewards use `loot` rather than `reward`. In the world, Events.buttonClick
 * deducts costs from Path.outfit but pays `reward` into village stores, so a
 * reward found twenty tiles out would teleport home; `loot` draws pickup
 * buttons that go into the pack and respect bag space.
 **/
Events.Road = [

	/* ================================================================
	 * TIER 1  --  getDistance() <= 10
	 * ================================================================ */

	{ /* A Cairn */
		title: _('A Cairn'),
		isAvailable: function() {
			return Engine.activeModule == World && World.getDistance() <= 10;
		},
		scenes: {
			'start': {
				text: [
					_('a waist-high pile of stones stands beside the track, built carefully and not recently.'),
					_('there are things balanced on the top of it. a tin cup. a bootlace. a twist of dried meat.'),
					_('none of it is worth anything. all of it was carried here by somebody.')
				],
				notification: _('a cairn stands beside the track'),
				buttons: {
					'take': {
						text: _('take what is on it'),
						onChoose: function() { $SM.add('character.karma', -2); },
						nextScene: { 1: 'took' }
					},
					'add': {
						text: _('leave something on it'),
						cost: { 'cured meat': 5 },
						available: function() {
							return (Path.outfit['cured meat'] || 0) >= 5;
						},
						onChoose: function() { $SM.add('character.karma', 2); },
						nextScene: { 1: 'added' }
					},
					'leave': {
						text: _('walk on'),
						nextScene: 'end'
					}
				}
			},
			'took': {
				text: [
					_('the cup is dented and the meat has gone hard, and both go in the pack.'),
					_('under where the cup was sitting there is a flat stone with a scratch on it.'),
					_('there are a lot of scratches. they have been added one at a time.')
				],
				notification: _('the cairn is stripped'),
				loot: {
					'cured meat': { min: 1, max: 3, chance: 1 },
					'cloth': { min: 1, max: 4, chance: 0.6 }
				},
				buttons: {
					'count': {
						text: _('count the scratches'),
						nextScene: { 1: 'scratches' }
					},
					'end': {
						text: _('walk on'),
						nextScene: 'end'
					}
				}
			},
			'scratches': {
				/* Reads differently once the player has finished a run. The
				 * cycle is not stated anywhere -- the tell is that the hand is
				 * recognisable and the memory is not. */
				text: function() {
					/* Checked first: a player at fifty deaths has necessarily
					 * completed runs, so without this the prestige variant
					 * below would always win and the milestone would never be
					 * reachable. */
					if(EasterEggs.atDeathMilestone()) {
						return EasterEggs.deathCairnText();
					}
					if(Prestige.hasCompletedRun()) {
						return [
							_('sixty-one.'),
							_('the scratches are not all the same. the last dozen are cut at an angle, short, by somebody holding the blade the way you hold a blade.'),
							_('it is your hand. it is unmistakably your hand.'),
							_('you do not remember being here. you do not remember any of the sixty-one.')
						];
					}
					return [
						_('sixty-one.'),
						_('somebody has come out this far sixty-one times and put something on this pile, and gone back.'),
						_('the pile is not a marker. it is a tally of trips that ended here.')
					];
				},
				notification: function() {
					return Prestige.hasCompletedRun() ?
						_('the last dozen scratches are in your hand') :
						_('sixty-one trips ended at this pile');
				},
				buttons: {
					'end': {
						text: _('walk on'),
						nextScene: 'end'
					}
				}
			},
			'added': {
				text: [
					_('a strip of meat goes on top, next to the cup.'),
					_('it is not clear who it is for. it does not seem to matter.')
				],
				buttons: {
					'end': {
						text: _('walk on'),
						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.EVENT_HMMM
	},

	{ /* The Snare Line */
		title: _('The Snare Line'),
		isAvailable: function() {
			return Engine.activeModule == World && World.getDistance() <= 10;
		},
		scenes: {
			'start': {
				text: [
					_('a line of snares runs across the slope, set by somebody who knew what they were doing.'),
					_('three of them have something in. one of the three is still alive.'),
					_('whoever set them is not here, and has not been for a day or two, judging by the other two.')
				],
				notification: _("somebody else's snares, with a catch in them"),
				buttons: {
					'rob': {
						text: _('empty the snares'),
						onChoose: function() { $SM.add('character.karma', -3); },
						nextScene: { 1: 'robbed' }
					},
					'reset': {
						text: _('free the live one and reset the line'),
						onChoose: function() { $SM.add('character.karma', 3); },
						nextScene: { 1: 'reset' }
					},
					'leave': {
						text: _('walk on'),
						nextScene: 'end'
					}
				}
			},
			'robbed': {
				text: [
					_('the snares are emptied and the line is left sprung and useless.'),
					_('whoever comes back to it will have walked a long way for nothing.')
				],
				notification: _('the snares are emptied'),
				loot: {
					'fur': { min: 5, max: 15, chance: 1 },
					'meat': { min: 5, max: 15, chance: 1 },
					'teeth': { min: 1, max: 4, chance: 0.5 }
				},
				buttons: {
					'end': {
						text: _('walk on'),
						nextScene: 'end'
					}
				}
			},
			'reset': {
				text: [
					_('the live one goes into the scrub without looking back. the line is reset and rebaited.'),
					_('there is a mark cut into the peg of the first snare. it is not a maker\'s mark.'),
					_('it is the same mark, cut again and again, over old ones that have weathered almost flat.')
				],
				notification: _('the snare line is reset'),
				buttons: {
					'look': {
						text: _('look closer at the peg'),
						nextScene: { 1: 'peg' }
					},
					'end': {
						text: _('walk on'),
						nextScene: 'end'
					}
				}
			},
			'peg': {
				text: function() {
					var base = [
						_('the peg has been re-cut so many times it is more notch than peg.'),
						_('the oldest marks underneath are not weathered the same way as the wood around them.'),
						_('they are not cut. they are stamped, evenly, by something that was not a knife.')
					];
					if(Prestige.hasCompletedRun()) {
						base.push(_('over the top of the stamped ones, newer and shallower, somebody has cut the same three letters again and again.'));
						base.push(_('you know the letters. you have never cut them into anything.'));
					}
					return base;
				},
				notification: _('the oldest marks on the peg were not cut by hand'),
				buttons: {
					'end': {
						text: _('walk on'),
						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.EVENT_RUINED_TRAP
	},
	
	{ /* The Bitter Night: the climate, close to home */
		title: _('The Bitter Night'),
		isAvailable: function() {
			return Engine.activeModule == World && World.getDistance() <= 10;
		},
		scenes: {
			'start': {
				text: [
					_('the temperature drops out from under the evening with no warning at all.'),
					_('there is no shelter on this stretch and no wood worth the name. the wind comes across flat ground and does not slow down for anything.'),
					_('it is going to be a long way to morning.')
				],
				notification: _('the cold comes down with nowhere to shelter'),
				buttons: {
					/* Burning a torch is the reliable answer and costs a real
					 * consumable that has other uses. */
					'torch': {
						text: _('burn a torch through the night'),
						cost: { 'torch': 1 },
						available: function() {
							return (Path.outfit['torch'] || 0) >= 1;
						},
						nextScene: { 1: 'torch' }
					},
					/* Free, but you arrive at morning worse off. */
					'walk': {
						text: _('keep walking to stay warm'),
						nextScene: function() {
							return Events.karmaOdds(0.5, 'walkedBad', 'walkedGood');
						}
					},
					'dig': {
						text: _('dig in and wait it out'),
						nextScene: { 1: 'dug' }
					}
				}
			},
			'torch': {
				text: [
					_('the torch is set in the lee of the pack and burns down to nothing by first light.'),
					_('it is not warm. it is the difference between cold and the other thing.')
				],
				notification: _('the night is burned through'),
				buttons: {
					'end': {
						text: _('move on at dawn'),
						nextScene: 'end'
					}
				}
			},
			'walkedGood': {
				text: [
					_('walking works, as long as it does not stop.'),
					_('by grey light the ground has come up into low hills and the wind has something to break against.'),
					_('a good deal of distance is covered by somebody who was not trying to cover it.')
				],
				notification: _('the night is walked off'),
				loot: {
					'cured meat': { min: 1, max: 3, chance: 0.4 }
				},
				buttons: {
					'end': {
						text: _('keep going'),
						nextScene: 'end'
					}
				}
			},
			'walkedBad': {
				text: [
					_('walking works until the ground stops cooperating, and then it works against you.'),
					_('an hour is lost going the wrong way around a gully, and the water in the skin comes up solid.'),
					_('morning arrives eventually. so does most of the damage.')
				],
				notification: _('the night takes a toll'),
				onLoad: function() {
					World.setHp(Math.max(1, World.health - 5));
					World.setWater(Math.max(0, World.water - 2));
				},
				buttons: {
					'end': {
						text: _('keep going'),
						nextScene: 'end'
					}
				}
			},
			'dug': {
				text: [
					_('a scrape in the lee of a rock, the pack pulled over, and eight hours of not moving.'),
					_('scratched into the underside of the rock, where somebody lying exactly here would see it, there is a line of marks.'),
					_('somebody else has had this same idea, in this same spot, a great many times.')
				],
				notification: _('somebody has waited out this stretch before'),
				buttons: {
					'read': {
						text: _('look at the marks'),
						nextScene: { 1: 'marks' }
					},
					'end': {
						text: _('move on at dawn'),
						nextScene: 'end'
					}
				}
			},
			'marks': {
				text: function() {
					if(Prestige.hasCompletedRun()) {
						return [
							_('they are tallies, in groups of five, in at least four different hands.'),
							_('three of the four are strangers. the fourth is not.'),
							_('the fourth hand is yours, and it has counted higher than any of the others, and you have no memory of a single night of it.')
						];
					}
					return [
						_('they are tallies, in groups of five, in at least four different hands.'),
						_('the newest ones are cut into the oldest ones because there is no clean rock left to cut.'),
						_('everybody who has sheltered under this rock has counted something, and nobody has written down what.')
					];
				},
				notification: function() {
					return Prestige.hasCompletedRun() ?
						_('the fourth hand under the rock is yours') :
						_('four hands have counted under this rock');
				},

				buttons: {
					'end': {
						text: _('move on at dawn'),
						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.EVENT_HUT_FIRE
	},

	/* ================================================================
	 * TIER 2  --  getDistance() > 10
	 * ================================================================ */

	{ /* A Cold Camp */
		title: _('A Cold Camp'),
		isAvailable: function() {
			return Engine.activeModule == World && World.getDistance() > 10 && World.getDistance() <= 20;
		},
		scenes: {
			'start': {
				text: [
					_('a camp, not long abandoned. the ash is grey through but the ground under it is still dry.'),
					_('four bedrolls. three packs. the fourth pack is gone and so is whoever carried it.'),
					_('nothing here was taken in a hurry. it was all set down and left.')
				],
				notification: _('a recently abandoned camp'),
				buttons: {
					'scavenge': {
						text: _('go through the packs'),
						onChoose: function() { $SM.add('character.karma', -1); },
						nextScene: { 1: 'scavenged' }
					},
					'track': {
						text: _('follow the one who left'),
						nextScene: function() {
							return Events.karmaOdds(0.5, 'trackNothing', 'trackFound');
						}
					},
					'leave': {
						text: _('walk on'),
						nextScene: 'end'
					}
				}
			},
			'scavenged': {
				text: [
					_('the packs are full and carefully organised. water, food, spare cloth, all of it usable.'),
					_('nobody walks away from this much on purpose.'),
					_('at the bottom of one there is a folded sheet with three names on it and a fourth crossed out.')
				],
				notification: _('the packs are gone through'),
				loot: {
					'cured meat': { min: 5, max: 15, chance: 1 },
					'cloth': { min: 5, max: 12, chance: 0.8 },
					'leather': { min: 2, max: 6, chance: 0.5 },
					'bullets': { min: 1, max: 5, chance: 0.3 }
				},
				buttons: {
					'sheet': {
						text: _('look at the sheet'),
						nextScene: { 1: 'sheet' }
					},
					'end': {
						text: _('walk on'),
						nextScene: 'end'
					}
				}
			},
			'sheet': {
				text: [
					_('three names, and a fourth with a line through it, and under them a heading in a much older hand.'),
					_('the heading is a crew manifest. the sheet has been reused, and reused, and the names written over each other.'),
					_('counting the layers is not possible. there are a lot of them.')
				],
				notification: _('the sheet is a manifest, written over many times'),
				buttons: {
					'end': {
						text: _('walk on'),
						nextScene: 'end'
					}
				}
			},
			'trackFound': {
				text: function() {
					return [
						Events.pick([
							_('the trail goes half a day out and stops at a flat place with no cover.'),
							_('the trail runs straight for hours, which nothing walking on its own does, and then ends.'),
							_('the trail doubles back on itself twice and then commits to a direction and stops in the open.')
						]),
						_('the fourth pack is sitting upright in the middle of it, buckled, undisturbed.'),
						Events.pick([
							_('the tracks go up to it and do not come away from it in any direction.'),
							_('there is one set of prints in and none out, and the ground is soft enough that there would be.'),
							_('the prints stop a pace short of the pack, both feet together, as if whoever it was had halted to be told something.'),
							_('some of the tracks shift from two feet to crawling and then being dragged away.'),
							_('the tracks eventually circle back which makes no sense whatsoever.'),
							_('the tracks lead to a sheer rockface that would be a very difficult climb, even for the six arms of a Wanderer.'),
						])
					];
				},
				notification: _('the tracks stop, and do not continue'),
				loot: {
					'cured meat': { min: 5, max: 10, chance: 1 },
					'medicine': { min: 1, max: 1, chance: 0.4 },
					'steel': { min: 1, max: 4, chance: 0.4 }
				},
				buttons: {
					'end': {
						text: _('go back'),
						nextScene: 'end'
					}
				}
			},
			'trackNothing': {
				text: [
					_('the trail is gone inside a mile. the ground out here does not hold anything for long.'),
					_('the walk back costs most of the afternoon.')
				],
				notification: _('the trail goes nowhere'),
				buttons: {
					'end': {
						text: _('go back'),
						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.EVENT_HMMM
	},

	{ /* The Water Cache */
		title: _('The Water Cache'),
		isAvailable: function() {
			return Engine.activeModule == World && World.getDistance() > 10 && World.getDistance() <= 20;
		},
		scenes: {
			'start': {
				text: [
					_('three stones stand upright in a row, which is not how stones stand.'),
					_('buried under them, wrapped and sealed, is water. a good deal of it.'),
					_('there is no name on it. it was put here for whoever needed it, by somebody who did not.')
				],
				notification: _('a buried water cache'),
				buttons: {
					'all': {
						text: _('take all of it'),
						onChoose: function() {
							$SM.add('character.karma', -3);
							World.setWater(World.getMaxWater());
						},
						nextScene: { 1: 'tookAll' }
					},
					'share': {
						text: _('take a share and rebury the rest'),
						onChoose: function() {
							$SM.add('character.karma', 2);
							World.setWater(Math.min(World.getMaxWater(), World.water + Math.floor(World.getMaxWater() / 2)));
						},
						nextScene: { 1: 'tookShare' }
					},
					'leave': {
						text: _('leave it'),
						onChoose: function() { $SM.add('character.karma', 1); },
						nextScene: 'end'
					}
				}
			},
			'tookAll': {
				text: [
					_('every container is drained and the wrappings are left open to the air.'),
					_('the three stones are still standing. they will go on saying there is water here for a long time.')
				],
				notification: _('the cache is emptied'),
				buttons: {
					'end': {
						text: _('walk on'),
						nextScene: 'end'
					}
				}
			},
			'tookShare': {
				text: [
					_('enough is taken to matter and the rest goes back under, resealed, stones replaced.'),
					_('scratched on the underside of the middle stone there is a list of marks in different hands.'),
					_('everybody who has used this has signed it. none of the hands are the same, and none of them are recent.')
				],
				notification: _('the cache is shared and resealed'),
				buttons: {
					'sign': {
						text: _('add a mark'),
						onChoose: function() { $SM.add('character.karma', 1); },
						nextScene: { 1: 'signed' }
					},
					'end': {
						text: _('walk on'),
						nextScene: 'end'
					}
				}
			},
			'signed': {
				text: function() {
					if(Prestige.hasCompletedRun()) {
						return [
							_('a mark goes on the underside of the stone, at the end of the list.'),
							_('it lands next to one that is already the same mark, in the same hand, made the same way.'),
							_('and the one before that. and four further up.'),
							_('somebody with your hand has signed this stone five times. you are signing it for the first time.')
						];
					}
					return [
						_('a mark goes on the underside of the stone, at the end of the list.'),
						_('the list runs onto the back and down the side. it started a very long time before this.')
					];
				},
				buttons: {
					'end': {
						text: _('walk on'),
						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.EVENT_SKY
	},
	
	{ /* The Dry Stretch */
		title: _('The Dry Stretch'),
		isAvailable: function() {
			return Engine.activeModule == World && World.getDistance() > 10 && World.getDistance() <= 20;
		},
		scenes: {
			'start': {
				text: [
					_('the ground here is cracked into plates and there has been nothing green for hours.'),
					_('there is a figure a long way off, sitting down, not moving. sitting down out here is how it ends.'),
					_('going over there is a detour, in the wrong direction, across the worst of it.')
				],
				notification: _('somebody is sitting down out on the flats'),
				buttons: {
					'help': {
						text: _('go to them'),
						cost: { 'water': 2 },
						available: function() {
							return World.water >= 2;
						},
						onChoose: function() { $SM.add('character.karma', 4); },
						nextScene: function() {
							return Events.karmaOdds(0.4, 'tooLate', 'saved');
						}
					},
					'shout': {
						text: _('shout and keep going'),
						onChoose: function() { $SM.add('character.karma', -1); },
						nextScene: { 1: 'shouted' }
					},
					'ignore': {
						text: _('do not look over'),
						onChoose: function() { $SM.add('character.karma', -3); },
						nextScene: 'end'
					}
				}
			},
			'saved': {
				text: function() {
					return [
						_('she gets the water down and then most of an hour later she can stand.'),
						Events.pick([
							_('she has been walking east for eleven days on four days of supplies, which she is aware does not work.'),
							_('she has been walking since a settlement that she names, and that nobody has heard of, and that she is certain is two days behind her.'),
							_('she says she stopped to think and could not work out how to start again. she says it took hours to notice.'),
							_('she has been rationing to a schedule she wrote out beforehand. the schedule assumed the water would be where the map said.'),
							_('she said kindness is rare here, but appreciated. she heard good things of you as of late.'),
							_('she was coming to terms with the end, and now has to process what comes next.'),
							_('she said someone found her hidden water cache and raided it. there was no contigency plan beyond that.'),
						]),
						_('she gives up what is left in her pack, which is not much, and starts back the way she came.')
					];
				},
				notification: _('the walker is brought round'),
				loot: {
					'cloth': { min: 2, max: 6, chance: 0.8 },
					'scales': { min: 2, max: 8, chance: 0.6 },
					'medicine': { min: 1, max: 1, chance: 0.2 }
				},
				buttons: {
					'ask': {
						text: _('ask what is east'),
						nextScene: { 1: 'east' }
					},
					'end': {
						text: _('go your own way'),
						nextScene: 'end'
					}
				}
			},
			'east': {
				text: function() {
					return [
						Events.pick([
							_('she says nothing is east. says she checked.'),
							_('she says east was fine for nine days and then stopped being a direction.'),
							_('she says there is nothing east, and then corrects herself, and says there is nothing east that stays where it is.'),
							_('she says things that were east disappeared and other things that were east reappeared.'),
						]),
						_('says she walked east because the last three people she asked all said something different, and east was the only direction nobody had ruled out.'),
						Events.pick([
							_('says she is going to try north next, when she can walk properly.'),
							_('says she is going to go back and ask better questions.'),
							_('says she has stopped believing the answers and started keeping a list of who gave them.'),
							_('says you cant always trust your memory of where you have been before. take notes.'),
							_('says the compass in your hand shows more than hers.'),
							_('says that sometimes all you can do is commit to a direction to avoid madness.'),
						])
					];
				},
				notification: _('nobody agrees on which way is out'),
				buttons: {
					'end': {
						text: _('go your own way'),
						nextScene: 'end'
					}
				}
			},
			'tooLate': {
				text: [
					_('the detour costs the water and most of the afternoon and she is already gone when it is done.'),
					_('her pack is beside her, still buckled. she was not out of supplies.'),
					_('she stopped walking a good while before she ran out of anything.')
				],
				notification: _('the walker had stopped before she ran out'),
				loot: {
					'cured meat': { min: 3, max: 8, chance: 1 },
					'cloth': { min: 2, max: 6, chance: 0.7 }
				},
				buttons: {
					'end': {
						text: _('go on'),
						nextScene: 'end'
					}
				}
			},
			'shouted': {
				text: [
					_('the shout carries a long way out here. she does not move.'),
					_('there is no way to tell from this distance whether she heard it.'),
					_('the sensible thing is to assume she did.')
				],
				buttons: {
					'end': {
						text: _('go on'),
						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.EVENT_SICK_MAN
	},

	/* ================================================================
	 * TIER 3  --  getDistance() > 20
	 * ================================================================ */

	{ /* The Wreck  --  radioactive, genuinely lethal */
		title: _('The Wreck'),
		isAvailable: function() {
			return Engine.activeModule == World && World.getDistance() > 20 && World.getDistance() <= 29;
		},
		scenes: {
			'start': {
				text: [
					_('something came down here hard enough to leave a furrow half a mile long.'),
					_('what is at the end of the furrow is a hull, split open along its length, and it is not from here.'),
					_('nothing grows within thirty paces of it. teeth ache at twenty.')
				],
				notification: _('a split hull lies at the end of a long furrow'),
				buttons: {
					/* Safe option: costs nothing but yields little. */
					'edge': {
						text: _('take what is on the outside'),
						nextScene: { 1: 'edge' }
					},
					/* Dangerous option: a real hp cost up front just to be in
					 * there, and then a karma-weighted roll for whether you
					 * come out with the alloy or do not come out. */
					'inside': {
						text: _('go inside it'),
						cost: { 'hp': 10 },
						available: function() {
							return World.health > 10;
						},
						nextScene: function() {
							return Events.karmaOdds(0.35, 'insideBad', 'insideGood');
						}
					},
					'leave': {
						text: _('give it a wide berth'),
						nextScene: 'end'
					}
				}
			},
			'edge': {
				text: [
					_('plating has sheared off along the split and lies scattered where the grass stops.'),
					_('it is light, and cold, and does not mark when it is struck.'),
					_('a few minutes at this distance is survivable. more is not.')
				],
				notification: _('plating is stripped from the outside of the hull'),
				loot: {
					'steel': { min: 3, max: 8, chance: 1 },
					'iron': { min: 5, max: 12, chance: 0.8 }
				},
				buttons: {
					/* Having seen how much is out here, the split is right
					 * there. Same cost and same roll as going in from the
					 * start -- the escalation is the point, not a discount. */
					'inside': {
						text: _('go in after all'),
						cost: { 'hp': 10 },
						available: function() {
							return World.health > 10;
						},
						nextScene: function() {
							return Events.karmaOdds(0.35, 'insideBad', 'insideGood');
						}
					},
					'end': {
						text: _('move away from it'),
						nextScene: 'end'
					}
				}
			},
			'insideGood': {
				text: [
					_('inside, the air is dry and tastes of pennies and the light does not behave.'),
					_('most of it is fused. one bulkhead is not, and behind it is a rack of undamaged stock.'),
					_('one piece comes free. carrying it out takes longer than it should, and the walk back is very bad.')
				],
				notification: _('one piece comes out of the wreck'),
				onLoad: function() {
					// The exposure costs more than the entry price did.
					World.setHp(Math.max(1, World.health - 10));
				},
				loot: {
					'alien alloy': { min: 1, max: 1, chance: 1 },
					'energy cell': { min: 1, max: 4, chance: 0.5 }
				},
				buttons: {
					'end': {
						text: _('get away from it'),
						nextScene: 'end'
					}
				}
			},
			'insideBad': {
				text: [
					_('inside, the air is dry and tastes of pennies and the light does not behave.'),
					_('the rack behind the bulkhead is intact. reaching it means going past the split, and past the split is where it is worst.'),
					_('the piece comes free. the walk back out does not happen.')
				],
				notification: _('the wreck is not survived'),
				buttons: {
					/* No nextScene: killPlayer() ends the event itself, and
					 * endEvent() must only run once. */
					'end': {
						text: _('...'),
						onChoose: function() {
							Events.killPlayer();
						}
					}
				}
			}
		},
		audio: AudioLibrary.EVENT_SKY
	},

	{ /* A Column of Smoke */
		title: _('A Column of Smoke'),
		isAvailable: function() {
			return Engine.activeModule == World && World.getDistance() > 20 && World.getDistance() <= 29;
		},
		scenes: {
			'start': {
				text: [
					_('a column of smoke stands off to one side, too straight and too steady to be a fire.'),
					_('it does not drift. the wind out here would take a fire apart in minutes and it does not touch this.'),
					_('it has the look of something venting rather than burning.')
				],
				notification: _('a column of smoke stands too straight to be a fire'),
				buttons: {
					'approach': {
						text: _('go and look'),
						nextScene: { 1: 'approach' }
					},
					'mark': {
						text: _('note where it is and move on'),
						onChoose: function() { $SM.add('character.karma', 1); },
						nextScene: { 1: 'marked' }
					},
					'avoid': {
						text: _('go the other way'),
						nextScene: 'end'
					}
				}
			},
			'approach': {
				text: [
					_('close up it is a vent in the ground, ringed in fused earth, breathing out steadily.'),
					_('there is a track worn to the ring and around it, walked flat, going nowhere else.'),
					_('somebody comes here. regularly. and then goes back the way they came.')
				],
				notification: _('the smoke is a vent, and something walks a circle around it'),
				buttons: {
					'wait': {
						text: _('wait for whoever walks it'),
						nextScene: function() {
							return Events.karmaOdds(0.5, 'waitedNothing', 'waited');
						}
					},
					'end': {
						text: _('leave before they come back'),
						nextScene: 'end'
					}
				}
			},
			'waited': {
				text: function() {
					return [
						Events.pick([
							_('he arrives at dusk, alone, in armour that was very good once and has not been repaired in living memory.'),
							_('he arrives exactly at dusk, which he has clearly been doing for a very long time.'),
							_('he comes out of the dark already walking the line, as though he had never stopped and simply became visible.'),
							_('he arrives with a perfect uniform stride, stepping in his previous footprints.'),
						]),
						_('he walks the ring, checks the vent, and starts back. he does not acknowledge anyone.'),
						Events.pick([
							_('asked what he is guarding, he says that the wing is secure and the prisoner is held.'),
							_('asked who he reports to, he gives a rank and a designation and waits, briefly, as though expecting to be dismissed.'),
							_('asked how long he has been posted here, he says his relief is due, and does not say when it was due from.'),
							_('asked anything at all, he answers it the way a man answers a question he has answered several thousand times.'),
							_('asked what he is guarding, he responds that a good soldier follows orders without needing to know.'),
							_('asked about the vent, he responds that where it leads is classified and that you no longer have Fleet access.'),
						])
					];
				},
				notification: _('the vent is being guarded by someone still on duty'),
				loot: {
					'steel': { min: 2, max: 6, chance: 0.8 },
					'energy cell': { min: 1, max: 3, chance: 0.5 }
				},
				buttons: {
					'end': {
						text: _('let him walk'),
						nextScene: 'end'
					}
				}
			},
			'waitedNothing': {
				text: [
					_('nobody comes. the vent breathes. the track stays exactly as worn as it was.'),
					_('a night is spent out here for nothing, and the cold gets into everything.')
				],
				notification: _('nobody comes to the vent'),
				buttons: {
					'end': {
						text: _('move on'),
						nextScene: 'end'
					}
				}
			},
			'marked': {
				text: [
					_('the bearing is taken and written down, and the smoke is left standing where it stands.'),
					_('it is still visible most of the next day. it does not change at all.')
				],
				buttons: {
					'end': {
						text: _('walk on'),
						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.EVENT_GUILT
	},
	
    { /* The Fall */
		title: _('The Fall'),
		isAvailable: function() {
			return Engine.activeModule == World && World.getDistance() > 20 && World.getDistance() <= 29;
		},
		scenes: {
			'start': {
				text: [
					_('the crust over the old workings gives way without any warning and the drop is further than it should be.'),
					_('the walls are dressed stone below the first few feet. this was a shaft once, and somebody cut it properly.'),
					_('getting out is going to cost something. the only question is what.')
				],
				notification: _('the ground gives way into an old shaft'),
				onLoad: function() {
					World.setHp(Math.max(1, World.health - 5));
				},
				buttons: {
					/* Fast and safe, but the pack is the price. */
					'drop': {
						text: _('cut the pack loose and climb'),
						nextScene: { 1: 'dropped' }
					},
					/* Free, but genuinely uncertain. Three outcomes rather than
					 * a coin flip between "fine" and "fixed damage": a clean
					 * escape, a bad climb that still gets you out, and a fall
					 * that puts you back on the floor of the shaft with less
					 * gear and the same decision to make again. */
					'climb': {
						text: _('climb with everything'),
						nextScene: function() {
							/* Built rather than written as a literal: object
							 * literal keys can't be expressions, and these
							 * thresholds shift with karma. Clamped so the two
							 * bad outcomes never vanish entirely or crowd out
							 * the clean one. */
							var luck = Events.karmaLuck();
							var fell = Math.max(0.10, Math.min(0.45, 0.30 - luck));
							var hard = Math.max(fell + 0.15, Math.min(0.80, 0.65 - luck));
							var table = {};
							table[fell] = 'climbFell';
							table[hard] = 'climbHard';
							table[1] = 'climbClean';
							return table;
						}
					},
					'explore': {
						text: _('follow the shaft'),
						nextScene: { 1: 'shaft' }
					}
				}
			},
			'dropped': {
				text: [
					_('the pack goes, and without it the climb is twenty minutes of unpleasantness rather than a question.'),
					_('most of what was in it is scattered at the bottom of a hole nobody is going back down.')
				],
				notification: _('the pack is left at the bottom of the shaft'),
				onLoad: function() {
					/* Half of everything carried, rounded down -- the pack is
					 * cut loose, not emptied neatly. */
					for(var k in Path.outfit) {
						if(typeof Path.outfit[k] === 'number' && Path.outfit[k] > 0) {
							Path.outfit[k] = Math.floor(Path.outfit[k] / 2);
						}
					}
					World.updateSupplies();
				},
				buttons: {
					'end': {
						text: _('go on'),
						nextScene: 'end'
					}
				}
			},
			'climbClean': {
				text: function() {
					return [
						Events.pick([
							_('the holds are further apart than they look and it still goes first time.'),
							_('it is easier with the pack on than without. the weight keeps you against the wall.'),
							_('twenty minutes, no drama, and the pack never so much as shifts.')
						]),
						_('the dressed stone runs the whole height of the shaft. it is cut to a tolerance nothing in the village could manage.')
					];
				},
				notification: _('the climb goes clean'),
				buttons: {
					'end': {
						text: _('go on'),
						nextScene: 'end'
					}
				}
			},
			'climbHard': {
				text: function() {
					return [
						Events.pick([
							_('it goes badly about two thirds of the way up, and the recovery is worse than the slip.'),
							_('a hold gives out at head height and the catch is made with one arm and a lot of luck.'),
							_('the last stretch is done wrong, fast, with the pack swinging, and it very nearly does not work.'),
							_('if you fell here, would anyone find you? was the pack worth it? it nearly cost you dearly.'),
						]),
						_('the pack comes up. so does most of the skin off one arm.')
					];
				},
				notification: _('the climb goes badly'),
				onLoad: function() {
					World.setHp(Math.max(1, World.health - 10));
				},
				buttons: {
					'end': {
						text: _('go on'),
						nextScene: 'end'
					}
				}
			},
			/* The interesting failure: you do not get out, you get returned.
			 * Costs health and supplies, and puts the same three choices back
			 * in front of a player who is now in a worse position to make
			 * them. Cutting the pack loose is always still available, so this
			 * can't trap anybody -- it just gets more expensive to be proud. */
			'climbFell': {
				text: function() {
					var spoiled = Events.damageOutfit(0.25);
					var lines = [
						Events.pick([
							_('the fall is short and it is not survivable-looking on the way down.'),
							_('something gives, high up, and the shaft goes past very fast.'),
							_('the pack catches on the way down and turns the fall into a scrape the whole height of the wall.'),
							_('pride goeth before the fall. your pride is not the only thing that hurts.'),
						]),
						_('the floor of the shaft arrives. so does everything that was in the pack.')
					];
					if(spoiled.length > 0) {
						lines.push(_('what is ruined: {0}.', spoiled.join(', ')));
					}
					lines.push(_('the walls are still dressed stone. the shaft still runs off level. the choice is the same one it was.'));
					return lines;
				},
				notification: _('the climb fails, and the pack pays for it'),
				onLoad: function() {
					World.setHp(Math.max(1, World.health - 8));
				},
				buttons: {
					'again': {
						text: _('try the climb again'),
						nextScene: function() {
							/* Built rather than written as a literal: object
							 * literal keys can't be expressions, and these
							 * thresholds shift with karma. Clamped so the two
							 * bad outcomes never vanish entirely or crowd out
							 * the clean one. */
							var luck = Events.karmaLuck();
							var fell = Math.max(0.10, Math.min(0.45, 0.30 - luck));
							var hard = Math.max(fell + 0.15, Math.min(0.80, 0.65 - luck));
							var table = {};
							table[fell] = 'climbFell';
							table[hard] = 'climbHard';
							table[1] = 'climbClean';
							return table;
						}
					},
					'drop': {
						text: _('cut the pack loose and climb'),
						nextScene: { 1: 'dropped' }
					},
					'explore': {
						text: _('follow the shaft instead'),
						nextScene: { 1: 'shaft' }
					}
				}
			},
			'shaft': {
				text: [
					_('the shaft runs level for a long way and the dressed stone never stops.'),
					_('there are brackets set into the wall at regular intervals, at a height that is wrong for carrying a lamp.'),
					_('they are too high, evenly, all the way along. whoever cut this was taller than anybody who has walked it since.')
				],
				notification: _('the shaft was cut for somebody taller'),
				buttons: {
					'deeper': {
						text: _('keep going'),
						nextScene: function() {
							return Events.karmaOdds(0.45, 'shaftBad', 'shaftGood');
						}
					},
					'back': {
						text: _('go back and climb out'),
						nextScene: { 1: 'climbClean' }
					}
				}
			},
			'shaftGood': {
				text: [
					_('it opens into a chamber with a collapsed ceiling and daylight coming through the collapse.'),
					_('there is stock stacked against one wall, sealed, and the seals have held.'),
					_('the way out is straight up through the rubble and does not require hands.')
				],
				notification: _('the shaft opens into daylight'),
				loot: {
					'steel': { min: 4, max: 10, chance: 1 },
					'energy cell': { min: 2, max: 5, chance: 0.6 },
					'alien alloy': { min: 1, max: 1, chance: 0.25 }
				},
				buttons: {
					'end': {
						text: _('climb out through the collapse'),
						nextScene: 'end'
					}
				}
			},
			'shaftBad': {
				text: [
					_('it runs level for another hour and then it runs into fill, floor to ceiling, packed and deliberate.'),
					_('somebody sealed this from the other side.'),
					_('the walk back to the shaft takes what is left of the day, and then there is still a climb.')
				],
				notification: _('the shaft was sealed from the other side'),
				onLoad: function() {
					World.setHp(Math.max(1, World.health - 5));
					World.setWater(Math.max(0, World.water - 2));
				},
				buttons: {
					'end': {
						text: _('climb out'),
						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.EVENT_GUILT
	},

	/* ================================================================
	 * TIER 4  --  getDistance() > 29
	 * ================================================================ */

	{ /* The Kneeling Ones */
		title: _('The Kneeling Ones'),
		isAvailable: function() {
			return Engine.activeModule == World && World.getDistance() > 29;
		},
		scenes: {
			'start': {
				text: [
					_('there are figures out on the flat, kneeling, in rows.'),
					_('they are not dead and they are not statues. they are breathing, slowly, a long way apart.'),
					_('every one of them faces the same direction. none of them is facing the village.')
				],
				notification: _('rows of kneeling figures, all facing the same way'),
				buttons: {
					'follow': {
						text: _('sight along the way they face'),
						nextScene: { 1: 'sighted' }
					},
					'wake': {
						text: _('try to wake one'),
						nextScene: function() {
							return Events.karmaOdds(0.5, 'wokeBad', 'wokeGood');
						}
					},
					'leave': {
						text: _('leave them'),
						onChoose: function() { $SM.add('character.karma', 1); },
						nextScene: 'end'
					}
				}
			},
			'sighted': {
				text: [
					_('every one of them is lined up on the same point, and the point is a long way further out than this.'),
					_('some of them have been kneeling long enough that the ground has come up around their knees.'),
					_('they are all pointed at the same thing, and whatever it is, they got as close to it as they were willing to.')
				],
				notification: _('they are all facing the same distant point'),
				buttons: {
					'walk': {
						text: _('walk a little way along the sightline'),
						nextScene: { 1: 'sightline' }
					},
					'end': {
						text: _('go around them'),
						nextScene: 'end'
					}
				}
			},
			'sightline': {
				text: [
					_('a few hundred paces along it the kneeling stops, all at once, in a clean line.'),
					_('past that line there is nothing kneeling and nothing standing and nothing at all.'),
					_('whatever they are facing, none of them was willing to go past here, and all of them agreed on where here was.')
				],
				notification: _('the kneeling stops at a clean line'),
				buttons: {
					'end': {
						text: _('turn back'),
						nextScene: 'end'
					}
				}
			},
			'wokeGood': {
				text: function() {
					return [
						_('she comes back slowly, the way somebody surfaces rather than wakes.'),
						Events.pick([
							_('she says she is waiting to be told she can stop. she says the order has not been given.'),
							_('she says she is holding. she says holding is the whole of it and there is nothing after holding.'),
							_('she asks whether it is over. told that nobody knows what "it" is, she says that is the correct answer and seems satisfied by it.'),
							_('she says she was told to wait here and that the person who told her was extremely clear about it.'),
							_('she says if you knew what she knew, you would be kneeling and holding like her.'),
							_('she says if you wait long enough the Infinite Expanse cycle will restart.'),
							_('she says the Mysterious Wanderer can answer better than she can.'),
							_('she says it is mostly silence where voices and signals once were.'),
						]),
						_('asked who is meant to give it, she turns her head very slightly further out, and does not answer, and goes back under.')
					];
				},
				notification: _('one of them surfaces, briefly'),
				loot: {
					'cloth': { min: 3, max: 8, chance: 0.8 },
					'alien alloy': { min: 1, max: 1, chance: 0.2 }
				},
				buttons: {
					'end': {
						text: _('leave her to it'),
						nextScene: 'end'
					}
				}
			},
			'wokeBad': {
				text: [
					_('he does not surface. shaking him does nothing and shouting does less.'),
					_('what he does do is take hold of a wrist, without opening his eyes, and hold on for a long time.'),
					_('getting free of him costs skin.')
				],
				notification: _('one of them takes hold and does not let go'),
				onLoad: function() {
					World.setHp(Math.max(1, World.health - 8));
				},
				buttons: {
					'end': {
						text: _('get clear'),
						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.EVENT_NIGHTMARE
	},

	{ /* The Last Camp */
		title: _('The Last Camp'),
		isAvailable: function() {
			return Engine.activeModule == World && World.getDistance() > 29;
		},
		scenes: {
			'start': {
				text: [
					_('a camp, laid out properly, with a windbreak and a latrine trench and a fire ring used a great many times.'),
					_('it was not abandoned. it was finished with. everything is stacked, and covered, and squared away.'),
					_('whoever kept it got this far out, made it permanent, and then at some point stopped keeping it.')
				],
				notification: _('a camp that was finished with rather than abandoned'),
				buttons: {
					'search': {
						text: _('search it'),
						nextScene: { 1: 'searched' }
					},
					'burn': {
						text: _('burn it'),
						onChoose: function() { $SM.add('character.karma', -2); },
						nextScene: { 1: 'burned' }
					},
					'leave': {
						text: _('leave it as it is'),
						onChoose: function() { $SM.add('character.karma', 2); },
						nextScene: 'end'
					}
				}
			},
			'searched': {
				text: [
					_('the stores are sealed and still good, which they should not be.'),
					_('there is a log, kept daily in a small hand, and it runs for eleven years.'),
					_('the last eleven pages are the same line, written out again each morning: still here. and then it stops mid-page, in the middle of the same line.')
				],
				notification: _('a log kept daily for eleven years'),
				loot: {
					'cured meat': { min: 10, max: 25, chance: 1 },
					'steel': { min: 2, max: 6, chance: 0.6 },
					'energy cell': { min: 1, max: 4, chance: 0.4 }
				},
				buttons: {
					'read': {
						text: _('read further back'),
						nextScene: { 1: 'readBack' }
					},
					'end': {
						text: _('move on'),
						nextScene: 'end'
					}
				}
			},
			'readBack': {
				text: [
					_('the early pages are a plan. distances, rations, bearings, a departure date.'),
					_('the middle pages are the same plan, revised, with a later departure date. then again. then again.'),
					_('the dates stop being dates about four years in and become a number that only goes up.')
				],
				notification: _('the log is a departure that kept being revised'),
				buttons: {
					'end': {
						text: _('put it back'),
						nextScene: 'end'
					}
				}
			},
			'burned': {
				text: [
					_('it goes up easily. everything out here is dry.'),
					_('the fire ring was used so many times the stones have gone to glass in places.'),
					_('there is nothing to mark the spot afterwards, which was the idea.')
				],
				notification: _('the camp is burned'),
				loot: {
					'steel': { min: 1, max: 4, chance: 0.6 }
				},
				buttons: {
					'end': {
						text: _('walk on'),
						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.EVENT_GUILT
	},
	
	{ /* The Stopped Storm */
		title: _('The Stopped Storm'),
		isAvailable: function() {
			return Engine.activeModule == World && World.getDistance() > 29;
		},
		scenes: {
			'start': {
				text: [
					_('there is a storm ahead, and it is not moving.'),
					_('it has the shape of a storm and the sound of one and it is standing exactly still, in a circle, with a clean edge to it.'),
					_('the ground under the edge is scoured to rock on one side and untouched on the other.')
				],
				notification: _('a storm stands still, with an edge to it'),
				buttons: {
					'through': {
						text: _('go through it'),
						cost: { 'water': 3 },
						available: function() {
							return World.water >= 3;
						},
						nextScene: function() {
							return Events.karmaOdds(0.5, 'throughBad', 'throughGood');
						}
					},
					'around': {
						text: _('go around the edge'),
						nextScene: { 1: 'around' }
					},
					'watch': {
						text: _('sit and watch it'),
						nextScene: { 1: 'watch' }
					}
				}
			},
			'throughGood': {
				text: [
					_('inside it there is no wind at all. the noise is entirely on the outside.'),
					_('in the middle there is a shape in the rock, machined, most of it still buried.'),
					_('whatever it is, it is what the storm is going around. the storm has been going around it for a very long time.')
				],
				notification: _('the storm is turning around something'),
				loot: {
					'alien alloy': { min: 1, max: 1, chance: 0.5 },
					'steel': { min: 3, max: 8, chance: 0.8 }
				},
				buttons: {
					'end': {
						text: _('come out the far side'),
						nextScene: 'end'
					}
				}
			},
			'throughBad': {
				text: [
					_('the edge takes the skin off everything it can reach and the water goes almost immediately.'),
					_('there is no middle reached. there is a turning back, and a long crawl, and coming out on the same side that was entered.')
				],
				notification: _('the storm is not crossed'),
				onLoad: function() {
					World.setHp(Math.max(1, World.health - 12));
					World.setWater(Math.max(0, World.water - 3));
				},
				buttons: {
					'end': {
						text: _('go around instead'),
						nextScene: 'end'
					}
				}
			},
			'around': {
				text: [
					_('the detour costs half a day and the edge stays exactly where it is the entire time.'),
					_('walking it, the circle is perfect. it does not wander by a single pace over that distance.'),
					_('nothing weather does is perfect.')
				],
				notification: _('the circle is exact'),
				buttons: {
					'end': {
						text: _('go on'),
						nextScene: 'end'
					}
				}
			},
			'watch': {
				text: [
					_('an hour of watching, and it does not move, and it does not weaken, and it does not vary.'),
					_('there is a rhythm in it, underneath the noise, too slow to be weather and too regular to be anything else out here.'),
					_('after a while it becomes obvious that it is not a storm that has stopped. it is a storm that has been left running.')
				],
				notification: _('it is not a storm that stopped. it is one left running'),
				buttons: {
					'listen': {
						text: _('listen to the rhythm'),
						nextScene: { 1: 'rhythm' }
					},
					'end': {
						text: _('go around it'),
						nextScene: { 1: 'around' }
					}
				}
			},
			'rhythm': {
				text: [
					_('counted against a pulse, it comes round every forty seconds, and it has not drifted once.'),
					_('it is a cycle. something is running a cycle out here, and has been, with nobody to run it for.'),
					_('the same thought arrives that arrives at the wreck, and at the vent, and under the village: none of this was built by anybody who is still here.')
				],
				notification: _('the storm runs on a forty second cycle'),
				buttons: {
					'end': {
						text: _('go around it'),
						nextScene: { 1: 'around' }
					}
				}
			}
		},
		audio: AudioLibrary.EVENT_SKY
	}
];
