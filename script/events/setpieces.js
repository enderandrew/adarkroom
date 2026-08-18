/**
 * Events that only occur at specific times. Launched manually.
 **/
Events.Setpieces = {
	"outpost": { /* Friendly Outpost */
		title: _('An Outpost'),
		scenes: {
			'start': {
				text: [
					_('a safe place in the wilds.')
				],
				notification: _('a safe place in the wilds.'),
				loot: {
					'cured meat': {
						min: 5,
						max: 10,
						chance: 1
					}
				},
				onLoad: function() {
					World.useOutpost();
				},
				buttons: {
					'leave': {
						text: _('leave'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.LANDMARK_FRIENDLY_OUTPOST
	},
	"swamp": { /* Swamp */
		title: _('A Murky Swamp'),
		scenes: {
			'start': {
				text: [
					_('rotting reeds rise out of the swampy earth.'),
					_('a lone frog sits in the muck, silently.')
				],
				notification: _('a swamp festers in the stagnant air.'),
				buttons: {
					'enter': {
						text: _('enter'),
						nextScene: {1: 'cabin'}
					},
					'leave': {
						text: _('leave'),
						nextScene: 'end'
					}
				}
			},
			'cabin': {
				text: [
					_('deep in the swamp is a moss-covered cabin.'),
					_('the lone wanderer sits inside, in a seeming trance.')
				],
				buttons: {
					'talk': {
						cost: {'charm': 1},
						text: function() {
							return Swamp.talks() > 0 ? _('talk again') : _('talk');
						},
						nextScene: {1: 'talk'}
					},
					'leave': {
						text: _('leave'),
						nextScene: 'end'
					}
				}
			},
			/* One charm buys one more piece of the story -- see script/swamp.js
			 * for the full conversation and why it is metered. The scene text
			 * is resolved per visit rather than fixed. */
			'talk': {
				text: function() {
					return Swamp.currentText();
				},
				notification: _('the wanderer takes the charm'),
				onLoad: function() {
					Swamp.grantFirstTalk();
					/* Deliberately NOT markVisited: he is a conversation, not
					 * a site to be looted once. Marking the tile would append
					 * '!' and stop doSpace() ever routing here again, which is
					 * exactly the bug the Temple had. */
				},
				buttons: {
					'more': {
						/* Worded so the player can tell whether another charm
						 * will buy anything new. */
						text: function() {
							return Swamp.hasMore() ? _('offer another charm') : _('offer another charm anyway');
						},
						cost: { 'charm': 1 },
						available: function() {
							return (Path.outfit['charm'] ?? 0) >= 1;
						},
						nextScene: { 1: 'talk' }
					},
					'leave': {
						text: _('leave'),
						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.LANDMARK_SWAMP
	},
	"ruins": { /* Underground Ruins -- Infinite Expanse */
		title: _('Underground Ruins'),
		/* Deliberately larger than the town or the city: 8 combat scenes
		 * across four descending depths, then a glyph lock. Every enemy is an
		 * energy construct, so the whole location drops energy cells and laser
		 * weaponry rather than the meat and iron the surface encounters give.
		 *
		 * Route structure: start -> one of two approaches -> a branching
		 * descent -> the lock chamber. Leaving is available from every scene
		 * except mid-combat, and the lock itself can always be walked away
		 * from, so nothing here can strand a player who is out of supplies. */
		scenes: {
			'start': {
				text: [
					_('the ground opens into a stairwell that goes down further than the light does.'),
					_('the walls are a single piece. no joins, no courses, no tool marks, and no wear where ten thousand years of feet should have worn them.'),
					_('there are lights on down there. something is still supplying them.')
				],
				notification: _('a stairwell descends into ruins that are still powered'),
				buttons: {
					'descend': {
						text: _('descend'),
						cost: { 'torch': 1 },
						nextScene: { 0.25: 'a1', 0.5: 'a2', 0.75: 'a3', 1: 'a4' }
					},
					'leave': {
						text: _('leave'),
						nextScene: 'end'
					}
				}
			},

			'a1': {
				text: [
					_("the stair ends in a hall with a ceiling too high to see."),
					_("the floor is warm. not sun-warm. warm from underneath, evenly, everywhere.")
				],
				buttons: {
					'continue': {
						text: _('go on'),
						nextScene: { 0.34: 'b1', 0.67: 'b2', 1: 'b3' }
					},
					'leave': {
						text: _('climb out'),
						nextScene: 'end'
					}
				}
			},
			'a2': {
				text: [
					_("a corridor runs off at an angle that does not match the stair."),
					_("every surface is the same material, and it is neither cold nor metal nor stone, and a blade will not mark it.")
				],
				buttons: {
					'continue': {
						text: _('follow it'),
						nextScene: { 0.34: 'b2', 0.67: 'b3', 1: 'b4' }
					},
					'leave': {
						text: _('climb out'),
						nextScene: 'end'
					}
				}
			},
			'a3': {
				text: [
					_("the stairwell opens onto a landing with three doorways, all of them lit."),
					_("the light has no source. it is simply brighter in here than it was out there.")
				],
				buttons: {
					'continue': {
						text: _('go on'),
						nextScene: { 0.34: 'b4', 0.67: 'b5', 1: 'b6' }
					},
					'leave': {
						text: _('climb out'),
						nextScene: 'end'
					}
				}
			},
			'a4': {
				text: [
					_("the steps stop being steps and become a ramp, worn in a single track down the middle."),
					_("something has gone up and down this a very great many times.")
				],
				buttons: {
					'continue': {
						text: _('follow the track'),
						nextScene: { 0.34: 'b6', 0.67: 'b7', 1: 'b8' }
					},
					'leave': {
						text: _('climb out'),
						nextScene: 'end'
					}
				}
			},
			'b1': {
				combat: true,
				notification: _("light gathers in the middle of the hall and stands up."),
				enemy: 'lumen',
				enemyName: _('lumen'),
				deathMessage: _("the light comes apart and does not reassemble."),
				chara: '\u2C00',
				damage: 5,
				hit: 0.8,
				attackDelay: 2,
				ranged: true,
				health: 30,
				loot: {
					'energy cell': { min: 2, max: 5, chance: 1 },
					'sulphur': { min: 1, max: 1, chance: 0.1 }
				},
				buttons: {
					'continue': {
						text: _('go on'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: { 0.5: 'c1', 1: 'c2' }
					},
					'leave': {
						text: _('climb out'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'b2': {
				combat: true,
				notification: _("a shape steps out of the wall it was part of a moment ago."),
				enemy: 'sentinel',
				enemyName: _('sentinel'),
				deathMessage: _("it folds back into the wall, and the wall does not close behind it."),
				chara: '\u2C01',
				damage: 7,
				hit: 0.85,
				attackDelay: 2,
				ranged: true,
				health: 42,
				loot: {
					'energy cell': { min: 3, max: 7, chance: 1 },
					'laser rifle': { min: 1, max: 1, chance: 0.1 }
				},
				buttons: {
					'continue': {
						text: _('go on'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: { 0.5: 'c2', 1: 'c3' }
					},
					'leave': {
						text: _('climb out'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'b3': {
				combat: true,
				notification: _("two of them come down the corridor abreast, in step."),
				enemy: 'paired lumen',
				enemyName: _('paired lumen'),
				deathMessage: _("both go out at the same instant."),
				chara: '\u2C02',
				damage: 6,
				hit: 0.9,
				attackDelay: 1.5,
				ranged: true,
				health: 38,
				specials: [
					{
						delay: 7,
						action: (fighter) => {
							Events.setStatus(fighter, 'energised');
							return _('charging');
						}
					}
				],
				loot: {
					'energy cell': { min: 3, max: 8, chance: 1 },
					'sulphur': { min: 1, max: 1, chance: 0.15 }
				},
				buttons: {
					'continue': {
						text: _('go on'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: { 0.5: 'c3', 1: 'c4' }
					},
					'leave': {
						text: _('climb out'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'b4': {
				text: [
					_("a bank of recesses runs the length of the wall, each one holding a slotted cell."),
					_("most are dead. a few still have something left in them.")
				],
				notification: _("a bank of cells, most of them dead"),
				loot: {
					'energy cell': { min: 4, max: 10, chance: 1 }
				},
				buttons: {
					'continue': {
						text: _('take what is live'),
						nextScene: { 0.5: 'c4', 1: 'c9' }
					},
					'leave': {
						text: _('climb out'),
						nextScene: 'end'
					}
				}
			},
			'b5': {
				combat: true,
				notification: _("the doorway ahead fills with something that was not standing there."),
				enemy: 'ward',
				enemyName: _('ward'),
				deathMessage: _("it thins out from the edges inward."),
				chara: '\u2C03',
				damage: 8,
				hit: 0.85,
				attackDelay: 1.8,
				ranged: true,
				health: 46,
				loot: {
					'energy cell': { min: 3, max: 8, chance: 1 },
					'sulphur': { min: 1, max: 1, chance: 0.12 }
				},
				buttons: {
					'continue': {
						text: _('go on'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: { 0.5: 'c5', 1: 'c6' }
					},
					'leave': {
						text: _('climb out'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'b6': {
				combat: true,
				notification: _("something small and very fast comes along the ceiling."),
				enemy: 'skitter',
				enemyName: _('skitter'),
				deathMessage: _("it drops, and stops."),
				chara: '\u2C04',
				damage: 5,
				hit: 0.95,
				attackDelay: 1,
				ranged: true,
				health: 28,
				specials: [
					{
						delay: 6,
						action: () => {
							const player = $('#wanderer');
							Events.setStatus(player, 'blinded');
							Events.updateFighterDiv(player);
							return _('flare');
						}
					}
				],
				loot: {
					'energy cell': { min: 2, max: 6, chance: 1 }
				},
				buttons: {
					'continue': {
						text: _('go on'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: { 0.5: 'c6', 1: 'c10' }
					},
					'leave': {
						text: _('climb out'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'b7': {
				text: [
					_("a room of columns, each one carrying a column of glyphs from floor to ceiling."),
					_("they are not carved. they are lit from inside the material, and they change while you watch, slowly.")
				],
				notification: _("the columns are writing something, very slowly"),
				buttons: {
					'continue': {
						text: _('go through'),
						nextScene: { 0.5: 'c7', 1: 'c11' }
					},
					'leave': {
						text: _('climb out'),
						nextScene: 'end'
					}
				}
			},
			'b8': {
				combat: true,
				notification: _("the ramp track ends at something that has been waiting at the bottom of it."),
				enemy: 'treader',
				enemyName: _('treader'),
				deathMessage: _("it settles onto the ramp and stops."),
				chara: '\u2C05',
				damage: 9,
				hit: 0.8,
				attackDelay: 2,
				ranged: true,
				health: 52,
				loot: {
					'energy cell': { min: 4, max: 9, chance: 1 },
					'laser rifle': { min: 1, max: 1, chance: 0.12 }
				},
				buttons: {
					'continue': {
						text: _('go on'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: { 0.5: 'c8', 1: 'c12' }
					},
					'leave': {
						text: _('climb out'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'c1': {
				text: [
					_("a gallery of alcoves, each holding a shape that is almost a person and is not."),
					_("they are not statues. they are not switched on either.")
				],
				buttons: {
					'continue': {
						text: _('go deeper'),
						nextScene: { 0.5: 'd1', 1: 'd2' }
					},
					'leave': {
						text: _('climb out'),
						nextScene: 'end'
					}
				}
			},
			'c2': {
				combat: true,
				notification: _("the alcove ahead is empty, and something is already behind you."),
				enemy: 'warden construct',
				enemyName: _('warden construct'),
				deathMessage: _("it discorporates without any sound at all."),
				chara: '\u2C00',
				damage: 9,
				hit: 0.85,
				attackDelay: 1.5,
				ranged: true,
				health: 55,
				specials: [
					{
						delay: 8,
						action: (fighter) => {
							Events.setStatus(fighter, 'shield');
							return _('shielded');
						}
					}
				],
				loot: {
					'energy cell': { min: 4, max: 9, chance: 1 },
					'laser rifle': { min: 1, max: 1, chance: 0.15 },
					'sulphur': { min: 1, max: 1, chance: 0.15 }
				},
				buttons: {
					'continue': {
						text: _('go on'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: { 0.5: 'd2', 1: 'd3' }
					},
					'leave': {
						text: _('climb out'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'c3': {
				combat: true,
				notification: _("the corridor lights ahead of you, one section at a time, coming closer."),
				enemy: 'coil',
				enemyName: _('coil'),
				deathMessage: _("the light in the corridor goes out behind it, section by section."),
				chara: '\u2C01',
				damage: 8,
				hit: 0.9,
				attackDelay: 1.2,
				ranged: true,
				health: 48,
				specials: [
					{
						delay: 6,
						action: () => {
							const player = $('#wanderer');
							Events.setStatus(player, 'blinded');
							Events.updateFighterDiv(player);
							return _('overload');
						}
					}
				],
				loot: {
					'energy cell': { min: 5, max: 10, chance: 1 },
					'sulphur': { min: 1, max: 1, chance: 0.15 }
				},
				buttons: {
					'continue': {
						text: _('go on'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: { 0.5: 'd3', 1: 'd4' }
					},
					'leave': {
						text: _('climb out'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'c4': {
				text: [
					_("a shaft drops away with no stair and no rail, and the far side is lit."),
					_("there are handholds cut into the wall. they are cut for a hand with more fingers than yours.")
				],
				buttons: {
					'continue': {
						text: _('climb down'),
						nextScene: { 0.5: 'd4', 1: 'd5' }
					},
					'leave': {
						text: _('climb out'),
						nextScene: 'end'
					}
				}
			},
			'c5': {
				combat: true,
				notification: _("the floor ahead is not flat, and then it is not floor."),
				enemy: 'crawler',
				enemyName: _('crawler'),
				deathMessage: _("it flattens back out and stays flat."),
				chara: '\u2C02',
				damage: 10,
				hit: 0.82,
				attackDelay: 1.6,
				health: 58,
				loot: {
					'energy cell': { min: 5, max: 10, chance: 1 },
					'sulphur': { min: 1, max: 1, chance: 0.15 }
				},
				buttons: {
					'continue': {
						text: _('go on'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: { 0.5: 'd5', 1: 'd6' }
					},
					'leave': {
						text: _('climb out'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'c6': {
				combat: true,
				notification: _("three lights come round the corner at head height, evenly spaced."),
				enemy: 'chorus',
				enemyName: _('chorus'),
				deathMessage: _("the three go out in sequence, left to right."),
				chara: '\u2C03',
				damage: 9,
				hit: 0.9,
				attackDelay: 1.3,
				ranged: true,
				health: 50,
				specials: [
					{
						delay: 7,
						action: (fighter) => {
							Events.setStatus(fighter, 'energised');
							return _('resonating');
						}
					}
				],
				loot: {
					'energy cell': { min: 5, max: 11, chance: 1 },
					'laser rifle': { min: 1, max: 1, chance: 0.15 }
				},
				buttons: {
					'continue': {
						text: _('go on'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: { 0.5: 'd6', 1: 'd7' }
					},
					'leave': {
						text: _('climb out'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'c7': {
				text: [
					_("a long room, entirely empty, with a single chair at the far end facing away."),
					_("the chair is the only thing down here built for sitting in.")
				],
				notification: _("one chair, facing away"),
				buttons: {
					'continue': {
						text: _('cross the room'),
						nextScene: { 0.5: 'd7', 1: 'd8' }
					},
					'leave': {
						text: _('climb out'),
						nextScene: 'end'
					}
				}
			},
			'c8': {
				combat: true,
				notification: _("something detaches from the ceiling of the column room."),
				enemy: 'scribe',
				enemyName: _('scribe'),
				deathMessage: _("the glyphs on the nearest column stop changing."),
				chara: '\u2C04',
				damage: 10,
				hit: 0.88,
				attackDelay: 1.4,
				ranged: true,
				health: 54,
				specials: [
					{
						delay: 8,
						action: (fighter) => {
							Events.setStatus(fighter, 'regenerating');
							return _('rewriting');
						}
					}
				],
				loot: {
					'energy cell': { min: 5, max: 11, chance: 1 },
					'sulphur': { min: 1, max: 2, chance: 0.18 }
				},
				buttons: {
					'continue': {
						text: _('go on'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: { 0.5: 'd8', 1: 'd9' }
					},
					'leave': {
						text: _('climb out'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'c9': {
				text: [
					_("a junction where four corridors meet, and all four are the same corridor."),
					_("walking back the way you came puts you at the junction again from a different direction.")
				],
				notification: _("the junction does not resolve"),
				buttons: {
					'continue': {
						text: _('pick one and commit'),
						nextScene: { 0.5: 'd9', 1: 'd10' }
					},
					'leave': {
						text: _('climb out'),
						nextScene: 'end'
					}
				}
			},
			'c10': {
				combat: true,
				notification: _("the walls on both sides come alive at once."),
				enemy: 'flanking pair',
				enemyName: _('flanking pair'),
				deathMessage: _("both walls go inert together."),
				chara: '\u2C05',
				damage: 11,
				hit: 0.86,
				attackDelay: 1.4,
				ranged: true,
				health: 60,
				specials: [
					{
						delay: 7,
						action: (fighter) => {
							Events.setStatus(fighter, 'shield');
							return _('warded');
						}
					}
				],
				loot: {
					'energy cell': { min: 6, max: 12, chance: 1 },
					'laser rifle': { min: 1, max: 1, chance: 0.18 }
				},
				buttons: {
					'continue': {
						text: _('go on'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: { 0.5: 'd10', 1: 'd1' }
					},
					'leave': {
						text: _('climb out'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'c11': {
				text: [
					_("a reservoir of something that is not water, lit from below, perfectly still."),
					_("a dropped stone does not make a sound and does not come back up.")
				],
				buttons: {
					'continue': {
						text: _('go around it'),
						nextScene: { 0.5: 'd2', 1: 'd5' }
					},
					'leave': {
						text: _('climb out'),
						nextScene: 'end'
					}
				}
			},
			'c12': {
				combat: true,
				notification: _("it comes up out of the reservoir without disturbing the surface."),
				enemy: 'drowned lumen',
				enemyName: _('drowned lumen'),
				deathMessage: _("it sinks back and the surface stays flat."),
				chara: '\u2C00',
				damage: 11,
				hit: 0.84,
				attackDelay: 1.5,
				ranged: true,
				health: 62,
				loot: {
					'energy cell': { min: 6, max: 12, chance: 1 },
					'sulphur': { min: 1, max: 2, chance: 0.2 }
				},
				buttons: {
					'continue': {
						text: _('go on'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: { 0.5: 'd6', 1: 'd9' }
					},
					'leave': {
						text: _('climb out'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'd1': {
				combat: true,
				notification: _("something very old finishes powering up."),
				enemy: 'archon',
				enemyName: _('archon'),
				deathMessage: _("it stops. the room stays lit."),
				chara: '\u2C01',
				damage: 12,
				hit: 0.85,
				attackDelay: 1.5,
				ranged: true,
				health: 75,
				specials: [
					{
						delay: 7,
						action: (fighter) => {
							Events.setStatus(fighter, 'regenerating');
							return _('drawing power');
						}
					},
					{
						delay: 11,
						action: (fighter) => {
							Events.setStatus(fighter, 'brittle');
							return _('venting');
						}
					}
				],
				loot: {
					'energy cell': { min: 8, max: 15, chance: 1 },
					'laser rifle': { min: 1, max: 1, chance: 0.25 },
					'sulphur': { min: 1, max: 2, chance: 0.3 }
				},
				buttons: {
					'continue': {
						text: _('go on'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: { 0.5: 'e1', 1: 'e2' }
					},
					'leave': {
						text: _('climb out'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'd2': {
				combat: true,
				notification: _("three of them rise out of the floor together."),
				enemy: 'triad',
				enemyName: _('triad'),
				deathMessage: _("the third one goes out a long moment after the other two."),
				chara: '\u2C02',
				damage: 10,
				hit: 0.9,
				attackDelay: 1.2,
				ranged: true,
				health: 68,
				specials: [
					{
						delay: 6,
						action: (fighter) => {
							Events.setStatus(fighter, 'energised');
							return _('resonating');
						}
					}
				],
				loot: {
					'energy cell': { min: 8, max: 14, chance: 1 },
					'laser rifle': { min: 1, max: 1, chance: 0.2 },
					'sulphur': { min: 1, max: 1, chance: 0.25 }
				},
				buttons: {
					'continue': {
						text: _('go on'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: { 0.5: 'e2', 1: 'e3' }
					},
					'leave': {
						text: _('climb out'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'd3': {
				combat: true,
				notification: _("the shape in the last alcove opens its eyes, which it does not have."),
				enemy: 'keeper',
				enemyName: _('keeper'),
				deathMessage: _("it sits back down in the alcove before it goes out."),
				chara: '\u2C03',
				damage: 11,
				hit: 0.88,
				attackDelay: 1.4,
				ranged: true,
				health: 72,
				specials: [
					{
						delay: 8,
						action: (fighter) => {
							Events.setStatus(fighter, 'shield');
							return _('warded');
						}
					}
				],
				loot: {
					'energy cell': { min: 8, max: 14, chance: 1 },
					'sulphur': { min: 1, max: 2, chance: 0.25 }
				},
				buttons: {
					'continue': {
						text: _('go on'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: { 0.5: 'e3', 1: 'e4' }
					},
					'leave': {
						text: _('climb out'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'd4': {
				combat: true,
				notification: _("it was the floor a moment ago."),
				enemy: 'substrate',
				enemyName: _('substrate'),
				deathMessage: _("it goes back to being the floor."),
				chara: '\u2C04',
				damage: 13,
				hit: 0.8,
				attackDelay: 1.6,
				health: 80,
				specials: [
					{
						delay: 9,
						action: (fighter) => {
							Events.setStatus(fighter, 'regenerating');
							return _('reknitting');
						}
					}
				],
				loot: {
					'energy cell': { min: 9, max: 16, chance: 1 },
					'laser rifle': { min: 1, max: 1, chance: 0.2 },
					'sulphur': { min: 1, max: 2, chance: 0.3 }
				},
				buttons: {
					'continue': {
						text: _('go on'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: { 0.34: 'e4', 0.67: 'e6', 1: 'e8' }
					},
					'leave': {
						text: _('climb out'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'd5': {
				text: [
					_("a hall of racks, most of them empty, all of them the right shape to hold something that is gone."),
					_("a few of the racks are not empty.")
				],
				notification: _("most of the racks are empty"),
				loot: {
					'energy cell': { min: 6, max: 14, chance: 1 },
					'sulphur': { min: 1, max: 1, chance: 0.25 }
				},
				buttons: {
					'continue': {
						text: _('take what is left'),
						nextScene: { 0.5: 'e5', 1: 'e9' }
					},
					'leave': {
						text: _('climb out'),
						nextScene: 'end'
					}
				}
			},
			'd6': {
				combat: true,
				notification: _("the rack at the end of the hall stands up."),
				enemy: 'armature',
				enemyName: _('armature'),
				deathMessage: _("it comes apart into rack-shaped pieces."),
				chara: '\u2C05',
				damage: 12,
				hit: 0.87,
				attackDelay: 1.5,
				ranged: true,
				health: 76,
				specials: [
					{
						delay: 8,
						action: (fighter) => {
							Events.setStatus(fighter, 'brittle');
							return _('unlatching');
						}
					}
				],
				loot: {
					'energy cell': { min: 8, max: 15, chance: 1 },
					'laser rifle': { min: 1, max: 1, chance: 0.22 }
				},
				buttons: {
					'continue': {
						text: _('go on'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: { 0.5: 'e10', 1: 'e11' }
					},
					'leave': {
						text: _('climb out'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'd7': {
				text: [
					_("the chair, seen from the front, is occupied."),
					_("what is in it has not moved in a very long time and is still drawing power."),
					_("it does not react to anything.")
				],
				notification: _("the chair is occupied"),
				buttons: {
					'continue': {
						text: _('go past it'),
						nextScene: { 0.5: 'e7', 1: 'e12' }
					},
					'leave': {
						text: _('climb out'),
						nextScene: 'end'
					}
				}
			},
			'd8': {
				combat: true,
				notification: _("the thing in the chair stands up after you have gone past it."),
				enemy: 'seated one',
				enemyName: _('seated one'),
				deathMessage: _("it goes back to the chair, and sits, and stops."),
				chara: '\u2C00',
				damage: 14,
				hit: 0.9,
				attackDelay: 1.3,
				ranged: true,
				health: 85,
				specials: [
					{
						delay: 6,
						action: (fighter) => {
							Events.setStatus(fighter, 'energised');
							return _('rising');
						}
					},
					{
						delay: 10,
						action: (fighter) => {
							Events.setStatus(fighter, 'regenerating');
							return _('sustained');
						}
					}
				],
				loot: {
					'energy cell': { min: 10, max: 18, chance: 1 },
					'sulphur': { min: 2, max: 3, chance: 0.3 },
					'laser rifle': { min: 1, max: 1, chance: 0.25 }
				},
				buttons: {
					'continue': {
						text: _('go on'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: { 0.5: 'e13', 1: 'e14' }
					},
					'leave': {
						text: _('climb out'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'd9': {
				combat: true,
				notification: _("the junction resolves, all at once, into one corridor with something in it."),
				enemy: 'convergence',
				enemyName: _('convergence'),
				deathMessage: _("the four corridors become four corridors again."),
				chara: '\u2C01',
				damage: 13,
				hit: 0.86,
				attackDelay: 1.4,
				ranged: true,
				health: 78,
				specials: [
					{
						delay: 7,
						action: () => {
							const player = $('#wanderer');
							Events.setStatus(player, 'blinded');
							Events.updateFighterDiv(player);
							return _('folding');
						}
					}
				],
				loot: {
					'energy cell': { min: 9, max: 16, chance: 1 },
					'sulphur': { min: 1, max: 2, chance: 0.28 }
				},
				buttons: {
					'continue': {
						text: _('go on'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: { 0.5: 'e2', 1: 'e5' }
					},
					'leave': {
						text: _('climb out'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'd10': {
				text: [
					_("a door standing open in a wall with nothing on the other side of it."),
					_("going through the doorway puts you further down than walking around it does.")
				],
				notification: _("the doorway goes further than the room"),
				buttons: {
					'continue': {
						text: _('go through the doorway'),
						nextScene: { 0.5: 'e3', 1: 'e7' }
					},
					'leave': {
						text: _('climb out'),
						nextScene: 'end'
					}
				}
			},
			'e1': {
				text: [
					_("the corridor widens into something that was meant to hold a crowd."),
					_("the floor is worn in lines, from the doorways to a low platform at the centre.")
				],
				notification: _("a room built to hold a crowd"),
				buttons: {
					'continue': {
						text: _('approach the platform'),
						nextScene: { 1: 'lock' }
					},
					'leave': {
						text: _('climb out'),
						nextScene: 'end'
					}
				}
			},
			'e2': {
				combat: true,
				notification: _("the platform is not unattended."),
				enemy: 'celebrant',
				enemyName: _('celebrant'),
				deathMessage: _("it steps down off the platform before it goes out."),
				chara: '\u2C02',
				damage: 15,
				hit: 0.88,
				attackDelay: 1.3,
				ranged: true,
				health: 90,
				specials: [
					{
						delay: 6,
						action: (fighter) => {
							Events.setStatus(fighter, 'shield');
							return _('warded');
						}
					},
					{
						delay: 11,
						action: (fighter) => {
							Events.setStatus(fighter, 'energised');
							return _('ascendant');
						}
					}
				],
				loot: {
					'energy cell': { min: 10, max: 18, chance: 1 },
					'sulphur': { min: 2, max: 3, chance: 0.3 }
				},
				buttons: {
					'continue': {
						text: _('go on'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: { 1: 'lock' }
					},
					'leave': {
						text: _('climb out'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'e3': {
				combat: true,
				notification: _("the walls of the deep hall are lined with them, and one of them notices."),
				enemy: 'attendant',
				enemyName: _('attendant'),
				deathMessage: _("it returns to the wall line and the line closes up."),
				chara: '\u2C03',
				damage: 14,
				hit: 0.9,
				attackDelay: 1.2,
				ranged: true,
				health: 88,
				specials: [
					{
						delay: 7,
						action: (fighter) => {
							Events.setStatus(fighter, 'regenerating');
							return _('drawing');
						}
					}
				],
				loot: {
					'energy cell': { min: 10, max: 18, chance: 1 },
					'laser rifle': { min: 1, max: 1, chance: 0.3 }
				},
				buttons: {
					'continue': {
						text: _('go on'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: { 1: 'lock' }
					},
					'leave': {
						text: _('climb out'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'e4': {
				text: [
					_("a stair down, and at the bottom of it the air is dry enough to hurt."),
					_("nothing has been in here. not dust, not damp, not anything, for a length of time the mind refuses.")
				],
				notification: _("nothing has been in here at all"),
				buttons: {
					'continue': {
						text: _('go to the door'),
						nextScene: { 1: 'lock' }
					},
					'leave': {
						text: _('climb out'),
						nextScene: 'end'
					}
				}
			},
			'e5': {
				combat: true,
				notification: _("something the size of the corridor comes down the corridor."),
				enemy: 'bulwark',
				enemyName: _('bulwark'),
				deathMessage: _("it fills the corridor and then it does not."),
				chara: '\u2C04',
				damage: 16,
				hit: 0.82,
				attackDelay: 1.8,
				health: 100,
				specials: [
					{
						delay: 8,
						action: (fighter) => {
							Events.setStatus(fighter, 'brittle');
							return _('plates parting');
						}
					},
					{
						delay: 12,
						action: (fighter) => {
							Events.setStatus(fighter, 'regenerating');
							return _('sealing');
						}
					}
				],
				loot: {
					'energy cell': { min: 12, max: 20, chance: 1 },
					'sulphur': { min: 2, max: 4, chance: 0.35 },
					'laser rifle': { min: 1, max: 1, chance: 0.3 }
				},
				buttons: {
					'continue': {
						text: _('go on'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: { 1: 'lock' }
					},
					'leave': {
						text: _('climb out'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'e6': {
				combat: true,
				notification: _("the last of the racks is guarded by the thing it was built to hold."),
				enemy: 'panoply',
				enemyName: _('panoply'),
				deathMessage: _("it returns to its rack and powers down into it."),
				chara: '\u2C05',
				damage: 15,
				hit: 0.9,
				attackDelay: 1.2,
				ranged: true,
				health: 95,
				specials: [
					{
						delay: 7,
						action: (fighter) => {
							Events.setStatus(fighter, 'shield');
							return _('sealed');
						}
					},
					{
						delay: 12,
						action: (fighter) => {
							Events.setStatus(fighter, 'energised');
							return _('discharging');
						}
					}
				],
				loot: {
					'energy cell': { min: 11, max: 19, chance: 1 },
					'sulphur': { min: 2, max: 3, chance: 0.32 }
				},
				buttons: {
					'continue': {
						text: _('go on'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: { 1: 'lock' }
					},
					'leave': {
						text: _('climb out'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'e7': {
				text: [
					_("the last stretch is unlit, and it is the only unlit thing down here."),
					_("whatever supplies the rest of it does not reach this far, or was told not to.")
				],
				notification: _("the last stretch is not lit"),
				buttons: {
					'continue': {
						text: _('go on in the dark'),
						nextScene: { 1: 'lock' }
					},
					'leave': {
						text: _('climb out'),
						nextScene: 'end'
					}
				}
			},
			'e8': {
				combat: true,
				notification: _("the dark is occupied and has been for a very long time."),
				enemy: 'unlit one',
				enemyName: _('unlit one'),
				deathMessage: _("it does not go out, because it was never lit. it simply stops."),
				chara: '\u2C00',
				damage: 17,
				hit: 0.85,
				attackDelay: 1.4,
				ranged: true,
				health: 105,
				specials: [
					{
						delay: 6,
						action: () => {
							const player = $('#wanderer');
							Events.setStatus(player, 'blinded');
							Events.updateFighterDiv(player);
							return _('unmaking');
						}
					},
					{
						delay: 11,
						action: (fighter) => {
							Events.setStatus(fighter, 'regenerating');
							return _('persisting');
						}
					}
				],
				loot: {
					'energy cell': { min: 12, max: 20, chance: 1 },
					'sulphur': { min: 2, max: 4, chance: 0.35 },
					'handheld nuke': { min: 1, max: 1, chance: 0.05 }
				},
				buttons: {
					'continue': {
						text: _('go on'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: { 1: 'lock' }
					},
					'leave': {
						text: _('climb out'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'e9': {
				combat: true,
				notification: _("the crowd room has one occupant and it has been facing the platform the whole time."),
				enemy: 'congregant',
				enemyName: _('congregant'),
				deathMessage: _("it faces the platform until it stops."),
				chara: '\u2C01',
				damage: 15,
				hit: 0.9,
				attackDelay: 1.25,
				ranged: true,
				health: 92,
				specials: [
					{
						delay: 7,
						action: (fighter) => {
							Events.setStatus(fighter, 'shield');
							return _('attending');
						}
					}
				],
				loot: {
					'energy cell': { min: 11, max: 19, chance: 1 },
					'sulphur': { min: 2, max: 3, chance: 0.3 }
				},
				buttons: {
					'continue': {
						text: _('go on'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: { 1: 'lock' }
					},
					'leave': {
						text: _('climb out'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'e10': {
				text: [
					_("a room of shallow basins set into the floor, each one holding a residue that has dried to powder."),
					_("the powder is the same colour as the walls, and the walls are missing exactly that much material.")
				],
				notification: _("the walls are missing exactly as much as the basins hold"),
				loot: {
					'sulphur': { min: 1, max: 2, chance: 0.3 },
					'energy cell': { min: 6, max: 12, chance: 0.8 }
				},
				buttons: {
					'continue': {
						text: _('go to the door'),
						nextScene: { 1: 'lock' }
					},
					'leave': {
						text: _('climb out'),
						nextScene: 'end'
					}
				}
			},
			'e11': {
				combat: true,
				notification: _("the residue in the nearest basin stands up out of it."),
				enemy: 'residue',
				enemyName: _('residue'),
				deathMessage: _("it settles back into the basin and dries."),
				chara: '\u2C02',
				damage: 16,
				hit: 0.86,
				attackDelay: 1.4,
				ranged: true,
				health: 98,
				specials: [
					{
						delay: 8,
						action: (fighter) => {
							Events.setStatus(fighter, 'regenerating');
							return _('drawing from the basin');
						}
					}
				],
				loot: {
					'energy cell': { min: 12, max: 20, chance: 1 },
					'sulphur': { min: 2, max: 4, chance: 0.32 }
				},
				buttons: {
					'continue': {
						text: _('go on'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: { 1: 'lock' }
					},
					'leave': {
						text: _('climb out'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'e12': {
				text: [
					_("the last door is visible from here, at the end of a hall built to make it look further away than it is."),
					_("the hall does not have that effect on the way back. it was built to be walked in one direction.")
				],
				notification: _("the hall was built to be walked one way"),
				buttons: {
					'continue': {
						text: _('walk the hall'),
						nextScene: { 1: 'lock' }
					},
					'leave': {
						text: _('climb out'),
						nextScene: 'end'
					}
				}
			},
			'e13': {
				combat: true,
				notification: _("the hall closes behind you, and something is walking it with you."),
				enemy: 'processional',
				enemyName: _('processional'),
				deathMessage: _("it reaches the door before it stops, which was where it was going."),
				chara: '\u2C03',
				damage: 17,
				hit: 0.88,
				attackDelay: 1.3,
				ranged: true,
				health: 102,
				specials: [
					{
						delay: 6,
						action: (fighter) => {
							Events.setStatus(fighter, 'energised');
							return _('pace quickening');
						}
					},
					{
						delay: 11,
						action: (fighter) => {
							Events.setStatus(fighter, 'shield');
							return _('closing ranks');
						}
					}
				],
				loot: {
					'energy cell': { min: 12, max: 20, chance: 1 },
					'sulphur': { min: 2, max: 4, chance: 0.35 },
					'laser rifle': { min: 1, max: 1, chance: 0.3 }
				},
				buttons: {
					'continue': {
						text: _('go on'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: { 1: 'lock' }
					},
					'leave': {
						text: _('climb out'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'e14': {
				combat: true,
				notification: _("the door is attended, and the attendant has noticed."),
				enemy: 'doorkeeper',
				enemyName: _('doorkeeper'),
				deathMessage: _("it steps aside. it does not stop being there. it simply stops."),
				chara: '\u2C04',
				damage: 18,
				hit: 0.87,
				attackDelay: 1.35,
				ranged: true,
				health: 110,
				specials: [
					{
						delay: 7,
						action: (fighter) => {
							Events.setStatus(fighter, 'brittle');
							return _('unsealing');
						}
					},
					{
						delay: 12,
						action: (fighter) => {
							Events.setStatus(fighter, 'regenerating');
							return _('reasserting');
						}
					}
				],
				loot: {
					'energy cell': { min: 13, max: 22, chance: 1 },
					'sulphur': { min: 3, max: 4, chance: 0.35 },
					'energy blade': { min: 1, max: 1, chance: 0.05 }
				},
				buttons: {
					'continue': {
						text: _('go on'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: { 1: 'lock' }
					},
					'leave': {
						text: _('climb out'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			/* ---- the lock ---- */
			'lock': {
				text: [
					_('the last door has no handle, no hinge and no seam. set into it is a grid of glyphs, lit from behind.'),
					_('some of them are fixed and will not move. the rest turn under a fingertip.'),
					_('no glyph may repeat along any line, or within any bordered block.')
				],
				notification: _('a glyph lock bars the last door'),
				/* onRender rather than onLoad: loadScene empties #description
				 * after onLoad runs, so anything drawn there would be wiped.
				 * See Events.startStory. */
				onRender: function() {
					Ruins.renderLock('standard', 'open');
				},
				buttons: {
					/* Disabled until the lock is solved. This MUST consult real
					 * state rather than returning a constant false:
					 * Events.updateButtons() re-runs available() on every
					 * stores/income state update and re-disables anything
					 * that says false, which would grey the door out again
					 * seconds after the player solved it. */
					'open': {
						text: _('open the door'),
						available: function() { return Ruins.isSolved('open'); },
						nextScene: { 1: 'vault' }
					},
					'leave': {
						text: _('leave it shut'),
						nextScene: 'end'
					}
				}
			},
			'vault': {
				text: [
					_('the door does not open so much as stop being there.'),
					_('the room behind it is small, and dry, and has been sealed since before anything on this world could have sealed it.'),
					_('there is a rack. on it sits an ingot, and beside the ingot a crystal the colour of nothing in particular.'),
					_('there is only time to touch one of them.')
				],
				notification: _('the lock opens'),
				onLoad: function() {
					World.clearDungeon();
				},
				buttons: {
					'alloy': {
						text: _('take the ingot'),
						nextScene: { 1: 'tookAlloy' }
					},
					'crystal': {
						text: _('touch the crystal'),
						nextScene: { 1: 'crystal' }
					},
					'deeper': {
						text: _('there is another door behind the rack'),
						nextScene: { 1: 'deepLock' }
					}
				}
			},
			'tookAlloy': {
				text: [
					_('it is a single ingot, and it is far heavier than its size accounts for.')
				],
				notification: _('an ingot of alien alloy'),
				loot: {
					'alien alloy': { min: 2, max: 3, chance: 1 },
					'energy cell': { min: 5, max: 10, chance: 0.8 }
				},
				buttons: {
					'end': {
						text: _('climb out'),
						nextScene: 'end'
					}
				}
			},
			/* The crystal is NOT loot. Touching it costs the player the ingot
			 * they could have taken instead and gives them nothing they can
			 * carry -- only a fragment of somebody else's memory. That trade
			 * is the point: the lore has a real price, paid in the currency
			 * the rest of the location deals in. */
			'crystal': {
				text: function() {
					return Ruins.memoryText();
				},
				notification: _('the crystal is warm, and something that is not yours goes through you'),
				buttons: {
					'end': {
						text: _('climb out'),
						nextScene: 'end'
					}
				}
			},
			/* ---- optional second lock, harder, for both rewards ---- */
			'deepLock': {
				text: [
					_('behind the rack the wall carries a second grid, larger than the first, and lit a different colour.'),
					_('the same rule. more of it.')
				],
				notification: _('a second, larger lock'),
				onRender: function() {
					Ruins.renderLock('deep', 'openDeep');
				},
				buttons: {
					'openDeep': {
						text: _('open the inner door'),
						available: function() { return Ruins.isSolved('openDeep'); },
						nextScene: { 1: 'inner' }
					},
					'back': {
						text: _('go back to the rack'),
						nextScene: { 1: 'vault' }
					}
				}
			},
			/* The 6x6 is where the handheld nuke is reliably obtained. It used
			 * to be an alternative prize for the 4x4, which made a nuke per
			 * ruin roughly free -- with five to seven ruins in a world that's
			 * an arsenal for solving the easy puzzle each time. Behind the 6x6
			 * it's a real prize for a real lock, and the outer vault still
			 * pays out on its own so the 4x4 is never wasted.
			 *
			 * Not literally the only source: the two toughest depth-five
			 * enemies ('unlit one' and 'doorkeeper', both 100hp+) each drop
			 * one at 5%. That's a rare bonus for the hardest fights in the
			 * location rather than a supply line, so it doesn't undercut the
			 * gating here. */
			'inner': {
				text: [
					_('the inner room is the size of a cupboard and has been sealed longer than the outer one.'),
					_('there is no rack. everything is simply stacked on the floor, as if whoever left it was in a hurry, four hundred centuries ago.'),
					_('an ingot. a device that fits in one hand, with a worn recess for a thumb. and another of the colourless crystals, set apart from the rest.'),
					_('there is enough time to take all of it.')
				],
				notification: _('the inner room opens'),
				onLoad: function() {
					World.clearDungeon();
				},
				loot: {
					'alien alloy': { min: 3, max: 5, chance: 1 },
					'handheld nuke': { min: 1, max: 1, chance: 1 },
					'energy cell': { min: 10, max: 20, chance: 1 },
					'laser rifle': { min: 1, max: 1, chance: 0.5 }
				},
				buttons: {
					/* Offered as a separate act rather than folded into the
					 * loot, so touching it stays a decision even here where
					 * it costs nothing. */
					'crystal': {
						text: _('touch the crystal'),
						nextScene: { 1: 'innerCrystal' }
					},
					'end': {
						text: _('climb out'),
						nextScene: 'end'
					}
				}
			},
			'innerCrystal': {
				text: function() {
					return Ruins.memoryText();
				},
				notification: _('the crystal is warm, and something that is not yours goes through you'),
				buttons: {
					'end': {
						text: _('climb out'),
						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.LANDMARK_RUINS
	},
	"temple": { /* The Silent Temple */
		title: _('A Silent Temple'),
		/* Karma-gated throughout. The threshold for being acknowledged at all
		 * is 10 -- well above the -10 the player starts on -- so this is a
		 * place that only opens to somebody who has actually been working at
		 * it, and it stays shut to anybody who hasn't.
		 *
		 * The doors can be permanently barred (game.temple.barred). That is
		 * the only irreversible lockout in the game, and it's deliberate:
		 * robbing or killing here should cost the player something they can
		 * never get back, in the one location whose entire subject is being
		 * judged. There is exactly one temple per world (LANDMARKS num: 1),
		 * so barring it means barring it. */
		audio: AudioLibrary.LANDMARK_TEMPLE,
		scenes: {
			'start': {
				text: function() {
					var lines = [
						_('the building is cut from one piece of stone and has no windows.'),
						_('above the door there is a figure worked into the rock: three eyes, three ears, and no mouth at all.')
					];
					if($SM.get('game.temple.barred')) {
						lines.push(_('the doors do not open. they will not open again.'));
					} else {
						lines.push(_('the doors stand open. inside, figures move without hurry. some of them are human. some of them are not.'));
					}
					return lines;
				},
				notification: _('a temple, cut from a single piece of stone'),
				/* Deliberately does NOT markVisited().
				 *
				 * markVisited() appends '!' to the map tile, and doSpace()
				 * looks landmarks up BY TILE CHARACTER -- so a marked tile no
				 * longer matches World.LANDMARKS and the setpiece never fires
				 * again. Correct for a place you loot once; wrong for a temple
				 * whose entire mechanic is that the monks' reception changes as
				 * karma does. A player shunned at -5 has to be able to come
				 * back at +15 and be let in, or the karma gate is decided
				 * permanently by whenever they first happened to walk past.
				 *
				 * The tile IS marked visited in Temple.bar(), at the one point
				 * where this place is genuinely finished with the player. */
				buttons: {
					'enter': {
						text: _('go inside'),
						available: function() {
							return !$SM.get('game.temple.barred');
						},
						/* One entrance, two receptions. Which one the player
						 * gets is the whole mechanic, so it's decided here
						 * rather than by hiding buttons after the fact. */
						nextScene: function() {
							return Temple.isWelcome() ? 'greeted' : 'shunned';
						}
					},
					'leave': {
						text: _('leave'),
						nextScene: 'end'
					}
				}
			},

			/* ---- below the threshold: shunned ---- */
			'shunned': {
				text: [
					_('the monks do not look up. not one of them.'),
					_('they move around you the way water moves around a rock, and with about as much interest.'),
					_('there is an offering plate near the door, and nobody is watching it.')
				],
				notification: _('the monks do not acknowledge you'),
				onRender: function() { Temple.hideLabButtonIfUndiscovered(); },
				buttons: {
					'lab': {
						text: _('ask about the lab'),
						/* Offered at ANY karma, including while shunned: the
						 * answer is a point of doctrine, not a favour, and the
						 * monks decline to withhold it even from somebody they
						 * will not otherwise speak to. Temple.isBarred() is
						 * the one thing that closes it -- after robbing or
						 * killing there is nobody left here to ask. */
						available: function() { return Lab.templeCanAdvise(); },
						nextScene: { 1: 'labAnswer' }
					},
					'force': {
						text: _('make one of them turn around'),
						nextScene: { 1: 'forced' }
					},
					'rob': {
						text: _('take the offering plate'),
						nextScene: { 1: 'robbed' }
					},
					'kill': {
						text: _('kill one of them'),
						nextScene: { 1: 'killed' }
					},
					'leave': {
						text: _('leave'),
						nextScene: 'end'
					}
				}
			},
			'forced': {
				text: [
					_('the monk turns because it is turned, not because it chose to.'),
					_('it has three eyes and no mouth, and the voice arrives anyway, from somewhere behind the ears.'),
					_('"forcing your will through violence? you have only proven why you deserve to be shunned."'),
					_('it turns back. the others never stopped ignoring you.')
				],
				notification: _('the monk speaks without speaking'),
				buttons: {
					'back': {
						text: _('stand there'),
						nextScene: { 1: 'shunned' }
					},
					'leave': {
						text: _('leave'),
						nextScene: 'end'
					}
				}
			},

			/* ---- at or above the threshold: welcomed ---- */
			'greeted': {
				text: [
					_('they stop what they are doing, all of them, at the same moment.'),
					_('"we perceive the penitent."'),
					_('"perhaps judgement will not be everlasting."'),
					_('some of them are human. some of them are wanderers. none of them appear to consider this worth remarking on.')
				],
				notification: _('the monks perceive the penitent'),
				onRender: function() { Temple.hideLabButtonIfUndiscovered(); },
				buttons: {
					'supplies': {
						text: _('say that you are short'),
						/* Only offered when actually short. Asking for charity
						 * you don't need would be its own kind of answer. */
						available: function() {
							return Temple.needsSupplies();
						},
						nextScene: { 1: 'given' }
					},
					'donate': {
						text: _('leave 10 food and 10 water'),
						available: function() {
							return Temple.canDonate();
						},
						onChoose: function() {
							Temple.donate();
						},
						nextScene: { 1: 'donated' }
					},
					'lab': {
						text: _('ask about the lab'),
						/* Offered at ANY karma, including while shunned: the
						 * answer is a point of doctrine, not a favour, and the
						 * monks decline to withhold it even from somebody they
						 * will not otherwise speak to. Temple.isBarred() is
						 * the one thing that closes it -- after robbing or
						 * killing there is nobody left here to ask. */
						available: function() { return Lab.templeCanAdvise(); },
						nextScene: { 1: 'labAnswer' }
					},
					'blessing': {
						text: _('ask for a blessing'),
						nextScene: { 1: 'blessing' }
					},
					'see': {
						text: _('ask what they see'),
						available: function() {
							return Temple.isPerceived();
						},
						nextScene: { 1: 'whatTheySee' }
					},
					'watcher': {
						text: _('ask about the watcher'),
						nextScene: { 1: 'watcher' }
					},
					'rob': {
						text: _('take the offering plate'),
						nextScene: { 1: 'robbed' }
					},
					'kill': {
						text: _('kill one of them'),
						nextScene: { 1: 'killed' }
					},
					'leave': {
						text: _('leave'),
						nextScene: 'end'
					}
				}
			},
			'given': {
				text: [
					_('nobody asks what happened, or where you have been, or what you intend to do next.'),
					_('the water is cold. the food is plain and there is exactly enough of it.'),
					_('"we help those in need if we are able."')
				],
				notification: _('the monks give food and water'),
				onLoad: function() {
					Temple.giveSupplies();
				},
				buttons: {
					'back': {
						text: _('stay a while'),
						nextScene: { 1: 'greeted' }
					},
					'leave': {
						text: _('leave'),
						nextScene: 'end'
					}
				}
			},
			'donated': {
				text: [
					_('the plate is not for them. it never was.'),
					_('what goes into it goes back out of the door, to whoever comes up the road next with nothing.'),
					_('a monk inclines its head very slightly. that appears to be the entire ceremony.')
				],
				notification: _('the offering is left'),
				buttons: {
					'back': {
						text: _('stay a while'),
						nextScene: { 1: 'greeted' }
					},
					'leave': {
						text: _('leave'),
						nextScene: 'end'
					}
				}
			},
			'labAnswer': {
				text: [
					_('the shunning stops for exactly as long as the question takes to answer.'),
					_('"the watcher would not forbid someone from observing their own fate."'),
					_('"we would be poor students of it if we did."'),
					_('a disc of the same stone the temple is cut from is put into your hand. it has the three eyes on one face and nothing on the other.'),
					_('"what is down there is not a secret. it is only difficult."')
				],
				notification: _('the monks give you a key'),
				onLoad: function() {
					Lab.giveKey();
				},
				buttons: {
					'back': {
						text: _('stay a while'),
						nextScene: function() {
							/* Back to whichever reception the player is
							 * actually entitled to -- asking this question
							 * does not buy them a welcome they haven't
							 * earned. */
							return Temple.isWelcome() ? 'greeted' : 'shunned';
						}
					},
					'leave': {
						text: _('leave'),
						nextScene: 'end'
					}
				}
			},
			'blessing': {
				text: [
					_('"we help those in need if we are able, but our path is to watch, not to intervene."'),
					_('"we do not ask the watcher to change fate, merely to help us understand it."')
				],
				notification: _('the monks do not intervene'),
				buttons: {
					'back': {
						text: _('stay a while'),
						nextScene: { 1: 'greeted' }
					},
					'leave': {
						text: _('leave'),
						nextScene: 'end'
					}
				}
			},
			'whatTheySee': {
				/* Two answers -- see EasterEggs.perceptionText. A player who
				 * has never moved their karma in either direction gets a
				 * different one. */
				text: function() {
					return EasterEggs.perceptionText();
				},
				notification: _('the monks say what they see'),
				buttons: {
					'back': {
						text: _('stay a while'),
						nextScene: { 1: 'greeted' }
					},
					'leave': {
						text: _('leave'),
						nextScene: 'end'
					}
				}
			},
			'watcher': {
				text: [
					_('"the watcher does not pass judgement."'),
					_('"the watcher observes judgement."'),
					_('the figure above the door has three eyes and three ears and no mouth, and now it is obvious why.')
				],
				notification: _('the watcher observes judgement'),
				buttons: {
					'back': {
						text: _('stay a while'),
						nextScene: { 1: 'greeted' }
					},
					'leave': {
						text: _('leave'),
						nextScene: 'end'
					}
				}
			},

			/* ---- the two irreversible acts ----
			 * Reachable identically from both receptions, on purpose: being
			 * welcomed does not remove the option, it only raises what it
			 * costs. */
			'robbed': {
				text: [
					_('the plate holds very little, and what it holds was left by people with less.'),
					_('"you are who you always are. this is why you are shunned."'),
					_('nothing touches you. the air does. the doorway arrives very quickly and the road arrives after it.'),
					_('behind you the doors close, and go on closing, past the point where a door would stop.')
				],
				notification: _('the temple casts you out'),
				onLoad: function() {
					$SM.add('character.karma', -5);
					Temple.bar();
				},
				loot: {
					'cured meat': { min: 3, max: 8, chance: 1 },
					'fur': { min: 5, max: 15, chance: 0.8 },
					'scales': { min: 2, max: 6, chance: 0.5 }
				},
				buttons: {
					'end': {
						text: _('go back to the road'),
						nextScene: 'end'
					}
				}
			},
			'killed': {
				text: [
					_('it does not resist. it does not appear to consider resisting.'),
					_('the others do not come. they watch, which is the entire thing they do.'),
					_('then the air moves, once, and you are outside, a long way outside, further than the doorway accounts for.'),
					_('the doors close and keep closing. this place is finished with you.')
				],
				notification: _('the temple casts you out'),
				onLoad: function() {
					$SM.add('character.karma', -10);
					$SM.add('character.kills', 1);
					Temple.bar();
				},
				buttons: {
					'end': {
						text: _('go back to the road'),
						nextScene: 'end'
					}
				}
			}
		}
	},
	"crater": { /* A Glassed Crater */
		title: _('A Glassed Crater'),
		/* Tier 3/4 (minRadius 22). The whole location is one decision --
		 * scrape the rim for a certain, small return, or go down into the
		 * bowl for a real one -- and the descent is the only place in the
		 * game that costs the player their maximum health rather than their
		 * current health. */
		audio: AudioLibrary.LANDMARK_CRASHED_SHIP,
		scenes: {
			'start': {
				text: [
					_('the ground falls away into a bowl, perfectly round, a mile across.'),
					_('it is smooth black glass all the way down, and it is not natural, and nothing has grown here since.'),
					_('teeth ache at thirty paces.')
				],
				notification: _('the ground falls away into a bowl of black glass'),
				/* Deliberately no markVisited() here.
				 *
				 * markVisited() appends '!' to the map tile, and World.doSpace()
				 * looks landmarks up BY TILE CHARACTER -- so a marked crater could
				 * never be routed to again. A player who found it without the
				 * hazard suit and deliberately left the descent for later could
				 * never come back. Same bug the Temple and the swamp both had, for
				 * the same reason: any location meant to be revisited must not
				 * call this. Reported directly. */
				buttons: {
					'rim': {
						text: _('scrape the rim'),
						nextScene: { 1: 'rim' }
					},
					'descend': {
						text: _('go down to the core'),
						cost: { 'hp': 15 },
						/* The cost is real and paid up front, so the player
						 * cannot attempt this on fumes and be killed by the
						 * entry price itself. */
						available: function() {
							return World.health > 15;
						},
						nextScene: function() {
							return Events.karmaOdds(0.5, 'coreBad', 'coreGood');
						}
					},
					'leave': {
						text: _('go around it'),
						nextScene: 'end'
					}
				}
			},

			'rim': {
				text: function() {
					return [
						Events.pick([
							_('the rim is where the glass is thinnest, and where the things that were caught in it are closest to the surface.'),
							_('at the lip the glass has gone frothy, full of bubbles, and things came to rest in the froth.'),
							_('the outer edge cooled fastest. whatever was in the air when it cooled is still in it.')
						]),
						_('an hour of chipping fills a pocket. staying longer is not worth what it costs.')
					];
				},
				notification: _('the rim yields a little'),
				loot: {
					'alien alloy': { min: 1, max: 1, chance: 0.6 },
					'scales': { min: 3, max: 8, chance: 1 }
				},
				buttons: {
					'shell': {
						text: _('something is moving out on the glass'),
						nextScene: { 1: 'shell' }
					},
					'end': {
						text: _('move away from it'),
						nextScene: 'end'
					}
				}
			},

			/* ---- the unique monster ---- */
			'shell': {
				combat: true,
				notification: _('a shape crosses the glass without leaving a mark on it.'),
				enemy: 'obsidian shell',
				enemyName: _('obsidian shell'),
				deathMessage: _('the hull comes apart into black flakes, and they do not reflect anything.'),
				chara: '\u2666',
				damage: 6,
				hit: 0.8,
				attackDelay: 2,
				ranged: true,
				health: 110,
				/* The hull is up from the first second rather than arriving on
				 * a special's delay -- the player should meet the mechanic
				 * immediately, not be ambushed by it after committing to a
				 * ranged loadout. */
				startStatus: 'shield',
				/* Fraction of RANGED damage bounced back at the shooter while
				 * the hull holds. With the shield also healing the target,
				 * shooting this thing is actively worse than doing nothing. */
				reflect: 0.5,
				specials: [{
					/* Re-forms the hull, so the reflect is a recurring problem
					 * rather than a single wasted shot at the start. */
					delay: 7,
					action: (fighter) => {
						Events.setStatus(fighter, 'shield');
						return _('hull re-forms');
					}
				}],
				loot: {
					'alien alloy': { min: 1, max: 2, chance: 0.7 },
					'scales': { min: 5, max: 12, chance: 1 },
					'energy cell': { min: 2, max: 6, chance: 0.5 }
				},
				buttons: {
					'continue': {
						text: _('go on'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: { 1: 'shellDown' }
					},
					'leave': {
						text: _('move away from it'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'shellDown': {
				text: [
					_('under the hull there is no body. there is a cavity, shaped for something, and the shape is empty.'),
					_('it has been empty a long time. the hull went on walking anyway.')
				],
				notification: _('there was nothing inside it'),
				buttons: {
					'end': {
						text: _('move away from it'),
						nextScene: 'end'
					}
				}
			},

			/* ---- the descent ---- */
			'coreGood': {
				text: function() {
					return [
						_('the walk down takes an hour and the glass rings underfoot the whole way.'),
						Events.pick([
							_('at the centre something is still standing upright, buried to the shoulder, and it did not go off.'),
							_('the middle of the bowl holds a shaft of metal driven straight down, and the whole of it is intact.'),
							_('there is a projectile at the centre, half-sunk, and whatever was supposed to happen to it never did.')
						]),
						_('getting a piece free takes the rest of the day. the walk back out is worse than the walk in.')
					];
				},
				notification: _('the core did not go off'),
				/* The hazard suit's plans are NOT here -- they're in the
				 * Strata, which sits at a shallower radius. Awarding a
				 * survival tool for having already survived is backwards:
				 * by the time you'd earned it you'd have no use for it. The
				 * crater is now the place the suit is FOR. */
				loot: {
					'handheld nuke': { min: 1, max: 1, chance: 0.5 },
					'alien alloy': { min: 3, max: 3, chance: 1 },
					'energy cell': { min: 3, max: 8, chance: 0.6 }
				},
				buttons: {
					'end': {
						text: _('climb out'),
						nextScene: 'end'
					}
				}
			},
			'coreBad': {
				text: function() {
					return [
						_('the walk down takes an hour and the glass rings underfoot the whole way.'),
						Events.pick([
							_('the centre is hotter than the rim in a way that has nothing to do with the sun.'),
							_('at the bottom the ringing stops, and the silence is worse.'),
							_('the middle of the bowl is where it went off, and it has not finished going off.')
						]),
						_('there is nothing down there. it comes on before the climb back out is finished: the taste of metal, and then the rest of it.')
					];
				},
				notification: _('radiation sickness'),
				onLoad: function() {
					Crater.radiationSickness();
				},
				buttons: {
					'end': {
						text: _('climb out'),
						nextScene: 'end'
					}
				}
			}
		}
	},
	"lab": { /* The Cloning Lab */
		title: _('A Wanderer Lab'),
		/* See script/lab.js for the gate structure. In short: the Builder,
		 * then a locked door, then a prestige-gated symbol, then the Temple.
		 * Nothing here can be brute-forced on a first playthrough. */
		audio: AudioLibrary.LANDMARK_RUINS,
		scenes: {
			'start': {
				text: function() {
					if(Lab.hasRefused()) {
						return [
							_('the door is where it was. it has not been opened.'),
							_('she asked you not to, and you agreed, and that is the end of it for now.')
						];
					}
					return [
						_('the structure is mostly underground. what is above the surface is a door and forty feet of blank wall.'),
						_('there is no dust on the threshold. something still uses this.')
					];
				},
				notification: _('a door set into the ground, and no dust on the threshold'),
				buttons: {
					'approach': {
						text: _('go to the door'),
						available: function() { return !Lab.hasRefused(); },
						nextScene: function() {
							if(Lab.hasKey()) { return 'unlock'; }
							if(!$SM.get('game.lab.builderMet')) { return 'builder'; }
							return 'door';
						}
					},
					'leave': {
						text: _('leave'),
						nextScene: 'end'
					}
				}
			},

			/* ---- gate 1: the Builder ---- */
			'builder': {
				text: [
					_('there is somebody standing behind you. she has been standing there for a while.'),
					_('it is the builder. she has walked out here, through all of it, on the leg that does not work properly, and she is not carrying anything.'),
					_('she does not explain how she found you. she asks you not to open the door.'),
					_('"there is nothing in there but pain. i am not going to pretend i can stop you."'),
					_('"there is a fire at home. it is still lit. that is all i have to offer and i am offering it."')
				],
				notification: _('the builder has come out into the wastes'),
				onLoad: function() {
					$SM.set('game.lab.builderMet', true);
				},
				buttons: {
					'home': {
						text: _('go home with her'),
						nextScene: { 1: 'refused' }
					},
					'door': {
						text: _('go to the door anyway'),
						nextScene: { 1: 'door' }
					}
				}
			},
			'refused': {
				text: [
					_('she does not say thank you. she does not say anything at all for the first hour of the walk.'),
					_('the fire is still going when you get back. she was right about that.'),
					_('you will not open that door. not this time. you gave her your word and she came a very long way for it.')
				],
				notification: _('the lab stays shut'),
				onLoad: function() {
					/* Permanent for this playthrough, on purpose. She is right,
					 * and the choice only means something if it costs the
					 * player the content behind it. */
					Lab.refuse();
					$SM.add('character.karma', 2);
				},
				buttons: {
					'end': {
						text: _('go home'),
						nextScene: 'end'
					}
				}
			},

			/* ---- gate 2/3: the door, and the symbol ---- */
			'door': {
				text: function() {
					var lines = [
						_('the door has no handle and no seam, and it does not respond to being pushed, struck, or shouted at.'),
						_('there is a recess beside it, shaped for something you do not have.')
					];
					if(Lab.seesSymbol()) {
						lines.push(_('and worked into the frame, so shallow you would only find it by running a hand over it:'));
						lines.push(_('three eyes. three ears. no mouth.'));
						lines.push(_('you have seen that before. you know exactly where.'));
					} else {
						lines.push(_('you do not know what would open this. you do not know anybody who would.'));
					}
					return lines;
				},
				notification: function() {
					return Lab.seesSymbol() ?
						_('the watcher is on the door frame') :
						_('the door does not open');
				},
				onLoad: function() {
					if(Lab.seesSymbol()) {
						Lab.noticeSymbol();
					}
				},
				buttons: {
					'end': {
						text: _('go back'),
						nextScene: 'end'
					}
				}
			},
			'unlock': {
				text: [
					_('the key is not a key. it is a flat disc of the same stone the temple is cut from, and it goes into the recess as though it were made for it, which it was.'),
					_('the door does not swing. it withdraws, and keeps withdrawing, and the stairs start immediately.'),
					_('the air coming up is cold and clean and has been filtered by something that still works.')
				],
				notification: _('the lab opens'),
				onLoad: function() {
					Lab.reachLevel(1);
					Lab.defineMazes();
					Maze.rewind('lab1');
				},
				buttons: {
					'down': {
						text: _('go down'),
						nextScene: { 1: 'level1' }
					}
				}
			},

			/* ---- the three levels ---- */
			'level1': {
				text: [_('sublevel one. the lights come on a corridor at a time, ahead of you.')],
				onLoad: function() { Lab.defineMazes(); Lab.reachLevel(1); },
				onRender: function() { Maze.render('lab1', 'level1'); },
				buttons: {
					'leave': {
						text: _('climb out'),
						nextScene: 'end'
					}
				}
			},
			'level2': {
				text: [_('sublevel two. colder. the filtration is louder down here.')],
				onLoad: function() { Lab.defineMazes(); Lab.reachLevel(2); },
				onRender: function() { Maze.render('lab2', 'level2'); },
				buttons: {
					'leave': {
						text: _('climb out'),
						nextScene: 'end'
					}
				}
			},
			'level3': {
				/* The deepest level is hot. Whatever the vats run on is down
				 * here with them, and it has not been shielded in a very long
				 * time -- which is the in-fiction reason the hazard suit's
				 * plans are two floors up, on the assay bench. */
				text: function() {
					var lines = [_('sublevel three. nothing down here is lit until you are already in it.')];
					if(Hazard.hasSuit()) {
						lines.push(_('the counter on the chest picks up the moment the stairwell opens, and keeps climbing. the suit holds.'));
					} else {
						lines.push(_('the air down here tastes of pennies. it is the same taste as the wreck out on the road.'));
					}
					return lines;
				},
				onLoad: function() {
					Lab.defineMazes();
					Lab.reachLevel(3);
					Lab.applyDepthRadiation();
				},
				onRender: function() { Maze.render('lab3', 'level3'); },
				buttons: {
					'leave': {
						text: _('climb out'),
						nextScene: 'end'
					}
				}
			},
			'descend1': {
				text: [_('a stairwell, going down. the air below is colder again.')],
				notification: _('stairs down to sublevel two'),
				onLoad: function() { Maze.rewind('lab2'); },
				buttons: {
					'down': { text: _('go down'), nextScene: { 1: 'level2' } },
					'back': { text: _('stay on this level'), nextScene: { 1: 'level1' } }
				}
			},
			'descend2': {
				text: [_('the last stairwell. it goes further down than the other two put together.')],
				notification: _('stairs down to sublevel three'),
				onLoad: function() { Maze.rewind('lab3'); },
				buttons: {
					'down': { text: _('go down'), nextScene: { 1: 'level3' } },
					'back': { text: _('stay on this level'), nextScene: { 1: 'level2' } }
				}
			},

			/* ---- the three fights ----
			 * Energy constructs, as in the ruins, but this is late-late game
			 * content sitting behind the Executioner's upgrades, so they hit
			 * considerably harder than anything down there. */
			'fight1': {
				combat: true,
				notification: _('something crosses the corridor ahead, and it is made of light'),
				enemy: 'lab construct',
				enemyName: _('lab construct'),
				chara: '\u2C00',
				damage: 9,
				hit: 0.8,
				attackDelay: 2,
				health: 120,
				ranged: true,
				specials: [{
					delay: 7,
					action: (fighter) => {
						Events.setStatus(fighter, 'shield');
						return _('field up');
					}
				}],
				loot: {
					'energy cell': { min: 5, max: 12, chance: 1 },
					'alien alloy': { min: 1, max: 2, chance: 0.5 }
				},
				buttons: {
					'continue': {
						text: _('go on'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: { 1: 'level1' }
					}
				}
			},
			'fight2': {
				combat: true,
				notification: _('a shape resolves out of the dark, already moving'),
				enemy: 'lab warden',
				enemyName: _('lab warden'),
				chara: '\u2C01',
				damage: 12,
				hit: 0.8,
				attackDelay: 1.8,
				health: 135,
				ranged: true,
				specials: [
					{
						delay: 6,
						action: (fighter) => {
							Events.setStatus(fighter, 'energised');
							return _('charging');
						}
					},
					{
						delay: 11,
						action: (fighter) => {
							Events.setStatus(fighter, 'brittle');
							return _('venting');
						}
					}
				],
				loot: {
					'energy cell': { min: 8, max: 16, chance: 1 },
					'alien alloy': { min: 1, max: 3, chance: 0.7 }
				},
				buttons: {
					'continue': {
						text: _('go on'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: { 1: 'level2' }
					}
				}
			},
			'fight3': {
				combat: true,
				notification: _('this one was waiting'),
				enemy: 'lab custodian',
				enemyName: _('lab custodian'),
				chara: '\u2C02',
				damage: 14,
				hit: 0.85,
				attackDelay: 1.6,
				health: 150,
				ranged: true,
				specials: [
					{
						delay: 6,
						action: (fighter) => {
							Events.setStatus(fighter, 'regenerating');
							return _('reknitting');
						}
					},
					{
						delay: 10,
						action: (fighter) => {
							Events.setStatus(fighter, 'energised');
							return _('charging');
						}
					}
				],
				loot: {
					'energy cell': { min: 10, max: 20, chance: 1 },
					'alien alloy': { min: 2, max: 4, chance: 0.8 }
				},
				buttons: {
					'continue': {
						text: _('go on'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: { 1: 'level3' }
					}
				}
			},

			/* ---- the three discoveries, one per level ---- */
			'notes': {
				text: [
					_('a work surface, and on it a log that has been kept by hand for a very long time.'),
					_('drones go out. they go out on a schedule, and the schedule is not regular -- it is triggered.'),
					_('every entry is the same shape. dispatch. transit. RECOVERY OF SAMPLE. return. hold for assay.'),
					_('the log does not say what the sample is. it does not need to; whoever kept it already knew.')
				],
				notification: _('the drones go out to recover a sample'),
				buttons: {
					'back': { text: _('go on'), nextScene: { 1: 'level1' } }
				}
			},
			'assay': {
				text: [
					_('a bench, and a row of instruments still under power, all of them pointed at the same kind of measurement.'),
					_('they are looking for drift. degradation. changes between one sample and the next.'),
					_('somebody has been comparing something against something older, over and over, for a very long time, and writing down how far it has moved.'),
					_('further along the wall there is a furnace, rated for biohazard, and it is the only thing down here that looks used.')
				],
				notification: _('instruments for measuring how far something has drifted'),
				buttons: {
					'back': { text: _('go on'), nextScene: { 1: 'level2' } }
				}
			},
			'furnace': {
				text: [
					_('the furnace is enormous and its log is longer than the one upstairs.'),
					_('disposal. disposal. disposal. the entries run for pages, and the intervals between them are not regular either.'),
					_('whatever comes out of the vats and fails the assay goes in here, and the machine has been very busy.'),
					_('there is nothing in it now. it is warm.')
				],
				notification: _('a biohazard furnace, recently used'),
				buttons: {
					'back': { text: _('go on'), nextScene: { 1: 'level2' } }
				}
			},

			/* ---- the glyph door, reusing the ruins lock ---- */
			'glyphDoor': {
				text: [
					_('the corridor ends at a door carrying a grid of glyphs, lit from behind.'),
					_('the same rule as the ruins. the same hand cut it.'),
					_('whoever built this place and whoever built those did not merely know each other. they were the same.')
				],
				notification: _('a glyph lock, the same as the ruins'),
				onRender: function() {
					Ruins.renderLock('deep', 'openVault');
				},
				buttons: {
					'openVault': {
						text: _('open the door'),
						available: function() { return Ruins.isSolved('openVault'); },
						nextScene: { 1: 'vats' }
					},
					'back': {
						text: _('go back'),
						nextScene: { 1: 'level3' }
					}
				}
			},

			/* ---- the reveal ---- */
			'vats': {
				text: [
					_('the room beyond is a storage facility, and it is very large, and almost all of it is in use.'),
					_('vats. rows of them, lit from within, each one at a different stage.'),
					_('one is barely anything yet. one is most of the way there. one is finished, and floating, and waiting.'),
					_('every single one of them is you.'),
					_('not somebody like you. you. the same hands. the same set to the jaw. the scar you have had as long as you can remember, already there on a body that has never been outside that glass.'),
					_('this is how it works. this is how it has always worked. you have died out there more times than the furnace log has pages, and every time, you have woken up in a dark room with no memory of it, and gone looking for wood.'),
					/* Two more banks, far smaller, and the whole point of them
					 * is the count. The player's row runs the length of the
					 * room; theirs are a handful each. Cloning is what takes
					 * the memory, so the arithmetic here is also the
					 * explanation for why they both remember what the player
					 * cannot -- stated by implication rather than spelled
					 * out, since the player has to assemble it. */
					_('at the far end there are two more banks, set apart, and far shorter.'),
					_('one holds a man you have met. he is sitting in a cabin in a swamp about four days east of here and he took a charm off you and would not explain why he wanted it.'),
					_('there are perhaps a dozen of him. the empties outnumber the full ones and the dust on the racks says the last one was drawn a long time ago.'),
					_('the other bank is shorter still. it holds the woman who keeps your fire.'),
					_('there are fewer of her than there are of him. she has been more careful, or luckier, or she has simply had less reason to be out where it happens.'),
					_('and then the row of you. the row of you goes on past where the lights end.')
				],
				notification: _('three sets of vats, and only one of them is a row'),
				onLoad: function() {
					Lab.complete();
					World.clearDungeon();
				},
				buttons: {
					'monk': {
						text: _('there is somebody behind you'),
						nextScene: { 1: 'monk' }
					}
				}
			},
			'monk': {
				text: [
					_('a monk. three eyes, three ears, no mouth. it has been standing there long enough that it did not arrive.'),
					_('it does not stop you looking. it does not appear to have considered stopping you.'),
					_('"you may observe your fate."'),
					_('"you may rarely change it."'),
					_('the force field holds. the vats go on doing what they do. the monk waits for you to finish, and does not leave first.'),
					_('on the way out you count the short bank again, and the shorter one after it, and you cannot make either number mean anything except that they did not have to be here.')
				],
				notification: _('you may observe your fate'),
				buttons: {
					'end': {
						text: _('climb out'),
						nextScene: 'end'
					}
				}
			}
		}
	},
	"graveyard": { /* The Graveyard */
		title: _('A Graveyard'),
		/* No combat anywhere in this location, by design. Nothing here is
		 * hostile and nothing here is worth taking -- the content is entirely
		 * what is cut into the stones. See script/graveyard.js. */
		audio: AudioLibrary.LANDMARK_DESTROYED_VILLAGE,
		scenes: {
			'start': {
				text: [
					_('graves. more of them than the ground should hold, set so close that walking the rows means walking on somebody.'),
					_('and underneath: older stone. courses of it, and the mouths of vaults, and older markers again below those, going down further than the digging that put these here.'),
					_('this ground has been a cemetery for longer than anything above it has been standing.')
				],
				notification: _('a graveyard, built over older graveyards'),
				onLoad: function() {
					World.markVisited(World.curPos[0], World.curPos[1]);
					Graveyard.reset();
				},
				buttons: {
					'read': {
						text: _('read the stones'),
						nextScene: { 1: 'grave' }
					},
					'leave': {
						text: _('leave them alone'),
						nextScene: 'end'
					}
				}
			},

			'grave': {
				/* Draws a fresh epitaph on every load. The last stone is not
				 * random -- once the player has read enough of them,
				 * Graveyard.atLastStone() routes to it instead, so the
				 * accusation always lands as a conclusion rather than as one
				 * grievance among many. */
				text: function() {
					return Graveyard.next();
				},
				notification: _('another stone, and another name'),
				buttons: {
					'next': {
						text: _('walk on'),
						nextScene: function() {
							return Graveyard.atLastStone() ? 'lastGrave' : 'grave';
						}
					},
					'respect': {
						text: _('pay your respects'),
						nextScene: { 1: 'respect' }
					},
					'rob': {
						text: _('rob the grave'),
						nextScene: { 1: 'rob' }
					},
					'leave': {
						text: _('leave them alone'),
						nextScene: 'end'
					}
				}
			},

			'lastGrave': {
				text: function() {
					return Graveyard.LAST;
				},
				notification: _('the last stone names two'),
				buttons: {
					'respect': {
						text: _('pay your respects'),
						nextScene: { 1: 'respect' }
					},
					'rob': {
						text: _('rob the grave'),
						nextScene: { 1: 'rob' }
					},
					'leave': {
						text: _('go back to the road'),
						nextScene: 'end'
					}
				}
			},

			'respect': {
				text: [
					_('there is nothing to do here that does anybody any good, and it takes a while to do it.'),
					_('it is too late to console the dead. but we can assuage the living.')
				],
				notification: _('respects are paid'),
				onLoad: function() {
					$SM.add('character.karma', 1);
				},
				buttons: {
					'more': {
						text: _('read on'),
						/* Still routes through the same gate, so paying
						 * respects can't be used to skip past the last stone
						 * or to farm the earlier ones indefinitely. */
						nextScene: function() {
							return Graveyard.atLastStone() ? 'lastGrave' : 'grave';
						}
					},
					'leave': {
						text: _('go back to the road'),
						nextScene: 'end'
					}
				}
			},

			'rob': {
				text: [
					_('the ground gives up a little cloth and a handful of teeth. that is all there is. that is all there was ever going to be.'),
					_('you have frequently looted your own kills. the living had more need of these things than the dead.'),
					_('still this feels needlessly impious.')
				],
				notification: _('the grave is robbed'),
				onLoad: function() {
					$SM.add('character.karma', -3);
				},
				/* Deliberately poor. Robbing here has to be a choice about who
				 * the player is, not a resource decision -- if the payout were
				 * competitive with anything else in the world, the karma cost
				 * would just be a price rather than a judgement. */
				loot: {
					'cloth': { min: 1, max: 4, chance: 1 },
					'teeth': { min: 1, max: 3, chance: 0.8 }
				},
				buttons: {
					'more': {
						text: _('read on'),
						nextScene: function() {
							return Graveyard.atLastStone() ? 'lastGrave' : 'grave';
						}
					},
					'leave': {
						text: _('go back to the road'),
						nextScene: 'end'
					}
				}
			}
		}
	},
	"observatory": { /* An Old Observatory */
		title: _('An Old Observatory'),
		audio: AudioLibrary.LANDMARK_RUINS,
		scenes: {
			'start': {
				text: [
					_('a white dome sits silent on the high ground, its shutter open to the empty sky.'),
					_('inside, wheels and gears creak in the wind.'),
					_('the pieces are a mix of ancient and modern, as if the whole structure has been partially replaced, over and over, for longer than anyone kept count.')
				],
				notification: _('a white dome, open to an empty sky'),
				onLoad: function() {
					World.markVisited(World.curPos[0], World.curPos[1]);
				},
				buttons: {
					'lens': {
						text: _('look through the lens'),
						nextScene: { 1: 'lens' }
					},
					'records': {
						text: _('search the records'),
						nextScene: { 1: 'records' }
					},
					'loot': {
						text: _('dismantle it for scrap'),
						nextScene: { 1: 'zapped' }
					},
					'leave': {
						text: _('leave'),
						nextScene: 'end'
					}
				}
			},

			'lens': {
				text: function() {
					var lines = [
						_('peering into the brass eyepiece. the stars are not where the old maps say they should be.'),
						_('some are missing. others are closer than they ought to be.')
					];
					/* Precise and Scout together: both are already the game's
					 * vocabulary for improved observation (Scout doubles
					 * discovery odds, Precise sharpens World.getDistance's
					 * accuracy), so stacking them here rather than gating on
					 * a new perk keeps the reward legible to a player who
					 * already knows what those two do. */
					if($SM.hasPerk('precise') && $SM.hasPerk('scout')) {
						lines.push(_('and something else, at the very edge of what the lens will resolve:'));
						lines.push(_('there appear to be large space stations around the planet.'));
					}
					return lines;
				},
				notification: _('the stars are not where the maps say'),
				buttons: {
					'back': {
						text: _('step back'),
						nextScene: { 1: 'start' }
					},
					'leave': {
						text: _('leave'),
						nextScene: 'end'
					}
				}
			},

			'records': {
				text: [
					_('a cabinet of logs, in more hands and more languages than one observatory should have needed.'),
					_('the earliest entries are barely legible. the most recent are not in any alphabet at all --'),
					_('\u2C00 \u2C01 \u2C02 \u2C03 \u2C04 \u2C05, the same glyphs cut into the ruins, going back to before the infinite expanse.'),
					_('somebody has been watching this sky, in shifts, across more successors than any one people could account for.')
				],
				notification: _('logs in more languages than one observatory should need'),
				buttons: {
					'back': {
						text: _('step back'),
						nextScene: { 1: 'start' }
					},
					'leave': {
						text: _('leave'),
						nextScene: 'end'
					}
				}
			},

			/* ---- looting: the telescope defends itself ---- */
			'zapped': {
				text: [
					_('the mounting bolts give easily. too easily.'),
					_('the whole structure discharges at once, a shock up both arms and off your feet, and when the light clears the machine has pushed you bodily out onto the gravel.'),
					_('it does not want to be scrap. apparently it has a say in the matter.')
				],
				notification: _('the telescope defends itself'),
				buttons: {
					'fight': {
						text: _('go back in'),
						nextScene: { 1: 'drone' }
					},
					'leave': {
						text: _('leave it alone'),
						nextScene: 'end'
					}
				}
			},

			'drone': {
				combat: true,
				notification: _('something unfolds from the mounting and levels itself at you'),
				enemy: 'aegis drone',
				enemyName: _('aegis drone'),
				chara: '\u0394',
				damage: 11,
				hit: 0.8,
				attackDelay: 2,
				health: 85,
				ranged: true,
				/* Overcharge. energised is already the engine's own outgoing-
				 * damage buff (ENERGISE_MULTIPLIER = 4, applied to whichever
				 * fighter holds the status when it lands a hit -- see
				 * Events.damage), so no new mechanic is needed to get the
				 * stated 4x: the drone charging itself IS the existing
				 * player-facing buff, turned around on the enemy side.
				 * Re-applied every 10s so a fight that runs long sees it
				 * threaten the hit more than once.
				 *
				 * "unless interrupted by a stun" is handled generically in
				 * Events.damage(): stunning a target that currently holds
				 * energised now clears the status outright rather than only
				 * delaying the next attack tick, so bolas/disruptor is a real
				 * counter to this specifically, not just a brief postponement. */
				specials: [{
					delay: 10,
					action: (fighter) => {
						Events.setStatus(fighter, 'energised');
						return _('overcharging');
					}
				}],
				loot: {
					'energy cell': { min: 6, max: 14, chance: 1 },
					'alien alloy': { min: 1, max: 2, chance: 0.6 },
					'scales': { min: 4, max: 10, chance: 0.7 }
				},
				buttons: {
					'continue': {
						text: _('go on'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: { 1: 'scrap' }
					}
				}
			},
			'scrap': {
				text: [
					_('with nothing left standing over it, the mount finally comes apart the way it should have the first time.'),
					_('under the floor plates there is a cache the drone was standing on: not instruments. plans.'),
					_('somebody catalogued what they saw coming and then drew up what a settlement would need to survive it. both answers. they did not choose.'),
					_('some of what it protected was worth protecting.')
				],
				notification: _('the mount comes apart, and what it was standing on is worth more'),
				/* Both village blueprints, moved here from the ruins vault.
				 * The ruins were already worth solving; the observatory
				 * needed a payoff beyond flavour. Better fit too -- this is
				 * the one location whose entire purpose was WATCHING what was
				 * coming, so plans for defending and sustaining a settlement
				 * are exactly what its keepers would have drawn.
				 *
				 * Both drop together because the player can only ever BUILD
				 * one (doctrine-gated against each other), so this costs
				 * nothing and means the fight always advances whichever track
				 * you are on. */
				loot: {
					'turret blueprint': { min: 1, max: 1, chance: 1 },
					'recycler blueprint': { min: 1, max: 1, chance: 1 }
				},
				buttons: {
					'end': {
						text: _('leave with what you can carry'),
						nextScene: 'end'
					}
				}
			}
		}
	},
	"strata": { /* The Strata */
		title: _('The Strata'),
		/* Deliberately shallower than the Glassed Crater (22-30): this is
		 * where the hazard suit's plans are, and a survival tool has to be
		 * reachable BEFORE the place it keeps you alive in. */
		audio: AudioLibrary.LANDMARK_RUINS,
		scenes: {
			'start': {
				text: [
					_('the ground has come apart along a fault, and the side of the cut is forty feet of readable history.'),
					_('there are layers. worked flint near the bottom. above it, iron. above that, plate that took a furnace to roll.'),
					_('near the top, something ceramic and white that does not scratch.')
				],
				notification: _('a cut in the ground, forty feet of readable layers'),
				onLoad: function() {
					World.markVisited(World.curPos[0], World.curPos[1]);
				},
				buttons: {
					'measure': {
						text: _('measure the layers'),
						nextScene: { 1: 'measure' }
					},
					'dig': {
						text: _('dig into the face'),
						nextScene: { 1: 'dig' }
					},
					'leave': {
						text: _('leave'),
						nextScene: 'end'
					}
				}
			},

			/* The realisation. No loot -- the payload is the fact. */
			'measure': {
				text: [
					_('flint to iron is four inches. iron to rolled plate is three.'),
					_('on any world where one of those follows the other, that is two thousand years of soil. this is seven inches.'),
					_('they are not stacked because one came after another. they are stacked because they all arrived, and then they all stopped.'),
					_('everything in this wall was somebody\'s present tense. none of them were the same century.')
				],
				notification: _('the layers are too close together'),
				buttons: {
					'back': {
						text: _('step back from the face'),
						nextScene: { 1: 'start' }
					},
					'leave': {
						text: _('leave'),
						nextScene: 'end'
					}
				}
			},

			'dig': {
				text: [
					_('the face comes away in sheets. most of what is in it is bone and rust.'),
					_('two feet in, the spoil starts to burn where it touches skin, and the burn does not stop when it is brushed off.'),
					_('somebody dug here before. what is left of their kit is folded into the layer they stopped at.')
				],
				notification: _('the spoil burns where it touches'),
				onLoad: function() {
					/* A real cost for digging bare-handed, and one the suit
					 * removes entirely -- this is the scene that teaches what
					 * the suit is for, immediately before handing over the
					 * plans for it. */
					if(!Hazard.hasSuit()) {
						World.setHp(Math.max(1, World.health - 12));
					}
				},
				loot: {
					'iron': { min: 10, max: 25, chance: 1 },
					'steel': { min: 5, max: 12, chance: 0.7 },
					'leather': { min: 5, max: 15, chance: 0.6 }
				},
				buttons: {
					'kit': {
						text: _('unfold what is left of their kit'),
						nextScene: { 1: 'kit' }
					},
					'leave': {
						text: _('climb out'),
						nextScene: 'end'
					}
				}
			},

			'kit': {
				text: [
					_('a suit, sealed at every seam, and whoever was in it did not come out of the hole.'),
					_('it is far past wearing. the pattern is cut into the lining, whole, the way you write something down when you expect to have to make another.'),
					_('they knew what the ground was doing to them. they made the suit first and it was still not enough.')
				],
				notification: _('a sealed suit, and the pattern for another'),
				loot: {
					'hazard suit blueprint': { min: 1, max: 1, chance: 1 },
					'alien alloy': { min: 1, max: 1, chance: 0.4 }
				},
				buttons: {
					'end': {
						text: _('climb out'),
						nextScene: 'end'
					}
				}
			}
		}
	},
	"concordance": { /* The Concordance */
		title: _('The Concordance'),
		/* The one place on this world where the premise went right, found
		 * after it stopped being true. Everything here still works and
		 * nobody is left to use it. */
		audio: AudioLibrary.LANDMARK_TOWN,
		scenes: {
			'start': {
				text: [
					_('a settlement, intact, and running.'),
					_('an aqueduct comes down off the ridge in dressed stone, on piers, cut by hand. it feeds a condenser that is not stone and not hand-cut and is doing fusion, quietly, in a shed.'),
					_('neither has been maintained in a very long time. both are still working.'),
					_('there is nobody here. there is no sign of a fight, and no sign of anybody leaving in a hurry either.')
				],
				notification: _('a settlement where everything still works and nobody is left'),
				onLoad: function() {
					World.markVisited(World.curPos[0], World.curPos[1]);
				},
				buttons: {
					'charter': {
						text: _('there is something carved by the well'),
						nextScene: { 1: 'charter' }
					},
					'condenser': {
						text: _('look at the condenser'),
						nextScene: { 1: 'condenser' }
					},
					'leave': {
						text: _('leave'),
						nextScene: 'end'
					}
				}
			},

			/* The charter. The lore payload, and the only place the game
			 * explains what alien alloy actually IS. */
			'charter': {
				text: [
					_('a slab by the well, and the same text on it four times, in four scripts, none of which share an alphabet.'),
					_('it is an agreement. who digs, who repairs, whose year it is when the years do not match.'),
					_('"we did not arrive together and we will not leave together. the water is one water."'),
					_('the last section is about the alloy. it says the same thing four ways: that it was what everything in the infinite expanse ran on, that nobody here knows how it was made, and that when it is gone it is gone.'),
					_('"spend it on what will still be here after us."')
				],
				notification: _('four scripts, one agreement'),
				buttons: {
					'why': {
						text: _('so what happened to them'),
						nextScene: { 1: 'why' }
					},
					'condenser': {
						text: _('look at the condenser'),
						nextScene: { 1: 'condenser' }
					},
					'leave': {
						text: _('leave'),
						nextScene: 'end'
					}
				}
			},

			'why': {
				text: [
					_('the roll of names is kept on the same slab, added to in four hands, and it stops.'),
					_('it does not taper. there is no run of illness, no bad winter, no slow decline.'),
					_('it stops on one date, and the date is not a mystery. everything on this world stops around then.'),
					_('they did not fail. they were doing the hardest thing anybody on this rock ever managed and they were still doing it when the wars reached them.'),
					_('somebody was let out, a long way from here, and this is one of the places that cost.')
				],
				notification: _('the roll of names stops on a date you have seen before'),
				onLoad: function() {
					/* Recognising what this place was, and what ended it, is
					 * the whole reward for the high road. No loot. */
					$SM.add('character.karma', 3);
				},
				buttons: {
					'condenser': {
						text: _('look at the condenser'),
						nextScene: { 1: 'condenser' }
					},
					'leave': {
						text: _('leave them to it'),
						nextScene: 'end'
					}
				}
			},

			'condenser': {
				text: function() {
					var lines = [
						_('the shed is warm and the note of it has not changed in centuries.'),
						_('the core sits behind a shield that was never meant to be opened by hand. it is alloy, and it is the size of a fist, and it is the reason the water still runs.')
					];
					if(Hazard.hasSuit()) {
						lines.push(_('the seal would come away. the suit would hold long enough.'));
					} else {
						lines.push(_('opening it bare-handed is not a decision. it is just a way of dying in a shed.'));
					}
					return lines;
				},
				notification: _('the core is alloy, and it is what keeps the water running'),
				buttons: {
					/* Gated on the suit AND on the player being somebody who
					 * would. Karma is not a difficulty setting here -- it is
					 * the question the location is asking, and a player who
					 * has been decent all run should have to work at wanting
					 * this. */
					'take': {
						text: _('take the core'),
						available: function() {
							return Hazard.hasSuit() && $SM.get('character.karma', true) < 0;
						},
						nextScene: { 1: 'took' }
					},
					'back': {
						text: _('leave it running'),
						nextScene: { 1: 'left' }
					}
				}
			},

			'took': {
				text: [
					_('the seal comes away. the note the shed has held for centuries drops, and then stops.'),
					_('the aqueduct keeps running for about a minute on what is already in it, and then it does not.'),
					_('two pieces of alloy, out of a thing that was working, in a place that was working, in the one settlement on this world where four peoples agreed on anything.'),
					_('"spend it on what will still be here after us."'),
					_('nothing here will be.')
				],
				notification: _('the condenser stops'),
				onLoad: function() {
					$SM.add('character.karma', -10);
					$SM.set('game.concordance.killed', true);
				},
				loot: {
					'alien alloy': { min: 2, max: 2, chance: 1 }
				},
				buttons: {
					'end': {
						text: _('go back to the road'),
						nextScene: 'end'
					}
				}
			},

			'left': {
				text: [
					_('the shed stays warm. the water keeps coming down off the ridge in dressed stone.'),
					_('it will go on doing that for nobody, for a long time, and then it will stop on its own.'),
					_('that is not nothing. it is the last thing on this world that four peoples built together and it is still running.')
				],
				notification: _('the water keeps running'),
				buttons: {
					'end': {
						text: _('go back to the road'),
						nextScene: 'end'
					}
				}
			}
		}
	},
	"prison": { /* The Prison */
		title: _('A Locked-Down Prison'),
		audio: AudioLibrary.LANDMARK_RUINS,
		scenes: {
			'start': {
				text: function() {
					var lines = [
						_('it is one piece. no seams, no windows, no join where a door would have to be.'),
						_('the only openings are vent slits, finger-width, and there are not many of them.'),
						_('whatever this is, it was not built to be opened from outside. it was built so that opening it would have to be a decision somebody made from within.')
					];
					if(!Prison.canEnter()) {
						lines.push(_('you walk the whole face of it twice. there is nothing here to try.'));
					}
					return lines;
				},
				notification: _('a structure with no way into it'),
				onLoad: function() {
					World.markVisited(World.curPos[0], World.curPos[1]);
				},
				buttons: {
					'open': {
						text: _('put your hands on the wall'),
						/* The Lab is the key. Before it, the player has
						 * nothing to try and the button does not exist --
						 * this is a wall to come back to, the same shape as
						 * the Lab's own door. */
						available: function() { return Prison.canEnter(); },
						nextScene: function() {
							return Prison.hasOpened() ? 'hub' : 'handprints';
						}
					},
					'leave': {
						text: _('leave'),
						nextScene: 'end'
					}
				}
			},

			'handprints': {
				text: [
					_('your hands go up before you have decided to raise them.'),
					_('not two. six. the placements are exact and they are nowhere near each other, and three of them are at heights you cannot reach.'),
					_('you stand there with both palms flat on stone that has no markings on it, and you know -- the way you know your own name, which you do not -- that this is wrong. that it is supposed to be six. that it was never a lock at all, only a thing that could not be done alone.'),
					_('the wall reads what is there and finds four fewer hands than it needs.'),
					_('and then it opens anyway, because whatever is inside recognised you before the sensors did.')
				],
				notification: _('the wall opens'),
				onLoad: function() {
					Prison.open();
					Prison.defineMazes();
				},
				buttons: {
					'in': {
						text: _('go in'),
						nextScene: { 1: 'hub' }
					}
				}
			},

			/* ---- the hub: three wings in any order ---- */
			'hub': {
				text: function() {
					var lines = [
						_('a junction, and three ways off it, and each one ends in a shape you can see from here.')
					];
					var n = Prison.crystalCount();
					if(n === 0) {
						lines.push(_('a cube. a tetrahedron. a sphere. all three older than the wanderers, and all three used since for something the wanderers needed.'));
					} else if(n < 3) {
						lines.push(_('{0} of the three are dark now. what is left is still lit.', n));
					} else {
						lines.push(_('all three are dark. and at the junction, in the floor, three recesses that were not there before -- or were, and you had no reason to look down.'));
					}
					return lines;
				},
				notification: _('three ways, and a shape at the end of each'),
				onLoad: function() { Prison.defineMazes(); },
				buttons: {
					'cube': {
						text: _('the cube'),
						available: function() { return !Prison.hasCrystal('cube'); },
						onChoose: function() { Maze.rewind('prison_cube'); },
						nextScene: { 1: 'wing_cube' }
					},
					'tetra': {
						text: _('the tetrahedron'),
						available: function() { return !Prison.hasCrystal('tetra'); },
						onChoose: function() { Maze.rewind('prison_tetra'); },
						nextScene: { 1: 'wing_tetra' }
					},
					'sphere': {
						text: _('the sphere'),
						available: function() { return !Prison.hasCrystal('sphere'); },
						onChoose: function() { Maze.rewind('prison_sphere'); },
						nextScene: { 1: 'wing_sphere' }
					},
					'core': {
						text: _('set the three in the floor'),
						available: function() { return Prison.coreUnlocked() && !Prison.hasFinalCrystal(); },
						onChoose: function() { Maze.rewind('prison_core'); },
						nextScene: { 1: 'coreOpen' }
					},
					'leave': {
						text: _('climb out'),
						nextScene: 'end'
					}
				}
			},

			'wing_cube': {
				text: [_('the corridor is square in section, exactly, and stays exactly square the whole way.')],
				onLoad: function() { Prison.defineMazes(); },
				onRender: function() { Maze.render('prison_cube', 'wing_cube'); },
				buttons: {
					'leave': { text: _('back to the junction'), nextScene: { 1: 'hub' } }
				}
			},
			'wing_tetra': {
				text: [_('the walls lean in overhead and meet. every surface is a triangle and none of them are the same triangle.')],
				onLoad: function() { Prison.defineMazes(); },
				onRender: function() { Maze.render('prison_tetra', 'wing_tetra'); },
				buttons: {
					'leave': { text: _('back to the junction'), nextScene: { 1: 'hub' } }
				}
			},
			'wing_sphere': {
				text: [_('there are no corners anywhere in this wing. the floor is the wall is the ceiling and the curve never gives you a straight line to fix on.')],
				onLoad: function() { Prison.defineMazes(); },
				onRender: function() { Maze.render('prison_sphere', 'wing_sphere'); },
				buttons: {
					'leave': { text: _('back to the junction'), nextScene: { 1: 'hub' } }
				}
			},
			/* ---- deep history: what each wing was, long before the trial ---- */
			'hist_cube': {
				text: [
					_('a hall, and in the middle of it, on a plinth, a bar of metal in a case that is still holding vacuum.'),
					_('the plates around the wall are an instruction. this bar is the length. every length in the infinite expanse was cut to match this one, and every copy was brought back here and checked against it, and the ones that had drifted were destroyed.'),
					_('a cube because a cube is what you build when a thing has to be the same from every side, and be seen to be.'),
					_('they were not measuring for the sake of it. an expanse that size only holds together if a part made at one end fits a machine at the other. this room is the reason any of it worked.'),
					_('the case is intact. the bar inside it is still exactly the length. there is nothing left anywhere to check against it.')
				],
				notification: _('the hall where a unit of measure was kept'),
				buttons: {
					'back': { text: _('go on'), nextScene: { 1: 'wing_cube' } }
				}
			},
			'hist_tetra': {
				text: [
					_('four faces, four legs into bedrock, and a table with places for eleven.'),
					_('the boards still hold the last thing written on them, and it is not an evacuation order. it is a schedule for dismantling themselves.'),
					_('the infinite expanse did not fall over. it was wound down, from this room, by people who could see it going and decided how it would go.'),
					_('a tetrahedron because it is the only shape that cannot be made to wobble, and because they knew what they were sitting in the middle of.'),
					_('the last entry is a list of what to leave behind for whoever came next. this prison is on the list. so is the observatory. so is the vein of iron you have been mining.')
				],
				notification: _('the room the expanse was wound down from'),
				buttons: {
					'back': { text: _('go on'), nextScene: { 1: 'wing_tetra' } }
				}
			},
			'hist_sphere': {
				text: [
					_('this wing is newer than the other two by an order of magnitude, and it is still very old.'),
					_('the wanderers cut it into the prison when they inherited the prison, which was not the same as being given it.'),
					_('the panels are a charter of a kind: that the fleets would go outward, that a world with people on it was still a world worth having, that this had all been agreed by people who are not named here.'),
					_('somebody has been at the last panel with a tool. the line about the people already living on those worlds is gouged out, and it was gouged out from the inside, by somebody who was locked in here.'),
					_('a sphere because a sphere has no corner to stand in and no direction to face. whoever built this wing understood exactly what they were building.')
				],
				notification: _('the wing the wanderers cut for themselves'),
				buttons: {
					'back': { text: _('go on'), nextScene: { 1: 'wing_sphere' } }
				}
			},

			/* ---- the trial cells ---- */
			'cell_cube': {
				text: [
					_('a cell, set into the wall of the assay hall, and much newer than the hall.'),
					_('somebody was held here through a trial. the marks on the floor are a man walking the same four paces for a long time.'),
					_('there is a name scratched at head height and then scratched out, thoroughly, by the same hand.'),
					_('under it, not scratched out: I COUNTERSIGNED. and beneath that, later, in a steadier hand: I WOULD AGAIN, WHICH IS THE PART THAT MATTERS.'),
					_('they kept the man who signed things in the room where the expanse decided what correct meant. somebody chose that.')
				],
				notification: _('somebody was held here through a trial'),
				buttons: {
					'back': { text: _('go on'), nextScene: { 1: 'wing_cube' } }
				}
			},
			'cell_tetra': {
				text: [
					_('this one was not walked in. it was worked in.'),
					_('whoever was held here took the cell apart and put it back together better. the bunk is reseated. the vent has been rebuilt and it draws properly now. there is a bracket in the corner that is not standard issue and is doing a job the original design got wrong.'),
					_('none of it is an escape attempt. all of it is maintenance.'),
					_('there is one line on the wall, low down, where you would only see it sitting on the floor: HE DID NOT ASK ME TO. I KNOW HE DID NOT ASK ME TO.'),
					_('they put the one who makes things stand up in the last room the old world built to stay standing. somebody chose that too.')
				],
				notification: _('this cell was repaired from the inside'),
				buttons: {
					'back': { text: _('go on'), nextScene: { 1: 'wing_tetra' } }
				}
			},
			'cell_sphere': {
				text: [
					_('there is no cell in this wing. the wing is the cell.'),
					_('no corner to put your back in. no wall to face. the curve goes on being the same curve in every direction and after a while you stop being able to say which way you came in.'),
					_('there are no marks. not one. either nobody was held here, or whoever was held here would not give it the satisfaction.'),
					_('the monks have a line about somebody weighed down with the weight of the stars, in a prison without walls. you had assumed that was a figure of speech.'),
					_('it is a description of this room. somebody told them what it was like in here, and there is only one person who could have.')
				],
				notification: _('the wing is the cell'),
				buttons: {
					'back': { text: _('go on'), nextScene: { 1: 'wing_sphere' } }
				}
			},

			/* ---- the three crystals ---- */
			'crystal_cube': {
				text: [
					_('a crystal, cut as a cube, sitting in a socket that was made for it.'),
					_('it is warm. it is the same warmth as the one in the ruins, and you already know what happens if you touch it, and you touch it.'),
					_('a room of eleven. a vote taken by people who all know each other. the word RECORD, and somebody saying that whatever else is lost, the record is not lost.'),
					_('and then it is gone, and the crystal comes out of the socket easily, as though it had been waiting to be collected.')
				],
				notification: _('the cube crystal'),
				onLoad: function() { Prison.takeCrystal('cube'); },
				buttons: {
					'back': { text: _('back to the junction'), nextScene: { 1: 'hub' } }
				}
			},
			'crystal_tetra': {
				text: [
					_('a crystal cut with four faces, in a socket at the apex where the walls meet.'),
					_('hands. not yours. good at what they are doing and doing it fast, and there is a great deal to get through and not much time.'),
					_('somebody says her name and she does not look up, and the name goes past you before you can hold on to it.'),
					_('and then it is gone, and you are holding four flat faces and you cannot say what you have just lost.')
				],
				notification: _('the tetrahedron crystal'),
				onLoad: function() { Prison.takeCrystal('tetra'); },
				buttons: {
					'back': { text: _('back to the junction'), nextScene: { 1: 'hub' } }
				}
			},
			'crystal_sphere': {
				text: [
					_('the socket is in the exact centre of the wing, on nothing, and the crystal in it is a sphere.'),
					_('you are standing where you are standing now. the room is the same room. it is lit the same way.'),
					_('there is nothing else in the memory. no sound, no other person, no before or after. just this room, from inside, for what the memory insists was a very long time.'),
					_('and then it is gone, and your hand closes on it, and you are shaking and cannot immediately say why.')
				],
				notification: _('the sphere crystal'),
				onLoad: function() { Prison.takeCrystal('sphere'); },
				buttons: {
					'back': { text: _('back to the junction'), nextScene: { 1: 'hub' } }
				}
			},
			/* ---- the wardens ----
			 * Energy constructs like the Lab's, tuned harder: this is the
			 * last location in the game and sits behind both the Executioner
			 * upgrades and the Lab. */
			'fight_cube': {
				combat: true,
				notification: _('something that was standing very still stops standing very still'),
				enemy: 'assay warden', enemyName: _('assay warden'),
				chara: '\u25A0', damage: 14, hit: 0.85, attackDelay: 1.8,
				health: 160, ranged: true,
				specials: [{ delay: 7, action: (f) => { Events.setStatus(f, 'shield'); return _('field up'); } }],
				loot: { 'energy cell': { min: 8, max: 16, chance: 1 }, 'alien alloy': { min: 1, max: 2, chance: 0.5 } },
				buttons: { 'continue': { text: _('go on'), cooldown: Events._LEAVE_COOLDOWN, nextScene: { 1: 'wing_cube' } } }
			},
			'fight_tetra': {
				combat: true,
				notification: _('it unfolds out of a corner that did not have room for it'),
				enemy: 'lattice warden', enemyName: _('lattice warden'),
				chara: '\u25B2', damage: 15, hit: 0.85, attackDelay: 1.7,
				health: 170, ranged: true,
				specials: [
					{ delay: 6, action: (f) => { Events.setStatus(f, 'energised'); return _('charging'); } },
					{ delay: 11, action: (f) => { Events.setStatus(f, 'brittle'); return _('venting'); } }
				],
				loot: { 'energy cell': { min: 8, max: 18, chance: 1 }, 'alien alloy': { min: 1, max: 2, chance: 0.6 } },
				buttons: { 'continue': { text: _('go on'), cooldown: Events._LEAVE_COOLDOWN, nextScene: { 1: 'wing_tetra' } } }
			},
			'fight_sphere': {
				combat: true,
				notification: _('it comes around the curve and it was always going to'),
				enemy: 'hollow warden', enemyName: _('hollow warden'),
				chara: '\u25CF', damage: 16, hit: 0.85, attackDelay: 1.6,
				health: 185, ranged: true,
				specials: [
					{ delay: 6, action: (f) => { Events.setStatus(f, 'regenerating'); return _('reknitting'); } },
					{ delay: 10, action: (f) => { Events.setStatus(f, 'energised'); return _('charging'); } }
				],
				loot: { 'energy cell': { min: 10, max: 20, chance: 1 }, 'alien alloy': { min: 2, max: 3, chance: 0.7 } },
				buttons: { 'continue': { text: _('go on'), cooldown: Events._LEAVE_COOLDOWN, nextScene: { 1: 'wing_sphere' } } }
			},

			/* ---- the core ---- */
			'coreOpen': {
				text: [
					_('the three go into the floor and sit flush, and nothing happens for long enough that you start to feel foolish.'),
					_('then the junction floor withdraws, all of it at once, and there are stairs, and they go down a very long way.'),
					_('the air coming up is old in a way the rest of this place is not. nothing has breathed it.')
				],
				notification: _('the floor opens'),
				onLoad: function() { Prison.defineMazes(); },
				buttons: {
					'down': { text: _('go down'), nextScene: { 1: 'wing_core' } }
				}
			},
			'wing_core': {
				text: [_('one corridor. it does not branch, and it is much longer than the building above it should allow.')],
				onLoad: function() { Prison.defineMazes(); },
				onRender: function() { Maze.render('prison_core', 'wing_core'); },
				buttons: {
					'leave': { text: _('go back up'), nextScene: { 1: 'hub' } }
				}
			},

			'profane': {
				text: [
					_('the cell at the end is not built like the others. the others were built to hold somebody in.'),
					_('this one was built to keep everything else out. the shielding is on the inner face. the vents run one way. there is a seat, bolted down, facing a wall with nothing on it, and the wall is six feet thick.'),
					_('nothing in here is designed to stop a person leaving. all of it is designed to stop a person being HEARD.'),
					_('there are records, and the records are not a criminal file. they are a transcript, and the transcript is mostly other people.'),
					_('the profane never raised a hand. not once, in any of it. the file is very clear about that and it is the reason the file exists -- they could not charge them with anything they had done.'),
					_('what they did was talk. they were the best anyone had ever met at it, and they were a telepath, and they could see the roads a thing might go down before anybody set out on any of them.'),
					_('they would find the one road that ended in blood, and show it to somebody, and make it look like the only road there was. and then that person would walk it and believe the whole way that they had chosen.'),
					_('the last section is your own testimony. you gave it before the trial, and it is one line long, and you have not read it in four hundred centuries.'),
					_('"THEY SHOWED ME A THING THAT CANNOT BE TRUE. I KNEW IT WAS TRUE THE MOMENT I SAW IT. I HAVE NOT BEEN ABLE TO PUT IT DOWN SINCE."'),
					_('that is why you came here. not to free them. to ask them whether it was still true.')
				],
				notification: _('the cell of the profane'),
				onLoad: function() { World.clearDungeon(); },
				buttons: {
					'crystal': {
						text: _('there is one more crystal'),
						nextScene: { 1: 'lastCrystal' }
					}
				}
			},

			'lastCrystal': {
				text: [
					_('it is in the seat. not in a socket -- in the seat, where somebody sat holding it, waiting.'),
					_('it is not cut to a shape. it is the wrong colour for a crystal and the wrong weight for its size, and it is not warm.'),
					_('you get the gloves out of the pack without deciding to. you have handled every other one of these barehanded and you are not going to handle this one barehanded and you could not tell anybody why.'),
					_('through two layers of leather you can feel it doing something. not to your hand. further in.'),
					_('you put it in the bottom of the pack, under everything, and you do not touch it again.'),
					_('not here. not yet. not until there is nowhere left to go and no reason not to know.')
				],
				notification: _('you take it with gloves on'),
				onLoad: function() {
					Prison.takeFinalCrystal();
				},
				buttons: {
					'end': {
						text: _('climb out'),
						nextScene: 'end'
					}
				}
			}
		}
	},
	"cave": { /* Cave */
		title: _('A Damp Cave'),
		scenes: {
			'start': {
				text: [
					_('the mouth of the cave is wide and dark.'),
					_("can't see what's inside.")
				],
				notification: _('the earth here is split, as if bearing an ancient wound'),
				buttons: {
					'enter': {
						text: _('go inside'),
						cost: { torch: 1 },
						nextScene: {0.3: 'a1', 0.6: 'a2', 1: 'a3'}
					},
					'leave': {
						text: _('leave'),
						nextScene: 'end'
					}
				}
			},
			
			'a1': {
				combat: true,
				enemy: 'beast',
				chara: 'R',
				damage: 1,
				hit: 0.8,
				attackDelay: 1,
				health: 5,
				notification: _('a startled beast defends its home'),
				loot: {
					'fur': {
						min: 1,
						max: 10,
						chance: 1
					},
					'teeth': {
						min: 1,
						max: 5,
						chance: 0.8
					}
				},
				buttons: {
					'continue': {
						text: _('continue'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: {0.5: 'b1', 1: 'b2'}
					},
					'leave': {
						text: _('leave cave'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'a2': {
				text: [
					_('the cave narrows a few feet in.'),
					_("the walls are moist and moss-covered")
				],
				buttons: {
					'continue': {
						text: _('squeeze'),
						nextScene: {0.5: 'b2', 1: 'b3'}
					},
					'leave': {
						text: _('leave cave'),
						nextScene: 'end'
					}
				}
			},
			'a3': {
				text: [
					_('the remains of an old camp sits just inside the cave.'),
					_('bedrolls, torn and blackened, lay beneath a thin layer of dust.')
				],
				loot: {
					'cured meat': {
						min: 1,
						max: 5,
						chance: 1
					},
					'torch': {
						min: 1,
						max: 5,
						chance: 0.5
					},
					'leather': {
						min: 1,
						max: 5,
						chance: 0.3
					}
				},
				buttons: {
					'continue': {
						text: _('continue'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: {0.5: 'b3', 1: 'b4'}
					},
					'leave': {
						text: _('leave cave'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'b1': {
				text: [
					_('the body of a wanderer lies in a small cavern.'),
					_("rot's been to work on it, and some of the pieces are missing."),
                    /// TRANSLATORS : 'it' is a rotting wanderer's body
					_("can't tell what left it here.")
				],
				loot: {
					'iron sword': {
						min: 1,
						max: 1,
						chance: 1
					},
					'cured meat': {
						min: 1,
						max: 5,
						chance: 0.8
					},
					'torch': {
						min: 1,
						max: 3,
						chance: 0.5
					},
					'medicine': {
					min: 1,
					max: 2,
					chance: 0.1
					}
				},
				buttons: {
					'continue': {
						text: _('continue'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: { 1: 'c1' }
					},
					'leave': {
						text: _('leave cave'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'b2': {
				text: [
					_('the torch sputters and dies in the damp air'),
					_('the darkness is absolute')
				],
				notification: _('the torch goes out'),
				buttons: {
					'continue': {
						text: _('continue'),
						cost: {'torch': 1},
						nextScene: { 1: 'c1' }
					},
					'leave': {
						text: _('leave cave'),
						nextScene: 'end'
					}
				}
			},
			'b3': {
				combat: true,
				enemy: 'beast',
				chara: 'R',
				damage: 1,
				hit: 0.8,
				attackDelay: 1,
				health: 5,
				notification: _('a startled beast defends its home'),
				loot: {
					'fur': {
						min: 1,
						max: 3,
						chance: 1
					},
					'teeth': {
						min: 1,
						max: 2,
						chance: 0.8
					}
				},
				buttons: {
					'continue': {
						text: _('continue'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: {1: 'c2'}
					},
					'leave': {
						text: _('leave cave'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'b4': {
				combat: true,
				enemy: 'cave lizard',
				chara: 'R',
				damage: 3,
				hit: 0.8,
				attackDelay: 2,
				health: 6,
				notification: _('a cave lizard attacks'),
				loot: {
					'scales': {
						min: 1,
						max: 3,
						chance: 1
					},
					'teeth': {
						min: 1,
						max: 2,
						chance: 0.8
					}
				},
				buttons: {
					'continue': {
						text: _('continue'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: {1: 'c2'}
					},
					'leave': {
						text: _('leave cave'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'c1': {
				combat: true,
				enemy: 'beast',
				chara: 'R',
				damage: 3,
				hit: 0.8,
				attackDelay: 2,
				health: 10,
				notification: _('a large beast charges out of the dark'),
				loot: {
					'fur': {
						min: 1,
						max: 3,
						chance: 1
					},
					'teeth': {
						min: 1,
						max: 3,
						chance: 1
					}
				},
				buttons: {
					'continue': {
						text: _('continue'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: {0.5: 'end1', 1: 'end2'}
					},
					'leave': {
						text: _('leave cave'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'c2': {
				combat: true,
				enemy: 'lizard',
				chara: 'T',
				damage: 4,
				hit: 0.8,
				attackDelay: 2,
				health: 10,
				notification: _('a giant lizard shambles forward'),
				loot: {
					'scales': {
						min: 1,
						max: 3,
						chance: 1
					},
					'teeth': {
						min: 1,
						max: 3,
						chance: 1
					}
				},
				buttons: {
					'continue': {
						text: _('continue'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: {0.7: 'end2', 1: 'end3'}
					},
					'leave': {
						text: _('leave cave'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'end1': {
				text: [
					_('the nest of a large animal lies at the back of the cave.')
				],
				onLoad: function() {
					World.clearDungeon();
				},
				loot: {
					'meat': {
						min: 5,
						max: 10,
						chance: 1
					},
					'fur': {
						min: 5,
						max: 10,
						chance: 1
					},
					'scales': {
						min: 5,
						max: 10,
						chance: 1
					},
					'teeth': {
						min: 5,
						max: 10,
						chance: 1
					},
					'cloth': {
						min: 5,
						max: 10,
						chance: 0.5
					}
				},
				buttons: {
					'leave': {
						text: _('leave cave'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'end2': {
				text: [
					_('a small supply cache is hidden at the back of the cave.')
				],
				loot: {
					'cloth': {
						min: 5,
						max: 10,
						chance: 1
					},
					'leather': {
						min: 5,
						max: 10,
						chance: 1
					},
					'iron': {
						min: 5,
						max: 10,
						chance: 1
					},
					'cured meat': {
						min: 5,
						max: 10,
						chance: 1
					},
					'steel': {
						min: 5,
						max: 10,
						chance: 0.5
					},
					'bolas': {
						min: 1,
						max: 3,
						chance: 0.3
					},
					'medicine': {
						min: 1,
						max: 4,
						chance: 0.15
					}
				},
				onLoad: function() {
					World.clearDungeon();
				},
				buttons: {
					'leave': {
						text: _('leave cave'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'end3': {
				text: [
					_('an old case is wedged behind a rock, covered in a thick layer of dust.')
				],
				loot: {
					'steel sword': {
						min: 1,
						max: 1,
						chance: 1
					},
					'bolas': {
						min: 1,
						max: 3,
						chance: 0.5
					},
					'medicine': {
						min: 1,
						max: 3,
						chance: 0.3
					}
				},
				onLoad: function() {
					World.clearDungeon();
				},
				buttons: {
					'leave': {
						text: _('leave cave'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.LANDMARK_CAVE
	},
	"town": { /* Town */
		title: _('A Deserted Town'),
		scenes: {
			'start': {
				text: [
					_('a small suburb lays ahead, empty houses scorched and peeling.'),
					_("broken streetlights stand, rusting. light hasn't graced this place in a long time.")
				],
				notification: _("the town lies abandoned, its citizens long dead"),
				buttons: {
					'enter': {
						text: _('explore'),
						nextScene: {0.3: 'a1', 0.7: 'a3', 1: 'a2'}
					},
					'leave': {
						text: _('leave'),
						nextScene: 'end'
					}
				}
			},
			
			'a1': {
				text: [
					_("where the windows of the schoolhouse aren't shattered, they're blackened with soot."),
					_('the double doors creak endlessly in the wind.')
				],
				buttons: {
					'enter': {
						text: _('enter'),
						nextScene: {0.5: 'b1', 1: 'b2'},
						cost: {torch: 1}
					},
					'leave': {
						text: _('leave town'),
						nextScene: 'end'
					}
				}
			},
			
			'a2': {
				combat: true,
				enemy: 'thug',
				chara: 'E',
				damage: 4,
				hit: 0.8,
				attackDelay: 2,
				specials: [
					{
						delay: 6,
						action: (fighter) => {
							Events.setStatus(fighter, 'enraged');
							return _('furious');
						}
					}
				],
				health: 30,
				loot: {
					'cloth': {
						min: 5,
						max: 10,
						chance: 0.8
					},
					'leather': {
						min: 5,
						max: 10,
						chance: 0.8
					},
					'cured meat': {
						min: 1,
						max: 5,
						chance: 0.5
					}
				},
				notification: _('ambushed on the street.'),
				buttons: {
					'continue': {
						text: _('continue'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: {0.5: 'b3', 1: 'b4'}
					},
					'leave': {
						text: _('leave town'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'a3': {
				text: [
					_("a squat building up ahead."),
					_('a green cross barely visible behind grimy windows.')
				],
				buttons: {
					'enter': {
						text: _('enter'),
						nextScene: {0.5: 'b5', 1: 'end5'},
						cost: {torch: 1}
					},
					'leave': {
						text: _('leave town'),
						nextScene: 'end'
					}
				}
			},
			'b1': {
				text: [
					_('a small cache of supplies is tucked inside a rusting locker.')
				],
				loot: {
					'cured meat': {
						min: 1,
						max: 5,
						chance: 1
					},
					'torch': {
						min: 1,
						max: 3,
						chance: 0.8
					},
					'bullets': {
						min: 1,
						max: 5,
						chance: 0.3
					},
					'medicine': {
						min: 1,
						max: 3,
						chance: 0.05
					}
			},
			buttons: {
					'continue': {
						text: _('continue'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: {0.5: 'c1', 1: 'c2'}
					},
					'leave': {
						text: _('leave town'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'b2': {
				combat: true,
				enemy: 'scavenger',
				chara: 'E',
				damage: 4,
				hit: 0.8,
				attackDelay: 2,
				specials: [
					{
						delay: 7,
						action: () => {
							const player = $('#wanderer');
							Events.setStatus(player, 'blinded');
							Events.updateFighterDiv(player);
							return _('kicks up grit');
						}
					}
				],
				health: 30,
				loot: {
					'cloth': {
						min: 5,
						max: 10,
						chance: 0.8
					},
					'leather': {
						min: 5,
						max: 10,
						chance: 0.8
					},
					'cured meat': {
						min: 1,
						max: 5,
						chance: 0.5
					}
				},
				notification: _('a scavenger waits just inside the door.'),
				buttons: {
					'continue': {
						text: _('continue'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: {0.5: 'c2', 1: 'c3'}
					},
					'leave': {
						text: _('leave town'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'b3': {
				combat: true,
				enemy: 'beast',
				chara: 'R',
				damage: 3,
				hit: 0.8,
				attackDelay: 1,
				specials: [
					{
						delay: 6,
						action: (fighter) => {
							Events.setStatus(fighter, 'enraged');
							return _('snarling');
						}
					}
				],
				health: 25,
				loot: {
					'teeth': {
						min: 1,
						max: 5,
						chance: 1
					},
					'fur': {
						min: 5,
						max: 10,
						chance: 1
					}
				},
				notification: _('a beast stands alone in an overgrown park.'),
				buttons: {
					'continue': {
						text: _('continue'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: {0.5: 'c4', 1: 'c5'}
					},
					'leave': {
						text: _('leave town'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'b4': {
				text: [
					_('an overturned caravan is spread across the pockmarked street.'),
					_("it's been picked over by scavengers, but there's still some things worth taking.")
				],
				loot: {
					'cured meat': {
						min: 1,
						max: 5,
						chance: 0.8
					},
					'torch': {
						min: 1,
						max: 3,
						chance: 0.5
					},
					'bullets': {
						min: 1,
						max: 5,
						chance: 0.3
					},
					'medicine': {
						min: 1,
						max: 3,
						chance: 0.1
					}
				},
				buttons: {
					'continue': {
						text: _('continue'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: {0.5: 'c5', 1: 'c6' }
					},
					'leave': {
						text: _('leave town'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'b5': {
				combat: true,
				enemy: 'madman',
				chara: 'E',
				damage: 6,
				hit: 0.3,
				attackDelay: 1,
				health: 10,
				loot: {
					'cloth': {
						min: 2,
						max: 4,
						chance: 0.3
					},
					'cured meat': {
						min: 1,
						max: 5,
						chance: 0.9
					},
					'medicine': {
						min: 1,
						max: 2,
						chance: 0.4
					}
				},
				notification: _('a madman attacks, screeching.'),
				buttons: {
					'continue': {
						text: _('continue'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: {0.3: 'end5', 1: 'end6'}
					},
					'leave': {
						text: _('leave town'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'c1': {
				combat: true,
				enemy: 'thug',
				chara: 'E',
				damage: 4,
				hit: 0.8,
				attackDelay: 2,
				specials: [
					{
						delay: 7,
						action: (fighter) => {
							Events.setStatus(fighter, 'brittle');
							return _('overreaches');
						}
					}
				],
				health: 30,
				loot: {
					'cloth': {
						min: 5,
						max: 10,
						chance: 0.8
					},
					'leather': {
						min: 5,
						max: 10,
						chance: 0.8
					},
					'cured meat': {
						min: 1,
						max: 5,
						chance: 0.5
					}
				},
				notification: _('a thug moves out of the shadows.'),
				buttons: {
					'continue': {
						text: _('continue'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: {1: 'd1'}
					},
					'leave': {
						text: _('leave town'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'c2': {
				combat: true,
				enemy: 'beast',
				chara: 'R',
				damage: 3,
				hit: 0.8,
				attackDelay: 1,
				specials: [
					{
						delay: 6,
						action: (fighter) => {
							Events.setStatus(fighter, 'venomous');
							return _('filthy bite');
						}
					}
				],
				health: 25,
				loot: {
					'teeth': {
						min: 1,
						max: 5,
						chance: 1
					},
					'fur': {
						min: 5,
						max: 10,
						chance: 1
					}
				},
				notification: _('a beast charges out of a ransacked classroom.'),
				buttons: {
					'continue': {
						text: _('continue'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: {1: 'd1'}
					},
					'leave': {
						text: _('leave town'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'c3': {
				text: [
					_('through the large gymnasium doors, footsteps can be heard.'),
					_('the torchlight casts a flickering glow down the hallway.'),
					_('the footsteps stop.')
				],
				buttons: {
					'continue': {
						text: _('enter'),
						nextScene: {1: 'd1'}
					},
					'leave': {
						text: _('leave town'),
						nextScene: 'end'
					}
				}
			},
			'c4': {
				combat: true,
				enemy: 'beast',
				chara: 'R',
				damage: 4,
				hit: 0.8,
				attackDelay: 1,
				specials: [
					{
						delay: 7,
						action: (fighter) => {
							Events.setStatus(fighter, 'enraged');
							return _('frenzied');
						}
					}
				],
				health: 25,
				loot: {
					'teeth': {
						min: 1,
						max: 5,
						chance: 1
					},
					'fur': {
						min: 5,
						max: 10,
						chance: 1
					}
				},
				notification: _('another beast, drawn by the noise, leaps out of a copse of trees.'),
				buttons: {
					'continue': {
						text: _('continue'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: {1: 'd2'}
					},
					'leave': {
						text: _('leave town'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'c5': {
				text: [
					_("something's causing a commotion a ways down the road."),
					_("a fight, maybe.")
				],
				buttons: {
					'continue': {
						text: _('continue'),
						nextScene: {1: 'd2'}
					},
					'leave': {
						text: _('leave town'),
						nextScene: 'end'
					}
				}
			},
			'c6': {
				text: [
					_('a small basket of food is hidden under a park bench, with a note attached.'),
					_("can't read the words.")
				],
				loot: {
					'cured meat': {
						min: 1,
						max: 5,
						chance: 1
					}
				},
				buttons: {
					'continue': {
						text: _('continue'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: {1: 'd2'}
					},
					'leave': {
						text: _('leave town'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'd1': {
				combat: true,
				enemy: 'scavenger',
				chara: 'E',
				damage: 5,
				hit: 0.8,
				attackDelay: 2,
				specials: [
					{
						delay: 8,
						action: (fighter) => {
							Events.setStatus(fighter, 'shield');
							return _('scrap plating');
						}
					}
				],
				health: 30,
				loot: {
					'cured meat': {
						min: 1,
						max: 5,
						chance: 1
					},
					'leather': {
						min: 5,
						max: 10,
						chance: 0.8
					},
					'steel sword': {
						min: 1,
						max: 1,
						chance: 0.5
					}
				},
				notification: _('a panicked scavenger bursts through the door, screaming.'),
				buttons: {
					'continue': {
						text: _('continue'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: {0.5: 'end1', 1: 'end2'}
					},
					'leave': {
						text: _('leave town'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'd2': {
				combat: true,
				enemy: 'vigilante',
				chara: 'D',
				damage: 6,
				hit: 0.8,
				attackDelay: 2,
				specials: [
					{
						delay: 7,
						action: (fighter) => {
							Events.setStatus(fighter, 'energised');
							return _('winds up');
						}
					}
				],
				health: 30,
				loot: {
					'cured meat': {
						min: 1,
						max: 5,
						chance: 1
					},
					'leather': {
						min: 5,
						max: 10,
						chance: 0.8
					},
					'steel sword': {
						min: 1,
						max: 1,
						chance: 0.5
					}
				},
				notification: _("a man stands over a dead wanderer. notices he's not alone."),
				buttons: {
					'continue': {
						text: _('continue'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: {0.5: 'end3', 1: 'end4'}
					},
					'leave': {
						text: _('leave town'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'end1': {
				text: [
					_('scavenger had a small camp in the school.'),
					_('collected scraps spread across the floor like they fell from heaven.')
				],
				onLoad: function() {
					World.clearDungeon();
				},
				loot: {
					'steel sword': {
						min: 1,
						max: 1,
						chance: 1
					},
					'steel': {
						min: 5,
						max: 10,
						chance: 1
					},
					'cured meat': {
						min: 5,
						max: 10,
						chance: 1
					},
					'bolas': {
						min: 1,
						max: 5,
						chance: 0.5
					},
					'medicine': {
						min: 1,
						max: 2,
						chance: 0.3
					}
				},
				buttons: {
					'leave': {
						text: _('leave town'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'end2': {
				text: [
					_("scavenger'd been looking for supplies in here, it seems."),
					_("a shame to let what he'd found go to waste.")
				],
				onLoad: function() {
					World.clearDungeon();
				},
				loot: {
					'coal': {
						min: 5,
						max: 10,
						chance: 1
					},
					'cured meat': {
						min: 5,
						max: 10,
						chance: 1
					},
					'leather': {
						min: 5,
						max: 10,
						chance: 1
					}
				},
				buttons: {
					'leave': {
						text: _('leave town'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'end3': {
				text: [
					_("beneath the wanderer's rags, clutched in one of its many hands, a glint of steel."),
					_("worth killing for, it seems.")
				],
				onLoad: function() {
					World.clearDungeon();
				},
				loot: {
					'rifle': {
						min: 1,
						max: 1,
						chance: 1
					},
					'bullets': {
						min: 1,
						max: 5,
						chance: 1
					}
				},
				buttons: {
					'leave': {
						text: _('leave town'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'end4': {
				text: [
					_("eye for an eye seems fair."),
					_("always worked before, at least."),
					_("picking the bones finds some useful trinkets.")
				],
				onLoad: function() {
					World.clearDungeon();
				},
				loot: {
					'cured meat': {
						min: 5,
						max: 10,
						chance: 1
					},
					'iron': {
						min: 5,
						max: 10,
						chance: 1
					},
					'torch': {
						min: 1,
						max: 5,
						chance: 1
					},
					'bolas': {
						min: 1,
						max: 5,
						chance: 0.5
					},
					'medicine': {
					min: 1,
					max: 2,
					chance: 0.1
					}
				},
				buttons: {
					'leave': {
						text: _('leave town'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'end5': {
				text: [
					_('some medicine abandoned in the drawers.')
				],
				onLoad: function() {
					World.clearDungeon();
				},
				loot: {
					'medicine': {
						min: 2,
						max: 5,
						chance: 1
					}
				},
				buttons: {
					'leave': {
						text: _('leave town'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'end6': {
				text: [
					_('the clinic has been ransacked.'),
					_('only dust and stains remain.')
				],
				onLoad: function() {
					World.clearDungeon();
				},
				buttons: {
					'leave': {
						text: _('leave town'),

						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.LANDMARK_TOWN
	},
	"city": { /* City */
		title: _('A Ruined City'),
		scenes: {
			'start': {
				text: [
					_('a battered highway sign stands guard at the entrance to this once-great city.'),
					_("the towers that haven't crumbled jut from the landscape like the ribcage of some ancient beast."),
					_('might be things worth having still inside.')
				],
				notification: _("the towers of a decaying city dominate the skyline"),
				buttons: {
					'enter': {
						text: _('explore'),
						nextScene: {0.2: 'a1', 0.5: 'a2', 0.8: 'a3', 1: 'a4'}
					},
					'leave': {
						text: _('leave'),
						nextScene: 'end'
					}
				}
			},
			'a1': {
				text:[
					_('the streets are empty.'),
					_('the air is filled with dust, driven relentlessly by the hard winds.')
				],
				buttons: {
					'continue': {
						text: _('continue'),
						nextScene: {0.5: 'b1', 1: 'b2'}
					},
					'leave': {
						text: _('leave city'),
						nextScene: 'end'
					}
				}
			},
			'a2': {
				text:[
					_('orange traffic cones are set across the street, faded and cracked.'),
					_('lights flash through the alleys between buildings.')
				],
				buttons: {
					'continue': {
						text: _('continue'),
						nextScene: {0.5: 'b3', 1: 'b4'}
					},
					'leave': {
						text: _('leave city'),
						nextScene: 'end'
					}
				}
			},
			'a3': {
				text: [
					_('a large shanty town sprawls across the streets.'),
					_('faces, darkened by soot and blood, stare out from crooked huts.')
				],
				buttons: {
					'continue': {
						text: _('continue'),
						nextScene: {0.5: 'b5', 1: 'b6'}
					},
					'leave': {
						text: _('leave city'),
						nextScene: 'end'
					}
				}
			},
			'a4': {
				text: [
					_('the shell of an abandoned hospital looms ahead.')
				],
				buttons: {
					'enter': {
						text: _('enter'),
						cost: { 'torch': 1 },
						nextScene: {0.5: 'b7', 1: 'b8'}
					},
					'leave': {
						text: _('leave city'),
						nextScene: 'end'
					}
				}
			},
			'b1': {
				text: [
					_('the old tower seems mostly intact.'),
					_('the shell of a burned out car blocks the entrance.'),
					_('most of the windows at ground level are busted anyway.')
				],
				buttons: {
					'enter': {
						text: _('enter'),
						nextScene: {0.5: 'c1', 1: 'c2'}
					},
					'leave': {
						text: _('leave city'),
						nextScene: 'end'
					}
				}
			},
			'b2': {
				combat: true,
				notification: _('a huge lizard scrambles up out of the darkness of an old metro station.'),
				enemy: 'lizard',
				chara: 'R',
				damage: 5,
				hit: 0.8,
				attackDelay: 2,
				specials: [
					{
						delay: 6,
						action: (fighter) => {
							Events.setStatus(fighter, 'venomous');
							return _('venom');
						}
					}
				],
				health: 20,
				loot: {
					'scales': {
						min: 5,
						max: 10,
						chance: 0.8
					},
					'teeth': {
						min: 5,
						max: 10,
						chance: 0.5
					},
					'meat': {
						min: 5,
						max: 10,
						chance: 0.8
					}
				},
				buttons: {
					'descend': {
						text: _('descend'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: {0.5: 'c2', 1: 'c3'}
					},
					'leave': {
						text: _('leave city'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'b3': {
				notification: _('the shot echoes in the empty street.'),
				combat: true,
				enemy: 'sniper',
				chara: 'D',
				damage: 15,
				hit: 0.8,
				attackDelay: 4,
				specials: [
					{
						delay: 8,
						action: (fighter) => {
							Events.setStatus(fighter, 'shield');
							return _('takes cover');
						}
					}
				],
				health: 30,
				ranged: true,
				loot: {
					'cured meat': {
						min: 1,
						max: 5,
						chance: 0.8
					},
					'bullets': {
						min: 1,
						max: 5,
						chance: 0.5
					},
					'rifle': {
						min: 1,
						max: 1,
						chance: 0.2
					}
				},
				buttons: {
					'continue': {
						text: _('continue'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: {0.5: 'c4', 1: 'c5'}
					},
					'leave': {
						text: _('leave city'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'b4': {
				notification: _('the soldier steps out from between the buildings, rifle raised.'),
				combat: true,
				enemy: 'soldier',
				ranged: true,
				chara: 'D',
				damage: 8,
				hit: 0.8,
				attackDelay: 2,
				specials: [
					{
						delay: 8,
						action: (fighter) => {
							Events.setStatus(fighter, 'shield');
							return _('armour holds');
						}
					}
				],
				health: 50,
				loot: {
					'cured meat': {
						min: 1,
						max: 5,
						chance: 0.8
					},
					'bullets': {
						min: 1,
						max: 5,
						chance: 0.5
					},
					'rifle': {
						min: 1,
						max: 1,
						chance: 0.2
					}
				},
				buttons: {
					'continue': {
						text: _('continue'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: {0.5: 'c5', 1: 'c6'}
					},
					'leave': {
						text: _('leave city'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'b5': {
				notification: _('a frail man stands defiantly, blocking the path.'),
				combat: true,
				enemy: 'frail man',
				chara: 'E',
				damage: 1,
				hit: 0.8,
				attackDelay: 2,
				health: 10,
				loot: {
					'cured meat': {
						min: 1,
						max: 5,
						chance: 0.8
					},
					'cloth': {
						min: 1,
						max: 5,
						chance: 0.5
					},
					'leather': {
						min: 1,
						max: 1,
						chance: 0.2
					},
					'medicine': {
						min: 1,
						max: 3,
						chance: 0.05
					}
				},
				buttons: {
					'continue': {
						text: _('continue'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: {0.5: 'c7', 1: 'c8'}
					},
					'leave': {
						text: _('leave city'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'b6': {
				text: [
					_('nothing but downcast eyes.'),
					_('the people here were broken a long time ago.')
				],
				buttons: {
					'continue': {
						text: _('continue'),
						nextScene: {0.5: 'c8', 1: 'c9'}
					},
					'leave': {
						text: _('leave city'),
						nextScene: 'end'
					}
				}
			},
			'b7': {
				text: [
					_('empty corridors.'),
					_('the place has been swept clean by scavengers.')
				],
				buttons: {
					'continue': {
						text: _('continue'),
						nextScene: {0.3: 'c12', 0.7: 'c10', 1: 'c11'}
					},
					'leave': {
						text: _('leave city'),
						nextScene: 'end'
					}
				}
			},
			'b8': {
				notification: _('an old man bursts through a door, wielding a scalpel.'),
				combat: true,
				enemy: 'old man',
				chara: 'E',
				damage: 3,
				hit: 0.5,
				attackDelay: 2,
				health: 10,
				loot: {
					'cured meat': {
						min: 1,
						max: 3,
						chance: 0.5
					},
					'cloth': {
						min: 1,
						max: 5,
						chance: 0.8
					},
					'medicine': {
						min: 1,
						max: 2,
						chance: 0.5
					}
				},
				buttons: {
					'continue': {
						text: _('continue'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: {0.3: 'c13', 0.7: 'c11', 1: 'end15'}
					},
					'leave': {
						text: _('leave city'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'c1': {
				notification: _('a thug is waiting on the other side of the wall.'),
				combat: true,
				enemy: 'thug',
				chara: 'E',
				damage: 3,
				hit: 0.8,
				attackDelay: 2,
				specials: [
					{
						delay: 7,
						action: (fighter) => {
							Events.setStatus(fighter, 'brittle');
							return _('overreaches');
						}
					}
				],
				health: 30,
				loot: {
					'steel sword': {
						min: 1,
						max: 1,
						chance: 0.5
					},
					'cured meat': {
						min: 1,
						max: 3,
						chance: 0.5
					},
					'cloth': {
						min: 1,
						max: 5,
						chance: 0.8
					}
				},
				buttons: {
					'continue': {
						text: _('continue'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: {0.5: 'd1', 1: 'd2'}
					},
					'leave': {
						text: _('leave city'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			
			'c2': {
				notification: _('a snarling beast jumps out from behind a car.'),
				combat: true,
				enemy: 'beast',
				chara: 'R',
				damage: 2,
				hit: 0.8,
				attackDelay: 1,
				specials: [
					{
						delay: 6,
						action: (fighter) => {
							Events.setStatus(fighter, 'enraged');
							return _('snarling');
						}
					}
				],
				health: 30,
				loot: {
					'meat': {
						min: 1,
						max: 5,
						chance: 0.8
					},
					'fur': {
						min: 1,
						max: 5,
						chance: 0.8
					},
					'teeth': {
						min: 1,
						max: 5,
						chance: 0.5
					}
				},
				buttons: {
					'continue': {
						text: _('continue'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: {1: 'd2'}
					},
					'leave': {
						text: _('leave city'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			
			'c3': {
				text: [
					_('street above the subway platform is blown away.'),
					_('lets some light down into the dusty haze.'),
					_('a sound comes from the tunnel, just ahead.')
				],
				buttons: {
					'enter': {
						text: _('investigate'),
						cost: { 'torch': 1 },
						nextScene: {0.5: 'd2', 1: 'd3'}
					},
					'leave': {
						text: _('leave city'),
						nextScene: 'end'
					}
				}
			},
			
			'c4': {
				text: [
					_('looks like a camp of sorts up ahead.'),
                    /// TRANSLATORS : chainlink is a type of metal fence.
					_('rusted chainlink is pulled across an alleyway.'),
					_('fires burn in the courtyard beyond.')
				],
				buttons: {
					'enter': {
						text: _('continue'),
						nextScene: {0.5: 'd4', 1: 'd5'}
					},
					'leave': {
						text: _('leave city'),
						nextScene: 'end'
					}
				}
			},
			
			'c5': {
				text: [
					_('more voices can be heard ahead.'),
					_('they must be here for a reason.')
				],
				buttons: {
					'enter': {
						text: _('continue'),
						nextScene: {1: 'd5'}
					},
					'leave': {
						text: _('leave city'),
						nextScene: 'end'
					}
				}
			},
			
			'c6': {
				text: [
					_('the sound of gunfire carries on the wind.'),
					_('the street ahead glows with firelight.')
				],
				buttons: {
					'enter': {
						text: _('continue'),
						nextScene: {0.5: 'd5', 1: 'd6'}
					},
					'leave': {
						text: _('leave city'),
						nextScene: 'end'
					}
				}
			},
			
			'c7': {
				text: [
                    /// TRANSLATORS : squatters occupy abandoned dwellings they don't own.
					_('more squatters are crowding around now.'),
					_('someone throws a stone.')
				],
				buttons: {
					'enter': {
						text: _('continue'),
						nextScene: {0.5: 'd7', 1: 'd8'}
					},
					'leave': {
						text: _('leave city'),
						nextScene: 'end'
					}
				}
			},
			
			'c8': {
				text: [
					_('an improvised shop is set up on the sidewalk.'),
					_('the owner stands by, stoic.')
				],
				loot: {
					'steel sword': {
						min: 1,
						max: 1,
						chance: 0.8
					},
					'rifle': {
						min: 1,
						max: 1,
						chance: 0.5
					},
					'bullets': {
						min: 1,
						max: 8,
						chance: 0.25
					},
					'alien alloy': {
						min: 1,
						max: 1,
						chance: 0.01
					},
					'medicine': {
						min: 1,
						max: 4,
						chance: 0.5
					}
				},
				buttons: {
					'enter': {
						text: _('continue'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: {1: 'd8'}
					},
					'leave': {
						text: _('leave city'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			
			'c9': {
				text: [
					_('strips of meat hang drying by the side of the street.'),
					_('the people back away, avoiding eye contact.')
				],
				loot: {
					'cured meat': {
						min: 5,
						max: 10,
						chance: 1
					}
				},
				buttons: {
					'enter': {
						text: _('continue'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: {0.5: 'd8', 1: 'd9'}
					},
					'leave': {
						text: _('leave city'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			
			'c10': {
				text: [
					_('someone has locked and barricaded the door to this operating theatre.')
				],
				buttons: {
					'enter': {
						text: _('continue'),
						nextScene: {0.2: 'end12', 0.6: 'd10', 1: 'd11'}
					},
					'leave': {
						text: _('leave city'),
						nextScene: 'end'
					}
				}
			},
			
			'c11': {
				notification: _('a tribe of elderly squatters is camped out in this ward.'),
				combat: true,
				enemy: 'squatters',
				plural: true,
				chara: 'EEE',
				damage: 2,
				hit: 0.7,
				attackDelay: 0.5,
				specials: [
					{
						delay: 7,
						action: () => {
							const player = $('#wanderer');
							Events.setStatus(player, 'blinded');
							Events.updateFighterDiv(player);
							return _('flung dust');
						}
					}
				],
				health: 40,
				loot: {
					'cured meat': {
						min: 1,
						max: 3,
						chance: 0.5
					},
					'cloth': {
						min: 3,
						max: 8,
						chance: 0.8
					},
					'medicine': {
						min: 1,
						max: 3,
						chance: 0.3
					}
				},
				buttons: {
					'continue': {
						text: _('continue'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: { 1: 'end10' }
					},
					'leave': {
						text: _('leave city'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			
			'c12': {
				notification: _('a pack of lizards rounds the corner.'),
				combat: true,
				enemy: 'lizards',
				plural: true,
				chara: 'RRR',
				damage: 4,
				hit: 0.7,
				attackDelay: 0.7,
				specials: [
					{
						delay: 6,
						action: (fighter) => {
							Events.setStatus(fighter, 'venomous');
							return _('venom');
						}
					}
				],
				health: 30,
				loot: {
					'meat': {
						min: 3,
						max: 8,
						chance: 1
					},
					'teeth': {
						min: 2,
						max: 4,
						chance: 1
					},
					'scales': {
						min: 3,
						max: 5,
						chance: 1
					}
				},
				buttons: {
					'continue': {
						text: _('continue'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: { 1: 'end10' }
					},
					'leave': {
						text: _('leave city'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			
			'c13': {
				text: [
					_('strips of meat are hung up to dry in this ward.')
				],
				loot: {
					'cured meat': {
						min: 3,
						max: 10,
						chance: 1
					}
				},
				buttons: {
					'continue': {
						text: _('continue'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: { 0.5: 'end10', 1: 'end11' }
					},
					'leave': {
						text: _('leave city'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
						
			'd1': {
				notification: _('a large bird nests at the top of the stairs.'),
				combat: true,
				enemy: 'bird',
				chara: 'R',
				damage: 5,
				hit: 0.7,
				attackDelay: 1,
				specials: [
					{
						delay: 6,
						action: () => {
							const player = $('#wanderer');
							Events.setStatus(player, 'blinded');
							Events.updateFighterDiv(player);
							return _('wings in your face');
						}
					}
				],
				health: 45,
				loot: {
					'meat': {
						min: 5,
						max: 10,
						chance: 0.8
					}
				},
				buttons: {
					'continue': {
						text: _('continue'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: {0.5: 'end1', 1: 'end2'}
					},
					'leave': {
						text: _('leave city'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			
			'd2': {
				text: [
					_("the debris is denser here."),
					_("maybe some useful stuff in the rubble.")
				],
				loot: {
					'bullets': {
						min: 1,
						max: 5,
						chance: 0.5
					},
					'steel': {
						min: 1,
						max: 10,
						chance: 0.8
					},
					'alien alloy': {
						min: 1,
						max: 1,
						chance: 0.01
					},
					'cloth': {
						min: 1,
						max: 10,
						chance: 1
					}
				},
				buttons: {
					'continue': {
						text: _('continue'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: {1: 'end2'}
					},
					'leave': {
						text: _('leave city'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			
			'd3': {
				notification: _('a swarm of rats rushes up the tunnel.'),
				combat: true,
				enemy: 'rats',
				plural: true,
				chara: 'RRR',
				damage: 1,
				hit: 0.8,
				attackDelay: 0.25,
				specials: [
					{
						delay: 8,
						action: (fighter) => {
							Events.setStatus(fighter, 'regenerating');
							return _('more keep coming');
						}
					}
				],
				health: 60,
				loot: {
					'fur': {
						min: 5,
						max: 10,
						chance: 0.8
					},
					'teeth': {
						min: 5,
						max: 10,
						chance: 0.5
					}
				},
				buttons: {
					'continue': {
						text: _('continue'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: {0.5: 'end2', 1: 'end3'}
					},
					'leave': {
						text: _('leave city'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			
			'd4': {
				notification: _('a large man attacks, waving a bayonet.'),
				combat: true,
				enemy: 'veteran',
				chara: 'D',
				damage: 6,
				hit: 0.8,
				attackDelay: 2,
				specials: [
					{
						delay: 8,
						action: (fighter) => {
							Events.setStatus(fighter, 'meditation');
							return _('sets itself');
						}
					}
				],
				health: 45,
				loot: {
					'bayonet': {
						min: 1,
						max: 1,
						chance: 0.5
					},
					'cured meat': {
						min: 1,
						max: 5,
						chance: 0.8
					}
				},
				buttons: {
					'continue': {
						text: _('continue'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: {0.5: 'end4', 1: 'end5'}
					},
					'leave': {
						text: _('leave city'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			
			'd5': {
				notification: _('a second soldier opens fire.'),
				combat: true,
				enemy: 'soldier',
				ranged: true,
				chara: 'D',
				damage: 8,
				hit: 0.8,
				attackDelay: 2,
				specials: [
					{
						delay: 8,
						action: (fighter) => {
							Events.setStatus(fighter, 'shield');
							return _('armour holds');
						}
					}
				],
				health: 50,
				loot: {
					'cured meat': {
						min: 1,
						max: 5,
						chance: 0.8
					},
					'bullets': {
						min: 1,
						max: 5,
						chance: 0.5
					},
					'rifle': {
						min: 1,
						max: 1,
						chance: 0.2
					}
				},
				buttons: {
					'continue': {
						text: _('continue'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: {1: 'end5'}
					},
					'leave': {
						text: _('leave city'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			
			'd6': {
				notification: _('a masked soldier rounds the corner, gun drawn'),
				combat: true,
				enemy: 'commando',
				chara: 'D',
				ranged: true,
				damage: 3,
				hit: 0.9,
				attackDelay: 2,
				specials: [
					{
						delay: 7,
						action: (fighter) => {
							Events.setStatus(fighter, 'energised');
							return _('lines up the shot');
						}
					}
				],
				health: 55,
				loot: {
					'rifle': {
						min: 1,
						max: 1,
						chance: 0.5
					},
					'bullets': {
						min: 1,
						max: 5,
						chance: 0.8
					},
					'cured meat': {
						min: 1,
						max: 5,
						chance: 0.8
					}
				},
				buttons: {
					'continue': {
						text: _('continue'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: {0.5: 'end5', 1: 'end6'}
					},
					'leave': {
						text: _('leave city'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			
			'd7': {
				notification: _('the crowd surges forward.'),
				combat: true,
				enemy: 'squatters',
				plural: true,
				chara: 'EEE',
				damage: 2,
				hit: 0.7,
				attackDelay: 0.5,
				specials: [
					{
						delay: 7,
						action: () => {
							const player = $('#wanderer');
							Events.setStatus(player, 'blinded');
							Events.updateFighterDiv(player);
							return _('flung dust');
						}
					}
				],
				health: 40,
				loot: {
					'cloth': {
						min: 1,
						max: 5,
						chance: 0.8
					},
					'teeth': {
						min: 1,
						max: 5,
						chance: 0.5
					}
				},
				buttons: {
					'continue': {
						text: _('continue'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: {0.5: 'end7', 1: 'end8'}
					},
					'leave': {
						text: _('leave city'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			
			'd8': {
				notification: _('a youth lashes out with a tree branch.'),
				combat: true,
				enemy: 'youth',
				chara: 'E',
				damage: 2,
				hit: 0.7,
				attackDelay: 1,
				specials: [
					{
						delay: 7,
						action: (fighter) => {
							Events.setStatus(fighter, 'enraged');
							return _('wild swings');
						}
					}
				],
				health: 45,
				loot: {
					'cloth': {
						min: 1,
						max: 5,
						chance: 0.8
					},
					'teeth': {
						min: 1,
						max: 5,
						chance: 0.5
					}
				},
				buttons: {
					'continue': {
						text: _('continue'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: {1: 'end8'}
					},
					'leave': {
						text: _('leave city'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			
			'd9': {
				notification: _('a squatter stands firmly in the doorway of a small hut.'),
				combat: true,
				enemy: 'squatter',
				chara: 'E',
				damage: 3,
				hit: 0.8,
				attackDelay: 2,
				specials: [
					{
						delay: 6,
						action: (fighter) => {
							Events.setStatus(fighter, 'brittle');
							return _('loses footing');
						}
					}
				],
				health: 20,
				loot: {
					'cloth': {
						min: 1,
						max: 5,
						chance: 0.8
					},
					'teeth': {
						min: 1,
						max: 5,
						chance: 0.5
					}
				},
				buttons: {
					'continue': {
						text: _('continue'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: {0.5: 'end8', 1: 'end9'}
					},
					'leave': {
						text: _('leave city'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			
			'd10': {
				notification: _('behind the door, a deformed figure awakes and attacks.'),
				combat: true,
				enemy: 'deformed',
				chara: 'T',
				damage: 8,
				hit: 0.6,
				attackDelay: 2,
				specials: [
					{
						delay: 6,
						action: (fighter) => {
							Events.setStatus(fighter, 'venomous');
							return _('weeping barbs');
						}
					},
					{
						delay: 8,
						action: (fighter) => {
							Events.setStatus(fighter, 'regenerating');
							return _('knitting');
						}
					}
				],
				health: 40,
				loot: {
					'cloth': {
						min: 1,
						max: 5,
						chance: 0.8
					},
					'teeth': {
						min: 2,
						max: 2,
						chance: 1
					},
					'steel': {
						min: 1,
						max: 3,
						chance: 0.6
					},
					'scales': {
						min: 2,
						max: 3,
						chance: 0.1
					}
				},
				buttons: {
					'continue': {
						text: _('continue'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: {1: 'end14'}
					}
				}
			},
			
			'd11': {
				notification: _('as soon as the door is open a little bit, hundreds of tentacles erupt.'),
				combat: true,
				enemy: 'tentacles',
				plural: true,
				chara: 'TTT',
				damage: 2,
				hit: 0.6,
				attackDelay: 0.5,
				specials: [
					{
						delay: 7,
						action: (fighter) => {
							Events.setStatus(fighter, 'regenerating');
							return _('regrowing');
						}
					},
					{
						delay: 11,
						action: (fighter) => {
							Events.setStatus(fighter, 'venomous');
							return _('stinging');
						}
					}
				],
				health: 60,
				loot: {
					'meat': {
						min: 10,
						max: 20,
						chance: 1
					}
				},
				buttons: {
					'continue': {
						text: _('continue'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: {1: 'end13'}
					}
				}
			},
		
			'end1': {
				text: [
					_('bird must have liked shiney things.'),
					_('some good stuff woven into its nest.')
				],
				onLoad: function() {
					World.clearDungeon();
					$SM.set('game.cityCleared', true);
				},
				loot: {
					bullets: {
						min: 5,
						max: 10,
						chance: 0.8
					},
					bolas: {
						min: 1,
						max: 5,
						chance: 0.5
					},
					'alien alloy': {
						min: 1,
						max: 1,
						chance: 0.5
					}
				},
				buttons: {
					'leave': {
						text: _('leave city'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			
			'end2': {
				text: [
					_('not much here.'),
					_('scavengers must have gotten to this place already.')
				],
				onLoad: function() {
					World.clearDungeon();
					$SM.set('game.cityCleared', true);
				},
				loot: {
					torch: {
						min: 1,
						max: 5,
						chance: 0.8
					},
					'cured meat': {
						min: 1,
						max: 5,
						chance: 0.5
					}
				},
				buttons: {
					'leave': {
						text: _('leave city'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			
			'end3': {
				text: [
                    /// TRANSLATORS : a platform in the subway
					_('the tunnel opens up at another platform.'),
					_('the walls are scorched from an old battle.'),
					_('bodies and supplies from both sides litter the ground.')
				],
				onLoad: function() {
					World.clearDungeon();
					$SM.set('game.cityCleared', true);
				},
				loot: {
					rifle: {
						min: 1,
						max: 1,
						chance: 0.8
					},
					bullets: {
						min: 1,
						max: 5,
						chance: 0.8
					},
					'laser rifle': {
						min: 1,
						max: 1,
						chance: 0.3
					},
					'energy cell': {
						min: 1,
						max: 5,
						chance: 0.3
					},
					'alien alloy': {
						min: 1,
						max: 1,
						chance: 0.3
					}
				},
				buttons: {
					'leave': {
						text: _('leave city'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			
			'end4': {
				text: [
					_('the small military outpost is well supplied.'),
					_('arms and munitions, relics from the war, are neatly arranged on the store-room floor.'),
					_('just as deadly now as they were then.')
				],
				onLoad: function() {
					World.clearDungeon();
					$SM.set('game.cityCleared', true);
				},
				loot: {
					rifle: {
						min: 1,
						max: 1,
						chance: 1
					},
					bullets: {
						min: 1,
						max: 10,
						chance: 1
					},
					grenade: {
						min: 1,
						max: 5,
						chance: 0.8
					}
				},
				buttons: {
					'leave': {
						text: _('leave city'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			
			'end5': {
				text: [
					_('searching the bodies yields a few supplies.'),
					_('more soldiers will be on their way.'),
					_('time to move on.')
				],
				onLoad: function() {
					World.clearDungeon();
					$SM.set('game.cityCleared', true);
				},
				loot: {
					rifle: {
						min: 1,
						max: 1,
						chance: 1
					},
					bullets: {
						min: 1,
						max: 10,
						chance: 1
					},
					'cured meat': {
						min: 1,
						max: 5,
						chance: 0.8
					},
					'medicine': {
					min: 1,
					max: 4,
					chance: 0.1
					}
				},
				buttons: {
					'leave': {
						text: _('leave city'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			
			'end6': {
				text: [
					_('the small settlement has clearly been burning a while.'),
					_('the bodies of the wanderers that lived here are still visible in the flames.'),
					_("still time to rescue a few supplies.")
				],
				onLoad: function() {
					World.clearDungeon();
					$SM.set('game.cityCleared', true);
				},
				loot: {
					'laser rifle': {
						min: 1,
						max: 1,
						chance: 0.5
					},
					'energy cell': {
						min: 1,
						max: 5,
						chance: 0.5
					},
					'cured meat': {
						min: 1,
						max: 10,
						chance: 1
					}
				},
				buttons: {
					'leave': {
						text: _('leave city'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			
			'end7': {
				text: [
					_('the remaining settlers flee from the violence, their belongings forgotten.'),
					_("there's not much, but some useful things can still be found.")
				],
				onLoad: function() {
					World.clearDungeon();
					$SM.set('game.cityCleared', true);
				},
				loot: {
					'steel sword': {
						min: 1,
						max: 1,
						chance: 0.8
					},
					'energy cell': {
						min: 1,
						max: 5,
						chance: 0.5
					},
					'cured meat': {
						min: 1,
						max: 10,
						chance: 1
					}
				},
				buttons: {
					'leave': {
						text: _('leave city'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			
			'end8': {
				text: [
					_('the young settler was carrying a canvas sack.'),
					_("it contains travelling gear, and a few trinkets."),
					_("there's nothing else here.")
				],
				onLoad: function() {
					World.clearDungeon();
					$SM.set('game.cityCleared', true);
				},
				loot: {
					'steel sword': {
						min: 1,
						max: 1,
						chance: 0.8
					},
					'bolas': {
						min: 1,
						max: 5,
						chance: 0.5
					},
					'cured meat': {
						min: 1,
						max: 10,
						chance: 1
					}
				},
				buttons: {
					'leave': {
						text: _('leave city'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			
			'end9': {
				text: [
					_('inside the hut, a child cries.'),
					_("a few belongings rest against the walls."),
					_("there's nothing else here.")
				],
				onLoad: function() {
					World.clearDungeon();
					$SM.set('game.cityCleared', true);
				},
				loot: {
					'rifle': {
						min: 1,
						max: 1,
						chance: 0.8
					},
					'bullets': {
						min: 1,
						max: 5,
						chance: 0.8
					},
					'bolas': {
						min: 1,
						max: 5,
						chance: 0.5
					},
					'alien alloy': {
						min: 1,
						max: 1,
						chance: 0.2
					}
				},
				buttons: {
					'leave': {
						text: _('leave city'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			
			'end10': {
				text: [
					_('the stench of rot and death fills the operating theatres.'),
					_("a few items are scattered on the ground."),
					_('there is nothing else here.')
				],
				onLoad: function() {
					World.clearDungeon();
					$SM.set('game.cityCleared', true);
				},
				loot: {
					'energy cell': {
						min: 1,
						max: 1,
						chance: 0.3
					},
					'medicine': {
						min: 1,
						max: 5,
						chance: 0.3
					},
					'teeth': {
						min: 3,
						max: 8,
						chance: 1
					},
					'scales': {
						min: 4,
						max: 7,
						chance: 0.9
					}
				},
				buttons: {
					'leave': {
						text: _('leave city'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			
			'end11': {
				text: [
					_('a pristine medicine cabinet at the end of a hallway.'),
					_("the rest of the hospital is empty.")
				],
				onLoad: function() {
					World.clearDungeon();
					$SM.set('game.cityCleared', true);
				},
				loot: {
					'energy cell': {
						min: 1,
						max: 1,
						chance: 0.2
					},
					'medicine': {
						min: 3,
						max: 10,
						chance: 1
					},
					'teeth': {
						min: 1,
						max: 2,
						chance: 0.2
					}
				},
				buttons: {
					'leave': {
						text: _('leave city'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			
			'end12': {
				text: [
					_('someone had been stockpiling loot here.')
				],
				onLoad: function() {
					World.clearDungeon();
					$SM.set('game.cityCleared', true);
				},
				loot: {
					'energy cell': {
						min: 1,
						max: 3,
						chance: 0.2
					},
					'medicine': {
						min: 3,
						max: 10,
						chance: 0.5
					},
					'bullets': {
						min: 2,
						max: 8,
						chance: 1
					},
					'torch': {
					min: 1,
					max: 3,
					chance: 0.5
					},
					'grenade': {
					min: 1,
					max: 1,
					chance: 0.5
					},
					'alien alloy': {
					min: 1,
					max: 2,
					chance: 0.8
					}
				},
				buttons: {
					'leave': {
						text: _('leave city'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			
			'end13': {
				text: [
					_('the tentacular horror is defeated.'),
					_('inside, the remains of its victims are everywhere.')
				],
				onLoad: function() {
					World.clearDungeon();
					$SM.set('game.cityCleared', true);
				},
				loot: {
					'steel sword': {
						min: 1,
						max: 3,
						chance: 0.5
					},
					'rifle': {
						min: 1,
						max: 2,
						chance: 0.3
					},
					'teeth': {
						min: 2,
						max: 8,
						chance: 1
					},
					'cloth': {
					min: 3,
					max: 6,
					chance: 0.5
					},
					'alien alloy': {
					min: 1,
					max: 1,
					chance: 0.1
					}
				},
				buttons: {
					'leave': {
						text: _('leave city'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			
			'end14': {
				text: [
                    /// TRANSLATORS : warped means extremely disfigured.
					_('the warped man lies dead.'),
					_('the operating theatre has a lot of curious equipment.')
				],
				onLoad: function() {
					World.clearDungeon();
					$SM.set('game.cityCleared', true);
				},
				loot: {
					'energy cell': {
						min: 2,
						max: 5,
						chance: 0.8
					},
					'medicine': {
						min: 3,
						max: 12,
						chance: 1
					},
					'cloth': {
						min: 1,
						max: 3,
						chance: 0.5
					},
					'steel': {
						min: 2,
						max: 3,
						chance: 0.3
					},
					'alien alloy': {
						min: 1,
						max: 1,
						chance: 0.3
					}
				},
				buttons: {
					'leave': {
						text: _('leave city'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			
			'end15': {
				text: [
					_('the old man had a small cache of interesting items.')
				],
				onLoad: function() {
					World.clearDungeon();
					$SM.set('game.cityCleared', true);
				},
				loot: {
					'alien alloy': {
						min: 1,
						max: 1,
						chance: 0.8
					},
					'medicine': {
					min: 1,
					max: 4,
					chance: 1
					},
					'cured meat': {
					min: 3,
					max: 7,
					chance: 1
					},
					'bolas': {
					min: 1,
					max: 3,
					chance: 0.5
					},
					'fur': {
					min: 1,
					max: 5,
					chance: 0.8
					}
				},
				buttons: {
					'leave': {
						text: _('leave city'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.LANDMARK_CITY
	},
	"house": { /* Abandoned House */
		title: _('An Old House'),
		scenes: {
			'start': {
				text: [
					_('an old house remains here, once white siding yellowed and peeling.'),
					_('the door hangs open.')
				],
				notification: _('the remains of an old house stand as a monument to simpler times'),
				buttons: {
					'enter': {
						text: _('go inside'),
						nextScene: { 0.25: 'medicine', 0.5: 'supplies', 1: 'occupied' }
					},
					'leave': {
						text: _('leave'),
						nextScene: 'end'
					}
				}
			},
			'supplies': {
				text: [
					_('the house is abandoned, but not yet picked over.'),
					_('still a few drops of water in the old well.')
				],
				onLoad: function() {
					World.markVisited(World.curPos[0], World.curPos[1]);
					World.setWater(World.getMaxWater());
					Notifications.notify(null, _('water replenished'));
				},
				loot: {
					'cured meat': {
						min: 1,
						max: 10,
						chance: 0.8
					},
					'leather': {
						min: 1,
						max: 10,
						chance: 0.2
					},
					'cloth': {
						min: 1,
						max: 10,
						chance: 0.5
					}
				},
				buttons: {
					'leave': {
						text: _('leave'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'medicine': {
				text: [
					_('the house has been ransacked.'),
					_('but there is a cache of medicine under the floorboards.')
				],
				onLoad: function() {
					World.markVisited(World.curPos[0], World.curPos[1]);
				},
				loot: {
					'medicine': {
						min: 2,
						max: 5,
						chance: 1
					}
				},
				buttons: {
					'leave': {
						text: _('leave'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'occupied': {
				combat: true,
				enemy: 'squatter',
				chara: 'E',
				damage: 3,
				hit: 0.8,
				attackDelay: 2,
				health: 10,
				notification: _('a man charges down the hall, a rusty blade in his hand'),
				onLoad: function() {
					World.markVisited(World.curPos[0], World.curPos[1]);
				},
				loot: {
					'cured meat': {
						min: 1,
						max: 10,
						chance: 0.8
					},
					'leather': {
						min: 1,
						max: 10,
						chance: 0.2
					},
					'cloth': {
						min: 1,
						max: 10,
						chance: 0.5
					}
				},
				buttons: {
					'leave': {
						text: _('leave'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.LANDMARK_HOUSE
	},
	"battlefield": { /* Discovering an old battlefield */
		title: _('A Forgotten Battlefield'),
		scenes: {
			'start': {
				text: [
					_('a battle was fought here, long ago.'),
					_('battered technology from both sides lays dormant on the blasted landscape.')
				],
				onLoad: function() {
					World.markVisited(World.curPos[0], World.curPos[1]);
				},
				loot: {
					'rifle': {
						min: 1,
						max: 3,
						chance: 0.5
					},
					'bullets': {
						min: 5,
						max: 20,
						chance: 0.8
					},
					'laser rifle': {
						min: 1,
						max: 3,
						chance: 0.3
					},
					'energy cell': {
						min: 5,
						max: 10,
						chance: 0.5
					},
					'grenade': {
						min: 1,
						max: 5,
						chance: 0.5
					},
					'alien alloy': {
						min: 1,
						max: 1,
						chance: 0.3
					}
				},
				buttons: {
					'leave': {
						text: _('leave'),

						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.LANDMARK_BATTLEFIELD
	},
	"borehole": { /* Admiring a huge borehole */
		title: _('A Huge Borehole'),
		scenes: {
			'start': {
				text: [
					_('a huge hole is cut deep into the earth, evidence of the past harvest.'),
					_('they took what they came for, and left.'),
					_('castoff from the mammoth drills can still be found by the edges of the precipice.')
				],
				onLoad: function() {
					World.markVisited(World.curPos[0], World.curPos[1]);
				},
				loot: {
					'alien alloy': {
						min: 1,
						max: 3,
						chance: 1
					}
				},
				buttons: {
					'leave': {
						text: _('leave'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.LANDMARK_BOREHOLE
	},
	"ship": { /* Finding a way off this rock */
		title: _('A Crashed Ship'),
		scenes: {
			'start': {
				onLoad: function() {
					World.markVisited(World.curPos[0], World.curPos[1]);
					World.drawRoad();
					World.state.ship = true;
				},
				text: [
					_('the familiar curves of a wanderer vessel rise up out of the dust and ash. '),
					_("lucky that the natives can't work the mechanisms."),
					_('with a little effort, it might fly again.')
				],
				buttons: {
					'leavel': {
						text: _('salvage'),
						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.LANDMARK_CRASHED_SHIP
	},
	"sulphurmine": { /* Clearing the Sulphur Mine */
		title: _('The Sulphur Mine'),
		scenes: {
			'start': {
				text: [
					_("the military is already set up at the mine's entrance."),
					_('soldiers patrol the perimeter, rifles slung over their shoulders.')
				],
				notification: _('a military perimeter is set up around the mine.'),
				buttons: {
					'attack': {
						text: _('attack'),
						nextScene: {1: 'a1'}
					},
					'leave': {
						text: _('leave'),
						nextScene: 'end'
					}
				}
			},
			'a1': {
				combat: true,
				enemy: 'soldier',
				ranged: true,
				chara: 'D',
				damage: 8,
				hit: 0.8,
				attackDelay: 2,
				specials: [
					{
						delay: 8,
						action: (fighter) => {
							Events.setStatus(fighter, 'shield');
							return _('armour holds');
						}
					}
				],
				health: 50,
				loot: {
					'cured meat': {
						min: 1,
						max: 5,
						chance: 0.8
					},
					'bullets': {
						min: 1,
						max: 5,
						chance: 0.5
					},
					'rifle': {
						min: 1,
						max: 1,
						chance: 0.2
					}
				},
				notification: _('a soldier, alerted, opens fire.'),
				buttons: {
					'continue': {
						text: _('continue'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: { 1: 'a2' }
					},
					'run': {
						text: _('run'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'a2': {
				combat: true,
				enemy: 'soldier',
				ranged: true,
				chara: 'D',
				damage: 8,
				hit: 0.8,
				attackDelay: 2,
				specials: [
					{
						delay: 8,
						action: (fighter) => {
							Events.setStatus(fighter, 'shield');
							return _('armour holds');
						}
					}
				],
				health: 50,
				loot: {
					'cured meat': {
						min: 1,
						max: 5,
						chance: 0.8
					},
					'bullets': {
						min: 1,
						max: 5,
						chance: 0.5
					},
					'rifle': {
						min: 1,
						max: 1,
						chance: 0.2
					}
				},
				notification: _('a second soldier joins the fight.'),
				buttons: {
					'continue': {
						text: _('continue'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: { 1: 'a3' }
					},
					'run': {
						text: _('run'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'a3': {
				combat: true,
				enemy: 'veteran',
				chara: 'D',
				damage: 10,
				hit: 0.8,
				attackDelay: 2,
				specials: [
					{
						delay: 7,
						action: (fighter) => {
							Events.setStatus(fighter, 'meditation');
							return _('sets himself');
						}
					},
					{
						delay: 12,
						action: (fighter) => {
							Events.setStatus(fighter, 'energised');
							return _('both hands');
						}
					}
				],
				health: 65,
				loot: {
					'bayonet': {
						min: 1,
						max: 1,
						chance: 0.5
					},
					/* Only source of the katana in the base game -- the weapon
					 * was fully wired into World.Weapons, path.js and
					 * prestige.js scoring with no encounter that ever dropped
					 * one. Kept rare: this is the toughest fight in the mine,
					 * and it's the one time a plain soldier upgrades to
					 * carrying an officer's sidearm rather than a rifle. */
					'katana': {
						min: 1,
						max: 1,
						chance: 0.12
					},
					'cured meat': {
						min: 1,
						max: 5,
						chance: 0.8
					}
				},
				notification: _('a grizzled soldier attacks, a trophy blade at his hip alongside the bayonet.'),
				buttons: {
					'continue': {
						text: _('continue'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: { 1: 'cleared' }
					}
				}
			},
			'cleared': {
				text: [
					_('the military presence has been cleared.'),
					_('the mine is now safe for workers.')
				],
				notification: _('the sulphur mine is clear of dangers'),
				onLoad: function() {
					World.drawRoad();
					World.state.sulphurmine = true;
					World.markVisited(World.curPos[0], World.curPos[1]);
				},
				buttons: {
					'leave': {
						text: _('leave'),
						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.LANDMARK_SULPHUR_MINE
	},
	"coalmine": { /* Clearing the Coal Mine */
		title: _('The Coal Mine'),
		scenes: {
			'start': {
				text: [
					_('camp fires burn by the entrance to the mine.'),
					_('men mill about, weapons at the ready.')
				],
				notification: _('this old mine is not abandoned'),
				buttons: {
					'attack': {
						text: _('attack'),
						nextScene: {1: 'a1'}
					},
					'leave': {
						text: _('leave'),
						nextScene: 'end'
					}
				}
			},
			'a1': {
				combat: true,
				enemy: 'man',
				chara: 'E',
				damage: 3,
				hit: 0.8,
				attackDelay: 2,
				health: 10,
				loot: {
					'cured meat': {
						min: 1,
						max: 5,
						chance: 0.8
					},
					'cloth': {
						min: 1,
						max: 5,
						chance: 0.8
					}
				},
				notification: _('a man joins the fight'),
				buttons: {
					'continue': {
						text: _('continue'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: { 1: 'a2' }
					},
					'run': {
						text: _('run'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'a2': {
				combat: true,
				enemy: 'man',
				chara: 'E',
				damage: 3,
				hit: 0.8,
				attackDelay: 2,
				health: 10,
				loot: {
					'cured meat': {
						min: 1,
						max: 5,
						chance: 0.8
					},
					'cloth': {
						min: 1,
						max: 5,
						chance: 0.8
					}
				},
				notification: _('a man joins the fight'),
				buttons: {
					'continue': {
						text: _('continue'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: { 1: 'a3' }
					},
					'run': {
						text: _('run'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: 'end'
					}
				}
			},
			'a3': {
				combat: true,
				enemy: 'chief',
				chara: 'D',
				damage: 5,
				hit: 0.8,
				attackDelay: 2,
				specials: [
					{
						delay: 5,
						action: (fighter) => {
							Events.setStatus(fighter, 'enraged');
							return _('bellowing');
						}
					}
				],
				health: 20,
				loot: {
					'cured meat': {
						min: 5,
						max: 10,
						chance: 1
					},
					'cloth': {
						min: 5,
						max: 10,
						chance: 0.8
					},
					'iron': {
						min: 1,
						max: 5,
						chance: 0.8
					}
				},
				notification: _('only the chief remains.'),
				buttons: {
					'continue': {
						text: _('continue'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: { 1: 'cleared' }
					}
				}
			},
			'cleared': {
				text: [
					_('the camp is still, save for the crackling of the fires.'),
					_('the mine is now safe for workers.')
				],
				notification: _('the coal mine is clear of dangers'),
				onLoad: function() {
					World.drawRoad();
					World.state.coalmine = true;
					World.markVisited(World.curPos[0], World.curPos[1]);
				},
				buttons: {
					'leave': {
						text: _('leave'),
						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.LANDMARK_COAL_MINE
	},
	"ironmine": { /* Clearing the Iron Mine */
		title: _('The Iron Mine'),
		scenes: {
			'start': {
				text: [
					_('an old iron mine sits here, tools abandoned and left to rust.'),
					_('bleached bones are strewn about the entrance. many, deeply scored with jagged grooves.'),
					_('feral howls echo out of the darkness.')
				],
				notification: _('the path leads to an abandoned mine'),
				buttons: {
					'enter': {
						text: _('go inside'),
						nextScene: { 1: 'enter' },
						cost: { 'torch': 1 }
					},
					'leave': {
						text: _('leave'),
						nextScene: 'end'
					}
				}
			},
			'enter': {
				combat: true,
				enemy: 'beastly matriarch',
				chara: 'T',
				damage: 4,
				hit: 0.8,
				attackDelay: 2,
				health: 10,
				loot: {
					'teeth': {
						min: 5,
						max: 10,
						chance: 1
					},
					'scales': {
						min: 5,
						max: 10,
						chance: 0.8
					},
					'cloth': {
						min: 5,
						max: 10,
						chance: 0.5
					}
				},
				notification: _('a large creature lunges, muscles rippling in the torchlight'),
				buttons: {
					'leave': {
						text: _('leave'),
						cooldown: Events._LEAVE_COOLDOWN,
						nextScene: { 1: 'cleared' }
					}
				}
			},
			'cleared': {
				text: [
					_('the beast is dead.'),
					_('the mine is now safe for workers.')
				],
				notification: _('the iron mine is clear of dangers'),
				onLoad: function() {
					World.drawRoad();
					World.state.ironmine = true;
					World.markVisited(World.curPos[0], World.curPos[1]);
				},
				buttons: {
					'leave': {
						text: _('leave'),
						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.LANDMARK_IRON_MINE
	},
	
	"cache": { /* Cache - contains some of supplies from previous game */
		title: _('A Destroyed Village'),
		scenes: {
			'start': {
				text: [
					_('a destroyed village lies in the dust.'),
					_('charred bodies litter the ground.')
				],
                /// TRANSLATORS : tang = strong metallic smell, wanderer afterburner = ship's engines
				notification: _('the metallic tang of wanderer afterburner hangs in the air.'),
				buttons: {
					'enter': {
						text: _('enter'),
						nextScene: {1: 'underground'}
					},
					'leave': {
						text: _('leave'),
						nextScene: 'end'
					}
				}
			},
			'underground': {
				text: [
					_('a shack stands at the center of the village.'),
					_('there are still supplies inside.')
				],
				buttons: {
					'take': {
						text: _('take'),
						nextScene: {1: 'exit'}
					}
				}
			},
			'exit': {
				text: [
					_('all the work of a previous generation is here.'),
				_('ripe for the picking.')
				],
				onLoad: function() {
					World.markVisited(World.curPos[0], World.curPos[1]);
					Prestige.collectStores();
				},
				buttons: {
					'leave': {
						text: _('leave'),
						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.LANDMARK_DESTROYED_VILLAGE
	}
};
