/**
 * Module that registers the starship!
 */
var Ship = {
	LIFTOFF_COOLDOWN: 120,
	/* Rebalanced from 1 each.
	 *
	 * An audit of every alloy source in the game came to roughly 56 expected
	 * alloy across a thorough run, against 12 to craft one of every
	 * fabricator item. Hull and thrusters are the only other sink and both
	 * are uncapped, so at 1 alloy apiece the endgame upgrade curve was
	 * effectively free -- a player could arrive at the ship with dozens of
	 * spare alloy and max both without a decision.
	 *
	 * At 2 and 3, a full run's surplus still buys a comfortable ship, but
	 * hull-versus-speed becomes an actual trade, and the ruins/crater/lab
	 * content that drops alloy has something to be spent on. Thrusters cost
	 * more than hull because speed compounds -- it shortens the whole
	 * asteroid gauntlet -- while hull is linear damage absorption. */
	/* Linear scaling: the Nth upgrade costs N alloy.
	 *
	 * Flat costs gave alloy no diminishing returns -- past the fabricator's
	 * fixed 12, every remaining alloy was worth exactly the same and there
	 * was never a point at which you stopped wanting more. Linear pricing
	 * makes the last few levels a real decision while making the FIRST few
	 * cheaper than the old flat 2/3, so a struggling player gets help sooner
	 * and a hoarder hits a genuine wall.
	 *
	 * Sizing: base thrusters are 1 (speed 4), each upgrade is +1 -- a 25%
	 * speed gain at first, ~10% by level 10, so the mechanic diminishes
	 * naturally too. Level 8 in both costs 36+36=72; a thorough run drops
	 * ~44 alloy and the other sinks below take ~26, which is what finally
	 * makes the trading post's alloy purchase matter. */
	alloyCost: function(currentLevel) {
		return currentLevel + 1;
	},

	hullCost: function() {
		return Ship.alloyCost($SM.get('game.spaceShip.hull', true));
	},

	thrusterCost: function() {
		/* Thrusters start at BASE_THRUSTERS (1), so the first PURCHASED
		 * upgrade should still cost 1 -- price on upgrades bought, not on
		 * the displayed level, or the engine would open at 2 while the hull
		 * opens at 1 for no reason the player can see. */
		return Ship.alloyCost($SM.get('game.spaceShip.thrusters', true) - Ship.BASE_THRUSTERS);
	},
	BASE_HULL: 0,
	BASE_THRUSTERS: 1,
	name: _("Ship"),
	init: function(options) {
		this.options = $.extend(
			this.options,
			options
		);
		
		if(!$SM.get('features.location.spaceShip')) {
			$SM.set('features.location.spaceShip', true);
			$SM.setM('game.spaceShip', {
				hull: Ship.BASE_HULL,
				thrusters: Ship.BASE_THRUSTERS
			});
		}
		
		// Create the Ship tab
		this.tab = Header.addLocation(_("An Old Starship"), "ship", Ship);
		
		// Create the Ship panel
		this.panel = $('<div>').attr('id', "shipPanel")
			.addClass('location')
			.appendTo('div#locationSlider');
		
		Engine.updateSlider();
		
		// Draw the hull label
		var hullRow = $('<div>').attr('id', 'hullRow').appendTo('div#shipPanel');
		$('<div>').addClass('row_key').text(_('hull:')).appendTo(hullRow);
		$('<div>').addClass('row_val').text($SM.get('game.spaceShip.hull')).appendTo(hullRow);
		$('<div>').addClass('clear').appendTo(hullRow);
		
		// Draw the thrusters label
		var engineRow = $('<div>').attr('id', 'engineRow').appendTo('div#shipPanel');
		$('<div>').addClass('row_key').text(_('engine:')).appendTo(engineRow);
		$('<div>').addClass('row_val').text($SM.get('game.spaceShip.thrusters')).appendTo(engineRow);
		$('<div>').addClass('clear').appendTo(engineRow);
		
		// Draw the reinforce button
		new Button.Button({
			id: 'reinforceButton',
			text: _('reinforce hull'),
			click: Ship.reinforceHull,
			width: '100px',
			cost: {'alien alloy': Ship.hullCost()}
		}).appendTo('div#shipPanel');
		
		// Draw the engine button
		new Button.Button({
			id: 'engineButton',
			text: _('upgrade engine'),
			click: Ship.upgradeEngine,
			width: '100px',
			cost: {'alien alloy': Ship.thrusterCost()}
		}).appendTo('div#shipPanel');
		
		// Draw the lift off button
		var b = new Button.Button({
			id: 'liftoffButton',
			text: _('lift off'),
			click: Ship.checkLiftOff,
			width: '100px',
			cooldown: Ship.LIFTOFF_COOLDOWN
		}).appendTo('div#shipPanel');
		
		if($SM.get('game.spaceShip.hull') <= 0) {
			Button.setDisabled(b, true);
		}
		
		// Init Space
		Space.init();
		
		//subscribe to stateUpdates
		$.Dispatch('stateUpdate').subscribe(Ship.handleStateUpdates);
	},
	
	options: {}, // Nothing for now
	
	onArrival: function(transition_diff) {
		Ship.setTitle();
		if(!$SM.get('game.spaceShip.seenShip')) {
			Notifications.notify(Ship, _('somewhere above the debris cloud, the wanderer fleet hovers. been on this rock too long.'));
			$SM.set('game.spaceShip.seenShip', true);
		}
		AudioEngine.playBackgroundMusic(AudioLibrary.MUSIC_SHIP);

		Engine.moveStoresView(null, transition_diff);
	},
	
	setTitle: function() {
		if(Engine.activeModule == this) {
			document.title = _("An Old Starship");
		}
	},
	
	reinforceHull: function() {
		var cost = Ship.hullCost();
		if($SM.get('stores["alien alloy"]', true) < cost) {
			Notifications.notify(Ship, _("not enough alien alloy"));
			return false;
		}
		$SM.add('stores["alien alloy"]', -cost);
		$SM.add('game.spaceShip.hull', 1);
		if($SM.get('game.spaceShip.hull') > 0) {
			Button.setDisabled($('#liftoffButton', Ship.panel), false);
		}
		$('#hullRow .row_val', Ship.panel).text($SM.get('game.spaceShip.hull'));
		Ship.updateCosts();
		AudioEngine.playSound(AudioLibrary.REINFORCE_HULL);
	},
	
	upgradeEngine: function() {
		var cost = Ship.thrusterCost();
		if($SM.get('stores["alien alloy"]', true) < cost) {
			Notifications.notify(Ship, _("not enough alien alloy"));
			return false;
		}
		$SM.add('stores["alien alloy"]', -cost);
		$SM.add('game.spaceShip.thrusters', 1);
		$('#engineRow .row_val', Ship.panel).text($SM.get('game.spaceShip.thrusters'));
		Ship.updateCosts();
		AudioEngine.playSound(AudioLibrary.UPGRADE_ENGINE);
	},

	/* Rewrites both buttons' cost tooltips after a purchase.
	 *
	 * Button costs are captured when the button is BUILT, so with a flat
	 * price they never needed refreshing. Under linear scaling the price
	 * changes with every purchase, and a tooltip still advertising the old
	 * cost is worse than no tooltip at all. */
	updateCosts: function() {
		Ship.refreshCost($('#reinforceButton', Ship.panel), Ship.hullCost());
		Ship.refreshCost($('#engineButton', Ship.panel), Ship.thrusterCost());
	},

	refreshCost: function(btn, cost) {
		if(!btn || btn.length === 0) { return; }
		btn.data('cost', { 'alien alloy': cost });
		var tooltip = $('.tooltip', btn);
		if(tooltip.length === 0) { return; }
		tooltip.empty();
		$('<div>').addClass('row_key').text(_('alien alloy')).appendTo(tooltip);
		$('<div>').addClass('row_val').text(cost).appendTo(tooltip);
	},
	
	getMaxHull: function() {
		return $SM.get('game.spaceShip.hull');
	},
	
	checkLiftOff: function() {
		if(!$SM.get('game.spaceShip.seenWarning')) {
			Events.startEvent({
				title: _('Ready to Leave?'),
				scenes: {
					'start': {
						text: [
							_("time to get out of this place. won't be coming back.")
						],
						buttons: {
							'fly': {
								text: _('lift off'),
								onChoose: function() {
									$SM.set('game.spaceShip.seenWarning', true);
									Ship.liftOff();
								},
								nextScene: 'end'
							},
							'wait': {
								text: _('linger'),
								onChoose: function() {
									Button.clearCooldown($('#liftoffButton'));
								},
								nextScene: 'end'
							}
						}
					}
				}
			});
		} else {
			Ship.liftOff();
		}
	},
	
	liftOff: function () {
		$('#outerSlider').animate({top: Engine.getPanelHeight() + 'px'}, 300);
		Space.onArrival();
		Engine.activeModule = Space;
		AudioEngine.playSound(AudioLibrary.LIFT_OFF);
	},
	
	handleStateUpdates: function(e){
		
	}
};