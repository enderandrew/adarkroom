/**
 * Native swipe detection.
 *
 * Replaces jquery.event.move + jquery.event.swipe, two unmaintained plugins
 * that hooked jQuery internals (jQuery.event.add/remove/trigger/special) and
 * relied on utilities jQuery 4 has been steadily removing. Rather than write
 * another compatibility shim to keep them alive, this does the job directly
 * with Pointer Events, which every browser the game targets has supported
 * for years and which handles mouse, touch and stylus through one code path.
 *
 * The plugins were also the game's only remaining dependency on jQuery
 * internals, so dropping them removes the most fragile part of the jQuery-4
 * surface -- see the notes in build/README.md.
 *
 * Emits the same four jQuery events the plugins did -- swipeleft,
 * swiperight, swipeup, swipedown -- on the element it's attached to, so
 * Engine's existing handlers and World's swipe methods are untouched. The
 * point of the seam is that the event source changed and nothing else did.
 */
var Swipe = {

	/* Minimum travel, in pixels, before a gesture counts as a swipe. Below
	 * this it's a tap or a twitch, and turning those into map movement would
	 * make the world map unusable on a phone.
	 *
	 * Deliberately generous: the alternative failure -- a swipe that doesn't
	 * register -- costs the player one repeat, while an accidental swipe
	 * costs them a real move on the world map, food, water, and possibly a
	 * fight. */
	THRESHOLD: 40,

	/* How far the gesture may drift on the OTHER axis and still count. A
	 * diagonal drag shouldn't resolve to a cardinal direction the player
	 * didn't intend, since the map only moves in four directions. */
	MAX_CROSS: 0.7,

	/* Gestures slower than this are treated as a drag or a scroll, not a
	 * swipe. Stops a slow finger-rest-and-shift from moving the player. */
	TIMEOUT: 800,

	_start: null,
	_el: null,

	/* Attaches swipe detection to a jQuery element or raw node. Safe to call
	 * more than once -- it detaches any previous binding first, so a
	 * re-initialised Engine can't end up with two listeners racing to move
	 * the player two tiles per swipe. */
	attach: function(el) {
		Swipe.detach();

		var node = el instanceof $ ? el[0] : el;
		if(!node) { return; }
		Swipe._el = node;

		node.addEventListener('pointerdown', Swipe.onDown, { passive: true });
		node.addEventListener('pointerup', Swipe.onUp, { passive: true });
		/* pointercancel matters on touch: the browser takes the pointer away
		 * when it decides the gesture is a scroll, and without clearing state
		 * here the NEXT unrelated pointerup would be measured against a stale
		 * start point and fire a phantom swipe. */
		node.addEventListener('pointercancel', Swipe.onCancel, { passive: true });
	},

	detach: function() {
		if(!Swipe._el) { return; }
		Swipe._el.removeEventListener('pointerdown', Swipe.onDown);
		Swipe._el.removeEventListener('pointerup', Swipe.onUp);
		Swipe._el.removeEventListener('pointercancel', Swipe.onCancel);
		Swipe._el = null;
		Swipe._start = null;
	},

	onDown: function(e) {
		/* Ignore secondary buttons and multi-touch. A two-finger gesture is a
		 * pinch or a scroll, not a swipe, and treating it as one produces
		 * movement the player didn't ask for. */
		if(e.button && e.button !== 0) {
			Swipe._start = null;
			return;
		}
		Swipe._start = {
			x: e.clientX,
			y: e.clientY,
			t: Date.now(),
			id: e.pointerId
		};
	},

	onCancel: function() {
		Swipe._start = null;
	},

	onUp: function(e) {
		var start = Swipe._start;
		Swipe._start = null;
		if(!start) { return; }
		// A different pointer finishing than the one that started: not a swipe.
		if(start.id !== e.pointerId) { return; }
		if(Date.now() - start.t > Swipe.TIMEOUT) { return; }

		var dx = e.clientX - start.x;
		var dy = e.clientY - start.y;
		var adx = Math.abs(dx);
		var ady = Math.abs(dy);

		var dir = null;
		if(adx >= Swipe.THRESHOLD && ady <= adx * Swipe.MAX_CROSS) {
			dir = dx > 0 ? 'swiperight' : 'swipeleft';
		} else if(ady >= Swipe.THRESHOLD && adx <= ady * Swipe.MAX_CROSS) {
			dir = dy > 0 ? 'swipedown' : 'swipeup';
		}

		if(dir) {
			/* Triggered through jQuery rather than dispatched as a native
			 * CustomEvent, so the existing .on('swipeleft', ...) bindings in
			 * Engine keep working exactly as they did under the plugins. */
			$(Swipe._el).trigger(dir);
		}
	}
};
