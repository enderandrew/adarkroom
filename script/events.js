/**
 * Module that handles the random event system
 */
var Events = {

	_EVENT_TIME_RANGE: [3, 6], // range, in minutes
	_PANEL_FADE: 200,
	_FIGHT_SPEED: 100,
	_EAT_COOLDOWN: 5,
	_MEDS_COOLDOWN: 7,
	_HYPO_COOLDOWN: 7,
	_SHIELD_COOLDOWN: 10,
	_STIM_COOLDOWN: 10,
	_LEAVE_COOLDOWN: 1,
	STUN_DURATION: 4000,
	ENERGISE_MULTIPLIER: 4, // bonus damage multipler
	EXPLOSION_DURATION: 3000, // explode on death
	ENRAGE_DURATION: 4000, // attack faster
	MEDITATE_DURATION: 5000, // no damage while meditating
	BOOST_DURATION: 3000,
	BOOST_DAMAGE: 10, // bonus damage added
	DOT_TICK: 1000,
	/* --- Status effects added by this fork ---------------------------------
	 * A fighter has exactly one status at a time (it lives in a single
	 * .data('status') slot), so these are mutually exclusive with each other
	 * and with shield/energised/venomous/enraged/meditation/boost. That's an
	 * existing constraint of the engine, not a new one, but it matters when
	 * designing enemies: applying a status to a fighter clears whatever it
	 * had before. setStatus() guards the player's shield specifically so an
	 * enemy debuff can't strip an armour the player spent a cooldown on. */
	BRITTLE_MULTIPLIER: 2,   // incoming damage multiplier while brittle
	BRITTLE_DURATION: 4000,  // window the player has to punish a wind-up
	REGEN_DURATION: 6000,    // total time spent regenerating
	REGEN_TICK: 1000,        // how often a regenerating fighter heals
	REGEN_AMOUNT: 4,         // hp restored per tick
	BLIND_DURATION: 5000,    // how long reduced accuracy lasts
	BLIND_ACCURACY: 0.4,     // to-hit multiplier while blinded
	BLINK_INTERVAL: false,

	init: function(options) {
		this.options = $.extend(
			this.options,
			options
		);

		// Build the Event Pool
		Events.EventPool = [].concat(
			Events.Global,
			Events.Room,
			Events.Outside,
			Events.Path,
			Events.Marketing
		);

		Events.eventStack = [];

		Events.scheduleNextEvent();

		//subscribe to stateUpdates
		$.Dispatch('stateUpdate').subscribe(Events.handleStateUpdates);

		//check for stored delayed events
		Events.initDelay();
	},

	options: {}, // Nothing for now

	delayState: 'wait',
	activeScene: null,

	loadScene: function(name) {
		Engine.log('loading scene: ' + name);
		Events.activeScene = name;
		var scene = Events.activeEvent().scenes[name];

		// onLoad
		if(scene.onLoad) {
			scene.onLoad();
		}

		// Notify the scene change
		if(scene.notification) {
			Notifications.notify(null, Events.resolve(scene.notification));
		}

		// Scene reward
		if(scene.reward) {
			$SM.addM('stores', scene.reward);
		}

		$('#description', Events.eventPanel()).empty();
		$('#buttons', Events.eventPanel()).empty();
		if(scene.combat) {
			Events.startCombat(scene);
		} else {
			Events.startStory(scene);
		}
	},

	startCombat: function(scene) {
		Engine.event('game event', 'combat');
		Events.fought = false;
		Events.won = false;
		var desc = $('#description', Events.eventPanel());

		$('<div>').text(scene.notification).appendTo(desc);

		/* // Draw pause button
		// Disable for now, because it doesn't work and looks weird
		var pauseBox = $('<div>').attr('id', 'pauseButton').appendTo(desc);
		var pause = new Button.Button({
			id: 'pause',
			text: '',
			cooldown: Events._PAUSE_COOLDOWN,
			click: Events.togglePause
		}).appendTo(pauseBox);
		$('<span>').addClass('text').insertBefore(pause.children('.cooldown'));
		$('<div>').addClass('clear').appendTo(pauseBox);
		Events.setPause(pause, 'set');
		Events.removePause(pause, 'set'); */
		

		var fightBox = $('<div>').attr('id', 'fight').appendTo(desc);
		// Draw the wanderer
		Events.createFighterDiv('@', World.health, World.getMaxHealth()).attr('id', 'wanderer').appendTo(fightBox);
		// Draw the enemy
		Events.createFighterDiv(scene.chara, scene.health, scene.health).attr('id', 'enemy').appendTo(fightBox);

		// Draw the action buttons
		var btns = $('#buttons', Events.eventPanel());

		var attackBtns = $('<div>').appendTo(btns).attr('id','attackButtons');
		/* Fists are always available, full stop. This used to be gated behind
		 * a numWeapons counter meant to detect "the player has no weapons at
		 * all" -- but the counter was wrong: for each carried weapon it
		 * decremented once per unaffordable cost resource and then
		 * unconditionally incremented once more, so a single-resource-cost
		 * weapon with insufficient ammo (e.g. a rifle with 0 bullets) netted
		 * to zero instead of being excluded. That only produced the correct
		 * "no usable weapons" result by coincidence, when the unusable
		 * ranged weapon was the ONLY weapon carried. Carrying anything else
		 * usable alongside it (e.g. grenades) pushed the count above zero
		 * and hid fists entirely -- leaving the player with a disabled rifle
		 * button and nothing to fall back on once the other weapon's ammo
		 * ran out too. Rather than patch the arithmetic, fists is just
		 * always shown: it has no ammo cost, so there's never a reason to
		 * hide it. */
		Events.createAttackButton('fists').appendTo(attackBtns);
		for(var k in World.Weapons) {
			if(k === 'fists') continue;
			var weapon = World.Weapons[k];
			/* No damage-type filtering here: bolas and disruptor deal a
			 * non-numeric 'stun' rather than a number, and are legitimate
			 * attack options whenever carried, same as any other weapon. */
			if(typeof Path.outfit[k] == 'number' && Path.outfit[k] > 0) {
				Events.createAttackButton(k).appendTo(attackBtns);
			}
		}
		$('<div>').addClass('clear').appendTo(attackBtns);

		var healBtns = $('<div>').appendTo(btns).attr('id','healButtons');
		Events.createEatMeatButton().appendTo(healBtns);
		Events.createHealButtons(healBtns);

		if($SM.get('stores["kinetic armour"]', true) > 0) {
			Events.createShieldButton().appendTo(healBtns);
		}
		$('<div>').addClass('clear').appendTo(healBtns);
		Events.setHeal(healBtns);

		// Set up the enemy attack timers
		Events.startEnemyAttacks();
		Events._specialTimers = (scene.specials ?? []).map(s => Engine.setInterval(
			() => {
				const enemy = $('#enemy');
				const text = s.action(enemy);
				Events.updateFighterDiv(enemy);
				if (text) {
					Events.drawFloatText(text, $('.hp', enemy))
				}
			}, 
			s.delay * 1000
		));
		
		// Bind hotkeys
		bindHotKeys();
	},

	startEnemyAttacks: (delay) => {
		clearInterval(Events._enemyAttackTimer);
		/* Guards a real, reachable crash: this is called from the enraged
		 * status's delayed setTimeout (see setStatus below), which used to
		 * be untracked. If the fight ends -- enemy dies, player flees, player
		 * dies -- before that timeout fires, activeEvent() is already null
		 * and .scenes threw. The setTimeout is now tracked and cleared by
		 * clearTimeouts(), which closes the gap for new fights, but this
		 * guard stays as a second line of defense for any caller that
		 * reaches here after the event has already ended. */
		const event = Events.activeEvent();
		if (!event) {
			return;
		}
		const scene = event.scenes[Events.activeScene];
		Events._enemyAttackTimer = Engine.setInterval(Events.enemyAttack, scene.attackDelay * 1000, Engine._debug);
	},

	/* Tracks every setTimeout registered by setStatus below, so clearTimeouts()
	 * can cancel all of them at once when a fight ends. Before this existed,
	 * only the interval-based timers (_enemyAttackTimer, _dotTimer,
	 * _regenTimer, _specialTimers) were cancelled on fight end; the
	 * enraged/meditation/boost/brittle/blinded setTimeouts were not, and any
	 * of them could fire after Events.activeEvent() had already gone null. */
	_statusTimers: [],

	setStatus: (fighter, status) => {
		/* Debuffs must not silently eat a shield the player paid a cooldown
		 * (and a kinetic armour) for. Everything else overwrites freely,
		 * which is the engine's pre-existing single-slot behaviour. */
		const DEBUFFS = ['brittle', 'blinded'];
		if (fighter.attr('id') === 'wanderer' &&
			fighter.data('status') === 'shield' &&
			DEBUFFS.indexOf(status) !== -1) {
			return;
		}

		fighter.data('status', status);
		if (status === 'enraged' && fighter.attr('id') === 'enemy') {
			Events.startEnemyAttacks(0.5);
			Events._statusTimers.push(setTimeout(() => {
				fighter.data('status', 'none');
				Events.startEnemyAttacks();
			}, Events.ENRAGE_DURATION));
		}
		if (status === 'meditation') {
			Events._meditateDmg = 0;
			Events._statusTimers.push(setTimeout(() => {
				fighter.data('status', 'none');
			}, Events.MEDITATE_DURATION));
		}
		if (status === 'boost') {
			Events._statusTimers.push(setTimeout(() => {
				fighter.data('status', 'none');
			}, Events.BOOST_DURATION));
		}
		/* Brittle is consumed by the next hit that lands (see damage()), but
		 * it also times out on its own -- otherwise a fighter that never gets
		 * hit stays vulnerable for the rest of the fight, and the wind-up
		 * stops reading as a window the player has to actually seize. */
		if (status === 'brittle') {
			Events._statusTimers.push(setTimeout(() => {
				if (fighter.data('status') === 'brittle') {
					fighter.data('status', 'none');
					Events.updateFighterDiv(fighter);
				}
			}, Events.BRITTLE_DURATION));
		}
		if (status === 'blinded') {
			Events._statusTimers.push(setTimeout(() => {
				if (fighter.data('status') === 'blinded') {
					fighter.data('status', 'none');
					Events.updateFighterDiv(fighter);
				}
			}, Events.BLIND_DURATION));
		}
		if (status === 'regenerating') {
			clearInterval(Events._regenTimer);
			Events._regenTimer = setInterval(() => {
				Events.healOverTime(fighter, Events.REGEN_AMOUNT);
			}, Events.REGEN_TICK);
			Events._statusTimers.push(setTimeout(() => {
				clearInterval(Events._regenTimer);
				if (fighter.data('status') === 'regenerating') {
					fighter.data('status', 'none');
					Events.updateFighterDiv(fighter);
				}
			}, Events.REGEN_DURATION));
		}
	},

	/* Mirror of dotDamage(): restores hp instead of removing it, capped at the
	 * fighter's maxHp so a regenerating enemy can't heal past its own bar. */
	healOverTime: (target, amount) => {
		const maxHp = target.data('maxHp');
		const current = target.data('hp');
		if (current <= 0) {
			// Already dead this tick -- don't resurrect it mid-animation.
			return;
		}
		const hp = Math.min(maxHp, current + amount);
		const healed = hp - current;
		if (healed <= 0) {
			return;
		}
		target.data('hp', hp);
		if (target.attr('id') == 'wanderer') {
			World.setHp(hp);
			Events.setHeal();
		}
		Events.updateFighterDiv(target);
		Events.drawFloatText(`+${healed}`, $('.hp', target));
	},

	setPause: function(btn, state){
		if(!btn) {
			btn = $('#pause');
		}
		var event = btn.closest('#event');
		var string, log;
		if(state == 'set') {
			string = 'start.';
			log = 'loaded';
		} else {
			string = 'resume.';
			log = 'paused';
		}
		btn.children('.text').first().text( _(string) );
		Events.paused = (state == 'auto') ? 'auto' : true;
		event.addClass('paused');
		Button.clearCooldown(btn);
		$('#buttons').find('.button').each(function(i){
			if($(this).data('onCooldown')){
				$(this).children('.cooldown').stop(true,false);
			}
		});
		Engine.log('fight '+ log +'.');
	},

	removePause: function(btn, state){
		if(!btn) {
			btn = $('#pause');
		}
		var event = btn.closest('#event');
		var log, time, target;
		if(state == 'auto' && Events.paused != 'auto') {
			return;
		}
		switch(state){
			case 'set':
				Button.cooldown(btn, Events._LEAVE_COOLDOWN);
				log = 'started';
				time = Events._LEAVE_COOLDOWN * 1000;
				target = $();
				break;
			case 'end':
				Button.setDisabled(btn, true);
				log = 'ended';
				time = Events._FIGHT_SPEED;
				target = $();
				break;
			case 'auto':
				Button.cooldown(btn);
				/* falls through */
			default:
				log = 'resumed';
				time = Events._PAUSE_COOLDOWN * 1000;
				target = $('#buttons').find('.button');
				break;
		}
		Engine.setTimeout(function(){
			btn.children('.text').first().text( _('pause.') );
			Events.paused = false;
			event.removeClass('paused');
			target.each(function(i){
				if($(this).data('onCooldown')){
					Button.cooldown($(this), 'pause');
				}
			});
			Engine.log('Event '+ log);
		}, time);
	},

	togglePause: function(btn, auto){
		if(!btn) {
			btn = $('#pause');
		}
		if((auto) && (document.hasFocus() == !Events.paused)) {
			return;
		}
		var f = (Events.paused) ? Events.removePause : Events.setPause;
		var state = (auto) ? 'auto' : false;
		f(btn, state);
	},

	createEatMeatButton: function(cooldown) {
		if (cooldown == null) {
			cooldown = Events._EAT_COOLDOWN;
		}

		var btn = new Button.Button({
			id: 'eat',
			// hotKeys[*].text is a fixed bracketed hint ('[E]'), not prose --
			// concatenating it inside _() before pybabel runs meant the whole
			// "eat meat [E]" string could never match a translation entry, so
			// every locale but English silently fell back to English here.
			text: _('eat meat') + ' ' + hotKeys.eat.text,
			cooldown: cooldown,
			click: Events.eatMeat,
			cost: { 'cured meat': 1 }
		});

		if(Path.outfit['cured meat'] === 0) {
			Button.setDisabled(btn, true);
		}

		return btn;
	},

	createHealButtons: function(healBtns) {
		if ((Path.outfit['medicine'] || 0) !== 0) {
			Events.createUseMedsButton().appendTo(healBtns);
		}
		if ((Path.outfit['hypo'] || 0) !== 0) {
			Events.createUseHypoButton().appendTo(healBtns);
		}
		if ((Path.outfit['stim'] ?? 0) > 0) {
			Events.createStimButton().appendTo(healBtns);
		}
	},

	createUseMedsButton: function(cooldown) {
		if (cooldown == null) {
			cooldown = Events._MEDS_COOLDOWN;
		}

		var btn = new Button.Button({
			id: 'meds',
			text: _('use meds') + ' ' + hotKeys.meds.text,
			cooldown: cooldown,
			click: Events.useMeds,
			cost: { 'medicine': 1 }
		});

		if((Path.outfit['medicine'] || 0) === 0) {
			Button.setDisabled(btn, true);
		}

		return btn;
	},

	createUseHypoButton: function(cooldown) {
		if (cooldown == null) {
			cooldown = Events._HYPO_COOLDOWN;
		}

		var btn = new Button.Button({
			id: 'hypo',
			text: _('use hypo') + ' ' + hotKeys.hypo.text,
			cooldown: cooldown,
			click: Events.useHypo,
			cost: { 'hypo': 1 }
		});

		/* This condition was inverted: `> 0` disabled the button the instant
		 * the player HAD a hypo, and left it enabled with none in stock. Cost
		 * on Button.Button is display-only (see Button.js) -- it renders the
		 * tooltip but never gates the click -- so this check is the only thing
		 * standing between the player and a dead button while carrying hypos.
		 * createUseMedsButton just above has the correct polarity; matched it. */
		if((Path.outfit['hypo'] ?? 0) === 0) {
			Button.setDisabled(btn, true);
		}

		return btn;
	},

	createShieldButton: function() {
		var btn = new Button.Button({
			id: 'shld',
			text: _('use shield') + ' ' + hotKeys.shield.text,
			cooldown: Events._SHIELD_COOLDOWN,
			click: Events.useShield
		});
		return btn;
	},

	createStimButton: () => new Button.Button({
		id: 'use-stim',
		text: _('use stim') + ' ' + hotKeys.boost.text,
		cooldown: Events._STIM_COOLDOWN,
		click: Events.useStim
	}),

	createAttackButton: function(weaponName) {
		var weapon = World.Weapons[weaponName];
		var cd = weapon.cooldown;
		if(weapon.type == 'unarmed') {
			if($SM.hasPerk('unarmed master')) {
				cd /= 2;
			}
		}
		/* Same exemption as scene-button costs (see drawButtons/updateButtons/
		 * buttonClick below): a carried glowstone is a permanent light source,
		 * so the handheld nuke's torch requirement -- needing something lit to
		 * trigger it -- is already satisfied without spending one. This is the
		 * one weapon cost in the game and it lives in World.Weapons rather than
		 * on a scene, so it doesn't automatically inherit the `delete
		 * cost.torch` pattern used everywhere else; it has to be applied here
		 * explicitly. Computed before the button is built so the tooltip
		 * itself doesn't advertise a torch cost that will never actually be
		 * charged. */
		var weaponCost = weapon.cost;
		if (weaponCost && weaponCost.torch && Path.outfit && Path.outfit['glowstone']) {
			weaponCost = { ...weaponCost };
			delete weaponCost.torch;
		}

		var btn = new Button.Button({
			id: 'attack_' + weaponName.replace(/ /g, '-'),
			text: weapon.verb + ' ' + hotKeys[weapon.verb].text,
			cooldown: cd,
			click: Events.useWeapon,
			boosted: () => $('#wanderer').data('status') === 'boost',
			cost: weaponCost
		});
		if(typeof weapon.damage == 'number' && weapon.damage > 0) {
			btn.addClass('weaponButton');
		}

		for(var k in weaponCost) {
			if(typeof Path.outfit[k] != 'number' || Path.outfit[k] < weaponCost[k]) {
				Button.setDisabled(btn, true);
				break;
			}
		}

		return btn;
	},

	drawFloatText: function(text, parent, cb) {
		$('<div>').text(text).addClass('damageText').appendTo(parent).animate({
			'bottom': '70px',
			'opacity': '0'
		},
		700,
		'linear',
		function() {
			$(this).remove();
			cb && cb();
		});
	},

	setHeal: function(healBtns) {
		if(!healBtns){
			healBtns = $('#healButtons');
		}
		healBtns = healBtns.children('.button');
		var canHeal = (World.health < World.getMaxHealth());
		healBtns.each(function(i){
			const btn = $(this);
			Button.setDisabled(btn, !canHeal && btn.attr('id') !== 'shld');
		});
		return canHeal;
	},

	doHeal: function(healing, cured, btn) {
		if(Path.outfit[healing] > 0) {
			Path.outfit[healing]--;
			World.updateSupplies();
			if(Path.outfit[healing] === 0) {
				Button.setDisabled(btn, true);
			}

			var hp = World.health + cured;
			hp = Math.min(World.getMaxHealth(),hp);
			World.setHp(hp);
			Events.setHeal();

			if(Events.activeEvent()) {
				var w = $('#wanderer');
				w.data('hp', hp);
				Events.updateFighterDiv(w);
				Events.drawFloatText('+' + cured, '#wanderer .hp');
				var takeETbutton = Events.setTakeAll();
				Events.canLeave(takeETbutton);
			}
		}
	},

	eatMeat: function(btn) {
		Events.doHeal('cured meat', World.meatHeal(), btn);
		AudioEngine.playSound(AudioLibrary.EAT_MEAT);
	},

	useMeds: function(btn) {
		Events.doHeal('medicine', World.medsHeal(), btn);
		AudioEngine.playSound(AudioLibrary.USE_MEDS);
	},

	useHypo: btn => {
		Events.doHeal('hypo', World.hypoHeal(), btn);
		AudioEngine.playSound(AudioLibrary.USE_MEDS);
	},

	useShield: btn => {
		const player = $('#wanderer');
		player.data('status', 'shield');
		Events.updateFighterDiv(player);
		AudioEngine.playSound(AudioLibrary.USE_SHIELD);
	},

	useStim: btn => {
		const player = $('#wanderer');
		player.data('status', 'boost');
		Events.dotDamage(player, Events.BOOST_DAMAGE);
		Events.updateFighterDiv(player);
	},

	useWeapon: function(btn) {
		if(Events.activeEvent()) {
			var weaponName = btn.attr('id').substring(7).replace(/-/g, ' ');
			var weapon = World.Weapons[weaponName];
			if(weapon.type == 'unarmed') {
				if(!$SM.get('character.punches')) $SM.set('character.punches', 0);
				$SM.add('character.punches', 1);
				if($SM.get('character.punches') == 50 && !$SM.hasPerk('boxer')) {
					$SM.addPerk('boxer');
				} else if($SM.get('character.punches') == 150 && !$SM.hasPerk('martial artist')) {
					$SM.addPerk('martial artist');
				} else if($SM.get('character.punches') == 300 && !$SM.hasPerk('unarmed master')) {
					$SM.addPerk('unarmed master');
				}

			}
			if(weapon.cost) {
				/* Same exemption applied when the button was built (see
				 * createAttackButton) -- repeated here because this is the
				 * function that actually spends the resources, and it must
				 * not deduct or require a torch that createAttackButton
				 * already told the player they wouldn't need. */
				var weaponCost = weapon.cost;
				if (weaponCost.torch && Path.outfit && Path.outfit['glowstone']) {
					weaponCost = { ...weaponCost };
					delete weaponCost.torch;
				}
				var mod = {};
				var out = false;
				for(var k in weaponCost) {
					if(typeof Path.outfit[k] != 'number' || Path.outfit[k] < weaponCost[k]) {
						return;
					}
					mod[k] = -weaponCost[k];
					if(Path.outfit[k] - weaponCost[k] < weaponCost[k]) {
						out = true;
					}
				}
				for(var m in mod) {
					Path.outfit[m] += mod[m];
				}
				if(out) {
					Button.setDisabled(btn, true);
					var validWeapons = false;
					$('.weaponButton').each(function(){
						if(!Button.isDisabled($(this)) && $(this).attr('id') != 'attack_fists') {
							validWeapons = true;
							return false;
						}
					});
					if(!validWeapons) {
						// enable or create the punch button
						var fists = $('#attack_fists');
						if(fists.length === 0) {
							Events.createAttackButton('fists').prependTo('#buttons', Events.eventPanel());
						} else {
							Button.setDisabled(fists, false);
						}
					}
				}
				World.updateSupplies();
			}
			var dmg = -1;
			var toHit = World.getHitChance();
			if($('#wanderer').data('status') === 'blinded') {
				toHit *= Events.BLIND_ACCURACY;
			}
			if(Math.random() <= toHit) {
				dmg = weapon.damage;
				if(typeof dmg == 'number') {
					if(weapon.type == 'unarmed' && $SM.hasPerk('boxer')) {
						dmg *= 2;
					}
					if(weapon.type == 'unarmed' && $SM.hasPerk('martial artist')) {
						dmg *= 3;
					}
					if(weapon.type == 'unarmed' && $SM.hasPerk('unarmed master')) {
						dmg *= 2;
					}
					if(weapon.type == 'melee' && $SM.hasPerk('barbarian')) {
						dmg = Math.floor(dmg * 1.5);
					}
				}
			}

			var attackFn = weapon.type == 'ranged' ? Events.animateRanged : Events.animateMelee;

			// play variation audio for weapon type
			var r = Math.floor(Math.random() * 3) + 1;
			switch (weapon.type) {
				case 'unarmed':
					AudioEngine.playSound(AudioLibrary['WEAPON_UNARMED_' + r]);
					break;
				case 'melee':
					AudioEngine.playSound(AudioLibrary['WEAPON_MELEE_' + r]);
					break;
				case 'ranged':
					AudioEngine.playSound(AudioLibrary['WEAPON_RANGED_' + r]);
					break;
			}

			attackFn($('#wanderer'), dmg, function() {
				/* This is a jQuery .animate() completion callback, fired
				 * Events._FIGHT_SPEED (~100ms) after the click that started
				 * it. clearTimeouts() has no way to cancel a running
				 * animation, so guard the same as the other async combat
				 * callbacks in this file rather than assume the event is
				 * still around by the time this fires. */
				const event = Events.activeEvent();
				if (!event) {
					return;
				}
				const enemy = $('#enemy');
				const enemyHp = enemy.data('hp');
				const scene = event.scenes[Events.activeScene];
				const atHealth = scene.atHealth ?? {};
				const explosion = scene.explosion;

				for (const [k, action] of Object.entries(atHealth)) {
					const hpThreshold = Number(k);
					if (enemyHp <= hpThreshold && enemyHp + dmg > hpThreshold) {
						action(enemy);
					}
				}

				if(enemyHp <= 0 && !Events.won) {
					// Success!
					Events.won = true;
					if (explosion) {
						Events.explode(enemy, $('#wanderer'), explosion);
					}
					else {
						Events.winFight();
					}
				}
			});
		}
	},

	explode: (enemy, player, dmg) => {
		Events.clearTimeouts();
		enemy.addClass('exploding');
		setTimeout(() => {
			enemy.removeClass('exploding');
			$('.label', enemy).text('*');
			Events.damage(enemy, player, dmg, 'ranged', () => {
				if (!Events.checkPlayerDeath()) {
					Events.winFight();
				}
			});
		}, Events.EXPLOSION_DURATION);
	},

	dotDamage: (target, dmg) => {
		const hp = Math.max(0, target.data('hp') - dmg);
		target.data('hp', hp);
		if(target.attr('id') == 'wanderer') {
			World.setHp(hp);
			Events.setHeal();
			Events.checkPlayerDeath();			
		}
		else if(hp <= 0 && !Events.won) {
			Events.won = true;
			Events.winFight();
		}
		Events.updateFighterDiv(target);
		Events.drawFloatText(`-${dmg}`, $('.hp', target));
	},

	damage: function(fighter, enemy, dmg, type, cb) {
		var enemyHp = enemy.data('hp');
		const maxHp = enemy.data('maxHp');
		var msg = "";
		const shielded = enemy.data('status') === 'shield';
		const energised = fighter.data('status') === 'energised';
		const venomous = fighter.data('status') === 'venomous';
		const meditating = enemy.data('status') === 'meditation';
		const brittle = enemy.data('status') === 'brittle';
		if(typeof dmg == 'number') {
			if(dmg <= 0) {
				msg = _('miss');
				dmg = 0;
			} else {
				if (energised) {
					dmg *= this.ENERGISE_MULTIPLIER;
				}

				/* Brittle is a defender-side vulnerability: whatever lands
				 * next hits for more. Applied after the attacker's own
				 * buffs so an energised hit into a brittle target stacks,
				 * which is the intended payoff for lining the two up. */
				if (brittle) {
					dmg = Math.floor(dmg * Events.BRITTLE_MULTIPLIER);
				}

				if (meditating) {
					Events._meditateDmg = (Events._meditateDmg ?? 0) + dmg;
					msg = dmg;
				}
				else {
					msg = (shielded ? '+' : '-') + dmg;
					enemyHp = Math.min(maxHp, Math.max(0, enemyHp + (shielded ? dmg : -dmg)));
					enemy.data('hp', enemyHp);
					if(fighter.attr('id') == 'enemy') {
						World.setHp(enemyHp);
						Events.setHeal();
					}
				}

				if (venomous && !shielded) {
					clearInterval(Events._dotTimer);
					Events._dotTimer = setInterval(() => {
						Events.dotDamage(enemy, Math.floor(dmg / 2));
					}, Events.DOT_TICK);
				}

				if (shielded) {
					// shields break in one hit
					enemy.data('status', 'none');
				}

				// brittle is spent by the hit that exploited it
				if (brittle) {
					enemy.data('status', 'none');
				}

				Events.updateFighterDiv(enemy);

				// play variation audio for weapon type
				var r = Math.floor(Math.random() * 2) + 1;
				switch (type) {
					case 'unarmed':
						AudioEngine.playSound(AudioLibrary['WEAPON_UNARMED_' + r]);
						break;
					case 'melee':
						AudioEngine.playSound(AudioLibrary['WEAPON_MELEE_' + r]);
						break;
					case 'ranged':
						AudioEngine.playSound(AudioLibrary['WEAPON_RANGED_' + r]);
						break;
				}
			}
		} else {
			if(dmg == 'stun') {
				msg = _('stunned');
				enemy.data('stunned', true);
				setTimeout(() => {enemy.data('stunned', false)},Events.STUN_DURATION);
			}
		}

		if (energised || venomous) {
			// attack buffs only applies to one hit
			fighter.data('status', 'none');
			Events.updateFighterDiv(fighter);
		}

		Events.drawFloatText(msg, $('.hp', enemy), cb);
	},

	animateMelee: function(fighter, dmg, callback) {
		var start, end, enemy;
		if(fighter.attr('id') == 'wanderer') {
			start = {'left': '50%'};
			end = {'left': '25%'};
			enemy = $('#enemy');
		} else {
			start = {'right': '50%'};
			end = {'right': '25%'};
			enemy = $('#wanderer');
		}

		fighter.stop(true, true).animate(start, Events._FIGHT_SPEED, function() {

			Events.damage(fighter, enemy, dmg, 'melee');

			$(this).animate(end, Events._FIGHT_SPEED, callback);
		});
	},

	animateRanged: function(fighter, dmg, callback) {
		var start, end, enemy;
		if(fighter.attr('id') == 'wanderer') {
			start = {'left': '25%'};
			end = {'left': '50%'};
			enemy = $('#enemy');
		} else {
			start = {'right': '25%'};
			end = {'right': '50%'};
			enemy = $('#wanderer');
		}

		$('<div>').css(start).addClass('bullet').text('o').appendTo('#description')
			.animate(end, Events._FIGHT_SPEED * 2, 'linear', function() {

			Events.damage(fighter, enemy, dmg, 'ranged');

			$(this).remove();
			if(typeof callback == 'function') {
				callback();
			}
		});
	},

	enemyAttack: function() {
		// Events.togglePause($('#pause'),'auto');

		/* _enemyAttackTimer is cleared by clearTimeouts() whenever a fight
		 * ends, which should make this unreachable with no active event --
		 * but that guarantee now depends on every fight-ending path
		 * remembering to call clearTimeouts(), so this stays as a cheap
		 * backstop rather than a crash if a future one doesn't. */
		const event = Events.activeEvent();
		if (!event) {
			return;
		}
		var scene = event.scenes[Events.activeScene];
		const enemy = $('#enemy');
		const stunned = enemy.data('stunned');
		const meditating = enemy.data('status') === 'meditation';

		if(!stunned && !meditating) {
			var toHit = scene.hit;
			toHit *= $SM.hasPerk('evasive') ? 0.8 : 1;
			if (enemy.data('status') === 'blinded') {
				toHit *= Events.BLIND_ACCURACY;
			}
			var dmg = -1;
			if ((Events._meditateDmg ?? 0) > 0) {
				dmg = Events._meditateDmg;
				Events._meditateDmg = 0;
			}
			else if(Math.random() <= toHit) {
				dmg = scene.damage;
				if($SM.get('config.hardcoreMode', true))
				{
					dmg = dmg*2;
				}
			}

			var attackFn = scene.ranged ? Events.animateRanged : Events.animateMelee;

			attackFn($('#enemy'), dmg, Events.checkPlayerDeath);
		}
		return false;
	},

	checkPlayerDeath: () => {
		if($('#wanderer').data('hp') <= 0) {
			Events.clearTimeouts();
			Events.endEvent();
			World.die();
			return true;
		}
		return false;
    },

	/* Death from a non-combat event -- a lethal scavenge, say.
	 *
	 * checkPlayerDeath() can't be reused: it reads $('#wanderer').data('hp'),
	 * which only exists while a fight is on screen. This mirrors the same
	 * sequence it uses (clear timers, tear the event down, then World.die()).
	 *
	 * endEvent() must be called exactly once -- its animation callback does
	 * Events.activeEvent().eventPanel = null, so a second call finds an empty
	 * stack and throws on null. Any button using this must therefore NOT also
	 * declare a nextScene, or gotoNextScene would end the event a second time. */
	killPlayer: function() {
		Events.clearTimeouts();
		Events.endEvent();
		World.die();
	},

	clearTimeouts: () => {
		clearInterval(Events._enemyAttackTimer);
		Events._specialTimers.forEach(clearInterval);
		clearInterval(Events._dotTimer);
		clearInterval(Events._regenTimer);
		/* These were the gap: setStatus's enraged/meditation/boost/brittle/
		 * blinded timeouts were previously untracked, so any of them firing
		 * after a fight ended would touch state (or, for enraged, call
		 * startEnemyAttacks()) belonging to an event that no longer exists. */
		Events._statusTimers.forEach(clearTimeout);
		Events._statusTimers = [];
		/* Stored meditation damage must not survive the fight.
		 *
		 * A meditating enemy banks incoming damage in _meditateDmg and
		 * releases it as its next attack. If the fight ends while damage is
		 * still banked -- the enemy dies mid-meditation, or the player flees
		 * -- that number used to persist on the Events object, and the FIRST
		 * enemy attack of the NEXT fight would fire it at the player out of
		 * nowhere. Latent before, but meditation is now on several setpiece
		 * enemies, so it would have become reachable in normal play. */
		Events._meditateDmg = 0;
	},		
		
	endFight: function() {
		Events.fought = true;
		Events.clearTimeouts();
		Events.removePause($('#pause'), 'end');
	},

	winFight: function() {
		Engine.setTimeout(function() {
			if(Events.fought) {
				return;
			}
			// World.setHp(World.getMaxHealth());
			Events.endFight();
			if(!$SM.get('character.kills')) $SM.set('character.kills', 0);
			$SM.add('character.kills', 1);
			AudioEngine.playSound(AudioLibrary.WIN_FIGHT);
			$('#enemy').animate({opacity: 0}, 300, 'linear', function() {
				Engine.setTimeout(function() {
					/* This runs inside a jQuery .animate() completion chained
					 * from another Engine.setTimeout -- clearTimeouts() has
					 * no way to cancel either of those, so if something else
					 * ended the event in the meantime (only reachable in
					 * unusual timing, but the same class of bug just showed
					 * up twice elsewhere in this file), bail out instead of
					 * crashing on a null activeEvent(). */
					const event = Events.activeEvent();
					if (!event) {
						return;
					}
					var scene = event.scenes[Events.activeScene];
					var leaveBtn = false;
					var desc = $('#description', Events.eventPanel());
					var btns = $('#buttons', Events.eventPanel());
					desc.empty();
					btns.empty();
					$('<div>').text(scene.deathMessage).appendTo(desc);

					var takeETbtn = Events.drawLoot(scene.loot);

					var exitBtns = $('<div>').appendTo(btns).attr('id','exitButtons');
					if(scene.buttons) {
						// Draw the buttons
						leaveBtn = Events.drawButtons(scene);
					} else {
						leaveBtn = new Button.Button({
							id: 'leaveBtn',
							cooldown: Events._LEAVE_COOLDOWN,
							click: function() {
								if(scene.nextScene && scene.nextScene != 'end') {
									Events.loadScene(scene.nextScene);
								} else {
									Events.endEvent();
								}
							},
							text: _('leave')
						});
						Button.cooldown(leaveBtn.appendTo(exitBtns));

						var healBtns = $('<div>').appendTo(btns).attr('id','healButtons');
						Events.createEatMeatButton(0).appendTo(healBtns);
						if((Path.outfit['medicine'] || 0) !== 0) {
							Events.createUseMedsButton(0).appendTo(healBtns);
						}
						if (Path.outfit['hypo'] ?? 0 > 0) {
							Events.createUseHypoButton(0).appendTo(healBtns);
						}
						$('<div>').addClass('clear').appendTo(healBtns);
						Events.setHeal(healBtns);
					}
					$('<div>').addClass('clear').appendTo(exitBtns);

					Events.allowLeave(takeETbtn, leaveBtn);
				}, 1000, true);
			});
		}, Events._FIGHT_SPEED);
	},

	loseFight: function(){
		Events.endFight();
		Events.endEvent();
		World.die();
	},

	drawDrop:function(btn) {
		var name = btn.attr('id').substring(5).replace(/-/g, ' ');
		var needsAppend = false;
		var weight = Path.getWeight(name);
		var freeSpace = Path.getFreeSpace();
		if(weight > freeSpace) {
			// Draw the drop menu
			Engine.log('drop menu');
			var dropMenu;
			if($('#dropMenu').length){
				dropMenu = $('#dropMenu');
				$('#dropMenu').empty();
			} else {
				dropMenu = $('<div>').attr({'id': 'dropMenu', 'data-legend': _('drop:')});
				needsAppend = true;
			}
			for(var k in Path.outfit) {
				if(name == k) continue;
				var itemWeight = Path.getWeight(k);
				if(itemWeight > 0) {
					var numToDrop = Math.ceil((weight - freeSpace) / itemWeight);
					if(numToDrop > Path.outfit[k]) {
						numToDrop = Path.outfit[k];
					}
					if(numToDrop > 0) {
						var dropRow = $('<div>').attr('id', 'drop_' + k.replace(/ /g, '-'))
							.text(_(k) + ' x' + numToDrop)
							.data('thing', k)
							.data('num', numToDrop)
							.click(Events.dropStuff)
							.mouseenter(function(e){
								e.stopPropagation();
							});
						dropRow.appendTo(dropMenu);
					}
				}
			}
			$('<div>').attr('id','no_drop')
				.text(_('nothing'))
				.mouseenter(function(e){
					e.stopPropagation();
				})
				.click(function(e){
					e.stopPropagation();
					dropMenu.remove();
				})
				.appendTo(dropMenu);
			if(needsAppend){
				dropMenu.appendTo(btn);
			}
			btn.one("mouseleave", function() {
				$('#dropMenu').remove();
			});
		}
	},

	drawLootRow: function(name, num){
		var id = name.replace(/ /g, '-');
		var lootRow = $('<div>').attr('id','loot_' + id).data('item', name).addClass('lootRow');
		var take = new Button.Button({
			id: 'take_' + id,
			text: _(name) + ' [' + num + ']',
			click: Events.getLoot
		}).addClass('lootTake').data('numLeft', num).appendTo(lootRow);
		take.mouseenter(function(){
			Events.drawDrop(take);
		});
		var takeall = new Button.Button({
			id: 'all_take_' + id,
			text: _('take') + ' ',
			click: Events.takeAll
		}).addClass('lootTakeAll').appendTo(lootRow);
		$('<span>').insertBefore(takeall.children('.cooldown'));
		$('<div>').addClass('clear').appendTo(lootRow);
		return lootRow;
	},

	drawLoot: function(lootList) {
		var desc = $('#description', Events.eventPanel());
		var lootButtons = $('<div>').attr({'id': 'lootButtons', 'data-legend': _('take:')});
		for(var k in lootList) {
			var loot = lootList[k];
			if(Math.random() < loot.chance) {
				var num = Math.floor(Math.random() * (loot.max + 1 - loot.min)) + loot.min;
				var lootRow = Events.drawLootRow(k, num);
				lootRow.appendTo(lootButtons);
			}
		}
		lootButtons.appendTo(desc);
		var takeET = null;
		if(lootButtons.children().length > 0) {
			var takeETrow = $('<div>').addClass('takeETrow');
			takeET = new Button.Button({
				id: 'loot_takeEverything',
				text: '',
				cooldown: Events._LEAVE_COOLDOWN,
				click: Events.takeEverything
			}).appendTo(takeETrow);
			$('<span>').insertBefore(takeET.children('.cooldown'));
			$('<div>').addClass('clear').appendTo(takeETrow);
			takeETrow.appendTo(lootButtons);
			Events.setTakeAll(lootButtons);
		} else {
			var noLoot = $('<div>').addClass('noLoot').text( _('nothing to take') );
			noLoot.appendTo(lootButtons);
		}
		return takeET || false;
	},

	setTakeAll: function(lootButtons){
		if(!lootButtons) {
			lootButtons = $('#lootButtons');
		}
		var canTakeSomething = false;
		var free = Path.getFreeSpace();
		var takeETbutton = lootButtons.find('#loot_takeEverything');
		lootButtons.children('.lootRow').each(function(i){
			var name = $(this).data('item');
			var take = $(this).children('.lootTake').first();
			var takeAll = $(this).children('.lootTakeAll').first();
			var numLeft = take.data('numLeft');
			var num = Math.min(Math.floor(Path.getFreeSpace() / Path.getWeight(name)), numLeft);
			takeAll.data('numLeft', num);
			free -= numLeft * Path.getWeight(name);
			if(num > 0){
				takeAll.removeClass('disabled');
				canTakeSomething = true;
			} else {
				takeAll.addClass('disabled');
			}
			if(num < numLeft){
				takeAll.children('span').first().text(num);
			} else {
				takeAll.children('span').first().text(_('all'));
			}
		});
		Button.setDisabled(takeETbutton, !canTakeSomething);
		takeETbutton.data('canTakeEverything', (free >= 0) ? true : false);
		return takeETbutton;
	},

	allowLeave: function(takeETbtn, leaveBtn){
		if(takeETbtn){
			if(leaveBtn){
				takeETbtn.data('leaveBtn', leaveBtn);
			}
			Events.canLeave(takeETbtn);
		}
	},

	canLeave: function(btn){
		var basetext = (btn.data('canTakeEverything')) ? _('take everything') : _('take all you can');
		var textbox = btn.children('span');
		var takeAndLeave = (btn.data('leaveBtn')) ? btn.data('canTakeEverything') : false;
		var text = _(basetext);
		if(takeAndLeave){
			Button.cooldown(btn);
			text += _(' and ') + btn.data('leaveBtn').text();
		}
		textbox.text( text );
		btn.data('canLeave', takeAndLeave);
	},

	dropStuff: function(e) {
		e.stopPropagation();
		var btn = $(this);
		var target = btn.closest('.button');
		var thing = btn.data('thing');
		var id = 'take_' + thing.replace(/ /g, '-');
		var num = btn.data('num');
		var lootButtons = $('#lootButtons');
		Engine.log('dropping ' + num + ' ' + thing);

		var lootBtn = $('#' + id, lootButtons);
		if(lootBtn.length > 0) {
			var curNum = lootBtn.data('numLeft');
			curNum += num;
			lootBtn.text(_(thing) + ' [' + curNum + ']').data('numLeft', curNum);
		} else {
			var lootRow = Events.drawLootRow(thing, num);
			lootRow.insertBefore($('.takeETrow', lootButtons));
		}
		Path.outfit[thing] -= num;
		Events.getLoot(target);
		World.updateSupplies();
	},

	getLoot: function(btn, stateSkipButtonSet) {
		var name = btn.attr('id').substring(5).replace(/-/g, ' ');
		if(btn.data('numLeft') > 0) {
			var skipButtonSet = stateSkipButtonSet || false;
			var weight = Path.getWeight(name);
			var freeSpace = Path.getFreeSpace();
			if(weight <= freeSpace) {
				var num = btn.data('numLeft');
				num--;
				btn.data('numLeft', num);
				// #dropMenu gets removed by this.
				btn.text(_(name) + ' [' + num + ']');
				if(num === 0) {
					Button.setDisabled(btn);
					btn.animate({'opacity':0}, 300, 'linear', function() {
						$(this).parent().remove();
						if($('#lootButtons').children().length == 1) {
							$('#lootButtons').remove();
						}
					});
				}
				var curNum = Path.outfit[name];
				curNum = typeof curNum == 'number' ? curNum : 0;
				curNum++;
				Path.outfit[name] = curNum;
				World.updateSupplies();

				if(!skipButtonSet){
					Events.setTakeAll();
				}
			}
			if(!skipButtonSet){
				Events.drawDrop(btn);
			}
		}
	},

	takeAll: function(btn){
		var target = $('#'+ btn.attr('id').substring(4));
		for(var k = 0; k < btn.data('numLeft'); k++){
			Events.getLoot(target, true);
		}
		Events.setTakeAll();
	},

	takeEverything: function(btn){
		$('#lootButtons').children('.lootRow').each(function(i){
			var target = $(this).children('.lootTakeAll').first();
			if(!target.hasClass('disabled')){
				Events.takeAll(target);
			}
		});
		if(btn.data('canLeave')){
			btn.data('leaveBtn').click();
		}
	},

	createFighterDiv: function(chara, hp, maxhp) {
		var fighter = $('<div>')
			.addClass('fighter')
			.data('hp', hp)
			.data('maxHp', maxhp)
			.data('refname',chara);
		$('<div>').addClass('label').text(_(chara)).appendTo(fighter);
		$('<div>').addClass('hp').text(hp+'/'+maxhp).appendTo(fighter);
		return fighter;
	},

	updateFighterDiv: function(fighter) {
		$('.hp', fighter).text(fighter.data('hp') + '/' + fighter.data('maxHp'));
		const status = fighter.data('status');
		const hasStatus = status && status !== 'none';
		fighter.attr('class', `fighter${hasStatus ? ` ${status}` : ''}`);
	},

	startStory: function(scene) {
		// Write the text
		var desc = $('#description', Events.eventPanel());
		var leaveBtn = false;
		var sceneText = Events.resolve(scene.text);
		for(var i in sceneText) {
			$('<div>').text(Events.resolve(sceneText[i])).appendTo(desc);
		}

		if(scene.textarea != null) {
			var ta = $('<textarea>').val(scene.textarea).appendTo(desc);
			if(scene.readonly) {
				ta.attr('readonly', true);
			}
			Engine.autoSelect('#description textarea');
		}

		// Draw any loot
		var takeETbtn;
		if(scene.loot) {
			takeETbtn = Events.drawLoot(scene.loot);
		}

		// Draw the buttons
		var exitBtns = $('<div>').attr('id','exitButtons').appendTo($('#buttons', Events.eventPanel()));
		leaveBtn = Events.drawButtons(scene);
		$('<div>').addClass('clear').appendTo(exitBtns);


		Events.allowLeave(takeETbtn, leaveBtn);

		/* Custom scene rendering.
		 *
		 * onLoad can't be used for this: loadScene() calls it BEFORE
		 * #description and #buttons are emptied, so anything injected there is
		 * immediately wiped. onRender runs here instead -- after the text,
		 * loot and buttons are all in place -- so a scene can add its own
		 * interactive content and manipulate the buttons that were just drawn.
		 * Used by the ruins glyph puzzles. */
		if(typeof scene.onRender === 'function') {
			scene.onRender(scene);
		}
	},

	drawButtons: function(scene) {
		var btns = $('#exitButtons', Events.eventPanel());
		var btnsList = [];
		for(var id in scene.buttons) {
			var info = scene.buttons[id];
			const cost = {
				...info.cost
			};
			if (Path.outfit && Path.outfit['glowstone']) {
				delete cost.torch;
			}
			var b = new Button.Button({
				id,
				text: info.text,
				cost,
				click: Events.buttonClick,
				cooldown: info.cooldown
			}).appendTo(btns);
			if(typeof info.available == 'function' && !info.available()) {
				Button.setDisabled(b, true);
			}
			if(typeof info.cooldown == 'number') {
				Button.cooldown(b);
			}
			btnsList.push(b);
		}

		var healBtns = $('<div>').appendTo(btns).attr('id','healButtons');

		if (Events.activeEvent().hasCombat) {
			Events.createEatMeatButton().appendTo(healBtns);
			Events.createHealButtons(healBtns);
		}

		Events.updateButtons();
		return (btnsList.length == 1) ? btnsList[0] : false;
	},

	/* Resolves a value that may be a plain string/array or a function
	 * returning one.
	 *
	 * Event data lives in object literals that are evaluated once, when the
	 * file loads. Anything that depends on game state chosen later -- the
	 * hope/fear doctrine's vocabulary, for instance -- has to be written as a
	 * function or it freezes whatever the state was at load time, which is
	 * before a new game has made any choices at all. */
	resolve: function(value) {
		return (typeof value === 'function') ? value() : value;
	},

	/* Picks one entry at random. Paired with Events.resolve, this is how a
	 * scene rotates its dialogue: write `text: function() { return [...,
	 * Events.pick([...]), ...]; }` and the line changes each time the scene
	 * is loaded rather than being fixed the first time the file was parsed. */
	pick: function(options) {
		return options[Math.floor(Math.random() * options.length)];
	},

	/* Knocks a fraction off everything in the expedition pack, and returns a
	 * short list of what visibly took the worst of it so a scene can name it.
	 *
	 * Used where an outcome should cost the player something other than hit
	 * points -- a fall that scatters the pack, say. Weapons and one-off tools
	 * are left alone: losing a rifle to a dice roll with no warning reads as
	 * the game cheating, whereas losing supplies reads as a setback. */
	damageOutfit: function(fraction) {
		var spoiled = [];
		var protectedItems = Object.keys(World.Weapons);
		for(var k in Path.outfit) {
			if(protectedItems.indexOf(k) !== -1) continue;
			var have = Path.outfit[k];
			if(typeof have !== 'number' || have <= 0) continue;
			var lost = Math.max(1, Math.floor(have * fraction));
			Path.outfit[k] = Math.max(0, have - lost);
			spoiled.push(_(k));
		}
		World.updateSupplies();
		return spoiled;
	},

	getQuantity: function(store) {
		if (store === 'water') {
			return World.water;
		}
		if (store === 'hp') {
			return World.health;
		}
		var num = Engine.activeModule == World ? Path.outfit[store] : $SM.get('stores["'+store+'"]', true);
		return isNaN(num) || num < 0 ? 0 : num;
	},

	updateButtons: function() {
		/* Same class of bug as buttonClick below: defensive guard in case a
		 * future caller invokes this outside a guaranteed-active-event
		 * context. Current call sites are already safe (two run inside the
		 * active event's own button flow, and handleStateUpdates checks
		 * activeEvent() before calling this), but that's an invariant this
		 * function shouldn't have to rely on callers to uphold correctly. */
		const event = Events.activeEvent();
		if (!event) {
			return;
		}
		var btns = event.scenes[Events.activeScene].buttons;
		for(var bId in btns) {
			var b = btns[bId];
			var btnEl = $('#'+bId, Events.eventPanel());
			if(typeof b.available == 'function' && !b.available()) {
				Button.setDisabled(btnEl, true);
			} else if(b.cost) {
				const cost = {
					...b.cost
				};
				if (Path.outfit && Path.outfit['glowstone']) {
					delete cost.torch;
				}
				var disabled = false;
				for(var store in cost) {
					var num = Events.getQuantity(store);
					if(num < cost[store]) {
						// Too expensive
						disabled = true;
						break;
					}
				}
				Button.setDisabled(btnEl, disabled);
			}
		}
	},

	/* --- Karma -------------------------------------------------------------
	 * character.karma starts at -10 (the Exile's unpaid debt) and moves in
	 * small steps as the player makes choices. These helpers turn that number
	 * into an actual bias on random outcomes, so that being decent to people
	 * measurably changes how the world treats you back.
	 *
	 * karmaLuck() returns a bounded shift in [-KARMA_LUCK_CAP, +KARMA_LUCK_CAP].
	 * The cap matters: karma should tilt the odds, never eliminate the gamble.
	 * At the +/-25% cap a con artist who robs you 60% of the time still robs
	 * you 35% of the time with saintly karma, and 85% at your worst -- the
	 * risk is always real, which keeps these events decisions rather than
	 * formalities.
	 */
	KARMA_LUCK_CAP: 0.25,   // most the odds can ever move, in either direction
	KARMA_LUCK_SCALE: 40,   // karma magnitude at which the cap is reached

	karma: function() {
		return $SM.get('character.karma', true);
	},

	karmaLuck: function() {
		var k = Events.karma() / Events.KARMA_LUCK_SCALE;
		k = Math.max(-1, Math.min(1, k));
		return k * Events.KARMA_LUCK_CAP;
	},

	/* Builds a two-outcome cumulative table where `badChance` is the base
	 * probability of the bad outcome, shifted by karma. Positive karma makes
	 * the bad outcome rarer; negative makes it likelier.
	 *
	 * Returns the table rather than a scene name so it still reads as a
	 * gamble in the data, and so the existing threshold matcher handles it. */
	karmaOdds: function(badChance, badScene, goodScene) {
		var chance = badChance - Events.karmaLuck();
		// Never let karma make an outcome impossible or guaranteed.
		chance = Math.max(0.05, Math.min(0.95, chance));
		var table = {};
		table[chance] = badScene;
		table[1] = goodScene;
		return table;
	},

	buttonClick: function(btn) {
		const event = Events.activeEvent();
		if (!event) {
			// The event already ended (win/loss animation, or the panel was
			// torn down) but a click already queued against the old button
			// element still delivered. Nothing to do.
			return;
		}
		var info = event.scenes[Events.activeScene].buttons[btn.attr('id')];
		if (!info) {
			/* Real, reproducible crash: the scene changes (e.g. combat ends
			 * and the reward/exit buttons are drawn) while a click on a
			 * button from the PREVIOUS scene is still in the browser's event
			 * queue -- most often from clicking rapidly right as a fight
			 * ends. The old DOM element's id has no entry in the new scene's
			 * buttons, so info was undefined and info.cost threw. */
			return;
		}
		// Cost
		var costMod = {};
		if(info.cost) {
			const cost = {
				...info.cost
			};
			if (Path.outfit && Path.outfit['glowstone']) {
				delete cost.torch;
			}
			for(var store in cost) {
				var num = Events.getQuantity(store);
				if(num < cost[store]) {
					// Too expensive
					return;
				}
				if (store === 'water') {
					World.setWater(World.water - info.cost[store]);
				}
				else if (store === 'hp') {
					/* World.hp does not exist -- the health property is
					 * World.health (see World.setHp and the #healthCounter
					 * readout). This computed undefined - N = NaN and handed
					 * it to setHp, so any button with a cost:{hp:N} silently
					 * set the player's health to NaN for the rest of the run.
					 * Reachable today from the Executioner's engineering wing. */
					World.setHp(World.health - info.cost[store]);
				}
				else {
					costMod[store] = -info.cost[store];
				}
			}
			if(Engine.activeModule == World) {
				for(var k in costMod) {
					Path.outfit[k] += costMod[k];
				}
				World.updateSupplies();
			} else {
				$SM.addM('stores', costMod);
			}
		}

		if(typeof info.onChoose == 'function') {
			var textarea = Events.eventPanel().find('textarea');
			info.onChoose(textarea.length > 0 ? textarea.val() : null);
		}

		// Reward
		if(info.reward) {
			$SM.addM('stores', info.reward);
		}

		Events.updateButtons();

		// Notification
		if(info.notification) {
			Notifications.notify(null, Events.resolve(info.notification));
		}

		info.onClick && info.onClick();

		// Link
		if (info.link) {
			Events.endEvent();
			window.open(info.link);
			return;
		}

		// Next Event
		if (info.nextEvent) {
			const eventData = Events.Setpieces[info.nextEvent] || Events.Executioner[info.nextEvent];
			Events.switchEvent(eventData);
			return;
		}
		
		// Next Scene
		if(info.nextScene) {
			Events.gotoNextScene(info.nextScene);
		}
	},

	/* Resolves a nextScene value and loads the result.
	 *
	 * Accepts three shapes:
	 *   'end'                        -- end the event
	 *   'sceneName'                  -- go straight there
	 *   { 0.3: 'a', 1: 'b' }         -- cumulative probability table
	 *
	 * ...and, new here, a function returning any of the above. That lets an
	 * outcome depend on live state -- karma, stores, perks -- instead of
	 * being frozen into the event data at load time, which is what the
	 * karma-weighted events below rely on. Without it, every karma-sensitive
	 * branch would have to be hand-rolled in an onChoose with its own copy of
	 * the threshold-matching loop.
	 */
	gotoNextScene: function(nextScene) {
		var resolved = (typeof nextScene === 'function') ? nextScene() : nextScene;

		if(!resolved) {
			Engine.log('ERROR: nextScene resolved to nothing');
			Events.endEvent();
			return;
		}

		if(resolved === 'end') {
			Events.endEvent();
			return;
		}

		if(typeof resolved === 'string') {
			Events.loadScene(resolved);
			return;
		}

		var r = Math.random();
		var lowestMatch = null;
		for(var i in resolved) {
			if(r < i && (lowestMatch == null || i < lowestMatch)) {
				lowestMatch = i;
			}
		}
		if(lowestMatch != null) {
			Events.loadScene(resolved[lowestMatch]);
			return;
		}
		Engine.log('ERROR: no suitable scene found');
		Events.endEvent();
	},

	// blinks the browser window title
	blinkTitle: function() {
		var title = document.title;

		// every 3 seconds change title to '*** EVENT ***', then 1.5 seconds later, change it back to the original title.
		Events.BLINK_INTERVAL = setInterval(function() {
			document.title = _('*** EVENT ***');
			Engine.setTimeout(function() {document.title = title;}, 1500, true);
		}, 3000);
	},

	stopTitleBlink: function() {
		clearInterval(Events.BLINK_INTERVAL);
		Events.BLINK_INTERVAL = false;
	},

	// Makes an event happen!
	triggerEvent: function() {
		if(Events.activeEvent() == null) {
			var possibleEvents = [];
			for(var i in Events.EventPool) {
				var event = Events.EventPool[i];
				if(event.isAvailable()) {
					possibleEvents.push(event);
				}
			}

			if(possibleEvents.length === 0) {
				Events.scheduleNextEvent(0.5);
				return;
			} else {
				var r = Math.floor(Math.random()*(possibleEvents.length));
				Events.startEvent(possibleEvents[r]);
			}
		}

		Events.scheduleNextEvent();
	},

	triggerFight: function() {
		var possibleFights = [];
		for(var i in Events.Encounters) {
			var fight = Events.Encounters[i];
			if(fight.isAvailable()) {
				possibleFights.push(fight);
			}
		}

		var r = Math.floor(Math.random()*(possibleFights.length));
		Events.startEvent(possibleFights[r]);

		// play audio only when fight is possible
		if (possibleFights.length > 0) {
			if (World.getDistance() > 20) {
				// Tier 3
				AudioEngine.playEventMusic(AudioLibrary.ENCOUNTER_TIER_3);
			} else if (World.getDistance() > 10) {
				// Tier 2
				AudioEngine.playEventMusic(AudioLibrary.ENCOUNTER_TIER_2);
			} else {
				// Tier 1
				AudioEngine.playEventMusic(AudioLibrary.ENCOUNTER_TIER_1);
			}
		}
	},

	activeEvent: function() {
		if(Events.eventStack && Events.eventStack.length > 0) {
			return Events.eventStack[0];
		}
		return null;
	},

	eventPanel: function() {
		return Events.activeEvent().eventPanel;
	},
	
	switchEvent: event => {
		if (!event) {
			return;
		}
		AudioEngine.stopEventMusic();
		Events.eventPanel().remove();
		Events.activeEvent().eventPanel = null;
		Events.eventStack.shift();
		Events.startEvent(event);
	},

	startEvent: function(event, options) {
		if(!event) {
			return;
		}
		event.audio && AudioEngine.playEventMusic(event.audio);
		Engine.event('game event', 'event');
		Engine.keyLock = true;
		Engine.tabNavigation = false;
		Button.saveCooldown = false;
		for (var scene in event.scenes) {
			if (event.scenes[scene].combat === true) {
				event.hasCombat = true;
				break;
			}
		}
		Events.eventStack.unshift(event);
		event.eventPanel = $('<div>').attr('id', 'event').addClass('eventPanel').css('opacity', '0');
		if(options != null && options.width != null) {
			Events.eventPanel().css('width', options.width);
		}
		$('<div>').attr('id', 'eventBackground').appendTo(Events.eventPanel());
		$('<div>').addClass('eventTitle').html(Events.activeEvent().title).appendTo(Events.eventPanel());
		$('<div>').attr('id', 'description').appendTo(Events.eventPanel());
		$('<div>').attr('id', 'buttons').appendTo(Events.eventPanel());
		Events.loadScene('start');
		$('div#wrapper').append(Events.eventPanel());
		Events.eventPanel().animate({opacity: 1}, Events._PANEL_FADE, 'linear');
		var currentSceneInformation = Events.activeEvent().scenes[Events.activeScene];
		if (currentSceneInformation.blink) {
			Events.blinkTitle();
		}
	},

	scheduleNextEvent: function(scale) {
		var nextEvent = Math.floor(Math.random()*(Events._EVENT_TIME_RANGE[1] - Events._EVENT_TIME_RANGE[0])) + Events._EVENT_TIME_RANGE[0];
		if(scale > 0) { nextEvent *= scale; }
		Engine.log('next event scheduled in ' + nextEvent + ' minutes');
		Events._eventTimeout = Engine.setTimeout(Events.triggerEvent, nextEvent * 60 * 1000, Engine._debug);
	},

	endEvent: function() {
		AudioEngine.stopEventMusic();
		Events.eventPanel().animate({opacity:0}, Events._PANEL_FADE, 'linear', function() {
			Events.eventPanel().remove();
			Events.activeEvent().eventPanel = null;
			Events.eventStack.shift();
			Engine.log(Events.eventStack.length + ' events remaining');
			Engine.keyLock = false;
			Engine.tabNavigation = true;
			Button.saveCooldown = true;
			if (Events.BLINK_INTERVAL) {
				Events.stopTitleBlink();
			}
			// Force refocus on the body. I hate you, IE.
			$('body').focus();
		});
	},

	handleStateUpdates: function(e){
		if((e.category == 'stores' || e.category == 'income') && Events.activeEvent() != null){
			Events.updateButtons();
		}
	},

	initDelay: function(){
		if($SM.get(Events.delayState)){
			Events.recallDelay(Events.delayState, Events);
		}
	},

	recallDelay: function(stateName, target){
		var state = $SM.get(stateName);
		for(var i in state){
			if(typeof(state[i]) == 'object'){
				Events.recallDelay(stateName +'["'+ i +'"]', target[i]);
			} else {
				if(target && typeof target[i] == 'function'){
					target[i]();
				} else {
					$SM.remove(stateName);
				}
			}
		}
		if($.isEmptyObject(state)){
			$SM.remove(stateName);
		}
	},

	saveDelay: function(action, stateName, delay){
		var state = Events.delayState + '.' + stateName;
		if(delay){
			$SM.set(state, delay);
		} else {
			delay = $SM.get(state, true);
		}
		var time = Engine.setInterval(function(){
			// update state every half second
			$SM.set(state, ($SM.get(state) - 0.5), true);
		}, 500);
		Engine.setTimeout(function(){
			// outcome realizes. erase countdown
			window.clearInterval(time);
			$SM.remove(state);
			$SM.removeBranch(Events.delayState);
			action();
		}, delay * 1000);
	}
};