/**
 * Environmental hazards and the hazard suit.
 *
 * The suit is worn OVER armour rather than replacing it, so equipping it
 * never forces a defensive downgrade -- it occupies no slot and competes with
 * nothing. What it buys is survival in places that damage the player
 * regardless of how well armed they are.
 *
 * Everything here MITIGATES rather than negates. A suit that made the
 * Glassed Crater safe would delete the crater's entire decision -- the
 * location is one gamble, and removing the downside removes the gamble. It
 * halves the cost instead, which turns "don't go down there" into "now it's
 * worth it", which is what an endgame upgrade should do.
 */
var Hazard = {

	hasSuit: function() {
		return $SM.get('stores["hazard suit"]', true) > 0;
	},

	/* Fraction of environmental damage that gets through while suited.
	 * 0.5 -- halved, not cancelled. See the note above. */
	MITIGATION: 0.5,

	/* Applies the suit to a raw hazard amount. Always returns at least 1 for
	 * a non-zero input: an environmental event that announces itself and then
	 * does literally nothing reads as a bug, not as protection. */
	mitigate: function(amount) {
		if(!Hazard.hasSuit()) { return amount; }
		if(amount <= 0) { return amount; }
		return Math.max(1, Math.floor(amount * Hazard.MITIGATION));
	},

	/* True when the suit should prevent a consequence outright rather than
	 * reduce it. Used only for effects with no meaningful "half" -- food
	 * contamination, and the wreck's lethal radiation, where the alternative
	 * to preventing it is a coin-flip death the player cannot influence. */
	preventsSpoilage: function() {
		return Hazard.hasSuit();
	},

	preventsLethalRadiation: function() {
		return Hazard.hasSuit();
	},

	/* Standard flavour line, so every hazard scene reports the suit the same
	 * way rather than each one inventing its own phrasing. */
	suitNote: function() {
		return Hazard.hasSuit() ?
			_('the suit holds. what gets through is a fraction of what should have.') :
			_('there is nothing between you and it.');
	}
};
