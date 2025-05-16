/**
 * Events that can occur when wandering around the world
 **/
Events.Encounters = [
	/* Tier 1 */
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
				deathMessage: _('the shadow is gone, or is it?'),
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
	/* Tier 2 */
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
	/* Tier 3 */
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
				notification: _("A random person runs out, swinging a spear around with drug-induced speed.")
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
	/* Tier 4 */
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
				chara: 'M',
				damage: 10,
				specials: [{
					delay: 4,
					action: (fighter) => {
						Events.setStatus(fighter, 'enraged');
						return 'enraged';
					}
				}],
				hit: 0.7,
				attackDelay: 1.5,
				health: 65,
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
				chara: 'C',
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
				chara: 'W',
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
];
