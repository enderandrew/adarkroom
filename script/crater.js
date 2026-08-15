/**
 * The Glassed Crater.
 *
 * Rules for the crater setpiece (see script/events/setpieces.js). Small, but
 * kept out of the scene data because radiation sickness touches two separate
 * systems -- the health ceiling and the expedition pack -- and doing that
 * inline in an onLoad would bury it.
 */
var Crater = {

	/* How much of the player's maximum health the sickness takes for the rest
	 * of the excursion. Applied to the CEILING, not to current health: the
	 * 15hp entry cost already hurt them once, and this is meant to be a
	 * different kind of damage -- one they can't heal off with meat. */
	MAX_HP_PENALTY: 15,

	/* Fraction of carried food ruined. Rounded up so it always bites: at low
	 * stocks a floor would round to zero and the "your food is contaminated"
	 * beat would land with nothing behind it. */
	FOOD_LOSS: 0.5,

	radiationSickness: function() {
		/* Halved by the hazard suit, and food contamination prevented
		 * outright -- there is no meaningful "half spoiled". The penalty is
		 * never removed entirely: the crater is one gamble, and a suit that
		 * made it free would delete the decision rather than reward it. */
		World.applyMaxHealthPenalty(Hazard.mitigate(Crater.MAX_HP_PENALTY));
		if(!Hazard.preventsSpoilage()) {
			Crater.spoilFood();
		}
	},

	spoilFood: function() {
		if(!Path.outfit) { return 0; }
		var have = Path.outfit['cured meat'];
		if(typeof have !== 'number' || have <= 0) { return 0; }
		var lost = Math.ceil(have * Crater.FOOD_LOSS);
		Path.outfit['cured meat'] = Math.max(0, have - lost);
		World.updateSupplies();
		return lost;
	}
};
