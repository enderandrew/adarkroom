/**
 * Distress.
 *
 * Schedules the rare per-area glitch events described in css/distress.css.
 * The resting layer (scanlines, grain, vignette) is pure CSS and needs no
 * help from here; this module only exists to decide WHEN something breaks and
 * WHICH KIND of breakage that area is capable of.
 *
 * Design rules this module exists to enforce:
 *
 *   - Never during an event. Glitching the screen while somebody is reading a
 *     choice, or mid-combat, turns atmosphere into an accessibility problem.
 *   - One at a time, and short. Every effect self-clears.
 *
 * Nothing here is load-bearing: if this module fails to load, or the player
 * turns it off, the game is exactly as it was.
 */
var Distress = {

	name: 'Distress',
	options: {},

	/* Seconds between events, as a range. The lower bound is what stops this
	 * becoming wallpaper; the spread is what stops it becoming a metronome. */
	MIN_INTERVAL: 5 * 1000,
	MAX_INTERVAL: 10 * 1000,

	/* Which effect each area is capable of, and how long its class needs to
	 * stay on for the CSS animation to finish.
	 *
	 * Room is 'dxFlicker' on purpose -- firelight, not a glitch. See the note
	 * at the top of css/distress.css.
	 *
	 * Keyed by an internal id, resolved to a module by identity in
	 * currentEffect(). Deliberately NOT keyed on module.name: most modules set
	 * that through _(), so Outside is "Outside" in English and something else
	 * entirely in every other language, and Room has no top-level name at all.
	 * Identity comparison is what Engine.travelTo uses, and it's the only
	 * thing here that's stable across locales. */
	EFFECTS: {
		room:       { cls: 'dxFlicker', duration: 1600 },
		outside:    { cls: 'dxAsh',     duration: 2600 },
		path:       { cls: 'dxShear',   duration: 700 },
		world:      { cls: 'dxSweep',   duration: 900 },
		fabricator: { cls: 'dxTear',    duration: 320 },
		ship:       { cls: 'dxRoll',    duration: 520 },
		space:      { cls: 'dxRoll',    duration: 520 },

		/* Maze interiors. Reached through setContext() rather than through a
		 * module, because a maze is a SCENE inside an event and has no module
		 * of its own -- see the note on canFire(). */
		lab:        { cls: 'dxVats',    duration: 3200 },
		prison:     { cls: 'dxHold',    duration: 4200 }
	},

	/* An explicit area override, for places that are not modules.
	 *
	 * Set by Maze.render() and cleared by Maze.teardown(). Everything else
	 * about the effect -- the player's toggle, reduced-motion, the clearing
	 * logic -- is shared with the normal path, so a maze cannot end up with
	 * its own half-implemented copy of the rules. */
	_context: null,

	setContext: function(key) {
		Distress._context = key || null;
	},

	clearContext: function() {
		Distress._context = null;
		Distress.clear();
	},

	/* Maps the live module object to an EFFECTS key. Each module is checked
	 * for existence first -- Fabricator and Ship only exist once unlocked,
	 * and referencing an undefined global would throw. */
	effectKeyFor: function(module) {
		if(typeof Room !== 'undefined' && module === Room) return 'room';
		if(typeof Outside !== 'undefined' && module === Outside) return 'outside';
		if(typeof Path !== 'undefined' && module === Path) return 'path';
		if(typeof World !== 'undefined' && module === World) return 'world';
		if(typeof Fabricator !== 'undefined' && module === Fabricator) return 'fabricator';
		if(typeof Ship !== 'undefined' && module === Ship) return 'ship';
		if(typeof Space !== 'undefined' && module === Space) return 'space';
		return null;
	},

	_timer: null,

	init: function(options) {
		this.options = $.extend(this.options, options);

		Distress.buildOverlay();

		// Respect a stored preference; default on.
		if($SM.get('config.distress') === false) {
			Distress.setEnabled(false);
		} else {
			Distress.setEnabled(true);
		}

		Distress.scheduleNext();
	},

	buildOverlay: function() {
		if($('#distress').length > 0) {
			return;
		}
		var d = $('<div>').attr('id', 'distress').attr('aria-hidden', 'true');
		$('<div>').addClass('dxScan').appendTo(d);
		$('<div>').addClass('dxGrain').appendTo(d);
		$('<div>').addClass('dxVignette').appendTo(d);
		$('<div>').addClass('dxSweep').appendTo(d);
		$('<div>').addClass('dxStatic').appendTo(d);
		d.appendTo('body');
	},

	isEnabled: function() {
		return !$('html').hasClass('dxOff');
	},

	setEnabled: function(on) {
		$('html').toggleClass('dxOff', !on);
		$SM.set('config.distress', !!on, true);
		$('.distressBtn').text(on ? _('distress off.') : _('distress.'));
	},

	toggle: function() {
		Distress.setEnabled(!Distress.isEnabled());
	},

	/* The player's OS-level setting. Checked at fire time rather than at init
	 * so that changing it mid-session takes effect without a reload. The CSS
	 * already suppresses the animations under this query -- this just avoids
	 * pointlessly setting and clearing classes. */
	prefersReducedMotion: function() {
		return typeof window.matchMedia === 'function' &&
			window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	},

	scheduleNext: function() {
		clearTimeout(Distress._timer);
		var wait = Distress.MIN_INTERVAL +
			Math.random() * (Distress.MAX_INTERVAL - Distress.MIN_INTERVAL);
		Distress._timer = setTimeout(Distress.fire, wait);
	},

	/* Whether it's currently acceptable to disturb the screen at all. */
	canFire: function() {
		if(!Distress.isEnabled()) return false;
		if(Distress.prefersReducedMotion()) return false;
		if(typeof Engine === 'undefined' || !Engine.activeModule) return false;
		if(Engine.GAME_OVER) return false;
		/* Never mid-event. The player is reading a choice, or fighting, and
		 * either way is being asked to make a decision under time pressure --
		 * shaking the screen at that moment is a usability problem wearing an
		 * atmosphere costume. */
		/* ...unless a context is set. A maze is an event, so this rule would
		 * otherwise exclude the lab and the prison entirely -- the two
		 * locations where an unattended machine still running is the whole
		 * point. Walking a corridor is not the same as being asked to choose
		 * under pressure, which is what this guard exists to protect. Combat
		 * scenes inside a maze clear the context via teardown, so fights are
		 * still exempt. */
		if(typeof Events !== 'undefined' && Events.activeEvent() && !Distress._context) {
			return false;
		}
		return true;
	},

	currentEffect: function() {
		/* An explicit context wins: it is only ever set somewhere the module
		 * cannot describe where the player actually is. */
		if(Distress._context) {
			return Distress.EFFECTS[Distress._context] || null;
		}
		if(typeof Engine === 'undefined' || !Engine.activeModule) return null;
		var key = Distress.effectKeyFor(Engine.activeModule);
		return key ? Distress.EFFECTS[key] : null;
	},

	fire: function() {
		if(Distress.canFire()) {
			var effect = Distress.currentEffect();
			if(effect) {
				Distress.play(effect);
			}
		}
		Distress.scheduleNext();
	},

	/* Applies an effect class and removes it once its animation has run.
	 * Clears any effect already running first, so two areas' classes can never
	 * be on the body at once (possible if the player changes tabs at exactly
	 * the wrong moment). */
	play: function(effect) {
		Distress.clear();
		$('body').addClass(effect.cls);
		Distress._clearTimer = setTimeout(function() {
			$('body').removeClass(effect.cls);
		}, effect.duration + 50);
	},

	clear: function() {
		clearTimeout(Distress._clearTimer);
		var body = $('body');
		for(var k in Distress.EFFECTS) {
			body.removeClass(Distress.EFFECTS[k].cls);
		}
	},

	/* Lets other code deliberately trigger the current area's effect -- for a
	 * story beat, say. Ignores the schedule but still respects the player's
	 * settings and the no-interrupting-events rule. */
	pulse: function() {
		if(!Distress.canFire()) return;
		var effect = Distress.currentEffect();
		if(effect) Distress.play(effect);
	}
};
