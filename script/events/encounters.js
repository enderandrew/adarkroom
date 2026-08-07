/**
 * Events that can occur when wandering around the world
 **/
Events.Encounters = [
	/* =====================================================================
	 * TIER 1  --  World.getDistance() <= 10
	 * Close to the village. Low hp, low damage, mostly no specials. The one
	 * exception (rust beetle) is a deliberately gentle first lesson in
	 * reading a wind-up, so the mechanic isn't brand new at tier 3.
	 * ===================================================================== */
	{ /* Thornback Hare */
	title: _('A Thornback Hare'),
		isAvailable: function() {
			return World.getDistance() <= 10 && World.getTerrain() == World.TILE.FOREST;
		},
		scenes: {
			'start': {
				combat: true,
				enemy: 'thornback hare',
				enemyName: _('thornback hare'),
				deathMessage: _('the hare goes still.'),
				chara: 'h',
				damage: 2,
				hit: 0.85,
				attackDelay: 1.2,
				health: 4,
				loot: {
					'fur': {
						min: 1,
						max: 2,
						chance: 0.9
					},
					'meat': {
						min: 1,
						max: 2,
						chance: 0.8
					},
					'teeth': {
						min: 1,
						max: 1,
						chance: 0.3
					}
				},
				notification: _('something small breaks cover, quills flared.')
			}
		}
	},
	{ /* Dust Wretch */
	title: _('A Dust Wretch'),
		isAvailable: function() {
			return World.getDistance() <= 10 && World.getTerrain() == World.TILE.BARRENS;
		},
		scenes: {
			'start': {
				combat: true,
				enemy: 'dust wretch',
				enemyName: _('dust wretch'),
				deathMessage: _('it stops moving. it does not look surprised.'),
				chara: 'w',
				damage: 2,
				hit: 0.75,
				attackDelay: 2,
				health: 6,
				loot: {
					'cloth': {
						min: 1,
						max: 2,
						chance: 0.7
					},
					'teeth': {
						min: 1,
						max: 2,
						chance: 0.5
					}
				},
				notification: _('a thin figure rises out of the dust. it has been here a long time.')
			}
		}
	},
	{ /* Rust Beetle */
	title: _('A Rust Beetle'),
		isAvailable: function() {
			return World.getDistance() <= 10 && World.getTerrain() == World.TILE.FIELD;
		},
		scenes: {
			'start': {
				combat: true,
				enemy: 'rust beetle',
				enemyName: _('rust beetle'),
				deathMessage: _('the shell cracks open. nothing inside but rust.'),
				chara: 'b',
				damage: 3,
				specials: [{
					delay: 5,
					action: (fighter) => {
						Events.setStatus(fighter, 'brittle');
						return _('shell splits');
					}
				}],
				hit: 0.8,
				attackDelay: 2.5,
				health: 9,
				loot: {
					'iron': {
						min: 1,
						max: 2,
						chance: 0.6
					},
					'scales': {
						min: 1,
						max: 3,
						chance: 0.7
					}
				},
				notification: _('a heavy armoured thing drags itself across the field.')
			}
		}
	},
	{ /* Ravenous Beast */
		title: _('A Ravenous Beast'),
		isAvailable: function() {
			return World.getDistance() <= 10 && World.getTerrain() == World.TILE.FOREST;
		},
		scenes: {
			'start': {
				combat: true,
				enemy: 'ravenous beast',
				enemyName: _('ravenous beast'),
				deathMessage: _('the ravenous beast hungers no more.'),
				chara: 'R',
				damage: 1,
				hit: 0.8,
				attackDelay: 1,
				health: 5,
				loot: {
					'fur': {
						min: 1,
						max: 3,
						chance: 1
					},
					'meat': {
						min: 1,
						max: 3,
						chance: 1
					},
					'teeth': {
						min: 1,
						max: 3,
						chance: 0.8
					}
				},
				notification: _('a ravenous beast leaps out of the underbrush. hunger has made it desperate and dangerous.')
			}
		}
	},
	{ /* Shadow */
		title: _('Shadow'),
		isAvailable: function() {
			return World.getDistance() <= 10 && World.getTerrain() == World.TILE.FOREST;
		},
		scenes: {
			'start': {
				combat: true,
				enemy: 'shadow',
				enemyName: _('shadow'),
				deathMessage: _('what made this shadow persist? is it gone now?'),
				chara: 'S',
				damage: 2,
				hit: 0.9,
				attackDelay: 2,
				health: 4,
				loot: {
					'leather': {
						min: 1,
						max: 2,
						chance: 1
					},
					'meat': {
						min: 1,
						max: 2,
						chance: 1
					},
					'teeth': {
						min: 1,
						max: 3,
						chance: 0.8
					}
				},
				notification: _('darting between the trees in the dark, the shadow is barely seen. you hear it lunge as it is upon you.')
			}
		}
	},
	{ /* Gaunt Human */
	title: _('A Gaunt Human'),
		isAvailable: function() {
			return World.getDistance() <= 10 && World.getTerrain() == World.TILE.BARRENS;
		},
		scenes: {
			'start': {
				combat: true,
				enemy: 'gaunt human',
				enemyName: _('gaunt human'),
				deathMessage: _('the gaunt human is still. their blood coats you.'),
				chara: 'H',
				damage: 2,
				hit: 0.7,
				attackDelay: 1.8,
				health: 5,
				loot: {
					'cloth': {
						min: 1,
						max: 3,
						chance: 0.8
					},
					'teeth': {
						min: 1,
						max: 2,
						chance: 0.8
					},
					'leather': {
						min: 1,
						max: 2,
						chance: 0.5
					}
				},
				notification: _('a gaunt human approaches, a crazed look in his eye. there is blood upon their teeth.')
			}
		}
	},
	{ /* Scavenger */
	title: _('A Scavenger'),
		isAvailable: function() {
			return World.getDistance() <= 10 && World.getTerrain() == World.TILE.BARRENS;
		},
		scenes: {
			'start': {
				combat: true,
				enemy: 'scavenger',
				enemyName: _('scavenger'),
				deathMessage: _('the scavenger will steal no more. what was theirs is now yours.'),
				chara: 'C',
				damage: 2,
				hit: 0.8,
				attackDelay: 2,
				health: 6,
				loot: {
					'cloth': {
						min: 1,
						max: 2,
						chance: 0.8
					},
					'cured meat': {
						min: 1,
						max: 3,
						chance: 0.8
					},
					'leather': {
						min: 1,
						max: 3,
						chance: 0.8
					},
					'iron': {
						min: 1,
						max: 3,
						chance: 0.3
					},
				},
				notification: _('a scavenger draws close, hoping to add to their stores at the cost of your life.')
			}
		}
	},
	{ /* Alien Bird */
	title: _('An Alien Bird'),
		isAvailable: function() {
			return World.getDistance() <= 10 && World.getTerrain() == World.TILE.FIELD;
		},
		scenes: {
			'start': {
				combat: true,
				enemy: 'alien bird',
				enemyName: _('alien bird'),
				deathMessage: _('the alien bird lays dead at your feet.'),
				chara: 'B',
				damage: 3,
				hit: 0.8,
				attackDelay: 2,
				health: 4,
				loot: {
					'scales': {
						min: 1,
						max: 3,
						chance: 0.8
					},
					'teeth': {
						min: 1,
						max: 2,
						chance: 0.5
					},
					'meat': {
						min: 1,
						max: 3,
						chance: 0.8
					}
				},
				notification: _('an alien looking bird speeds across the plains, talons at the ready.')
			}
		}
	},
	{ /* Radiated Goat */
	title: _('A Radiated Goat'),
		isAvailable: function() {
			return World.getDistance() <= 10 && World.getTerrain() == World.TILE.FIELD;
		},
		scenes: {
			'start': {
				combat: true,
				enemy: 'radiated goat',
				enemyName: _('radiated goat'),
				deathMessage: _('the radiated goat is dead'),
				chara: 'G',
				damage: 3,
				specials: [{
					delay: 4,
					action: (fighter) => {
						Events.setStatus(fighter, 'enraged');
						return 'enraged';
					}
				}],
				hit: 0.7,
				attackDelay: 2,
				health: 5,
				loot: {
					'leather': {
						min: 1,
						max: 3,
						chance: 0.8
					},
					'teeth': {
						min: 1,
						max: 2,
						chance: 0.5
					},
					'meat': {
						min: 1,
						max: 3,
						chance: 0.8
					}
				},
				notification: _('a radiated goat charges with its mutated antlers')
			}
		}
	},
	{ /* Two-Headed Creature */
	title: _('A Two-Headed Creature'),
		isAvailable: function() {
			return World.getDistance() <= 10 && World.getTerrain() == World.TILE.FIELD;
		},
		scenes: {
			'start': {
				combat: true,
				enemy: 'two-headed creature',
				enemyName: _('two-headed creature'),
				deathMessage: _('this test subject failed to yield results.'),
				chara: '¥',
				damage: 3,
				hit: 0.5,
				attackDelay: 3,
				health: 11,
				loot: {
					'fur': {
						min: 2,
						max: 4,
						chance: 1
					},
					'teeth': {
						min: 2,
						max: 3,
						chance: 0.8
					},
					'meat': {
						min: 2,
						max: 3,
						chance: 0.8
					}
				},
				notification: _('a two-headed creature appears, the smaller head, poorly attached and trembling')
			}
		}
	},
	/* =====================================================================
	 * TIER 2  --  World.getDistance() > 10
	 * ===================================================================== */
	{ /* Spore-Choked Stag */
	title: _('A Spore-Choked Stag'),
		isAvailable: function() {
			return World.getDistance() > 10 && World.getTerrain() == World.TILE.FOREST;
		},
		scenes: {
			'start': {
				combat: true,
				enemy: 'spore-choked stag',
				enemyName: _('spore-choked stag'),
				deathMessage: _('it falls, and the air goes clear again.'),
				chara: 'q',
				damage: 4,
				specials: [{
					delay: 6,
					action: () => {
						const player = $('#wanderer');
						Events.setStatus(player, 'blinded');
						Events.updateFighterDiv(player);
						return _('spores burst');
					}
				}],
				hit: 0.8,
				attackDelay: 2,
				health: 28,
				loot: {
					'fur': {
						min: 1,
						max: 4,
						chance: 0.8
					},
					'meat': {
						min: 1,
						max: 3,
						chance: 0.8
					},
					'teeth': {
						min: 1,
						max: 3,
						chance: 0.6
					}
				},
				notification: _('the stag turns. pale growth has taken most of its head.')
			}
		}
	},
	{ /* Trench Sentry */
	title: _('A Trench Sentry'),
		isAvailable: function() {
			return World.getDistance() > 10 && World.getTerrain() == World.TILE.BARRENS;
		},
		scenes: {
			'start': {
				combat: true,
				enemy: 'trench sentry',
				enemyName: _('trench sentry'),
				deathMessage: _('the sentry slumps back into the trench it never left.'),
				chara: 't',
				damage: 6,
				hit: 0.75,
				attackDelay: 2.5,
				ranged: true,
				health: 26,
				loot: {
					'bullets': {
						min: 1,
						max: 5,
						chance: 0.8
					},
					'cloth': {
						min: 1,
						max: 3,
						chance: 0.6
					},
					'iron': {
						min: 1,
						max: 2,
						chance: 0.4
					}
				},
				notification: _('a voice calls a challenge in a language with no speakers left. then it fires.')
			}
		}
	},
	{ /* Glass Wolf */
	title: _('A Glass Wolf'),
		isAvailable: function() {
			return World.getDistance() > 10 && World.getTerrain() == World.TILE.FIELD;
		},
		scenes: {
			'start': {
				combat: true,
				enemy: 'glass wolf',
				enemyName: _('glass wolf'),
				deathMessage: _('it comes apart in bright pieces.'),
				chara: 'g',
				damage: 5,
				hit: 0.85,
				attackDelay: 1.5,
				health: 24,
				loot: {
					'scales': {
						min: 2,
						max: 5,
						chance: 0.9
					},
					'teeth': {
						min: 1,
						max: 4,
						chance: 0.8
					},
					'meat': {
						min: 1,
						max: 2,
						chance: 0.5
					}
				},
				notification: _('something with too many edges is already running at you.')
			}
		}
	},
	{ /* Shivering Human */
	title: _('A Shivering Human'),
		isAvailable: function() {
			return World.getDistance() > 10 && World.getDistance() <= 20 && World.getTerrain() == World.TILE.BARRENS;
		},
		scenes: {
			'start': {
				combat: true,
				enemy: 'shivering human',
				enemyName: _('shivering human'),
				deathMessage: _('the shivering human is dead'),
				chara: 'H',
				damage: 5,
				hit: 0.5,
				attackDelay: 1,
				health: 20,
				loot: {
					'cloth': {
						min: 1,
						max: 1,
						chance: 0.2
					},
					'teeth': {
						min: 1,
						max: 2,
						chance: 0.8
					},
					'leather': {
						min: 1,
						max: 1,
						chance: 0.2
					},
					'medicine': {
						min: 1,
						max: 3,
						chance: 0.7
					}
				},
				notification: _('a shivering human moves desperately through the bracing cold winds. the biting pain has driven them mad. they attack with surprising strength.')
			}
		}
	},
	{ /* Scout */
	title: _('A Scout'),
		isAvailable: function() {
			return World.getDistance() > 10 && World.getDistance() <= 20 && World.getTerrain() == World.TILE.BARRENS;
		},
		scenes: {
			'start': {
				combat: true,
				enemy: 'scout',
				enemyName: _('scout'),
				deathMessage: _('the scout will not be reporting back.'),
				chara: 'S',
				damage: 4,
				hit: 0.8,
				attackDelay: 2,
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
					'iron': {
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
				notification: _('a scout spots you. they could pass by. but why leave a witness who has seen them?')
			}
		}
	},
	{ /* Man-eater */
		title: _('A Man-Eater'),
		isAvailable: function() {
			return World.getDistance() > 10 && World.getDistance() <= 20 && World.getTerrain() == World.TILE.FOREST;
		},
		scenes: {
			'start': {
				combat: true,
				enemy: 'man-eater',
				enemyName: _('man-eater'),
				deathMessage: _('the man-eater is dead, whatever it was.'),
				chara: 'M',
				damage: 4,
				hit: 0.8,
				attackDelay: 1,
				health: 25,
				loot: {
					'fur': {
						min: 5,
						max: 10,
						chance: 1
					},
					'meat': {
						min: 5,
						max: 10,
						chance: 1
					},
					'teeth': {
						min: 5,
						max: 10,
						chance: 0.8
					}
				},
				notification: _('a large creature attacks, claws freshly bloodied')
			}
		}
	},
	{ /* Pack of Beasts */
		title: _('A Pack of Beasts'),
		isAvailable: function() {
			return World.getDistance() > 10 && World.getDistance() <= 20 && World.getTerrain() == World.TILE.FOREST;
		},
		scenes: {
			'start': {
				combat: true,
				enemy: 'pack of beasts',
				enemyName: _('pack of beasts'),
				deathMessage: _('the pack of beasts has been put down.'),
				chara: 'P',
				damage: 3,
				hit: 0.8,
				attackDelay: 1,
				health: 30,
				loot: {
					'fur': {
						min: 5,
						max: 10,
						chance: 1
					},
					'meat': {
						min: 5,
						max: 10,
						chance: 1
					},
					'teeth': {
						min: 5,
						max: 10,
						chance: 0.8
					}
				},
				notification: _('an entire pack of beasts emerge from the forest, hungry for flesh.')
			}
		}
	},
	{ /* Huge Lizard */
	title: _('A Huge Lizard'),
		isAvailable: function() {
			return World.getDistance() > 10 && World.getDistance() <= 20 && World.getTerrain() == World.TILE.FIELD;
		},
		scenes: {
			'start': {
				combat: true,
				enemy: 'lizard',
				enemyName: _('lizard'),
				deathMessage: _('the lizard is dead'),
				chara: 'L',
				damage: 5,
				hit: 0.8,
				attackDelay: 2,
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
				notification: _('the grass thrashes wildly as a huge lizard pushes through')
			}
		}
	},
	{ /* Chitinous Elk */
	title: _('A Chitinous Elk'),
		isAvailable: function() {
			return World.getDistance() > 10 && World.getDistance() <= 20 && World.getTerrain() == World.TILE.FIELD;
		},
		scenes: {
			'start': {
				combat: true,
				enemy: 'chitinous elk',
				enemyName: _('chitinous elk'),
				deathMessage: _('the chitinous elk is dead'),
				chara: 'E',
				damage: 4,
				hit: 0.8,
				attackDelay: 2,
				health: 35,
				loot: {
					'scales': {
						min: 3,
						max: 5,
						chance: 0.8
					},
					'leather': {
						min: 3,
						max: 5,
						chance: 0.8
					},
					'teeth': {
						min: 3,
						max: 5,
						chance: 0.5
					},
					'meat': {
						min: 5,
						max: 10,
						chance: 0.8
					}
				},
				notification: _('a chitinous elk charges with its thick armored hide.')
			}
		}
	},
	{ /* Escaped Convict */
	title: _('Escaped Convict'),
		isAvailable: function() {
			return World.getDistance() > 10 && World.getDistance() <= 20 && World.getTerrain() == World.TILE.FIELD;
		},
		scenes: {
			'start': {
				combat: true,
				enemy: 'escaped convict',
				enemyName: _('escaped convict'),
				deathMessage: _('the convict now confined to the grave'),
				chara: 'E',
				damage: 5,
				hit: 0.9,
				attackDelay: 1.5,
				health: 25,
				loot: {
					'cloth': {
						min: 1,
						max: 3,
						chance: 1.0
					},
					'leather': {
						min: 1,
						max: 3,
						chance: 0.8
					},
					'teeth': {
						min: 3,
						max: 5,
						chance: 0.5
					},
					'meat': {
						min: 5,
						max: 10,
						chance: 0.8
					}
				},
				notification: _('what prison did this convict escape from?')
			}
		}
	},
	/* =====================================================================
	 * TIER 3  --  World.getDistance() > 20
	 * ===================================================================== */
	{ /* Hollow Monk */
	title: _('A Hollow Monk'),
		isAvailable: function() {
			return World.getDistance() > 20 && World.getDistance() < 30 && World.getTerrain() == World.TILE.FOREST;
		},
		scenes: {
			'start': {
				combat: true,
				enemy: 'hollow monk',
				enemyName: _('hollow monk'),
				deathMessage: _('the wounds stop closing.'),
				chara: 'ø',
				damage: 7,
				specials: [{
					delay: 7,
					action: (fighter) => {
						Events.setStatus(fighter, 'regenerating');
						return _('knitting');
					}
				}],
				hit: 0.8,
				attackDelay: 1.5,
				health: 40,
				loot: {
					'cloth': {
						min: 2,
						max: 5,
						chance: 0.8
					},
					'medicine': {
						min: 1,
						max: 1,
						chance: 0.3
					},
					'teeth': {
						min: 1,
						max: 3,
						chance: 0.5
					}
				},
				notification: _('it does not raise its head. the wounds on its arms are old, and closing.')
			}
		}
	},
	{ /* Chain-Gang Revenant */
	title: _('A Chain-Gang Revenant'),
		isAvailable: function() {
			return World.getDistance() > 20 && World.getDistance() < 30 && World.getTerrain() == World.TILE.BARRENS;
		},
		scenes: {
			'start': {
				combat: true,
				enemy: 'chain-gang revenant',
				enemyName: _('chain-gang revenant'),
				deathMessage: _('it falls. the shackle stays closed.'),
				chara: '‡',
				damage: 9,
				specials: [{
					delay: 8,
					action: (fighter) => {
						Events.setStatus(fighter, 'enraged');
						return _('straining');
					}
				}],
				hit: 0.75,
				attackDelay: 2,
				health: 45,
				loot: {
					'iron': {
						min: 2,
						max: 5,
						chance: 0.9
					},
					'steel': {
						min: 1,
						max: 2,
						chance: 0.4
					},
					'cloth': {
						min: 1,
						max: 3,
						chance: 0.5
					}
				},
				notification: _('it drags a length of chain behind it. the other end is still bolted to something.')
			}
		}
	},
	{ /* Carrion Drone */
	title: _('A Carrion Drone'),
		isAvailable: function() {
			return World.getDistance() > 20 && World.getDistance() < 30 && World.getTerrain() == World.TILE.FIELD;
		},
		scenes: {
			'start': {
				combat: true,
				enemy: 'carrion drone',
				enemyName: _('carrion drone'),
				deathMessage: _('the drone drops out of the air mid-sentence.'),
				chara: 'd',
				damage: 8,
				specials: [{
					delay: 6,
					action: (fighter) => {
						Events.setStatus(fighter, 'venomous');
						return _('venomous');
					}
				}],
				hit: 0.85,
				attackDelay: 2,
				ranged: true,
				health: 32,
				loot: {
					'energy cell': {
						min: 1,
						max: 3,
						chance: 0.7
					},
					'steel': {
						min: 1,
						max: 3,
						chance: 0.6
					},
					'scales': {
						min: 1,
						max: 2,
						chance: 0.3
					}
				},
				notification: _('it hovers over the dead and recites a census that ended a long time ago.')
			}
		}
	},
	{ /* Feral Terror */
		title: _('A Feral Terror'),
		isAvailable: function() {
			return World.getDistance() > 20 && World.getDistance() < 30 && World.getTerrain() == World.TILE.FOREST;
		},
		scenes: {
			'start': {
				combat: true,
				enemy: 'feral terror',
				enemyName: _('feral terror'),
				deathMessage: _('the feral terror is dead'),
				chara: 'T',
				damage: 6,
				hit: 0.8,
				attackDelay: 1,
				health: 45,
				loot: {
					'fur': {
						min: 5,
						max: 10,
						chance: 1
					},
					'meat': {
						min: 5,
						max: 10,
						chance: 1
					},
					'teeth': {
						min: 5,
						max: 10,
						chance: 0.8
					}
				},
				notification: _('a beast, wilder than imagining, erupts out of the foliage')
			}
		}
	},
	{ /* 11B-X-1371 */
		title: _('11B-X-1371'),
		isAvailable: function() {
			return World.getDistance() > 20 && World.getDistance() < 30 && World.getTerrain() == World.TILE.FOREST;
		},
		scenes: {
			'start': {
				combat: true,
				enemy: '11B-X-1371',
				enemyName: _('11B-X-1371'),
				deathMessage: _('11B-X-1371 is still and silent.'),
				chara: 'X',
				damage: 12,
				hit: 0.8,
				attackDelay: 2,
				health: 40,
				loot: {
					'cloth': {
						min: 5,
						max: 10,
						chance: 1
					},
					'teeth': {
						min: 5,
						max: 10,
						chance: 1
					},
					'medicine': {
						min: 1,
						max: 2,
						chance: 0.8
					},
				},
				notification: _('a plague doctor emerges from the shadows with an alien and confusing message.')
			}
		}
	},
	{ /* Soldier */
	title: _('A Soldier'),
		isAvailable: function() {
			return World.getDistance() > 20 && World.getDistance() < 30 && World.getTerrain() == World.TILE.BARRENS;
		},
		scenes: {
			'start': {
				combat: true,
				enemy: 'soldier',
				enemyName: _('soldier'),
				deathMessage: _('the soldier is finally at peace.'),
				ranged: true,
				chara: 'S',
				damage: 8,
				hit: 0.8,
				attackDelay: 2,
				health: 50,
				loot: {
					'steel': {
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
					},
					'medicine': {
						min: 1,
						max: 2,
						chance: 0.1
					}
				},
				notification: _('a human soldier still fighting a war they have long lost.')
			}
		}
	},
	{ /* Madman */
		title: _("A madman"),
		isAvailable: function() {
			return World.getDistance() > 20 && World.getDistance() < 30 && World.getTerrain() == World.TILE.BARRENS;
		},
		scenes: {
			'start': {
				combat: true,
				enemy: 'madman',
				enemyName: _("madman"),
				deathMessage: _('the madman has died.'),
				chara: "M",
				damage: 5,
				hit: 0.9,
				attackDelay: 1,
				health: 20,
				loot: {
					'cloth': {
						min: 5,
						max: 10,
						chance: 0.1
					},
					'bone spear': {
						min: 1,
						max: 1,
						chance: 1
					},
					'teeth': {
						min: 5,
						max: 15,
						chance: 0.7
					}
				},
				notification: _("a random person runs out, swinging a spear around with drug-induced speed.")
			}
		}
	},
	{ /* Sniper */
	title: _('A Sniper'),
		isAvailable: function() {
			return World.getDistance() > 20 && World.getDistance() < 30 && World.getTerrain() == World.TILE.FIELD;
		},
		scenes: {
			'start': {
				combat: true,
				enemy: 'sniper',
				enemyName: _('sniper'),
				deathMessage: _('the sniper is dead'),
				chara: 'P',
				damage: 20,
				hit: 0.99,
				attackDelay: 4,
				health: 30,
				ranged: true,
				loot: {
					'cloth': {
						min: 5,
						max: 10,
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
					},
					'medicine': {
						min: 1,
						max: 2,
						chance: 0.1
					}
				},
				notification: _('a shot rings out, from somewhere in the long grass')
			}
		}
	},
	{ /* Venomous Beast */
	title: _('Venomous Beast'),
		isAvailable: function() {
			return World.getDistance() > 20 && World.getDistance() < 30 && World.getTerrain() == World.TILE.FIELD;
		},
		scenes: {
			'start': {
				combat: true,
				enemy: 'venomous beast',
				enemyName: _('venomous beast'),
				deathMessage: _('the venomous beast is dead'),
				chara: 'V',
				damage: 9,
				specials: [{
					delay: 1,
					action: (fighter) => {
						Events.setStatus(fighter, 'venomous');
						return 'venomous';
					}
				}],
				hit: 0.8,
				attackDelay: 2,
				health: 35,
				ranged: true,
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
						min: 3,
						max: 5,
						chance: 1
					},
				},
				notification: _('a venomous beast bares its fangs.')
			}
		}
	},
	{ /* Plague Doctor */
	title: _('A Plague Doctor'),
		isAvailable: function() {
			return World.getDistance() > 20 && World.getDistance() < 30 && World.getTerrain() == World.TILE.FIELD;
		},
		scenes: {
			'start': {
				combat: true,
				enemy: 'plague doctor',
				enemyName: _('plague doctor'),
				deathMessage: _('death finally came for them'),
				chara: 'D',
				damage: 8,
				hit: 0.9,
				attackDelay: 1.5,
				health: 35,
				loot: {
					'scales': {
						min: 3,
						max: 5,
						chance: 0.8
					},
					'leather': {
						min: 3,
						max: 5,
						chance: 0.8
					},
					'teeth': {
						min: 3,
						max: 5,
						chance: 0.5
					},
					'meat': {
						min: 5,
						max: 10,
						chance: 0.8
					}
				},
				notification: _('plague doctor brings deadly precision from a deadly premonition.')
			}
		}
	},
	/* =====================================================================
	 * TIER 4  --  World.getDistance() > 29
	 * Weighted toward barrens and forest, which each had only a single
	 * tier 4 encounter before -- reaching the outer ring in either meant
	 * fighting the same thing every time.
	 * ===================================================================== */
	{ /* Siege Automaton */
	title: _('A Siege Automaton'),
		isAvailable: function() {
			return World.getDistance() > 29 && World.getTerrain() == World.TILE.BARRENS;
		},
		scenes: {
			'start': {
				combat: true,
				enemy: 'siege automaton',
				enemyName: _('siege automaton'),
				deathMessage: _('the automaton kneels, and does not get up.'),
				chara: 'Ω',
				damage: 12,
				specials: [
					{
						delay: 9,
						action: (fighter) => {
							Events.setStatus(fighter, 'shield');
							return _('plating');
						}
					},
					{
						/* Offset from the shield so the two don't fire together:
						 * the automaton alternates between covering itself and
						 * opening its housing to fire, which is the window. */
						delay: 13,
						action: (fighter) => {
							Events.setStatus(fighter, 'brittle');
							return _('housing open');
						}
					}
				],
				hit: 0.85,
				attackDelay: 2,
				ranged: true,
				health: 75,
				loot: {
					'steel': {
						min: 2,
						max: 5,
						chance: 0.9
					},
					'energy cell': {
						min: 2,
						max: 4,
						chance: 0.8
					},
					'alien alloy': {
						min: 1,
						max: 1,
						chance: 0.3
					}
				},
				notification: _('it was built to break a wall that is no longer standing. it settles for you.')
			}
		}
	},
	{ /* Grafted Colossus */
	title: _('A Grafted Colossus'),
		isAvailable: function() {
			return World.getDistance() > 29 && World.getTerrain() == World.TILE.FOREST;
		},
		scenes: {
			'start': {
				combat: true,
				enemy: 'grafted colossus',
				enemyName: _('grafted colossus'),
				deathMessage: _('all of it stops at once.'),
				chara: 'Ħ',
				damage: 12,
				specials: [{
					delay: 8,
					action: (fighter) => {
						Events.setStatus(fighter, 'regenerating');
						return _('grafting');
					}
				}],
				hit: 0.8,
				attackDelay: 2,
				health: 90,
				loot: {
					'leather': {
						min: 3,
						max: 6,
						chance: 0.9
					},
					'teeth': {
						min: 2,
						max: 6,
						chance: 0.8
					},
					'alien alloy': {
						min: 1,
						max: 1,
						chance: 0.25
					}
				},
				notification: _('too many limbs, and none of them agree on how old they are.')
			}
		}
	},
	{ /* Warden Echo */
	title: _('A Warden Echo'),
		isAvailable: function() {
			return World.getDistance() > 29 && World.getTerrain() == World.TILE.FIELD;
		},
		scenes: {
			'start': {
				combat: true,
				enemy: 'warden echo',
				enemyName: _('warden echo'),
				deathMessage: _('the shape thins out and is gone. the sound takes longer.'),
				chara: 'Ξ',
				damage: 13,
				specials: [
					{
						delay: 7,
						action: () => {
							const player = $('#wanderer');
							Events.setStatus(player, 'blinded');
							Events.updateFighterDiv(player);
							return _('unlit');
						}
					},
					{
						delay: 11,
						action: (fighter) => {
							Events.setStatus(fighter, 'energised');
							return _('energised');
						}
					}
				],
				hit: 0.85,
				attackDelay: 1.5,
				health: 70,
				loot: {
					'energy cell': {
						min: 2,
						max: 5,
						chance: 0.8
					},
					'alien alloy': {
						min: 1,
						max: 2,
						chance: 0.4
					},
					'steel': {
						min: 1,
						max: 3,
						chance: 0.5
					}
				},
				notification: _('it is still running a headcount. it has not been told the prison fell.')
			}
		}
	},
	{ /* Mutant */
		title: _('A Mutant'),
		isAvailable: function() {
			return World.getDistance() > 29 && World.getTerrain() == World.TILE.BARRENS;
		},
		scenes: {
			'start': {
				combat: true,
				enemy: 'mutant',
				enemyName: _('mutant'),
				deathMessage: _('the mutant appears relieved in death.'),
				chara: 'Œ',
				damage: 11,
				specials: [{
					delay: 4,
					action: (fighter) => {
						Events.setStatus(fighter, 'enraged');
						return 'enraged';
					}
				}],
				hit: 0.75,
				attackDelay: 1.5,
				health: 55,
				loot: {
					'fur': {
						min: 5,
						max: 10,
						chance: 1
					},
					'meat': {
						min: 5,
						max: 10,
						chance: 1
					},
					'teeth': {
						min: 5,
						max: 10,
						chance: 0.8
					}
				},
				notification: _('a victim of radiation, experimentation and bloodlust lurches forward.')
			}
		}
	},
	{ /* Cyborg Bear */
		title: _('A Cyborg Bear'),
		isAvailable: function() {
			return World.getDistance() > 29 && World.getTerrain() == World.TILE.FOREST;
		},
		scenes: {
			'start': {
				combat: true,
				enemy: 'cyborg bear',
				enemyName: _('cyborg bear'),
				deathMessage: _('the cyborg bear shuts down.'),
				chara: 'ß',
				damage: 12,
				specials: [{
					delay: 4,
					action: (fighter) => {
						Events.setStatus(fighter, 'energised');
						return 'energised';
					}
				}],
				hit: 0.8,
				attackDelay: 2,
				health: 70,
				loot: {
					'fur': {
						min: 5,
						max: 10,
						chance: 1
					},
					'meat': {
						min: 5,
						max: 10,
						chance: 1
					},
					'teeth': {
						min: 5,
						max: 10,
						chance: 0.8
					}
				},
				notification: _('equally unnatural and deadly, the cyborg bear stands ready.')
			}
		}
	},
	{ /* Mech Warrior */
		title: _('A Mech Warrior'),
		isAvailable: function() {
			return World.getDistance() > 29 && World.getTerrain() == World.TILE.FIELD;
		},
		scenes: {
			'start': {
				combat: true,
				enemy: 'mech warrior',
				enemyName: _('mech warrior'),
				deathMessage: _('the mech warrior has been destroyed.'),
				chara: '¤',
				damage: 10,
				specials: [{
					delay: 5,
					action: (fighter) => {
						Events.setStatus(fighter, 'shield');
						return 'shield';
					}
				}],
				hit: 0.9,
				attackDelay: 2,
				health: 60,
				loot: {
					'steel': {
						min: 5,
						max: 10,
						chance: 1
					},
					'energy cell': {
						min: 5,
						max: 10,
						chance: 1
					},
					'grenade': {
						min: 1,
						max: 2,
						chance: 0.3
					}
				},
				notification: _('stolen wanderer tech, the mech warrior blasts across the fields.')
			}
		}
	},
	{ /* Profane Cultist */
		title: _('A Profane Cultist'),
		isAvailable: function() {
			return World.getDistance() > 29 && World.getTerrain() == World.TILE.FIELD;
		},
		scenes: {
			'start': {
				combat: true,
				enemy: 'Profane cultist',
				enemyName: _('Profane cultist'),
				deathMessage: _('who is this Profane that they worshiped?'),
				chara: '¢',
				damage: 10,
				specials: [{
					delay: 5,
					action: (fighter) => {
						Events.setStatus(fighter, 'meditation');
						return 'meditation';
					}
				}],
				hit: 0.8,
				attackDelay: .75,
				health: 55,
				loot: {
					'steel': {
						min: 5,
						max: 10,
						chance: 1
					},
					'energy cell': {
						min: 5,
						max: 10,
						chance: 1
					},
					'grenade': {
						min: 1,
						max: 2,
						chance: 0.3
					}
				},
				notification: _('you see a symbol they bear, somehow knowing it to represent The Profane.')
			}
		}
	},
	{ /* Eldritch Horror */
		title: _('An Eldritch Horror'),
		isAvailable: function() {
			return World.getDistance() > 29 && World.getTerrain() == World.TILE.FIELD;
		},
		scenes: {
			'start': {
				combat: true,
				enemy: 'eldritch horror',
				enemyName: _('eldritch horror'),
				deathMessage: _('you send this beast back from whence it came.'),
				chara: '¿',
				damage: 13,
				specials: [{
					delay: 5,
					action: (fighter) => {
						Events.setStatus(fighter, 'venomous');
						return 'venomous';
					}
				}],
				hit: 0.8,
				attackDelay: 1.25,
				health: 100,
				loot: {
					'teeth': {
						min: 1,
						max: 3,
						chance: 1
					},
					'scales': {
						min: 1,
						max: 3,
						chance: 1
					},
					'cured meat': {
						min: 1,
						max: 3,
						chance: 1
					}
				},
				notification: _('you know this creature is not of this world.')
			}
		}
	},
];
