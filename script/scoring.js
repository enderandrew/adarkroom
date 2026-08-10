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

		/* Buildings score but never carry over -- see the comment on
		 * Prestige.buildingsMap. Reads game.buildings directly rather than
		 * through Prestige.getStores(), which only ever looks at `stores`. */
		for(var j = 0; j < Prestige.buildingsMap.length; j++) {
			var b = Prestige.buildingsMap[j];
			fullScore += $SM.get('game.buildings["' + b.building + '"]', true) * b.value;
		}

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
