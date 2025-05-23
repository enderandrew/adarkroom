/**
 * Module that registers the simple room functionality
 */
var Room = {
	// times in (minutes * seconds * milliseconds)
	_FIRE_COOL_DELAY: 5 * 60 * 1000, // time after a stoke before the fire cools
	_ROOM_WARM_DELAY: 30 * 1000, // time between room temperature updates
	_BUILDER_STATE_DELAY: 0.5 * 60 * 1000, // time between builder state updates
	_STOKE_COOLDOWN: 5, // cooldown to stoke the fire
	_NEED_WOOD_DELAY: 15 * 1000, // from when the stranger shows up, to when you need wood
	buttons:{},
	Craftables: {
		'trap': {
			name: _('trap'),
			button: null,
			maximum: 10,
			availableMsg: _('builder says she can make traps to catch any creatures might still be alive out there'),
			buildMsg: _('more traps to catch more creatures'),
			maxMsg: _("more traps won't help now"),
			type: 'building',
			cost: function() {
				if ($SM.get('playStats.trapAlertShown')) {
					var n = $SM.get('game.buildings["trap"]', true);
					return {
						'wood': 10 + (n*10)
					};
				}
		
				$SM.set('playStats.trapAlertShown', true);
				Events.startEvent({
					title: _('trap'),
					scenes: {
						start: {
							text: [_("creatures can be heard outside the room. builder says she can make traps to catch any creatures might still be alive out there.")],
							buttons: {
								'yes': {
									text: _('ok'),
									nextScene: 'end',
								}
							}
						}
					}
				});
				var n = $SM.get('game.buildings["trap"]', true);
				return {
					'wood': 10 + (n*10)
				};
			},
			audio: AudioLibrary.BUILD_TRAP
		},
		'cart': {
			name: _('cart'),
			button: null,
			maximum: 1,
			availableMsg: _('builder says she can make a cart for carrying wood'),
			buildMsg: _('the rickety cart will carry more wood from the forest'),
			type: 'building',
			cost: function() {
				if ($SM.get('playStats.cartAlertShown')) {
					return {
						'wood': 30
					};
				}
		
				$SM.set('playStats.cartAlertShown', true);
				Events.startEvent({
					title: _('cart'),
					scenes: {
						start: {
							text: [_("builder says to work smarter not harder. head still groggy but the fire needs more wood. having a cart means more time in the warm room and less time in the cold and dangerous woods.")],
							buttons: {
								'yes': {
									text: _('ok'),
									nextScene: 'end',
								}
							}
						}
					}
				});
				return {
					'wood': 30
				};
			},
			audio: AudioLibrary.BUILD_CART
		},
		'hut': {
			name: _('hut'),
			button: null,
			maximum: 25,
			availableMsg: _("builder says there are more wanderers. says they'll work, too."),
			buildMsg: _('builder puts up a hut, out in the forest. says word will get around.'),
			maxMsg: _('no more room for huts.'),
			type: 'building',
			cost: function() {
				if ($SM.get('playStats.hutAlertShown') || !Room.buttons["hut"]) {
					var n = $SM.get('game.buildings["hut"]', true);
					return {
						'wood': 100 + (n*50)
					};
				}
		
				$SM.set('playStats.hutAlertShown', true);
				Events.startEvent({
					title: _('hut'),
					scenes: {
						start: {
							text: [_("builder says there are more wanderers. says they'll work, too. the fire will attract them, but they will need a place to stay.")],
							buttons: {
								'yes': {
									text: _('ok'),
									nextScene: 'end',
								}
							}
						}
					}
				});
				var n = $SM.get('game.buildings["hut"]', true);
				return {
					'wood': 100 + (n*50)
				};
			},
			audio: AudioLibrary.BUILD_HUT
		},
		'lodge': {
			name: _('lodge'),
			button: null,
			maximum: 1,
			availableMsg: _('villagers could help hunt, given the means'),
			buildMsg: _('the hunting lodge stands in the forest, a ways out of town'),
			type: 'building',
			cost: function() {
				if ($SM.get('playStats.lodgeAlertShown') || !Room.buttons["lodge"]) {
					return {
						wood: 200,
						fur: 10,
						meat: 5
					};
				}
		
				$SM.set('playStats.lodgeAlertShown', true);
				Events.startEvent({
					title: _('lodge'),
					scenes: {
						start: {
							text: [_("hungry mouths crave meat. beasts attack wanderers in the wild. wanderers want to strike back. builder says villagers could help hunt, given the means with a hunting lodge. who will hunt the beasts?")],
							buttons: {
								'yes': {
									text: _('ok'),
									nextScene: 'end',
								}
							}
						}
					}
				});
				return {
					wood: 200,
					fur: 10,
					meat: 5
				};
			},
			audio: AudioLibrary.BUILD_LODGE
		},
		'trading post': {
			name: _('trading post'),
			button: null,
			maximum: 1,
			availableMsg: _("a trading post would make commerce easier"),
			buildMsg: _("now the nomads have a place to set up shop, they might stick around a while"),
			type: 'building',
			cost: function() {
				if ($SM.get('playStats.tradingpostAlertShown') || !Room.buttons["trading post"]) {
					return {
						'wood': 400,
						'fur': 100
					};
				}
		
				$SM.set('playStats.tradingpostAlertShown', true);
				Events.startEvent({
					title: _('trading post'),
					scenes: {
						start: {
							text: [_("dangerous as it is, there is a world outside this room. nomads pass by from time to time. builder says a trading post would make commerce easier")],
							buttons: {
								'yes': {
									text: _('ok'),
									nextScene: 'end',
								}
							}
						}
					}
				});
				return {
					'wood': 400,
					'fur': 100
				};
			},
			audio: AudioLibrary.BUILD_TRADING_POST
		},
		'tannery': {
			name: _('tannery'),
			button: null,
			maximum: 1,
			availableMsg: _("builder says leather could be useful. says the villagers could make it."),
			buildMsg: _('tannery goes up quick, on the edge of the village'),
			type: 'building',
			cost: function() {
				if ($SM.get('playStats.tanneryAlertShown') || !Room.buttons["tannery"]) {
					return {
						'wood': 500,
						'fur': 50
					};
				}
		
				$SM.set('playStats.tanneryAlertShown', true);
				Events.startEvent({
					title: _('tannery'),
					scenes: {
						start: {
							text: [_("builder points to the furs from the dead beasts. she says leather could be useful. says the villagers could make it.")],
							buttons: {
								'yes': {
									text: _('ok'),
									nextScene: 'end',
								}
							}
						}
					}
				});
				return {
					'wood': 500,
					'fur': 50
				};
			},
			audio: AudioLibrary.BUILD_TANNERY
		},
		'smokehouse': {
			name: _('smokehouse'),
			button: null,
			maximum: 1,
			availableMsg: _("should cure the meat, or it'll spoil. builder says she can fix something up."),
			buildMsg: _('builder finishes the smokehouse. she looks hungry.'),
			type: 'building',
			cost: function() {
				if ($SM.get('playStats.smokehouseAlertShown') || !Room.buttons["smokehouse"]) {
					return {
						'wood': 600,
						'meat': 50
					};
				}
		
				$SM.set('playStats.smokehouseAlertShown', true);
				Events.startEvent({
					title: _('smokehouse'),
					scenes: {
						start: {
							text: [_("enough meat to no longer worry about starving. first bright light in these dark lands? should cure the meat, or it'll spoil. builder says she can fix something up.")],
							buttons: {
								'yes': {
									text: _('ok'),
									nextScene: 'end',
								}
							}
						}
					}
				});
				return {
					'wood': 600,
					'meat': 50
				};
			},
			audio: AudioLibrary.BUILD_SMOKEHOUSE
		},
		'workshop': {
			name: _('workshop'),
			button: null,
			maximum: 1,
			availableMsg: _("builder says she could make finer things, if she had the tools"),
			buildMsg: _("workshop's finally ready. builder's excited to get to it"),
			type: 'building',		
			cost: function() {
				if ($SM.get('playStats.workshopAlertShown') || !Room.buttons["workshop"]) {
					return {
						'wood': 800,
						'leather': 100,
						'scales': 10
					};
				}
		
				$SM.set('playStats.workshopAlertShown', true);
				Events.startEvent({
					title: _('workshop'),
					scenes: {
						start: {
							text: [_("trying to carve out some semblence of civilization amongst the unforgiving wastes. builder says she could make finer things, if she had the tools")],
							buttons: {
								'yes': {
									text: _('ok'),
									nextScene: 'end',
								}
							}
						}
					}
				});
				return {
					'wood': 800,
					'leather': 100,
					'scales': 10
				};
			},
			audio: AudioLibrary.BUILD_WORKSHOP
		},
		'steelworks': {
			name: _('steelworks'),
			button: null,
			maximum: 1,
			availableMsg: _("builder says the villagers could make steel, given the tools"),
			buildMsg: _("a haze falls over the village as the steelworks fires up"),
			type: 'building',
			cost: function() {
				if ($SM.get('playStats.steelworksAlertShown') || !Room.buttons["steelworks"]) {
					return {
						'wood': 1500,
						'iron': 100,
						'coal': 100
					};
				}
		
				$SM.set('playStats.steelworksAlertShown', true);
				Events.startEvent({
					title: _('steelworks'),
					scenes: {
						start: {
							text: [_("steel blades and armor are a defense against the ravages and savages of the wastes. more than that. wanderers once crossed the stars. making steel seems like a step towards the future. builder says the villagers could make steel, given the tools")],
							buttons: {
								'yes': {
									text: _('ok'),
									nextScene: 'end',
								}
							}
						}
					}
				});
				return {
					'wood': 1500,
					'iron': 100,
					'coal': 100
				};
			},
			audio: AudioLibrary.BUILD_STEELWORKS
		},
		'armoury': {
			name: _('armoury'),
			button: null,
			maximum: 1,
			availableMsg: _("builder says it'd be useful to have a steady source of bullets"),
			buildMsg: _("armoury's done, welcoming back the weapons of the past."),
			type: 'building',
			cost: function() {
				if ($SM.get('playStats.armouryAlertShown') || !Room.buttons["armoury"]) {
					return {
						'wood': 3000,
						'steel': 100,
						'sulphur': 50
					};
				}
		
				$SM.set('playStats.armouryAlertShown', true);
				Events.startEvent({
					title: _('armoury'),
					scenes: {
						start: {
							text: [_("deadly soldiers and raiders out in the wild. builder says it'd be useful to have a steady source of bullets")],
							buttons: {
								'yes': {
									text: _('ok'),
									nextScene: 'end',
								}
							}
						}
					}
				});
				return {
					'wood': 3000,
					'steel': 100,
					'sulphur': 50
				};
			},
			audio: AudioLibrary.BUILD_ARMOURY
		},
		'uber trap': {
			name: _('uber trap'),
			button: null,
			maximum: 5,
			availableMsg: _('builder says she has come up with a better trap design'),
			buildMsg: _('uber traps leverage wanderer technology to catch more important resources'),
			maxMsg: _("more uber traps would be for naught"),
			type: 'building',
			cost: function() {
				if ($SM.get('playStats.utrapAlertShown') || !Room.buttons["utrap"]) {
					var n = $SM.get('game.buildings["utrap"]', true);
					return {
						'wood': 50 + (n*50),
						'iron': 10 + (n*10),
						'steel': 5 + (n*5)
					};
				}
		
				$SM.set('playStats.utrapAlertShown', true);
				Events.startEvent({
					title: _('uber trap'),
					scenes: {
						start: {
							text: [_("builder says she has come up with a better trap design. wanderer ingenuity and steel versus the beasts of the wilds.")],
							buttons: {
								'yes': {
									text: _('ok'),
									nextScene: 'end',
								}
							}
						}
					}
				});
				var n = $SM.get('game.buildings["utrap"]', true);
				return {
					'wood': 50 + (n*50),
					'iron': 10 + (n*10),
					'steel': 5 + (n*5)
				};
			},
			audio: AudioLibrary.BUILD_TRAP
		},
		'torch': {
			name: _('torch'),
			button: null,
			type: 'tool',
			buildMsg: _('a torch to keep the dark away'),
			cost: function() {
				if ($SM.get('playStats.torchAlertShown') || !Room.buttons["torch"]) {
					return {
						'wood': 1,
						'cloth': 1
					};
				}
		
				$SM.set('playStats.torchAlertShown', true);
				Events.startEvent({
					title: _('torch'),
					scenes: {
						start: {
							text: [_("fire in this room attracted others in need. but fire can also keep the darkness at bay in the wilds. build suggests crafting torches.")],
							buttons: {
								'yes': {
									text: _('ok'),
									nextScene: 'end',
								}
							}
						}
					}
				});
				return {
					'wood': 1,
					'cloth': 1
				};
			},
			audio: AudioLibrary.CRAFT_TORCH
		},
		'waterskin': {
			name: _('waterskin'),
			button: null,
			type: 'upgrade',
			maximum: 1,
			buildMsg: _('this waterskin\'ll hold a bit of water, at least'),
			cost: function() {
				if ($SM.get('playStats.waterskinAlertShown') || !Room.buttons["waterskin"]) {
					return {
						'leather': 50
					};
				}
		
				$SM.set('playStats.waterskinAlertShown', true);
				Events.startEvent({
					title: _('waterskin'),
					scenes: {
						start: {
							text: [_("water is needed to survive while exploring the wilds. builder suggests crafting a waterskin to safely explore the wilds.")],
							buttons: {
								'yes': {
									text: _('ok'),
									nextScene: 'end',
								}
							}
						}
					}
				});
				return {
					'leather': 50
				};
			},
			audio: AudioLibrary.CRAFT_WATERSKIN
		},
		'cask': {
			name: _('cask'),
			button: null,
			type: 'upgrade',
			maximum: 1,
			buildMsg: _('the cask holds enough water for longer expeditions'),
			cost: function() {
				if ($SM.get('playStats.caskAlertShown') || !Room.buttons["cask"]) {
					return {
						'leather': 100,
						'iron': 20
					};
				}
		
				$SM.set('playStats.caskAlertShown', true);
				Events.startEvent({
					title: _('cask'),
					scenes: {
						start: {
							text: [_("water is needed to survive while exploring the wilds. a waterskin can only hold so much. builder suggests crafting a cask to safely explore further.")],
							buttons: {
								'yes': {
									text: _('ok'),
									nextScene: 'end',
								}
							}
						}
					}
				});
				return {
					'leather': 100,
					'iron': 20
				};
			},
			audio: AudioLibrary.CRAFT_CASK
		},
		'water tank': {
			name: _('water tank'),
			button: null,
			type: 'upgrade',
			maximum: 1,
			buildMsg: _('never go thirsty again'),
			cost: function() {
				if ($SM.get('playStats.watertankAlertShown') || !Room.buttons["water tank"]) {
					return {
						'iron': 100,
						'steel': 50
					};
				}
		
				$SM.set('playStats.watertankAlertShown', true);
				Events.startEvent({
					title: _('water tank'),
					scenes: {
						start: {
							text: [_("water is needed to survive while exploring the wilds. a cask can only hold so much. builder suggests crafting a water tank to really explore the wilds.")],
							buttons: {
								'yes': {
									text: _('ok'),
									nextScene: 'end',
								}
							}
						}
					}
				});
				return {
					'iron': 100,
					'steel': 50
				};
			},
			audio: AudioLibrary.CRAFT_WATER_TANK
		},
		'bone spear': {
			name: _('bone spear'),
			button: null,
			type: 'weapon',
			buildMsg: _("this spear's not elegant, but it's pretty good at stabbing"),
			cost: function() {
				if ($SM.get('playStats.bonespearAlertShown') || !Room.buttons["bone spear"]) {
					return {
						'wood': 100,
						'teeth': 5
					};
				}
		
				$SM.set('playStats.bonespearAlertShown', true);
				Events.startEvent({
					title: _('bone spear'),
					scenes: {
						start: {
							text: [_("there are dangerous beasts and dangerous people outside. kill or be killed. builder can craft bone spears.")],
							buttons: {
								'yes': {
									text: _('ok'),
									nextScene: 'end',
								}
							}
						}
					}
				});
				return {
					'wood': 100,
					'teeth': 5
				};
			},
			audio: AudioLibrary.CRAFT_BONE_SPEAR
		},
		'rucksack': {
			name: _('rucksack'),
			button: null,
			type: 'upgrade',
			maximum: 1,
			buildMsg: _('carrying more means longer expeditions to the wilds'),
			cost: function() {
				if ($SM.get('playStats.rucksackAlertShown') || !Room.buttons["rucksack"]) {
					return {
						'leather': 200
					};
				}
		
				$SM.set('playStats.rucksackAlertShown', true);
				Events.startEvent({
					title: _('rucksack'),
					scenes: {
						start: {
							text: [_("expeditions require gear. builder can stitch leather together into a rucksack.")],
							buttons: {
								'yes': {
									text: _('ok'),
									nextScene: 'end',
								}
							}
						}
					}
				});
				return {
					'leather': 200
				};
			},
			audio: AudioLibrary.CRAFT_RUCKSACK
		},
		'wagon': {
			name: _('wagon'),
			button: null,
			type: 'upgrade',
			maximum: 1,
			buildMsg: _('the wagon can carry a lot of supplies'),
			cost: function() {
				if ($SM.get('playStats.wagonAlertShown') || !Room.buttons["wagon"]) {
					return {
						'wood': 500,
						'iron': 100
					};
				}
		
				$SM.set('playStats.wagonAlertShown', true);
				Events.startEvent({
					title: _('wagon'),
					scenes: {
						start: {
							text: [_("it isn't enough to carry the minimum to survive. the dead leave loot. builder can craft a wagon.")],
							buttons: {
								'yes': {
									text: _('ok'),
									nextScene: 'end',
								}
							}
						}
					}
				});
				return {
					'wood': 500,
					'iron': 100
				};
			},
			audio: AudioLibrary.CRAFT_WAGON
		},
		'convoy': {
			name: _('convoy'),
			button: null,
			type: 'upgrade',
			maximum: 1,
			buildMsg: _('the convoy can haul mostly everything'),
			cost: function() {
				if ($SM.get('playStats.convoyAlertShown') || !Room.buttons["convoy"]) {
					return {
						'wood': 1000,
						'iron': 200,
						'steel': 100
					};
				}
		
				$SM.set('playStats.convoyAlertShown', true);
				Events.startEvent({
					title: _('convoy'),
					scenes: {
						start: {
							text: [_("larger conquests need to be carried back. builder can leverage wanderer engineering to craft a convoy.")],
							buttons: {
								'yes': {
									text: _('ok'),
									nextScene: 'end',
								}
							}
						}
					}
				});
				return {
					'wood': 1000,
					'iron': 200,
					'steel': 100
				};
			},
			audio: AudioLibrary.CRAFT_CONVOY
		},
		'l armour': {
			name: _('l armour'),
			type: 'upgrade',
			maximum: 1,
			buildMsg: _("leather's not strong. better than rags, though."),
			cost: function() {
				if ($SM.get('playStats.larmourAlertShown') || !Room.buttons["l armour"]) {
					return {
						'leather': 200,
						'scales': 20
					};
				}
		
				$SM.set('playStats.larmourAlertShown', true);
				Events.startEvent({
					title: _('leather armour'),
					scenes: {
						start: {
							text: [_("sharp teeth, hungry mouths and violent hearts desire blood. builder can stitch together leather armour for protection.")],
							buttons: {
								'yes': {
									text: _('ok'),
									nextScene: 'end',
								}
							}
						}
					}
				});
				return {
					'leather': 200,
					'scales': 20
				};
			},
			audio: AudioLibrary.CRAFT_LEATHER_ARMOUR
		},
		'i armour': {
			name: _('i armour'),
			type: 'upgrade',
			maximum: 1,
			buildMsg: _("iron's stronger than leather"),
			cost: function() {
				if ($SM.get('playStats.iarmourAlertShown') || !Room.buttons["i armour"]) {
					return {
						'leather': 200,
						'iron': 100
					};
				}
		
				$SM.set('playStats.iarmourAlertShown', true);
				Events.startEvent({
					title: _('iron armour'),
					scenes: {
						start: {
							text: [_("sharp teeth, hungry mouths and violent hearts desire blood. builder can make stronger iron armour for protection.")],
							buttons: {
								'yes': {
									text: _('ok'),
									nextScene: 'end',
								}
							}
						}
					}
				});
				return {
					'leather': 200,
					'iron': 100
				};
			},
			audio: AudioLibrary.CRAFT_IRON_ARMOUR
		},
		's armour': {
			name: _('s armour'),
			type: 'upgrade',
			maximum: 1,
			buildMsg: _("steel's stronger than iron"),
			cost: function() {
				if ($SM.get('playStats.sarmourAlertShown') || !Room.buttons["s armour"]) {
					return {
						'leather': 200,
						'steel': 100
					};
				}
		
				$SM.set('playStats.sarmourAlertShown', true);
				Events.startEvent({
					title: _('steel armour'),
					scenes: {
						start: {
							text: [_("sharp teeth, hungry mouths and violent hearts desire blood. builder can make even stronger steel armour for protection.")],
							buttons: {
								'yes': {
									text: _('ok'),
									nextScene: 'end',
								}
							}
						}
					}
				});
				return {
					'leather': 200,
					'steel': 100
				};
			},
			audio: AudioLibrary.CRAFT_STEEL_ARMOUR
		},
		'iron sword': {
			name: _('iron sword'),
			button: null,
			type: 'weapon',
			buildMsg: _("sword is sharp. good protection out in the wilds."),
			cost: function() {
				if ($SM.get('playStats.ironswordAlertShown') || !Room.buttons["iron sword"]) {
					return {
						'wood': 200,
						'leather': 50,
						'iron': 20
					};
				}
		
				$SM.set('playStats.ironswordAlertShown', true);
				Events.startEvent({
					title: _('iron sword'),
					scenes: {
						start: {
							text: [_("a sharp blade can slay foes in the dangerous wilds. builder can make an iron sword.")],
							buttons: {
								'yes': {
									text: _('ok'),
									nextScene: 'end',
								}
							}
						}
					}
				});
				return {
					'wood': 200,
					'leather': 50,
					'iron': 20
				};
			},
			audio: AudioLibrary.CRAFT_IRON_SWORD
		},
		'steel sword': {
			name: _('steel sword'),
			button: null,
			type: 'weapon',
			buildMsg: _("the steel is strong, and the blade true."),
			cost: function() {
				if ($SM.get('playStats.steelswordAlertShown') || !Room.buttons["steel sword"]) {
					return {
						'wood': 200,
						'leather': 50,
						'steel': 20
					};
				}
		
				$SM.set('playStats.steelswordAlertShown', true);
				Events.startEvent({
					title: _('steel sword'),
					scenes: {
						start: {
							text: [_("a sharper blade for more deadly foes in the dangerous wilds. builder can make an steel sword.")],
							buttons: {
								'yes': {
									text: _('ok'),
									nextScene: 'end',
								}
							}
						}
					}
				});
				return {
					'wood': 200,
					'leather': 50,
					'steel': 20
				};
			},
			audio: AudioLibrary.CRAFT_STEEL_SWORD
		},
		'rifle': {
			name: _('rifle'),
			type: 'weapon',
			buildMsg: _("black powder and bullets, like the old days."),
			cost: function() {
				if ($SM.get('playStats.rifleAlertShown') || !Room.buttons["rifle"]) {
					return {
						'wood': 200,
						'steel': 50,
						'sulphur': 50
					};
				}
		
				$SM.set('playStats.rifleAlertShown', true);
				Events.startEvent({
					title: _('rifle'),
					scenes: {
						start: {
							text: [_("rifles can kill at a safe distance. a more modern and deadly weapon. builder can craft a rifle.")],
							buttons: {
								'yes': {
									text: _('ok'),
									nextScene: 'end',
								}
							}
						}
					}
				});
				return {
					'wood': 200,
					'steel': 50,
					'sulphur': 50
				};
			},
			audio: AudioLibrary.CRAFT_RIFLE
		},
		// Disabling the Handheld Nuke because it would remove the challenge of the boss fights in the Executioner. I may keep ONE as loot somewhere. If you can take it to a single boss and not die, then there you go.
		// 
		// 'handheld nuke': {
		// 	name: _('handheld nuke'),
		// 	type: 'weapon',
		// 	buildMsg: _("extremely powerful handheld bomb that instantly destroys an enemy."),
		//	cost: function() {
		//		if ($SM.get('playStats.handheldnukeAlertShown') || !Room.buttons["handheld nuke"]) {
		//			return {
		//				'wood': 200,
		//				'steel': 50,
		//				'sulphur': 50
		//			};
		//		}
		//
		//		$SM.set('playStats.handheldnukeAlertShown', true);
		//		Events.startEvent({
		//			title: _('handheld nuke'),
		//			scenes: {
		//				start: {
		//					text: [_("become the destroyer of worlds. use a nuke to kill the most deadly of foes. builder can channel wanderer technology to craft a handheld nuke.")],
		//					buttons: {
		//						'yes': {
		//							text: _('ok'),
		//							nextScene: 'end',
		//						}
		//					}
		//				}
		//			}
		//		});
		//		return {
		//			'wood': 200,
		//			'steel': 50,
		//			'sulphur': 50
		//		};
		//	},
		//	AudioLibrary.BUY_GRENADES
		// }
	},
	
	TradeGoods: {
		'scales': {
			type: 'good',
			cost: function() {
				return { fur: 150 };
			},
			audio: AudioLibrary.BUY_SCALES
		},
		'teeth': {
			type: 'good',
			cost: function() {
				return { fur: 300 };
			},
			audio: AudioLibrary.BUY_TEETH
		},
		'iron': {
			type: 'good',
			cost: function() {
				return {
					'fur': 150,
					'scales': 50
				};
			},
			audio: AudioLibrary.BUY_IRON
		},
		'coal': {
			type: 'good',
			cost: function() {
				return {
					'fur': 200,
					'teeth': 50
				};
			},
			audio: AudioLibrary.BUY_COAL
		},
		'steel': {
			type: 'good',
			cost: function() {
				return {
					'fur': 300,
					'scales': 50,
					'teeth': 50
				};
			},
			audio: AudioLibrary.BUY_STEEL
		},
		'medicine': {
			type: 'good',
			cost: function() {
				return {
					'scales': 50, 'teeth': 30
				};
			},
			audio: AudioLibrary.BUY_MEDICINE
		},
		'bullets': {
			type: 'good',
			cost: function() {
				return {
					'scales': 10
				};
			},
			audio: AudioLibrary.BUY_BULLETS
		},
		'energy cell': {
			type: 'good',
			cost: function() {
				return {
					'scales': 10,
					'teeth': 10
				};
			},
			audio: AudioLibrary.BUY_ENERGY_CELL
		},
		'bolas': {
			type: 'weapon',
			cost: function() {
				return {
					'teeth': 10
				};
			},
			audio: AudioLibrary.BUY_BOLAS
		},
		'grenade': {
			type: 'weapon',
			cost: function() {
				return {
					'scales': 100,
					'teeth': 50
				};
			},
			audio: AudioLibrary.BUY_GRENADES
		},
		'bayonet': {
			type: 'weapon',
			cost: function() {
				return {
					'scales': 500,
					'teeth': 250
				};
			},
			audio: AudioLibrary.BUY_BAYONET
		},
		'alien alloy': {
			type: 'good',
			cost: function() {
				return {
					'fur': 1500,
					'scales': 750,
					'teeth': 300
				};
			},
			audio: AudioLibrary.BUY_ALIEN_ALLOY
		},
		'compass': {
			type: 'special',
			maximum: 1,
			cost: function() {
				if ($SM.get('playStats.compassAlertShown') || !Room.buttons["compass"]) {
					return {
						fur: 400,
						scales: 20,
						teeth: 10
					};
				}
		
				$SM.set('playStats.compassAlertShown', true);
				Events.startEvent({
					title: _('compass'),
					scenes: {
						start: {
							text: [_("there is a larger world outside these walls, dangerous as it is. wanderers without direction get lost. a compass can point the way in the wilds.")],
							buttons: {
								'yes': {
									text: _('ok'),
									nextScene: 'end',
								}
							}
						}
					}
				});
				return {
					fur: 400,
					scales: 20,
					teeth: 10
				};
			},
			audio: AudioLibrary.BUY_COMPASS
		}
	},
	
	MiscItems: {
		'laser rifle': {
			type: 'weapon'
		}
	},
	
	name: _("Room"),
	init: function(options) {
		this.options = $.extend(
			this.options,
			options
		);
		
		Room.pathDiscovery = Boolean($SM.get('stores["compass"]'));

		if(Engine._debug) {
			this._ROOM_WARM_DELAY = 5000;
			this._BUILDER_STATE_DELAY = 5000;
			this._STOKE_COOLDOWN = 0;
			this._NEED_WOOD_DELAY = 5000;
		}
		
		if(typeof $SM.get('features.location.room') == 'undefined') {
			$SM.set('config.lightsOff', true);
			$SM.set('features.location.room', true);
			$SM.set('game.builder.level', -1);
			Notifications.notify(Room, _("it is bracingly cold. this place seems familiar. it is hard to think clearly with the cold."));
		}
		
		// If this is the first time playing, the fire is dead and it's frigid.
		// Otherwise grab past save state temp and fire level.
		$SM.set('game.temperature', $SM.get('game.temperature.value')===undefined?this.TempEnum.Freezing:$SM.get('game.temperature'));
		$SM.set('game.fire', $SM.get('game.fire.value')===undefined?this.FireEnum.Dead:$SM.get('game.fire'));
		
		// Create the room tab
		this.tab = Header.addLocation(_("A Dark Room"), "room", Room);
		
		// Create the Room panel
		this.panel = $('<div>')
			.attr('id', "roomPanel")
			.addClass('location')
			.appendTo('div#locationSlider');
		
		Engine.updateSlider();
		
		// Create the light button
		new Button.Button({
			id: 'lightButton',
			text: _('light fire'),
			click: Room.lightFire,
			cooldown: Room._STOKE_COOLDOWN,
			width: '80px',
			cost: {'wood': 5}
		}).appendTo('div#roomPanel');
		
		// Create the stoke button
		new Button.Button({
			id: 'stokeButton',
			text: _("stoke fire"),
			click: Room.stokeFire,
			cooldown: Room._STOKE_COOLDOWN,
			width: '80px',
			cost: {'wood': 1}
		}).appendTo('div#roomPanel');
		
		// Create the stores container
		$('<div>').attr('id', 'storesContainer').prependTo('div#roomPanel');
		
		//subscribe to stateUpdates
		$.Dispatch('stateUpdate').subscribe(Room.handleStateUpdates);
		
		Room.updateButton();
		Room.updateStoresView();
		Room.updateIncomeView();
		Room.updateBuildButtons();
		
		Room._fireTimer = Engine.setTimeout(Room.coolFire, Room._FIRE_COOL_DELAY);
		Room._tempTimer = Engine.setTimeout(Room.adjustTemp, Room._ROOM_WARM_DELAY);
		
		/*
		 * Builder states:
		 * 0 - Approaching
		 * 0.5 - Dead
		 * 1 - Collapsed
		 * 2 - Shivering
		 * 3 - Sleeping
		 * 4 - Helping
		 */
		if($SM.get('game.builder.level') >= 0 && $SM.get('game.builder.level') < 3) {
			Room._builderTimer = Engine.setTimeout(Room.updateBuilderState, Room._BUILDER_STATE_DELAY);
		}
		if($SM.get('game.builder.level') == 1 && $SM.get('stores.wood', true) < 0) {
			Engine.setTimeout(Room.unlockForest, Room._NEED_WOOD_DELAY);
		}
		Engine.setTimeout($SM.collectIncome, 1000);

		Notifications.notify(Room, _("The room is {0}", Room.TempEnum.fromInt($SM.get('game.temperature.value')).text));
		Notifications.notify(Room, _("The fire is {0}", Room.FireEnum.fromInt($SM.get('game.fire.value')).text));
	},
	
	options: {}, // Nothing for now
	
	onArrival: function(transition_diff) {
		Room.setTitle();
		if(Room.changed) {
			Notifications.notify(Room, _("the fire is {0}", Room.FireEnum.fromInt($SM.get('game.fire.value')).text));
			Notifications.notify(Room, _("The room is {0}", Room.TempEnum.fromInt($SM.get('game.temperature.value')).text));
			Room.changed = false;
		}
		if($SM.get('game.builder.level') == 3) {
			$SM.add('game.builder.level', 1);
			$SM.setIncome('builder', {
				delay: 10,
				stores: {'wood' : 2 }
			});
			Room.updateIncomeView();
			Notifications.notify(Room, _("The stranger is standing by the fire. She says she can help. Says she builds things."));
		}

		Engine.moveStoresView(null, transition_diff);
		
		Room.setMusic();
	},
	
	TempEnum: {
		fromInt: function(value) {
			for(var k in this) {
				if(typeof this[k].value != 'undefined' && this[k].value == value) {
					return this[k];
				}
			}
			return null;
		},
		Frigid: { value: 0, text: _('frigid') },
		Freezing: { value: 1, text: _('freezing') },
		Cold: { value: 2, text: _('cold') },
		Mild: { value: 3, text: _('mild') },
		Warm: { value: 4, text: _('warm') },
		Hot: { value: 5, text: _('hot') },
		Sweating: { value: 6, text: _('sweating') },
		Overheating: { value: 7, text: _('overheating') }
	},
	
	FireEnum: {
		fromInt: function(value) {
			for(var k in this) {
				if(typeof this[k].value != 'undefined' && this[k].value == value) {
					return this[k];
				}
			}
			return null;
		},
		Dead: { value: 0, text: _('dead') },
		Dying: { value: 1, text: _('dying') },
		Smoldering: { value: 2, text: _('smoldering') },
		Flickering: { value: 3, text: _('flickering') },
		Burning: { value: 4, text: _('burning') },
		Roaring: { value: 5, text: _('roaring') }
	},
	
	setTitle: function() {
		var title = $SM.get('game.fire.value') < 2 ? _("A Dark Room") : _("A Firelit Room");
		if(Engine.activeModule == this) {
			document.title = title;
		}
		$('div#location_room').text(title);
	},
	
	updateButton: function() {
		var light = $('#lightButton.button');
		var stoke = $('#stokeButton.button');
		if($SM.get('game.fire.value') == Room.FireEnum.Dead.value && stoke.css('display') != 'none') {
			stoke.hide();
			light.show();
			if(stoke.hasClass('disabled')) {
				Button.cooldown(light);
			}
		} else if(light.css('display') != 'none') {
			stoke.show();
			light.hide();
			if(light.hasClass('disabled')) {
				Button.cooldown(stoke);
			}
		}
		
		if(!$SM.get('stores.wood')) {
			light.addClass('free');
			stoke.addClass('free');
		} else {
			light.removeClass('free');
			stoke.removeClass('free');
		}
	},
	
	_fireTimer: null,
	_tempTimer: null,
	lightFire: function() {
		var wood = $SM.get('stores.wood');
		if(wood < 5) {
			Notifications.notify(Room, _("not enough wood to get the fire going"));
			Button.clearCooldown($('#lightButton.button'));
			return;
		} else if(wood > 4) {
			$SM.set('stores.wood', wood - 5);
		}
		$SM.set('game.fire', Room.FireEnum.Burning);
		AudioEngine.playSound(AudioLibrary.LIGHT_FIRE);
		Room.onFireChange();
	},
	
	stokeFire: function() {
		var wood = $SM.get('stores.wood');
		if(wood === 0) {
			Notifications.notify(Room, _("the wood has run out"));
			Button.clearCooldown($('#stokeButton.button'));
			return;
		}
		if(wood > 0) {
			$SM.set('stores.wood', wood - 1);
		}
		if($SM.get('game.fire.value') < 4) {
			$SM.set('game.fire', Room.FireEnum.fromInt($SM.get('game.fire.value') + 1));
		}
		AudioEngine.playSound(AudioLibrary.STOKE_FIRE);
		Room.onFireChange();
	},
	
	onFireChange: function() {
		if(Engine.activeModule != Room) {
			Room.changed = true;
		}
		Notifications.notify(Room, _("the fire is {0}", Room.FireEnum.fromInt($SM.get('game.fire.value')).text), true);
		if($SM.get('game.fire.value') > 1 && $SM.get('game.builder.level') < 0) {
			$SM.set('game.builder.level', 0);
			Notifications.notify(Room, _("the light from the fire spills from the windows, out into the dark"));
			Engine.setTimeout(Room.updateBuilderState, Room._BUILDER_STATE_DELAY);
		}	
		window.clearTimeout(Room._fireTimer);
		Room._fireTimer = Engine.setTimeout(Room.coolFire, Room._FIRE_COOL_DELAY);
		Room.updateButton();
		Room.setTitle();

		// only update music if in the room
		if (Engine.activeModule == Room) {
			Room.setMusic();
		}
	},

	coolFire: function() {
		var wood = $SM.get('stores.wood');
		if($SM.get('game.fire.value') <= Room.FireEnum.Flickering.value &&
			$SM.get('game.builder.level') > 3 && wood > 0) {
			Notifications.notify(Room, _("builder stokes the fire"), true);
			$SM.set('stores.wood', wood - 1);
			$SM.set('game.fire',Room.FireEnum.fromInt($SM.get('game.fire.value') + 1));
		}
		if($SM.get('game.fire.value') > 0) {
			$SM.set('game.fire',Room.FireEnum.fromInt($SM.get('game.fire.value') - 1));
			Room._fireTimer = Engine.setTimeout(Room.coolFire, Room._FIRE_COOL_DELAY);
			Room.onFireChange();
		}
	},
	
	adjustTemp: function() {
		var old = $SM.get('game.temperature.value');
		if($SM.get('game.temperature.value') > 0 && $SM.get('game.temperature.value') > $SM.get('game.fire.value')) {
			$SM.set('game.temperature',Room.TempEnum.fromInt($SM.get('game.temperature.value') - 1));
			Notifications.notify(Room, _("The room is {0}" , Room.TempEnum.fromInt($SM.get('game.temperature.value')).text), true);
		}
		if($SM.get('game.temperature.value') < 4 && $SM.get('game.temperature.value') < $SM.get('game.fire.value')) {
			$SM.set('game.temperature', Room.TempEnum.fromInt($SM.get('game.temperature.value') + 1));
			Notifications.notify(Room, _("The room is {0}" , Room.TempEnum.fromInt($SM.get('game.temperature.value')).text), true);
		}
		if($SM.get('game.temperature.value') != old) {
			Room.changed = true;
		}
		Room._tempTimer = Engine.setTimeout(Room.adjustTemp, Room._ROOM_WARM_DELAY);
	},

	unlockForest: function() {
		$SM.set('stores.wood', 4);
		Outside.init();
		Notifications.notify(Room, _("the wind howls outside"));
		Notifications.notify(Room, _("the wood is running out"));
		Engine.event('progress', 'outside');
	},
	
	updateBuilderState: function() {
		var lBuilder = $SM.get('game.builder.level');
		if(lBuilder === 0) {
			Notifications.notify(Room, _("a ragged stranger stumbles through the door and collapses in the corner"));
			lBuilder = $SM.setget('game.builder.level', 1);
			Engine.setTimeout(Room.unlockForest, Room._NEED_WOOD_DELAY);
		} 
		else if(lBuilder < 3 && $SM.get('game.temperature.value') >= Room.TempEnum.Warm.value) {
			var msg = "";
			switch(lBuilder) {
			case 1:
				msg = _("the stranger shivers, and mumbles quietly. her words are unintelligible.");
				break;
			case 2:
				msg = _("the stranger in the corner stops shivering. her breathing calms.");
				break;
			}
			Notifications.notify(Room, msg);
			if(lBuilder < 3) {
				lBuilder = $SM.setget('game.builder.level', lBuilder + 1);
			}
		}
		if(lBuilder < 3) {
			Engine.setTimeout(Room.updateBuilderState, Room._BUILDER_STATE_DELAY);
		}
		Engine.saveGame();
	},
	
	updateStoresView: function() {
		var stores = $('div#stores');
		var resources = $('div#resources');
		var special = $('div#special');
		var weapons = $('div#weapons');
		var needsAppend = false, rNeedsAppend = false, sNeedsAppend = false, wNeedsAppend = false, newRow = false;
		if(stores.length === 0) {
			stores = $('<div>').attr({
				'id': 'stores',
				'data-legend': _('stores')
			}).css('opacity', 0);
			needsAppend = true;
		}
		if(resources.length === 0) {
			resources = $('<div>').attr({
				id: 'resources'
			}).css('opacity', 0);
			rNeedsAppend = true;
		}
		if(special.length === 0) {
			special = $('<div>').attr({
				id: 'special'
			}).css('opacity', 0);
			sNeedsAppend = true;
		}
		if(weapons.length === 0) {
			weapons = $('<div>').attr({
				'id': 'weapons',
				'data-legend': _('weapons')
			}).css('opacity', 0);
			wNeedsAppend = true;
		}
		for(var k in $SM.get('stores')) {
			
			if (k.indexOf('blueprint') > 0) {
				// don't show blueprints
				continue;
			}

			const good =  
			Room.Craftables[k] ||
			Room.TradeGoods[k] ||
			Room.TradeGoods[k] ||
			Room.MiscItems[k] ||
			Fabricator.Craftables[k];
			const type = good ? good.type : null;
	  
			var location;
			switch(type) {
			case 'upgrade':
				// Don't display upgrades on the Room screen
				continue;
			case 'building':
				// Don't display buildings either
				continue;
			case 'weapon':
				location = weapons;
				break;
			case 'special':
				location = special;
				break;
			default:
				location = resources;
				break;
			}
			
			var id = "row_" + k.replace(/ /g, '-');
			var row = $('div#' + id, location);
			var num = $SM.get('stores["'+k+'"]');
			
			if(typeof num != 'number' || isNaN(num)) {
				// No idea how counts get corrupted, but I have reason to believe that they occassionally do.
				// Build a little fence around it!
				num = 0;
				$SM.set('stores["'+k+'"]', 0);
			}
			
			var lk = _(k);
			
			// thieves?
			if(typeof $SM.get('game.thieves') == 'undefined' && num > 5000 && $SM.get('features.location.world')) {
				$SM.startThieves();
			}
			
			if(row.length === 0) {
				row = $('<div>').attr('id', id).addClass('storeRow');
				$('<div>').addClass('row_key').text(lk).appendTo(row);
				$('<div>').addClass('row_val').text(Math.floor(num)).appendTo(row);
				$('<div>').addClass('clear').appendTo(row);
				var curPrev = null;
				location.children().each(function(i) {
					var child = $(this);
					var cName = child.children('.row_key').text();
					if(cName < lk) {
						curPrev = child.attr('id');
					}
				});
				if(curPrev == null) {
					row.prependTo(location);
				} else {
					row.insertAfter(location.find('#' + curPrev));
				}
				newRow = true;
			} else {
				$('div#' + row.attr('id') + ' > div.row_val', location).text(Math.floor(num));
			}
		}
				
		if(rNeedsAppend && resources.children().length > 0) {
			resources.prependTo(stores);
			resources.animate({opacity: 1}, 300, 'linear');
		}
		
		if(sNeedsAppend && special.children().length > 0) {
			special.appendTo(stores);
			special.animate({opacity: 1}, 300, 'linear');
		}
		
		if(needsAppend && stores.find('div.storeRow').length > 0) {
			stores.appendTo('div#storesContainer');
			stores.animate({opacity: 1}, 300, 'linear');
		}
		
		if(wNeedsAppend && weapons.children().length > 0) {
			weapons.appendTo('div#storesContainer');
			weapons.animate({opacity: 1}, 300, 'linear');
		}
		
		if(newRow) {
			Room.updateIncomeView();
		}

		if($("div#outsidePanel").length) {
			Outside.updateVillage();
		}

		if($SM.get('stores.compass') && !Room.pathDiscovery){
			Room.pathDiscovery = true;
			Path.openPath();
		}
	},

	updateIncomeView: function() {
		var stores = $('div#resources');
		var totalIncome = {};
		if(stores.length === 0 || typeof $SM.get('income') == 'undefined') return;
		$('div.storeRow', stores).each(function(index, el) {
			el = $(el);
			$('div.tooltip', el).remove();
			var ttPos = index > 10 ? 'top right' : 'bottom right';
			var tt = $('<div>').addClass('tooltip ' + ttPos);
			var storeName = el.attr('id').substring(4).replace('-', ' ');
			for(var incomeSource in $SM.get('income')) {
				var income = $SM.get('income["'+incomeSource+'"]');
				for(var store in income.stores) {
					if(store == storeName && income.stores[store] !== 0) {
						$('<div>').addClass('row_key').text(_(incomeSource)).appendTo(tt);
						$('<div>')
							.addClass('row_val')
							.text(Engine.getIncomeMsg(income.stores[store], income.delay))
							.appendTo(tt);
						if (!totalIncome[store] || totalIncome[store].income === undefined) {
							totalIncome[store] = { income: 0 };
						}
						totalIncome[store].income += Number(income.stores[store]);
						totalIncome[store].delay = income.delay;
					}
				}
			}
			if(tt.children().length > 0) {
				var total = totalIncome[storeName].income;
				$('<div>').addClass('total row_key').text(_('total')).appendTo(tt);
				$('<div>').addClass('total row_val').text(Engine.getIncomeMsg(total, totalIncome[storeName].delay)).appendTo(tt);
				tt.appendTo(el);
			}
		});
	},
	
	buy: function(buyBtn) {
		var thing = $(buyBtn).attr('buildThing');
		var good = Room.TradeGoods[thing];
		var numThings = $SM.get('stores["'+thing+'"]', true);
		if(numThings < 0) numThings = 0;
		if(good.maximum <= numThings) {
			return;
		}
		
		var storeMod = {};
		var cost = good.cost();
		for(var k in cost) {
			var have = $SM.get('stores["'+k+'"]', true);
			if(have < cost[k]) {
				Notifications.notify(Room, _("not enough " + k));
				return false;
			} else {
				storeMod[k] = have - cost[k];
			}
		}
		$SM.setM('stores', storeMod);
		
		Notifications.notify(Room, good.buildMsg);
		
		$SM.add('stores["'+thing+'"]', 1);

		// audio
		AudioEngine.playSound(AudioLibrary.BUY);
	},
	
	build: function(buildBtn) {
		var thing = $(buildBtn).attr('buildThing');
		if($SM.get('game.temperature.value') <= Room.TempEnum.Cold.value) {
			Notifications.notify(Room, _("builder just shivers"));
			return false;
		}
		var craftable = Room.Craftables[thing];
		
		var numThings = 0; 
		switch(craftable.type) {
		case 'good':
		case 'weapon':
		case 'tool':
		case 'upgrade':
			numThings = $SM.get('stores["'+thing+'"]', true);
			break;
		case 'building':
			numThings = $SM.get('game.buildings["'+thing+'"]', true);
			break;
		}
		
		if(numThings < 0) numThings = 0;
		if(craftable.maximum <= numThings) {
			return;
		}
		
		var storeMod = {};
		var cost = craftable.cost();
		for(var k in cost) {
			var have = $SM.get('stores["'+k+'"]', true);
			if(have < cost[k]) {
				Notifications.notify(Room, _("not enough "+k));
				return false;
			} else {
				storeMod[k] = have - cost[k];
			}
		}
		$SM.setM('stores', storeMod);
		
		Notifications.notify(Room, craftable.buildMsg);
		
		switch(craftable.type) {
		case 'good':
		case 'weapon':
		case 'upgrade':
		case 'tool':
			$SM.add('stores["'+thing+'"]', 1);
			break;
		case 'building':
			$SM.add('game.buildings["'+thing+'"]', 1);
			break;
		}

		// audio
		switch (craftable.type) {
			case 'weapon':
			case 'upgrade':
			case 'tool':
				AudioEngine.playSound(AudioLibrary.CRAFT);
				break;
			case 'building':
				AudioEngine.playSound(AudioLibrary.BUILD);
				break;
		}
	},
	needsWorkshop: function(type) {
		return type == 'weapon' || type == 'upgrade' || type =='tool';
	},
	
	craftUnlocked: function(thing) {
		if(Room.buttons[thing]) {
			return true;
		}
		if($SM.get('game.builder.level') < 4) return false;
		var craftable = Room.Craftables[thing];
		if(Room.needsWorkshop(craftable.type) && $SM.get('game.buildings["'+'workshop'+'"]', true) === 0) return false;
		var cost = craftable.cost();
		
		//show button if one has already been built
		if($SM.get('game.buildings["'+thing+'"]') > 0){
			Room.buttons[thing] = true;
			return true;
		}
		// Show buttons if we have at least 1/2 the wood, and all other components have been seen.
		if($SM.get('stores.wood', true) < cost['wood'] * 0.5) {
			return false;
		}
		for(var c in cost) {
			if(!$SM.get('stores["'+c+'"]')) {
				return false;
			}
		}
		
		Room.buttons[thing] = true;
		//don't notify if it has already been built before
		if(!$SM.get('game.buildings["'+thing+'"]')){
			Notifications.notify(Room, craftable.availableMsg);
		}
		return true;
	},
	
	buyUnlocked: function(thing) {
		if(Room.buttons[thing]) {
			return true;
		} else if($SM.get('game.buildings["trading post"]', true) > 0) {
			if(thing == 'compass' || typeof $SM.get('stores["'+thing+'"]') != 'undefined') {
				// Allow the purchase of stuff once you've seen it
				return true;
			}
		}
		return false;
	},
	
	updateBuildButtons: function() {
		var buildSection = $('#buildBtns');
		var needsAppend = false;
		if(buildSection.length === 0) {
			buildSection = $('<div>').attr({'id': 'buildBtns', 'data-legend': _('build:')}).css('opacity', 0);
			needsAppend = true;
		}
		
		var craftSection = $('#craftBtns');
		var cNeedsAppend = false;
		if(craftSection.length === 0 && $SM.get('game.buildings["workshop"]', true) > 0) {
			craftSection = $('<div>').attr({'id': 'craftBtns', 'data-legend': _('craft:')}).css('opacity', 0);
			cNeedsAppend = true;
		}
		
		var buySection = $('#buyBtns');
		var bNeedsAppend = false;
		if(buySection.length === 0 && $SM.get('game.buildings["trading post"]', true) > 0) {
			buySection = $('<div>').attr({'id': 'buyBtns', 'data-legend': _('buy:')}).css('opacity', 0);
			bNeedsAppend = true;
		}
		
		for(var k in Room.Craftables) {
			craftable = Room.Craftables[k];
			var max = $SM.num(k, craftable) + 1 > craftable.maximum;
			if(craftable.button == null) {
				if(Room.craftUnlocked(k)) {
					var loc = Room.needsWorkshop(craftable.type) ? craftSection : buildSection;
					craftable.button = new Button.Button({
						id: 'build_' + k.replace(/ /g, '-'),
						cost: craftable.cost(),
						text: _(k),
						click: Room.build,
						width: '80px',
						ttPos: loc.children().length > 10 ? 'top right' : 'bottom right'
					}).css('opacity', 0).attr('buildThing', k).appendTo(loc).animate({opacity: 1}, 300, 'linear');
				}
			} else {
				// refresh the tooltip
				var costTooltip = $('.tooltip', craftable.button);
				costTooltip.empty();
				var cost = craftable.cost();
				for(var c in cost) {
					$("<div>").addClass('row_key').text(_(c)).appendTo(costTooltip);
					$("<div>").addClass('row_val').text(cost[c]).appendTo(costTooltip);
				}
				if(max && !craftable.button.hasClass('disabled')) {
					Notifications.notify(Room, craftable.maxMsg);
				}
			}
			if(max) {
				Button.setDisabled(craftable.button, true);
			} else {
				Button.setDisabled(craftable.button, false);
			}
		}
		
		for(var g in Room.TradeGoods) {
			good = Room.TradeGoods[g];
			var goodsMax = $SM.num(g, good) + 1 > good.maximum;
			if(good.button == null) {
				if(Room.buyUnlocked(g)) {
					good.button = new Button.Button({
						id: 'build_' + g,
						cost: good.cost(),
						text: _(g),
						click: Room.buy,
						width: '80px',
						ttPos: buySection.children().length > 10 ? 'top right' : 'bottom right'
					}).css('opacity', 0).attr('buildThing', g).appendTo(buySection).animate({opacity:1}, 300, 'linear');
				}
			} else {
				// refresh the tooltip
				var goodsCostTooltip = $('.tooltip', good.button);
				goodsCostTooltip.empty();
				var goodCost = good.cost();
				for(var gc in goodCost) {
					$("<div>").addClass('row_key').text(_(gc)).appendTo(goodsCostTooltip);
					$("<div>").addClass('row_val').text(goodCost[gc]).appendTo(goodsCostTooltip);
				}
				if(goodsMax && !good.button.hasClass('disabled')) {
					Notifications.notify(Room, good.maxMsg);
				}
			}
			if(goodsMax) {
				Button.setDisabled(good.button, true);
			} else {
				Button.setDisabled(good.button, false);
			}
		}
		
		if(needsAppend && buildSection.children().length > 0) {
			buildSection.appendTo('div#roomPanel').animate({opacity: 1}, 300, 'linear');
		}
		if(cNeedsAppend && craftSection.children().length > 0) {
			craftSection.appendTo('div#roomPanel').animate({opacity: 1}, 300, 'linear');
		}
		if(bNeedsAppend && buildSection.children().length > 0) {
			buySection.appendTo('div#roomPanel').animate({opacity: 1}, 300, 'linear');
		}
	},
	
	compassTooltip: function(direction){
		var ttPos = $('div#resources').children().length > 10 ? 'top right' : 'bottom right';
		var tt = $('<div>').addClass('tooltip ' + ttPos);
		$('<div>').addClass('row_key').text(_('the compass points '+ direction)).appendTo(tt);
		tt.appendTo($('#row_compass'));
	},
	
	handleStateUpdates: function(e){
		if(e.category == 'stores'){
			Room.updateStoresView();
			Room.updateBuildButtons();
		} else if(e.category == 'income'){
			Room.updateStoresView();
			Room.updateIncomeView();
		} else if(e.stateName.indexOf('game.buildings') === 0){
			Room.updateBuildButtons();
		}
	},

	setMusic() {
		// set music based on fire level
		var fireValue = $SM.get('game.fire.value');
		switch (fireValue) {
			case 0:
				AudioEngine.playBackgroundMusic(AudioLibrary.MUSIC_FIRE_DEAD);
				break;
			case 1:
				AudioEngine.playBackgroundMusic(AudioLibrary.MUSIC_FIRE_SMOLDERING);
				break;
			case 2:
				AudioEngine.playBackgroundMusic(AudioLibrary.MUSIC_FIRE_FLICKERING);
				break;
			case 3:
				AudioEngine.playBackgroundMusic(AudioLibrary.MUSIC_FIRE_BURNING);
				break;
			case 4:
				AudioEngine.playBackgroundMusic(AudioLibrary.MUSIC_FIRE_ROARING);
				break;
		}
	}
};
