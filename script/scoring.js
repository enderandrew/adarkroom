var Score = {

	name : 'Score',

	options : {},

	init : function(options) {
		this.options = $.extend(this.options, options);
	},

	calculateScore : function() {
		var counts = Prestige.getStores(false);
		var fullScore = 0;

		/* Values live on Prestige.storesMap so this can't fall out of step with
		 * the store list. Items not in that list are scored explicitly below. */
		for(var i = 0; i < Prestige.storesMap.length; i++) {
			fullScore += counts[i] * Prestige.storesMap[i].value;
		}

		fullScore = fullScore + $SM.get('stores["alien alloy"]', true) * 10;
		fullScore = fullScore + $SM.get('stores["fleet beacon"]', true) * 500;
		/* getMaxHull() returns undefined when no ship has been found yet, and
		 * undefined * 50 poisons the whole total to NaN. Only reachable if
		 * scoring ever moves off the ending screens, but cheap to guard. */
		fullScore = fullScore + (Ship.getMaxHull() || 0) * 50;
		return Math.floor(fullScore);
	},

	save: function() {
		$SM.set('playStats.score', Score.calculateScore());
	},

	totalScore : function() {
		return $SM.get('previous.score', true) + Score.calculateScore();
	}
};
