/**
 * Compatibility shim: restores jQuery.type for jquery-color 2.1.2.
 *
 * ============================================================================
 * WHY THIS EXISTS
 * ============================================================================
 *
 * jQuery 4.0 removed several deprecated utilities -- $.isArray, $.trim, and
 * $.type among them. jquery-color 2.1.2 (loaded next, see index.html) was
 * written against jQuery 1.x/2.x/3.x and calls $.type() directly inside the
 * cssHooks it registers for every color-animatable property:
 *
 *     a.cssHooks[c] = { set: function(b, d) {
 *         if (d !== "transparent" && (a.type(d) !== "string" || ...
 *
 * Under jQuery 4, a.type is undefined, so this throws
 * "TypeError: a.type is not a function" the instant anything touches a
 * hooked property -- backgroundColor, color, borderColor, etc. That is NOT a
 * narrow edge case here: script/space.js's entire ending sequence animates
 * backgroundColor for the fade-to-white/black transition on BOTH liftoff and
 * the crash-landing return, and menu/panel color fades alongside them. The
 * practical effect was that reaching the end of the game threw an uncaught
 * error and broke the transition, in every browser, for as long as jQuery
 * was pinned to 4.0.0 without this.
 *
 * This was never caught by the existing jQuery-4 verification work (see the
 * notes in that history) because jsdom does not run a real animation/paint
 * loop -- the test suites' own animate() calls exercised numeric properties
 * (opacity, top, left) that never touch a color cssHook, so the failure was
 * invisible to every automated check and only surfaced in an actual browser
 * at the actual ending.
 *
 * ============================================================================
 * WHY A SHIM RATHER THAN REWRITING THE COLOR ANIMATIONS
 * ============================================================================
 *
 * The alternative -- replacing every backgroundColor/color animate() call in
 * space.js with a hand-rolled RGB interpolation -- would touch six call
 * sites across the game's actual ending sequence, which is exactly the kind
 * of high-consequence, low-test-coverage code where a rewrite risks
 * introducing a new bug in exchange for removing an old one. Restoring the
 * one missing utility function fixes all six at once, changes no game code,
 * and is a two-line, well-understood patch rather than a rewrite of the
 * climax of the game.
 *
 * ============================================================================
 * WHY THIS IS SAFE UNDER EVERY JQUERY VERSION
 * ============================================================================
 *
 * Guarded on `!jQuery.type`, so this is a genuine no-op wherever the real
 * jQuery.type still exists -- the CDN-blocked fallback to the local jQuery
 * 1.10.1 (see index.html), or any future pin back to jQuery 3.x. It can never
 * override or shadow a version's own implementation, only fill the gap where
 * one was removed.
 *
 * The implementation itself is not a guess: it is jQuery 3.x's own source for
 * $.type, copied verbatim, so a browser running under this shim sees
 * identical behaviour to a browser running the version that still ships it
 * natively.
 */
(function($) {
	if (!$ || typeof $.type === 'function') {
		return;
	}

	var class2type = {};
	'Boolean Number String Function Array Date RegExp Object Error Symbol'
		.split(' ')
		.forEach(function(name) {
			class2type['[object ' + name + ']'] = name.toLowerCase();
		});

	$.type = function(obj) {
		if (obj == null) {
			return obj + '';
		}
		return typeof obj === 'object' || typeof obj === 'function' ?
			class2type[Object.prototype.toString.call(obj)] || 'object' :
			typeof obj;
	};
})(window.jQuery);
