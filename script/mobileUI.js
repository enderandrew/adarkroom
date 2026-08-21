/**
 * Mobile UI.
 *
 * Loaded ONLY by mobile.html. Nothing in index.html references this, and
 * nothing here runs on desktop.
 *
 * ============================================================================
 * HOW IT WORKS
 * ============================================================================
 *
 * The game builds its normal DOM. This does NOT rewrite it, move containers
 * into wrappers, or re-render anything, because a dozen places in the game
 * call .empty() on those containers or select with direct-child selectors,
 * and any of that would break them. It only ever:
 *
 *   1. inserts a tappable header as a SIBLING before a container, and
 *   2. toggles a class on the container itself.
 *
 * CSS in css/mobile.css does the hiding. The game never needs to know.
 *
 * Containers are created lazily during play -- #buildBtns does not exist
 * until something is buildable, #craftBtns not until a workshop is up -- so a
 * MutationObserver tops up the decoration rather than running once at init.
 */
var MobileUI = {

	/* Section id -> header label and whether it starts open.
	 *
	 * Ordered as they should APPEAR, not as the game happens to create them.
	 * The two things a player touches constantly (the primary action button
	 * and stores) stay at the top; the long lists start closed.
	 */
	SECTIONS: [
		{ id: 'stores',      label: function() { return _('stores'); },       open: false },
		{ id: 'weapons',     label: function() { return _('weapons'); },      open: false },
		{ id: 'buildBtns',   label: function() { return _('build'); },        open: false },
		{ id: 'craftBtns',   label: function() { return _('craft'); },        open: false },
		{ id: 'buyBtns',     label: function() { return _('buy'); },          open: false },
		/* Collapsed like everything else. Open, the village and supplies
		 * panels each filled more than a phone screen -- the supplies list
		 * hid the embark button entirely, so the player could not leave. */
		{ id: 'village',     label: function() { return _('the village'); },  open: false },
		{ id: 'workers',     label: function() { return _('villagers'); },    open: false },
		{ id: 'perks',       label: function() { return _('perks'); },        open: false },
		{ id: 'blueprints',  label: function() { return _('blueprints'); },   open: false },
		{ id: 'outfitting',  label: function() { return _('supplies'); },     open: false }
	],

	_observer: null,
	_travelHooked: false,
	_mapHooked: false,
	_retrying: false,
	_decorateTimer: null,

	/* ---- one location at a time ----------------------------------------
	 *
	 * The desktop shows a single panel by sliding a wide strip left and
	 * right behind a fixed-width window with overflow hidden. In a single
	 * static column that machinery does nothing, so EVERY location renders
	 * stacked -- "gather wood" showing in the Firelit Room alongside the
	 * Silent Forest's buttons, which is what was reported.
	 *
	 * Panels are shown and hidden outright here instead. Hooked by wrapping
	 * Engine.travelTo rather than editing it, so the desktop slider path is
	 * untouched and this stays contained to the mobile layer. */
	hookTravel: function() {
		if(MobileUI._travelHooked) { return; }
		MobileUI._travelHooked = true;

		var original = Engine.travelTo;
		Engine.travelTo = function(module) {
			original.apply(Engine, arguments);
			MobileUI.showOnly(module);
		};

		/* Path.embark does NOT go through Engine.travelTo -- it sets
		 * Engine.activeModule directly and slides #outerSlider by hand, so
		 * the wrapper above never fired on embark. The World panel kept its
		 * .mHidden and embark silently did nothing, with no error, because
		 * from the game's point of view nothing had gone wrong.
		 * World.onArrival is the one call every embark makes. */
		if(typeof World !== 'undefined' && typeof World.onArrival === 'function') {
			var arrive = World.onArrival;
			World.onArrival = function() {
				arrive.apply(World, arguments);
				MobileUI.showOnly(World);
			};
		}

		if(Engine.activeModule) { MobileUI.showOnly(Engine.activeModule); }
	},

	showOnly: function(module) {
		/* Guarded BEFORE anything is hidden.
		 *
		 * A module's panel does not exist until that module has initialised
		 * -- Outside.panel is undefined until the forest is unlocked. Hiding
		 * every location first and only then discovering there is nothing to
		 * show would leave the player on a completely blank page. Bailing out
		 * early leaves whatever was showing in place, which is the safe
		 * failure. */
		if(!module || !module.panel || !module.panel.length) {
			/* The panel does not exist YET -- World.panel is not built until
			 * World.init runs, and Path.embark calls World.onArrival before
			 * that on the first trip out. Returning silently left every other
			 * panel visible, which is why the village, villagers, gather wood
			 * and check traps stayed on screen while out in the world.
			 *
			 * Retry once on the next tick rather than giving up. The guard
			 * still does its original job -- never hide everything and show
			 * nothing -- but no longer abandons the hide permanently. */
			if(!MobileUI._retrying) {
				MobileUI._retrying = true;
				setTimeout(function() {
					MobileUI._retrying = false;
					if(module && module.panel && module.panel.length) {
						MobileUI.showOnly(module);
					}
				}, 0);
			}
			return;
		}
		$('.location').addClass('mHidden');
		module.panel.removeClass('mHidden');

		/* The stores box lives outside the panels and is pinned to the right
		 * of whichever one is showing; in this layout it just belongs to the
		 * Room. */
		var stores = $('#storesContainer');
		if(stores.length) {
			stores.toggleClass('mHidden', module !== Room);
		}
	},

	/* ---- world map ------------------------------------------------------
	 *
	 * World.RADIUS is 33, so the map is a 67x67 monospace grid. There is no
	 * font size at which that fits a phone and stays readable, so rather
	 * than shrink it into illegibility it scrolls, and re-centres on the
	 * player after every redraw.
	 *
	 * Scroll position is computed proportionally from World.curPos rather
	 * than by measuring a character cell: cell width depends on a font that
	 * may not have loaded at first paint, and a wrong measurement centres on
	 * the wrong tile. Proportional maths needs no measurement.
	 *
	 * Hooked on drawMap, which runs after every move, fight and reveal --
	 * there is no single "player moved" event to listen for. */
	hookMap: function() {
		if(MobileUI._mapHooked) { return; }
		if(typeof World === 'undefined' || typeof World.drawMap !== 'function') { return; }
		MobileUI._mapHooked = true;

		var draw = World.drawMap;
		World.drawMap = function() {
			draw.apply(World, arguments);
			MobileUI.centreMap();
		};
	},

	centreMap: function() {
		var map = document.getElementById('map');
		if(!map || !World.curPos) { return; }
		var span = World.RADIUS * 2;
		if(!span) { return; }

		var fx = World.curPos[0] / span;
		var fy = World.curPos[1] / span;

		if(map.scrollWidth > map.clientWidth) {
			map.scrollLeft = Math.max(0, (fx * map.scrollWidth) - (map.clientWidth / 2));
		}
		if(map.scrollHeight > map.clientHeight) {
			map.scrollTop = Math.max(0, (fy * map.scrollHeight) - (map.clientHeight / 2));
		}
	},

	init: function() {
		$('html').addClass('mobileUI');
		MobileUI.syncDark();
		MobileUI.hookTravel();
		MobileUI.hookMap();
		MobileUI.buildSettingsMenu();
		MobileUI.decorate();
		MobileUI.watch();
	},

	/* ---- collapsible sections ------------------------------------------ */

	decorate: function() {
		MobileUI.SECTIONS.forEach(function(section) {
			var el = $('#' + section.id);
			if(el.length === 0) { return; }
			if(el.data('mobileDone')) { return; }

			var header = $('<div>')
				.addClass('mSection')
				.attr('data-for', section.id)
				.append($('<span>').addClass('mSectionLabel').text(Events.resolve(section.label)))
				.append($('<span>').addClass('mSectionMark'))
				.click(function() { MobileUI.toggle(section.id); });

			el.addClass('mBody').before(header);
			el.data('mobileDone', true);

			if(!section.open) {
				el.addClass('mClosed');
				header.addClass('closed');
			}
		});
	},

	toggle: function(id) {
		var el = $('#' + id);
		var header = $('.mSection[data-for="' + id + '"]');
		var closing = !el.hasClass('mClosed');
		el.toggleClass('mClosed', closing);
		header.toggleClass('closed', closing);
	},

	/* Sections are created during play, not at init. */
	watch: function() {
		if(MobileUI._observer || typeof MutationObserver === 'undefined') { return; }
		var target = document.getElementById('main') || document.body;
		if(!target) { return; }
		MobileUI._observer = new MutationObserver(function() {
			clearTimeout(MobileUI._decorateTimer);
			MobileUI._decorateTimer = setTimeout(MobileUI.decorate, 60);
		});
		MobileUI._observer.observe(target, { childList: true, subtree: true });
	},

	/* The language list is 26 options and, expanded, is most of a phone
	 * screen on its own -- inside the settings panel that is a list within a
	 * list. On desktop it opens on hover, which does not exist on touch, so
	 * it is given its own tap-to-open row; css/mobile.css collapses it and
	 * lays it out in columns when open. */
	collapseLanguagePicker: function(panel) {
		var sel = $('.customSelect', panel.length ? panel : $('#mSettingsPanel'));
		if(sel.length === 0) { return; }
		var first = $('.customSelectOptions > ul > li', sel).first();
		if(first.length === 0) { return; }
		first.off('click.mobile').on('click.mobile', function(e) {
			e.stopPropagation();
			sel.toggleClass('open');
		});
	},

	/* ---- dark mode -----------------------------------------------------
	 *
	 * Toggles a class beside mobileUI on <html>; css/mobile.css flips its
	 * colour variables from it. css/dark.css still loads and still handles
	 * the desktop-shaped selectors -- this only ensures the mobile layer's
	 * own colours move WITH it rather than staying light underneath. */
	applyDark: function(on) {
		$('html').toggleClass('mDark', !!on);
	},

	/* Reads the STYLESHEET, not config.lightsOff.
	 *
	 * Engine.turnLightsOff does not store a boolean for "dark is on": when
	 * enabling it writes `config.lightsOff = Engine.options.dark`, which is
	 * false unless the game was launched with that option set. The flag is
	 * therefore false in BOTH states and cannot distinguish them -- reading
	 * it left this layer permanently light while dark.css was active, which
	 * is the reported everything-white-in-dark-mode.
	 *
	 * The presence and enabled state of the darkenLights sheet is the real
	 * source of truth, and is what the desktop itself branches on. */
	isDarkActive: function() {
		if(typeof Engine === 'undefined' || typeof Engine.findStylesheet !== 'function') {
			return false;
		}
		var sheet = Engine.findStylesheet('darkenLights');
		return !!sheet && !sheet.disabled;
	},

	syncDark: function() {
		MobileUI.applyDark(MobileUI.isDarkActive());
	},

	/* ---- settings ------------------------------------------------------
	 *
	 * The desktop menu is a run of a dozen links pinned to the bottom-right
	 * corner. On a phone that is unusable at any size -- it was the specific
	 * thing that kept breaking. Here it collapses behind one button and
	 * becomes a full-width list, which is also where the language picker
	 * goes so its absolutely-positioned dropdown stops fighting the corner.
	 */
	buildSettingsMenu: function() {
		var panel = $('<div>').attr('id', 'mSettingsPanel').addClass('mClosed');

		var btn = $('<div>')
			.attr('id', 'mSettingsBtn')
			.addClass('mSection')
			.append($('<span>').addClass('mSectionLabel').text(_('settings')))
			.append($('<span>').addClass('mSectionMark'))
			.addClass('closed')
			.click(function() {
				var closing = !panel.hasClass('mClosed');
				panel.toggleClass('mClosed', closing);
				btn.toggleClass('closed', closing);
			});

		$('#wrapper').append(btn).append(panel);

		/* Move the real menu inside the panel rather than rebuilding it.
		 *
		 * Every item already has its click handler bound by Engine.init, and
		 * several of them (volume, lights, hardcore) are re-labelled later by
		 * code that finds them with $('.volume'), $('.lightsOff') and so on.
		 * Rebuilding the list would silently break all of that; moving the
		 * live nodes keeps every handler and every later lookup intact. */
		var real = $('.menu');
		if(real.length) {
			real.appendTo(panel).addClass('mMenuList');
		}

		/* AFTER the move, not before: the language picker lives inside
		 * .menu, so calling this first found nothing to collapse. */
		MobileUI.collapseLanguagePicker(panel);
	}
};
