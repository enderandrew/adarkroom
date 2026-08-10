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
					_('an old wanderer sits inside, in a seeming trance.')
				],
				buttons: {
					'talk': {
						cost: {'charm': 1},
						text: _('talk'),
						nextScene: {1: 'talk'}
					},
					'leave': {
						text: _('leave'),
						nextScene: 'end'
					}
				}
			},
			'talk': {
				text: [
					_('the wanderer takes the charm and nods slowly.'),
					_('he speaks of once leading the great fleets to fresh worlds.'),
					_('unfathomable destruction to fuel wanderer hungers.'),
					_('his time here, now, is his penance.')
				],
				onLoad: function() {
					$SM.addPerk('gastronome');
					World.markVisited(World.curPos[0], World.curPos[1]);
					/* This is the scene where he says outright that he led the
					 * great fleets. Recorded so other content can assume the
					 * player has heard his voice and knows what he was --
					 * The Signal's muster order keys off this. */
					$SM.set('game.metOldWanderer', true);
				},
				buttons: {
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
					'sulfur': { min: 1, max: 1, chance: 0.1 }
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
					'sulfur': { min: 1, max: 1, chance: 0.15 }
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
					'sulfur': { min: 1, max: 1, chance: 0.12 }
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
					'sulfur': { min: 1, max: 1, chance: 0.15 }
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
					'sulfur': { min: 1, max: 1, chance: 0.15 }
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
					'sulfur': { min: 1, max: 1, chance: 0.15 }
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
					'sulfur': { min: 1, max: 2, chance: 0.18 }
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
					'sulfur': { min: 1, max: 2, chance: 0.2 }
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
					'sulfur': { min: 1, max: 2, chance: 0.3 }
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
					'sulfur': { min: 1, max: 1, chance: 0.25 }
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
					'sulfur': { min: 1, max: 2, chance: 0.25 }
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
					'sulfur': { min: 1, max: 2, chance: 0.3 }
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
					'sulfur': { min: 1, max: 1, chance: 0.25 }
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
					'sulfur': { min: 2, max: 3, chance: 0.3 },
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
					'sulfur': { min: 1, max: 2, chance: 0.28 }
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
					'sulfur': { min: 2, max: 3, chance: 0.3 }
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
					'sulfur': { min: 2, max: 4, chance: 0.35 },
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
					'sulfur': { min: 2, max: 3, chance: 0.32 }
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
					'sulfur': { min: 2, max: 4, chance: 0.35 },
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
					'sulfur': { min: 2, max: 3, chance: 0.3 }
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
					'sulfur': { min: 1, max: 2, chance: 0.3 },
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
					'sulfur': { min: 2, max: 4, chance: 0.32 }
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
					'sulfur': { min: 2, max: 4, chance: 0.35 },
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
					'sulfur': { min: 3, max: 4, chance: 0.35 },
					'energy sword': { min: 1, max: 1, chance: 0.05 }
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
