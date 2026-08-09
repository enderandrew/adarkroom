var Prestige = {
		
	name: 'Prestige',

	options: {},

	init: function(options) {
		this.options = $.extend(this.options, options);
	},
	
	/* Each entry carries its own score value.
	 *
	 * This used to be a bare list here plus a parallel `factor` array over in
	 * scoring.js, matched only by index. Adding an item to this list without
	 * inserting a matching factor silently shifted every value after it, so
	 * `value` now lives on the entry itself and cannot drift.
	 *
	 * ORDER IS SAVE FORMAT. `previous.stores` is a plain array indexed by
	 * position in this list, so items may be appended but never reordered or
	 * removed without a save migration.
	 *
	 * type controls prestige carry-over: 'g'oods, 'w'eapons, 'a'mmo.
	 */
	storesMap: [
		{ store: 'wood',          type: 'g', value: 1 },
		{ store: 'fur',           type: 'g', value: 1.5 },
		{ store: 'meat',          type: 'g', value: 1 },
		{ store: 'iron',          type: 'g', value: 2 },
		{ store: 'coal',          type: 'g', value: 2 },
		{ store: 'sulphur',       type: 'g', value: 3 },
		{ store: 'steel',         type: 'g', value: 3 },
		{ store: 'cured meat',    type: 'g', value: 2 },
		{ store: 'scales',        type: 'g', value: 2 },
		{ store: 'teeth',         type: 'g', value: 2 },
		{ store: 'leather',       type: 'g', value: 2 },
		{ store: 'bait',          type: 'g', value: 1.5 },
		{ store: 'torch',         type: 'g', value: 1 },
		{ store: 'cloth',         type: 'g', value: 1 },
		{ store: 'bone spear',    type: 'w', value: 10 },
		{ store: 'iron sword',    type: 'w', value: 30 },
		{ store: 'steel sword',   type: 'w', value: 50 },
		{ store: 'katana',        type: 'w', value: 75 },
		{ store: 'energy blade',  type: 'w', value: 200 },
		{ store: 'bayonet',       type: 'w', value: 100 },
		{ store: 'rifle',         type: 'w', value: 150 },
		{ store: 'laser rifle',   type: 'w', value: 150 },
		{ store: 'plasma rifle',  type: 'w', value: 200 },
		{ store: 'disruptor',     type: 'w', value: 100 },
		{ store: 'bullets',       type: 'a', value: 3 },
		{ store: 'energy cell',   type: 'a', value: 3 },
		{ store: 'grenade',       type: 'a', value: 5 },
		{ store: 'handheld nuke', type: 'a', value: 25 },
		{ store: 'bolas',         type: 'a', value: 4 }
	],
	
	getStores: function(reduce) {
		var stores = [];
		
		for(var i in this.storesMap) {
			var s = this.storesMap[i];
			stores.push(Math.floor($SM.get('stores["' + s.store + '"]', true) / 
					(reduce ? this.randGen(s.type) : 1)));
		}
		
		return stores;
	},
	
	get: function() {
		return {
			stores: $SM.get('previous.stores'),
			score: $SM.get('previous.score')
		};
	},
	
	set: function(prestige) {
		$SM.set('previous.stores', prestige.stores);
		$SM.set('previous.score', prestige.score);
	},
	
	/* True once the player has finished a run at least once.
	 *
	 * previous.score is written by Prestige.save() at the ending and is NOT
	 * cleared by collectStores() (which only empties previous.stores) or by
	 * Engine.deleteSave (which deliberately preserves prestige), so it is the
	 * durable marker for "this has happened before" across the whole cycle. */
	hasCompletedRun: function() {
		return typeof $SM.get('previous.score') === 'number';
	},

	save: function() {
		$SM.set('previous.stores', this.getStores(true));
		$SM.set('previous.score', Score.totalScore());
	},
  
	collectStores : function() {
		var prevStores = $SM.get('previous.stores');
		if(prevStores != null) {
			var toAdd = {};
			for(var i = 0; i < this.storesMap.length; i++) {
				var amount = prevStores[i];
				/* A save written before an item was appended to storesMap has a
				 * shorter array, so guard rather than handing undefined to
				 * $SM.add. Skipping zeroes also stops empty rows appearing in
				 * the player's stores for things they never had. */
				if(typeof amount === 'number' && amount > 0) {
					toAdd[this.storesMap[i].store] = amount;
				}
			}
			$SM.addM('stores', toAdd);

			// Loading the stores clears em from the save
			prevStores.length = 0;
			$SM.set('previous.stores', prevStores);
		}
	},

	randGen : function(storeType) {
		var amount;
		switch(storeType) {
		case 'g':
			amount = Math.floor(Math.random() * 10);
			break;
		case 'w':
			amount = Math.floor(Math.floor(Math.random() * 10) / 2);
			break;
		case 'a':
			amount = Math.ceil(Math.random() * 10 * Math.ceil(Math.random() * 10));
			break;
		default:
			return 1;
		}
		if (amount !== 0) {
			return amount;
		}
		return 1;
	}

};
