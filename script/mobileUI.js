/**
 * Mobile UI.
 *
 * Loaded ONLY by mobile.html. Nothing in index.html references this, and
 * nothing here runs on desktop.
 *
 * ============================================================================
 * WHY THIS IS A SEPARATE PAGE
 * ============================================================================
 *
 * Three rounds of responsive CSS against index.html did not work, and each
 * one regressed something on desktop while fixing something on mobile. The
 * root cause is that the desktop layout is built from absolutely-positioned
 * columns sized against a fixed 700px stage, plus a position:fixed menu, and
 * every mobile rule had to fight that with !important overrides. Two layouts
 * were competing inside one stylesheet.
 *
 * A dedicated page removes the competition entirely. The game scripts are
 * identical -- same Engine, same Room, same save data, same everything. Only
 * the shell and the presentation layer differ.
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
		{ id: 'village',     label: function() { return _('the village'); },  open: true  },
		{ id: 'workers',     label: function() { return _('villagers'); },    open: false },
		{ id: 'perks',       label: function() { return _('perks'); },        open: false },
		{ id: 'blueprints',  label: function() { return _('blueprints'); },   open: false },
		{ id: 'outfitting',  label: function() { return _('supplies'); },     open: true  }
	],

	_observer: null,
	_travelHooked: false,
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
		if(!module || !module.panel || !module.panel.length) { return; }
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

	init: function() {
		$('html').addClass('mobileUI');
		MobileUI.hookTravel();
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
	}
};
