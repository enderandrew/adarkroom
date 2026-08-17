/**
 * Mobile layout: collapsible sections.
 *
 * On a phone the Room shows three columns of build/craft/buy buttons plus a
 * stores box and a weapons box, all at once. Stacked into one column that is
 * several screens tall, and the player has to scroll past everything to reach
 * anything.
 *
 * This turns each of those into a tappable section header that expands and
 * collapses, so the screen shows a handful of headers and whichever one the
 * player opened.
 *
 * ============================================================================
 * THE CONSTRAINT THAT SHAPES THE IMPLEMENTATION
 * ============================================================================
 *
 * The game writes into these containers constantly and from many places --
 * Room.updateBuildButtons() creates and destroys buttons inside #buildBtns,
 * Room.updateStoresView() rebuilds rows inside #stores, Outside rewrites
 * #workers, and so on. Several of those do things like `.empty()` on the
 * container, or query it with a bare id selector.
 *
 * So this NEVER moves a container into a new wrapper and never puts anything
 * inside one. It inserts a header as a SIBLING immediately before the
 * container, and toggles a class on the container itself. CSS does the
 * hiding. The game's own DOM manipulation inside the container is completely
 * untouched, which means none of it has to know this exists.
 *
 * A wrapper-based accordion would look tidier and would break the moment any
 * of that code called .empty() or matched on a direct-child selector.
 */
var Mobile = {

	/* MUST match the second breakpoint in css/responsive.css. If the two
	 * disagree, the headers appear at a width where the CSS still has the
	 * sections laid out as columns, or vice versa. */
	BREAKPOINT: 899,

	/* Section id -> the label shown on its header, and whether it starts
	 * open. Stores starts open because it is the one thing a player checks
	 * constantly and never interacts with; the button columns start closed
	 * because they are long. */
	SECTIONS: [
		{ id: 'buildBtns', label: function() { return _('build'); }, open: false },
		{ id: 'craftBtns', label: function() { return _('craft'); }, open: false },
		{ id: 'buyBtns', label: function() { return _('buy'); }, open: false },
		{ id: 'stores', label: function() { return _('stores'); }, open: true },
		{ id: 'weapons', label: function() { return _('weapons'); }, open: false },
		{ id: 'workers', label: function() { return _('the villagers'); }, open: false },
		{ id: 'village', label: function() { return _('the village'); }, open: true },
		{ id: 'perks', label: function() { return _('perks'); }, open: false },
		{ id: 'blueprints', label: function() { return _('blueprints'); }, open: false },
		{ id: 'outfitting', label: function() { return _('supplies'); }, open: true }
	],

	_active: false,
	_observer: null,
	_timer: null,
	_decorateTimer: null,

	isMobileWidth: function() {
		return $(window).width() <= Mobile.BREAKPOINT;
	},

	init: function() {
		Mobile.apply();
		/* Re-evaluated on resize AND on orientation change, since a phone
		 * rotating between portrait and landscape can cross the breakpoint
		 * without firing a resize on some browsers. */
		$(window).on('resize.mobile orientationchange.mobile', function() {
			clearTimeout(Mobile._timer);
			Mobile._timer = setTimeout(Mobile.apply, 150);
		});
		Mobile.watch();
	},

	/* Watches for sections that get CREATED during play.
	 *
	 * Most of these containers do not exist when the game starts.
	 * Room.updateBuildButtons() builds #buildBtns the first time anything is
	 * buildable and #craftBtns only once a workshop goes up; #village and
	 * #workers appear when the first hut does. Decorating once at init would
	 * give headers to whatever happened to exist at that moment and silently
	 * miss every section the player unlocks afterwards -- which is most of
	 * them.
	 *
	 * A MutationObserver keeps that entirely inside this module: no call
	 * sites to add across room.js, outside.js, path.js and fabricator.js,
	 * and nothing for a future location to remember to call. Debounced,
	 * because these containers are rewritten on every income tick and
	 * re-running decorate() on each mutation would be wasteful. */
	watch: function() {
		if(Mobile._observer || typeof MutationObserver === 'undefined') { return; }
		var target = document.getElementById('main') || document.body;
		if(!target) { return; }
		Mobile._observer = new MutationObserver(function() {
			if(!Mobile._active) { return; }
			clearTimeout(Mobile._decorateTimer);
			Mobile._decorateTimer = setTimeout(Mobile.decorate, 60);
		});
		Mobile._observer.observe(target, { childList: true, subtree: true });
	},

	/* Adds or removes the mobile treatment to match the current width.
	 * Idempotent -- safe to call as often as you like. */
	apply: function() {
		var shouldBeOn = Mobile.isMobileWidth();
		if(shouldBeOn === Mobile._active) {
			/* Still the right mode, but sections may have appeared since
			 * (the Room grows a craft column partway through the game), so
			 * top up rather than returning. */
			if(shouldBeOn) { Mobile.decorate(); }
			return;
		}
		Mobile._active = shouldBeOn;
		if(shouldBeOn) {
			$('html').addClass('mobileLayout');
			Mobile.decorate();
		} else {
			$('html').removeClass('mobileLayout');
			/* Leave the headers in the DOM but let CSS hide them, and drop
			 * the collapsed state so nothing is invisible on desktop. */
			$('.mobileSection').removeClass('mobileCollapsed');
		}
	},

	/* Gives every section that exists and hasn't got one yet a header. */
	decorate: function() {
		Mobile.SECTIONS.forEach(function(section) {
			var el = $('#' + section.id);
			if(el.length === 0) { return; }
			if(el.data('mobileDecorated')) { return; }

			var header = $('<div>')
				.addClass('mobileSectionHeader')
				.attr('data-for', section.id)
				.text(Events.resolve(section.label))
				.click(function() { Mobile.toggle(section.id); });

			/* Sibling, immediately before -- never a wrapper. See the note at
			 * the top of this file. */
			el.addClass('mobileSection').before(header);
			el.data('mobileDecorated', true);

			if(!section.open) {
				el.addClass('mobileCollapsed');
				header.addClass('collapsed');
			}
		});
	},

	toggle: function(id) {
		var el = $('#' + id);
		var header = $('.mobileSectionHeader[data-for="' + id + '"]');
		var collapsing = !el.hasClass('mobileCollapsed');
		el.toggleClass('mobileCollapsed', collapsing);
		header.toggleClass('collapsed', collapsing);
	}
};
