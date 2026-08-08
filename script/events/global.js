/**
 * Events that can occur when any module is active (Except World. It's special.)
 **/
Events.Global = [
	{ /* The Thief */
		title: _('The Thief'),
		isAvailable: function() {
			return (Engine.activeModule == Room || Engine.activeModule == Outside) && $SM.get('game.thieves') == 1;
		},
		scenes: {
			'start': {
				text: [
					_('the villagers haul a filthy man out of the store room.'),
					_("say his folk have been skimming the supplies."),
					_('say he should be strung up as an example.')
				],
				notification: _('a thief is caught'),
				blink: true,
				buttons: {
					'kill': {
						text: _('hang him'),
						nextScene: {1: 'hang'}
					},
					'spare': {
						text: _('spare him'),
						nextScene: {1: 'spare'}
					},
					/* A third path: neither execution nor exile. The village
					 * has a use for a man who knows how to get into a store
					 * room unseen. Whether that generosity is repaid is
					 * karma-weighted -- a village led by someone with a
					 * reputation for mercy has an easier time making mercy
					 * stick, and one led by a tyrant does not. */
					'work': {
						text: _('put him to work'),
						onChoose: function() { $SM.add('character.karma', 3); },
						nextScene: function() {
							return Events.karmaOdds(0.45, 'workBadly', 'workWell');
						}
					}
				}
			},
			'hang': {
				text: [
					_('the villagers hang the thief high in front of the store room.'),
					_('the point is made. in the next few days, the missing supplies are returned.')
				],
				onLoad: function() {
					$SM.set('game.thieves', 2);
					$SM.remove('income.thieves');
					$SM.addM('stores', $SM.get('game.stolen'));
					// executing a bound, unarmed captive for a property crime
					$SM.add('character.karma', -3);
				},
				buttons: {
					'leave': {
						text: _('leave'),
						nextScene: 'end'
					}
				}
			},
			'spare': {
				text: [
					_("the man says he's grateful. says he won't come around any more."),
					_("shares what he knows about sneaking before he goes.")
				],
				onLoad: function() {
					$SM.set('game.thieves', 2);
					$SM.remove('income.thieves');
					$SM.addPerk('stealthy');
					$SM.add('character.karma', 2);
				},
				buttons: {
					'leave': {
						text: _('leave'),
						nextScene: 'end'
					}
				}
			},
			'workWell': {
				text: [
					_('he is put on the store room door instead of behind it.'),
					_("nothing goes missing again. his folk come in from the cold, and they work."),
					_('he never says thank you. he does not need to.')
				],
				notification: _('the thief works off his debt'),
				onLoad: function() {
					$SM.set('game.thieves', 2);
					$SM.remove('income.thieves');
					$SM.addM('stores', $SM.get('game.stolen'));
					$SM.addPerk('stealthy');
				},
				buttons: {
					'leave': {
						text: _('leave'),
						nextScene: 'end'
					}
				}
			},
			'workBadly': {
				text: [
					_('he works the store room door for a week.'),
					_('on the eighth morning the door is open, and he is not behind it.'),
					_('so are the shelves.')
				],
				notification: _('the thief takes what he was given and goes'),
				onLoad: function() {
					$SM.set('game.thieves', 2);
					$SM.remove('income.thieves');
					/* No return of the stolen goods, and a further bite --
					 * but the karma gained for the attempt is NOT clawed back.
					 * Mercy that goes unrewarded is still mercy. */
					var loss = {};
					var stolen = $SM.get('game.stolen') || {};
					for(var k in stolen) {
						loss[k] = -Math.floor(($SM.get('stores["' + k + '"]', true)) * 0.1);
					}
					$SM.addM('stores', loss);
				},
				buttons: {
					'leave': {
						text: _('leave'),
						nextScene: 'end'
					}
				}
			}
		},
		audio: AudioLibrary.EVENT_THIEF
	}
];
