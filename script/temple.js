/**
 * The Silent Temple.
 *
 * Rules and state for the temple setpiece (see script/events/setpieces.js).
 * Kept out of the scene data so the thresholds are stated once, in one place,
 * rather than being repeated inline across a dozen available() callbacks
 * where they'd inevitably drift apart.
 */
var Temple = {

	/* Karma at or above this and the monks acknowledge you at all. The player
	 * starts on -10, so this is not a threshold anybody drifts across by
	 * accident -- reaching it means a run's worth of deliberately decent
	 * choices. Below it the temple is a place that happens near you. */
	WELCOME_KARMA: 10,

	/* A second, higher bar for being told what they actually see. The answer
	 * is the closest the game comes to telling the player who they are, so it
	 * costs more than merely being let in. */
	PERCEIVED_KARMA: 20,

	/* Charity threshold and cap. Below SUPPLY_FLOOR of either, the monks top
	 * you up TO SUPPLY_FLOOR -- not to full. They give what is needed, not
	 * what is wanted, which is the same distinction the blessing scene makes. */
	SUPPLY_FLOOR: 10,

	/* Donation: costs DONATION each of food and water, and is only offered if
	 * the player holds at least DONATION_REQUIRED of both. The gap between
	 * the two is what makes it a donation rather than a transaction -- you
	 * have to be able to spare it, not merely to cover it. */
	DONATION: 10,
	DONATION_REQUIRED: 20,
	DONATION_KARMA: 2,

	karma: function() {
		return $SM.get('character.karma', true);
	},

	isWelcome: function() {
		return Temple.karma() >= Temple.WELCOME_KARMA;
	},

	isPerceived: function() {
		return Temple.karma() >= Temple.PERCEIVED_KARMA;
	},

	/* Food lives in the expedition pack; water is its own World counter. */
	getFood: function() {
		return (Path.outfit && typeof Path.outfit['cured meat'] === 'number') ?
			Path.outfit['cured meat'] : 0;
	},

	getWater: function() {
		return typeof World.water === 'number' ? World.water : 0;
	},

	needsSupplies: function() {
		return Temple.getFood() < Temple.SUPPLY_FLOOR ||
			Temple.getWater() < Temple.SUPPLY_FLOOR;
	},

	/* Tops each up to SUPPLY_FLOOR without ever reducing a player who already
	 * has more than that, and without exceeding the waterskin's capacity --
	 * World.setWater clamps to getMaxWater(), but doing the max() here too
	 * means a player with a small skin isn't shown a gift that silently
	 * evaporates. */
	giveSupplies: function() {
		var food = Temple.getFood();
		if(food < Temple.SUPPLY_FLOOR) {
			Path.outfit['cured meat'] = Temple.SUPPLY_FLOOR;
		}
		var water = Temple.getWater();
		if(water < Temple.SUPPLY_FLOOR) {
			World.setWater(Math.min(Temple.SUPPLY_FLOOR, World.getMaxWater()));
		}
		World.updateSupplies();
	},

	canDonate: function() {
		return Temple.getFood() >= Temple.DONATION_REQUIRED &&
			Temple.getWater() >= Temple.DONATION_REQUIRED;
	},

	donate: function() {
		if(!Temple.canDonate()) {
			return false;
		}
		Path.outfit['cured meat'] = Temple.getFood() - Temple.DONATION;
		World.setWater(Temple.getWater() - Temple.DONATION);
		World.updateSupplies();
		$SM.add('character.karma', Temple.DONATION_KARMA);
		return true;
	},

	isBarred: function() {
		return $SM.get('game.temple.barred') === true;
	},

	/* Permanent, and the only permanent lockout in the game. There is exactly
	 * one temple per world (World.LANDMARKS TEMPLE num: 1) and nothing clears
	 * this flag, including on a later visit -- which is the point. */
	bar: function() {
		$SM.set('game.temple.barred', true);
		/* Mark the tile spent only now. The temple is revisitable by design
		 * (see the note on its start scene) precisely so a player's karma at
		 * the time of their FIRST visit doesn't decide their reception
		 * forever -- but once the doors are barred there is nothing left to
		 * come back for, so the map should stop advertising it.
		 *
		 * Guarded because bar() is reachable from a scene, and a scene can in
		 * principle be loaded outside a live world (tests, or any future
		 * non-world entry point) where curPos/state don't exist. */
		if(typeof World !== 'undefined' && World.state && World.curPos) {
			var tile = World.state.map[World.curPos[0]][World.curPos[1]];
			if(tile && tile.indexOf('!') === -1) {
				World.markVisited(World.curPos[0], World.curPos[1]);
				World.drawMap();
			}
		}
	}
};
