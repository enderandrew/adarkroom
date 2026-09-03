/**
 * Module that registers the starship!
 */
var Ship = {
	LIFTOFF_COOLDOWN: 120,
    MAX_LASERS: 9,
    BASE_HULL: 0,
    BASE_THRUSTERS: 1,
    BASE_LASERS: 0,

	alloyCost: function(currentLevel) {
		return currentLevel + 1;
	},

	hullCost: function() {
		return Ship.alloyCost($SM.get('game.spaceShip.hull', true) || 0);
	},

	thrusterCost: function() {
		return Ship.alloyCost(($SM.get('game.spaceShip.thrusters', true) || Ship.BASE_THRUSTERS) - Ship.BASE_THRUSTERS);
	},

	getLaserCost: function() {
		return Ship.alloyCost($SM.get('game.spaceShip.lasers', true) || 0);
	},

	getLaserCooldown: function() {
		var level = $SM.get('game.spaceShip.lasers', true) || 0;
		if (level <= 0) return 5000;
		return Math.max(500, 5000 - (level * 500));
	},

	name: _("Ship"),
	init: function(options) {
		this.options = $.extend(this.options, options);
		
		if(!$SM.get('features.location.spaceShip')) {
			$SM.set('features.location.spaceShip', true);
			$SM.setM('game.spaceShip', {
				hull: Ship.BASE_HULL,
				thrusters: Ship.BASE_THRUSTERS,
				lasers: Ship.BASE_LASERS
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
		var hullRow = $('<div>').attr('id', 'hullRow').css('width', '80px').appendTo('div#shipPanel');
		$('<div>').addClass('row_key').text(_('hull: ')).appendTo(hullRow);
		$('<div>').addClass('row_val').text($SM.get('game.spaceShip.hull', true) || 0).appendTo(hullRow);
		$('<div>').addClass('clear').appendTo(hullRow);
		
		// Draw the thrusters label
		var engineRow = $('<div>').attr('id', 'engineRow').css({ 'width': '80px', 'margin-bottom': '0px' }).appendTo('div#shipPanel');
		$('<div>').addClass('row_key').text(_('engine: ')).appendTo(engineRow);
		$('<div>').addClass('row_val').text($SM.get('game.spaceShip.thrusters', true) || 0).appendTo(engineRow);
		$('<div>').addClass('clear').appendTo(engineRow);

		// Draw the lasers label
		var laserRow = $('<div>').attr('id', 'laserRow').css({ 'width': '80px', 'margin-bottom': '20px' }).appendTo('div#shipPanel');
		$('<div>').addClass('row_key').text(_('lasers: ')).appendTo(laserRow);
		$('<div>').addClass('row_val').text($SM.get('game.spaceShip.lasers', true) || 0).appendTo(laserRow);
		$('<div>').addClass('clear').appendTo(laserRow);
		
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

		// Draw the laser button
		new Button.Button({
			id: 'laserButton',
			text: _('power lasers'),
			click: Ship.upgradeLasers,
			width: '100px',
			cost: {'alien alloy': Ship.getLaserCost()}
		}).appendTo('div#shipPanel');
		
		// Draw the lift off button
		var b = new Button.Button({
			id: 'liftoffButton',
			text: _('lift off'),
			click: Ship.checkLiftOff,
			width: '100px',
			cooldown: Ship.LIFTOFF_COOLDOWN
		}).appendTo('div#shipPanel');
		
		if(($SM.get('game.spaceShip.hull', true) || 0) <= 0) {
			Button.setDisabled(b, true);
		}
		
		// Init Space
		Space.init();
		
		// Subscribe to stateUpdates
		$.Dispatch('stateUpdate').subscribe(Ship.handleStateUpdates);
	},
	
	options: {},
	
	onArrival: function(transition_diff) {
		Ship.setTitle();
		if(!$SM.get('game.spaceShip.seenShip')) {
			Notifications.notify(Ship, _('somewhere above the debris cloud, the wanderer fleet hovers. been on this rock too long.'));
			$SM.set('game.spaceShip.seenShip', true);
		}
		AudioEngine.playBackgroundMusic(AudioLibrary.MUSIC_SHIP);

		Engine.moveStoresView(null, transition_diff);
		Ship.updateUI();
	},
	
	setTitle: function() {
		if(Engine.activeModule == this) {
			document.title = _("An Old Starship");
		}
	},
	
	reinforceHull: function() {
		var cost = Ship.hullCost();
		if(($SM.get('stores["alien alloy"]', true) || 0) < cost) {
			Notifications.notify(Ship, _("not enough alien alloy"));
			return false;
		}
		$SM.add('stores["alien alloy"]', -cost);
		$SM.add('game.spaceShip.hull', 1);
		if($SM.get('game.spaceShip.hull') > 0) {
			Button.setDisabled($('#liftoffButton', Ship.panel), false);
		}
		Ship.updateUI();
		AudioEngine.playSound(AudioLibrary.REINFORCE_HULL);
	},
	
	upgradeEngine: function() {
		var cost = Ship.thrusterCost();
		if(($SM.get('stores["alien alloy"]', true) || 0) < cost) {
			Notifications.notify(Ship, _("not enough alien alloy"));
			return false;
		}
		$SM.add('stores["alien alloy"]', -cost);
		$SM.add('game.spaceShip.thrusters', 1);
		Ship.updateUI();
		AudioEngine.playSound(AudioLibrary.UPGRADE_ENGINE);
	},

	upgradeLasers: function() {
		var current = $SM.get('game.spaceShip.lasers', true) || 0;
		if (current >= Ship.MAX_LASERS) return false;

		var cost = Ship.getLaserCost();
		if (($SM.get('stores["alien alloy"]', true) || 0) < cost) {
			Notifications.notify(Ship, _("not enough alien alloy"));
			return false;
		}
		$SM.add('stores["alien alloy"]', -cost);
		$SM.set('game.spaceShip.lasers', current + 1, true);
		Ship.updateUI();
		if (typeof AudioEngine !== 'undefined') {
			AudioEngine.playSound(AudioLibrary.UPGRADE_ENGINE || AudioLibrary.REINFORCE_HULL);
		}
	},

	refreshCost: function(btn, cost) {
		if(!btn || btn.length === 0) { return; }
		btn.data('cost', { 'alien alloy': cost });
		var tooltip = $('.tooltip', btn);
		if(tooltip.length === 0) { return; }
		tooltip.empty();
		if (typeof cost === 'number') {
			$('<div>').addClass('row_key').text(_('alien alloy')).appendTo(tooltip);
			$('<div>').addClass('row_val').text(cost).appendTo(tooltip);
		}
	},

	updateCosts: function() {
		var alloy = $SM.get('stores["alien alloy"]', true) || 0;

		var hCost = Ship.hullCost();
		var $hBtn = $('#reinforceButton', Ship.panel);
		Ship.refreshCost($hBtn, hCost);
		Button.setDisabled($hBtn, alloy < hCost);

		var tCost = Ship.thrusterCost();
		var $tBtn = $('#engineButton', Ship.panel);
		Ship.refreshCost($tBtn, tCost);
		Button.setDisabled($tBtn, alloy < tCost);

		var lasers = $SM.get('game.spaceShip.lasers', true) || 0;
		var $lBtn = $('#laserButton', Ship.panel);
		if (lasers >= Ship.MAX_LASERS) {
			$lBtn.text(_('lasers maxed'));
			Ship.refreshCost($lBtn, null);
			Button.setDisabled($lBtn, true);
		} else {
			var lCost = Ship.getLaserCost();
			$lBtn.text(_('power lasers'));
			Ship.refreshCost($lBtn, lCost);
			Button.setDisabled($lBtn, alloy < lCost);
		}
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

	updateUI: function() {
		$('#hullRow .row_val', Ship.panel).text($SM.get('game.spaceShip.hull', true) || 0);
		$('#engineRow .row_val', Ship.panel).text($SM.get('game.spaceShip.thrusters', true) || 0);
		$('#laserRow .row_val', Ship.panel).text($SM.get('game.spaceShip.lasers', true) || 0);

		if (($SM.get('game.spaceShip.hull', true) || 0) > 0) {
			Button.setDisabled($('#liftoffButton', Ship.panel), false);
		} else {
			Button.setDisabled($('#liftoffButton', Ship.panel), true);
		}

		Ship.updateCosts();
	},
	
	handleStateUpdates: function() {
		if (Engine.activeModule === Ship) {
			Ship.updateUI();
		}
	}
};