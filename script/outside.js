 /**
 * Module that registers the outdoors functionality
 */
var Outside = {
	name: _("Outside"),
	
	_STORES_OFFSET: 0,
	_GATHER_DELAY: 60,
	_TRAPS_DELAY: 90,
	_POP_DELAY: [0.5, 3],
	_HUT_ROOM: 4,
	
	_INCOME: {
		'gatherer': {
			name: _('gatherer'),
			delay: 10,
			stores: {
				'wood': 1
			}
		},
		'hunter': {
			name: _('hunter'),
			delay: 10,
			stores: {
				'fur': 0.5,
				'meat': 0.5
			}
		},
		'trapper': {
			name: _('trapper'),
			delay: 10,
			stores: {
				'meat': -1,
				'bait': 1
			}
		},
		'tanner': {
			name: _('tanner'),
			delay: 10,
			stores: {
				'fur': -5,
				'leather': 1
			}
		},
		'charcutier': {
			name: _('charcutier'),
			delay: 10,
			stores: {
				'meat': -5,
				'wood': -5,
				'cured meat': 1
			}
		},
		'iron miner': {
			name: _('iron miner'),
			delay: 10,
			stores: {
				'cured meat': -1,
				'iron': 1
			}
		},
		'coal miner': {
			name: _('coal miner'),
			delay: 10,
			stores: {
				'cured meat': -1,
				'coal': 1
			}
		},
		'sulphur miner': {
			name: _('sulphur miner'),
			delay: 10,
			stores: {
				'cured meat': -1,
				'sulphur': 1
			}
		},
		'steelworker': {
			name: _('steelworker'),
			delay: 10,
			stores: {
				'iron': -1,
				'coal': -1,
				'steel': 1
			}
		},
		'armourer': {
			name: _('armourer'),
			delay: 10,
			stores: {
				'steel': -1,
				'sulphur': -1,
				'bullets': 1
			}
		}
	},
	
	TrapDrops: [
		{
			rollUnder: 0.5,
			name: 'fur',
			message: _('scraps of fur')
		},
		{
			rollUnder: 0.75,
			name: 'meat',
			message: _('bits of meat')
		},
		{
			rollUnder: 0.85,
			name: 'scales',
			message: _('strange scales')
		},
		{
			rollUnder: 0.93,
			name: 'teeth',
			message: _('scattered teeth')
		},
		{
			rollUnder: 0.995,
			name: 'cloth',
			message: _('tattered cloth')
		},
		{
			rollUnder: 1.0,
			name: 'charm',
			message: _('a crudely made charm')
		}
	],
	
	UTrapDrops: [
		{
			rollUnder: 0.5,
			name: 'iron',
			message: _('scraps of iron')
		},
		{
			rollUnder: 0.75,
			name: 'coal',
			message: _('chunks of coal')
		},
		{
			rollUnder: 0.85,
			name: 'scales',
			message: _('lots of strange scales')
		},
		{
			rollUnder: 0.93,
			name: 'teeth',
			message: _('tons of scattered teeth')
		},
		{
			rollUnder: 0.995,
			name: 'sulphur',
			message: _('bad smelling sulphur')
		},
		{
			rollUnder: 0.776,
			name: 'charm',
			message: _('a crudely made charm')
		}
	],
	init: function(options) {
		this.options = $.extend(
			this.options,
			options
		);
		
		if(Engine._debug) {
			this._GATHER_DELAY = 0;
			this._TRAPS_DELAY = 0;
		}
		
		// Create the outside tab
		this.tab = Header.addLocation(_("A Silent Forest"), "outside", Outside);
		
		// Create the Outside panel
		this.panel = $('<div>').attr('id', "outsidePanel")
			.addClass('location')
			.appendTo('div#locationSlider');
		
		//subscribe to stateUpdates
		$.Dispatch('stateUpdate').subscribe(Outside.handleStateUpdates);
		
		if(typeof $SM.get('features.location.outside') == 'undefined') {
			$SM.set('features.location.outside', true);
			if(!$SM.get('game.buildings')) $SM.set('game.buildings', {});
			if(!$SM.get('game.population')) $SM.set('game.population', 0);
			if(!$SM.get('game.workers')) $SM.set('game.workers', {});
		}
		
		this.updateVillage();
		Outside.updateWorkersView();
		Outside.updateVillageIncome();
		
		Engine.updateSlider();
		
		// Create the gather button
		new Button.Button({
			id: 'gatherButton',
			text: _("gather wood"),
			click: Outside.gatherWood,
			cooldown: Outside._GATHER_DELAY,
			width: '80px'
		}).appendTo('div#outsidePanel');

		Outside.updateTrapButton();
		if($SM.get('game.buildings["utrap"]', true) > 0)
		{
			new Button.Button({
				id: 'uTrapsButton',
				text: _("check uber traps"),
				click: Outside.checkUTraps,
				cooldown: Outside._TRAPS_DELAY,
				width: '80px'
			}).appendTo('div#outsidePanel');
		}
		Outside.updateUTrapButton();
		//if that function doesn't work, add the button forcefully
	},
	
	getMaxPopulation: function() {
		return $SM.get('game.buildings["hut"]', true) * Outside._HUT_ROOM;
	},
	
	increasePopulation: function() {
		var space = Outside.getMaxPopulation() - $SM.get('game.population');
		if(space > 0) {
			var num = Math.floor(Math.random()*(space/2) + space/2);
			if(num === 0) num = 1;
			if(num == 1) {
				Notifications.notify(null, _('a stranger arrives in the night'));
			} else if(num < 5) {
				Notifications.notify(null, _('a weathered family takes up in one of the huts.'));
			} else if(num < 10) {
				Notifications.notify(null, _('a small group arrives, all dust and bones.'));
			} else if(num < 30) {
				Notifications.notify(null, _('a convoy lurches in, equal parts worry and hope.'));
			} else {
				Notifications.notify(null, _("the town's booming. word does get around."));
			}
			Engine.log('population increased by ' + num);
			$SM.add('game.population', num);
		}
		Outside.schedulePopIncrease();
	},
	
	killVillagers: function(num) {
		$SM.add('game.population', num * -1);
		if($SM.get('game.population') < 0) {
			$SM.set('game.population', 0);
		}
		var remaining = Outside.getNumGatherers();
		if(remaining < 0) {
			var gap = -remaining;
			for(var k in $SM.get('game.workers')) {
				var numWorkers = $SM.get('game.workers["'+k+'"]');
				if(numWorkers < gap) {
					gap -= numWorkers;
					$SM.set('game.workers["'+k+'"]', 0);
				} else {
					$SM.add('game.workers["'+k+'"]', gap * -1);
					break;
				}
			}
		}
	},
	
	destroyHuts: function(num, allowEmpty) {
		var dead = 0;
		for(var i = 0; i < num; i++){
			var population = $SM.get('game.population', true);
			var rate = population / Outside._HUT_ROOM;
			var full = Math.floor(rate);
			// by default this is used to destroy full or half-full huts
			// pass allowEmpty to include empty huts in the armageddon
			var huts = (allowEmpty) ? $SM.get('game.buildings["hut"]', true) : Math.ceil(rate);
			if(!huts) {
				break;
			}
			// random can be 0 but not 1; however, 0 as a target is useless
			var target = Math.floor(Math.random() * huts) + 1;
			var inhabitants = 0;
			if(target <= full){
				inhabitants = Outside._HUT_ROOM;
			} else if(target == full + 1){
				inhabitants = population % Outside._HUT_ROOM;
			}
			$SM.set('game.buildings["hut"]', ($SM.get('game.buildings["hut"]') - 1));
			if(inhabitants){
				Outside.killVillagers(inhabitants);
				dead += inhabitants;
			}
		}
		// this method returns the total number of victims, for further actions
		return dead;
	},
	
	schedulePopIncrease: function() {
		var nextIncrease = Math.floor(Math.random()*(Outside._POP_DELAY[1] - Outside._POP_DELAY[0])) + Outside._POP_DELAY[0];
		Engine.log('next population increase scheduled in ' + nextIncrease + ' minutes');
		Outside._popTimeout = Engine.setTimeout(Outside.increasePopulation, nextIncrease * 60 * 1000);
	},
	
	updateWorkersView: function() {
		var workers = $('div#workers');

		// If our population is 0 and we don't already have a workers view,
		// there's nothing to do here.
		if(!workers.length && $SM.get('game.population') === 0) return;

		var needsAppend = false;
		if(workers.length === 0) {
			needsAppend = true;
			workers = $('<div>').attr('id', 'workers').css('opacity', 0);
		}
		
		var numGatherers = $SM.get('game.population');
		var gatherer = $('div#workers_row_gatherer', workers);
		
		for(var k in $SM.get('game.workers')) {
			var lk = _(k);
			var workerCount = $SM.get('game.workers["'+k+'"]');
			var row = $('div#workers_row_' + k.replace(' ', '-'), workers);
			if(row.length === 0) {
				row = Outside.makeWorkerRow(k, workerCount);
				
				var curPrev = null;
				workers.children().each(function(i) {
					var child = $(this);
					var cName = child.children('.row_key').text();
					if(cName != 'gatherer') {
						if(cName < lk) {
							curPrev = child.attr('id');
						}
					}
				});
				if(curPrev == null && gatherer.length === 0) {
					row.prependTo(workers);
				} else if(curPrev == null) {
					row.insertAfter(gatherer);
				} else {
					row.insertAfter(workers.find('#'+ curPrev));
				}
				
			} else {
				$('div#' + row.attr('id') + ' > div.row_val > span', workers).text(workerCount);
			}
			numGatherers -= workerCount;
			if(workerCount === 0) {
				$('.dnBtn', row).addClass('disabled');
				$('.dnManyBtn', row).addClass('disabled');
			} else {
				$('.dnBtn', row).removeClass('disabled');
				$('.dnManyBtn', row).removeClass('disabled');
			}
		}
		
		if(gatherer.length === 0) {
			gatherer = Outside.makeWorkerRow('gatherer', numGatherers);
			gatherer.prependTo(workers);
		} else {
			$('div#workers_row_gatherer > div.row_val > span', workers).text(numGatherers);
		}
		
		if(numGatherers === 0) {
			$('.upBtn', '#workers').addClass('disabled');
			$('.upManyBtn', '#workers').addClass('disabled');
		} else {
			$('.upBtn', '#workers').removeClass('disabled');
			$('.upManyBtn', '#workers').removeClass('disabled');
		}
		
		
		if(needsAppend && workers.children().length > 0) {
			workers.appendTo('#outsidePanel').animate({opacity:1}, 300, 'linear');
		}
	},
	
	getNumGatherers: function() {
		var num = $SM.get('game.population'); 
		for(var k in $SM.get('game.workers')) {
			num -= $SM.get('game.workers["'+k+'"]');
		}
		return num;
	},
	
	makeWorkerRow: function(key, num) {
		name = Outside._INCOME[key].name;
		if(!name) name = key;
		var row = $('<div>')
			.attr('key', key)
			.attr('id', 'workers_row_' + key.replace(' ','-'))
			.addClass('workerRow');
		$('<div>').addClass('row_key').text(name).appendTo(row);
		var val = $('<div>').addClass('row_val').appendTo(row);
		
		$('<span>').text(num).appendTo(val);
		
		if(key != 'gatherer') {
			$('<div>').addClass('upBtn').appendTo(val).click([1], Outside.increaseWorker);
			$('<div>').addClass('dnBtn').appendTo(val).click([1], Outside.decreaseWorker);
			$('<div>').addClass('upManyBtn').appendTo(val).click([10], Outside.increaseWorker);
			$('<div>').addClass('dnManyBtn').appendTo(val).click([10], Outside.decreaseWorker);
		}
		
		$('<div>').addClass('clear').appendTo(row);
		
		var tooltip = $('<div>').addClass('tooltip bottom right').appendTo(row);
		var income = Outside._INCOME[key];
		for(var s in income.stores) {
			var r = $('<div>').addClass('storeRow');
			$('<div>').addClass('row_key').text(_(s)).appendTo(r);
			$('<div>').addClass('row_val').text(Engine.getIncomeMsg(income.stores[s], income.delay)).appendTo(r);
			r.appendTo(tooltip);
		}
		
		return row;
	},
	
	increaseWorker: function(btn) {
		var worker = $(this).closest('.workerRow').attr('key');
		if(Outside.getNumGatherers() > 0) {
			var increaseAmt = Math.min(Outside.getNumGatherers(), btn.data);
			Engine.log('increasing ' + worker + ' by ' + increaseAmt);
			$SM.add('game.workers["'+worker+'"]', increaseAmt);
		}
		// $SM.set('game.workers', btn.data + 1);
	},
	
	decreaseWorker: function(btn) {
		var worker = $(this).closest('.workerRow').attr('key');
		if($SM.get('game.workers["'+worker+'"]') > 0) {
			var decreaseAmt = Math.min($SM.get('game.workers["'+worker+'"]') || 0, btn.data);
			Engine.log('decreasing ' + worker + ' by ' + decreaseAmt);
			$SM.add('game.workers["'+worker+'"]', decreaseAmt * -1);
		}
		// $SM.set('game.workers', btn.data - 1);
	},
	
	updateVillageRow: function(name, num, village) {
		var id = 'building_row_' + name.replace(' ', '-');
		var lname = _(name);
		var row = $('div#' + id, village);
		if(row.length === 0 && num > 0) {
			row = $('<div>').attr('id', id).addClass('storeRow');
			$('<div>').addClass('row_key').text(lname).appendTo(row);
			$('<div>').addClass('row_val').text(num).appendTo(row);
			$('<div>').addClass('clear').appendTo(row);
			var curPrev = null;
			village.children().each(function(i) {
				var child = $(this);
				if(child.attr('id') != 'population') {
					var cName = child.children('.row_key').text();
					if(cName < lname) {
						curPrev = child.attr('id');
					}
				}
			});
			if(curPrev == null) {
				row.prependTo(village);
			} else {
				row.insertAfter('#' + curPrev);
			}
		} else if(num > 0) {
			$('div#' + row.attr('id') + ' > div.row_val', village).text(num);
		} else if(num === 0) {
			row.remove();
		}
	},
	
	updateVillage: function(ignoreStores) {
		var village = $('div#village');
		var population = $('div#population');
		var needsAppend = false;
		if(village.length === 0) {
			needsAppend = true;
			village = $('<div>').attr('id', 'village').css('opacity', 0);
			population = $('<div>').attr('id', 'population').appendTo(village);
		}
		
		for(var k in $SM.get('game.buildings')) {
			if(k == 'trap' || k == 'utrap') {
				var numTraps = $SM.get('game.buildings["'+k+'"]');
				var numBait = $SM.get('stores.bait', true);
				var traps = numTraps - numBait;
				traps = traps < 0 ? 0 : traps;
				Outside.updateVillageRow(k, traps, village);
				Outside.updateVillageRow('baited '+k, numBait > numTraps ? numTraps : numBait, village);
			} else {
				if(Outside.checkWorker(k)) {
					Outside.updateWorkersView();
				}
				Outside.updateVillageRow(k, $SM.get('game.buildings["'+k+'"]'), village);
			}
		}
		/// TRANSLATORS : pop is short for population.
		population.text(_('pop ') + $SM.get('game.population') + '/' + this.getMaxPopulation());
		
		var hasPeeps;
		if($SM.get('game.buildings["hut"]', true) === 0) {
			hasPeeps = false;
			village.attr('data-legend', _('forest'));
		} else {
			hasPeeps = true;
			village.attr('data-legend', _('village'));
		}
		
		if(needsAppend && village.children().length > 1) {
			village.prependTo('#outsidePanel');
			village.animate({opacity:1}, 300, 'linear');
		}
		
		if(hasPeeps && typeof Outside._popTimeout == 'undefined') {
			Outside.schedulePopIncrease();
		}
		
		this.setTitle();

		if(!ignoreStores && Engine.activeModule === Outside && village.children().length > 1) {
			$('#storesContainer').css({top: village.height() + 26 + Outside._STORES_OFFSET + 'px'});
		}
	},
	
	checkWorker: function(name) {
		var jobMap = {
			'lodge': ['hunter', 'trapper'],
			'tannery': ['tanner'],
			'smokehouse': ['charcutier'],
			'iron mine': ['iron miner'],
			'coal mine': ['coal miner'],
			'sulphur mine': ['sulphur miner'],
			'steelworks': ['steelworker'],
			'armoury' : ['armourer']
		};
		
		var jobs = jobMap[name];
		var added = false;
		if(typeof jobs == 'object') {
			for(var i = 0, len = jobs.length; i < len; i++) {
				var job = jobs[i];
				if(typeof $SM.get('game.buildings["'+name+'"]') == 'number' && 
						typeof $SM.get('game.workers["'+job+'"]') != 'number') {
					Engine.log('adding ' + job + ' to the workers list');
					$SM.set('game.workers["'+job+'"]', 0);
					added = true;
				}
			}
		}
		return added;
	},
	
	updateVillageIncome: function() {		
		for(var worker in Outside._INCOME) {
			var income = Outside._INCOME[worker];
			var num = worker == 'gatherer' ? Outside.getNumGatherers() : $SM.get('game.workers["'+worker+'"]');
			if(typeof num == 'number') {
				var stores = {};
				if(num < 0) num = 0;
				var tooltip = $('.tooltip', 'div#workers_row_' + worker.replace(' ', '-'));
				tooltip.empty();
				var needsUpdate = false;
				var curIncome = $SM.getIncome(worker);
				for(var store in income.stores) {
					stores[store] = income.stores[store] * num;
					if(curIncome[store] != stores[store]) needsUpdate = true;
					var row = $('<div>').addClass('storeRow');
					$('<div>').addClass('row_key').text(_(store)).appendTo(row);
					$('<div>').addClass('row_val').text(Engine.getIncomeMsg(stores[store], income.delay)).appendTo(row);
					row.appendTo(tooltip);
				}
				if(needsUpdate) {
					$SM.setIncome(worker, {
						delay: income.delay,
						stores: stores
					});
				}
			}
		}
		Room.updateIncomeView();
	},
	
	updateTrapButton: function() {
		var btn = $('div#trapsButton');
		if($SM.get('game.buildings["trap"]', true) > 0) {
			if(btn.length === 0) {
				new Button.Button({
					id: 'trapsButton',
					text: _("check traps"),
					click: Outside.checkTraps,
					cooldown: Outside._TRAPS_DELAY,
					width: '80px'
				}).appendTo('div#outsidePanel');
			} else {
				Button.setDisabled(btn, false);
			}
		} else {
			if(btn.length > 0) {
				Button.setDisabled(btn, true);
			}
		}
	},
	
	updateUTrapButton: function() {
		var btn = $('div#uTrapsButton');
		if($SM.get('game.buildings["utrap"]', true) > 0) {
			if(btn.length === 0) {
				new Button.Button({
					id: 'uTrapsButton',
					text: _("check uber traps"),
					click: Outside.checkUTraps,
					cooldown: Outside._TRAPS_DELAY,
					width: '80px'
				}).appendTo('div#outsidePanel');
			} else {
				Button.setDisabled(btn, false);
			}
		} else {
			if(btn.length > 0) {
				Button.setDisabled(btn, true);
			}
		} 
	},

	setTitle: function() {
		var numHuts = $SM.get('game.buildings["hut"]', true);
		var title;
		if(numHuts === 0) {
			title = _("A Silent Forest");
		} else if(numHuts == 1) {
			title = _("A Lonely Hut");
		} else if(numHuts <= 4) {
			title = _("A Tiny Village");
		} else if(numHuts <= 8) {
			title = _("A Modest Village");
		} else if(numHuts <= 14) {
			title = _("A Large Village");
		} else if(numHuts <= 20){
			title = _("A Raucous Village");
		} else {
			title = _("A Large City");
		}
		
		if(Engine.activeModule == this) {
			document.title = title;
		}
		$('#location_outside').text(title);
	},
	
	onArrival: function(transition_diff) {
		Outside.setTitle();
		if(!$SM.get('game.outside.seenForest')) {
			Notifications.notify(Outside, _("the sky is grey and the wind blows relentlessly"));
			$SM.set('game.outside.seenForest', true);
		}
		Outside.updateTrapButton();
		Outside.updateUTrapButton();
		Outside.updateVillage(true);

		Engine.moveStoresView($('#village'), transition_diff);

		// set music
		var numberOfHuts = $SM.get('game.buildings["hut"]', true);
		if(numberOfHuts === 0) {
			AudioEngine.playBackgroundMusic(AudioLibrary.MUSIC_SILENT_FOREST);
		} else if(numberOfHuts == 1) {
			AudioEngine.playBackgroundMusic(AudioLibrary.MUSIC_LONELY_HUT);
		} else if(numberOfHuts <= 4) {
			AudioEngine.playBackgroundMusic(AudioLibrary.MUSIC_TINY_VILLAGE);
		} else if(numberOfHuts <= 8) {
			AudioEngine.playBackgroundMusic(AudioLibrary.MUSIC_MODEST_VILLAGE);
		} else if(numberOfHuts <= 14) {
			AudioEngine.playBackgroundMusic(AudioLibrary.MUSIC_LARGE_VILLAGE);
		} else {
			AudioEngine.playBackgroundMusic(AudioLibrary.MUSIC_RAUCOUS_VILLAGE);
		}
	},
	
	gatherWood: function() {
		var gatherAmt = $SM.get('game.buildings["cart"]', true) > 0 ? 50 : 10;
		$SM.add('stores.wood', gatherAmt);
		/* _() supports {0}-style positional args (see lib/translate.js) -- the
		 * amount was previously concatenated into the key before translation,
		 * so it could never match a translated string, and the missing space
		 * before the '+' rendered as "...forest floor+50 wood" in English too. */
		Notifications.notify(Outside, _('dry brush and dead branches litter the forest floor +{0} wood', gatherAmt));
		AudioEngine.playSound(AudioLibrary.GATHER_WOOD);
		if(!$SM.get('character.gather')) $SM.set('character.gather', 0);
		$SM.add('character.gather', 1);

		if($SM.get('character.gather') == 5) {
			Events.startEvent({
				title: _('builder`s gaze'),
				scenes: {
					start: {
						text: [_("noticing the builder staring is at you as if trying to figure something out.")],
						buttons: {
							'yes': {
								text: _('ok'),
								nextScene: 'end',
							}
						}
					}
				},
			});
		}
		if($SM.get('character.gather') == 10) {
			Events.startEvent({
				title: _('a concerned face'),
				scenes: {
					start: {
						text: [_("returning from the woods and surpising the builder, noticing a look of concern. she quickly puts a reassuring smile on her face.")],
						buttons: {
							'yes': {
								text: _('ok'),
								nextScene: 'end',
							}
						}
					}
				},
			});
		}
		if($SM.get('character.gather') == 15) {
			Events.startEvent({
				title: _('good to rebuild'),
				scenes: {
					start: {
						text: [_("the builder says it is good to rebuild, to make a safe haven among the wilds.")],
						buttons: {
							'yes': {
								text: _('ok'),
								nextScene: 'end',
							}
						}
					}
				},
			});
		}
		if($SM.get('character.gather') == 20) {
			Events.startEvent({
				title: _('nightmares'),
				scenes: {
					start: {
						text: [_("the builder is sleeping in the room. she is shaking slightly and mumbling. she is having a nightmare of sorts. screaming 'NO', she wakes herself from her nightmare. she won't speak about the dream.")],
						buttons: {
							'yes': {
								text: _('ok'),
								nextScene: 'end',
							}
						}
					}
				},
				audio: AudioLibrary.EVENT_NIGHTMARE
			});
		}
		if($SM.get('character.gather') == 30) {
			Events.startEvent({
				title: _('nightmares continue'),
				scenes: {
					start: {
						text: [_("the builder is having another nightmare. this one seems worse than the last. upon waking she still won't speak about the dream.")],
						buttons: {
							'yes': {
								text: _('ok'),
								nextScene: 'end',
							}
						}
					}
				},
				audio: AudioLibrary.EVENT_NIGHTMARE
			});
		}
		if($SM.get('character.gather') == 45) {
			Events.startEvent({
				title: _('nightmares continue'),
				scenes: {
					start: {
						text: [_("the builder shivers in her sleep even with the fire. the bracing cold cuts right to the bone. was it always this dark and this cold?")],
						buttons: {
							'yes': {
								text: _('ok'),
								nextScene: 'end',
							}
						}
					}
				},
				audio: AudioLibrary.EVENT_NIGHTMARE
			});
		}
		if($SM.get('character.gather') == 60) {
			Events.startEvent({
				title: _('nightmares worsen'),
				scenes: {
					start: {
						text: [_('the nightmares are back. they worsen. the nightmare has gripped her. she never speaks about what is happening in her nightmares.')],
						notification: _('the builder is trapped in an awful nightmare'),
						blink: true,
						buttons: {
							'wake her': {
								text: _('wake her'),
								nextScene: {1: 'wake'}
							},
							'wait and listen': {
								text: _('wait and listen'),
								nextScene: {1: 'ignore'}
							},
						}
					},
					'wake': {
						text: [
							_('the builder is grateful for being woken and escaping that awful dream.'),
							_('still not knowing what the nightmares are about.'),
							_('the builder can share when she wants to.')
						],
						onLoad: function() {
							$SM.add('character.karma', 1);
						},
						buttons: {
							'leave': {
								text: _('leave'),
								nextScene: 'end'
							}
						}
					},
					'ignore': {
						text: [
							_('sitting in silence, ignoring the builder`s suffering.'),
							_('she starts to speak. she is mumbling about a war. she shrieks about human blood on her hands and finally bolts upright and awake.'),
							_('she sees you there staring at her.')
						],
						onLoad: function() {
							$SM.add('character.karma', -1);
						},
						buttons: {
							'leave': {
								text: _('leave'),
								nextScene: 'end'
							}
						}
					}
				},
				audio: AudioLibrary.EVENT_NIGHTMARE
			});
		}
		if($SM.get('character.gather') == 75) {
			Events.startEvent({
				title: _('nightmares worsen'),
				scenes: {
					start: {
						text: [_('the nightmares are back. they continue to worsen. the nightmare has gripped her. she never speaks about what is happening in her nightmares.')],
						notification: _('the builder is trapped in an awful nightmare'),
						blink: true,
						buttons: {
							'wake her': {
								text: _('wake her'),
								nextScene: {1: 'wake'}
							},
							'wait and listen': {
								text: _('wait and listen'),
								nextScene: {1: 'ignore'}
							},
						}
					},
					'wake': {
						text: [
							_('the builder is grateful for being woken and escaping that awful dream.'),
							_('she hasn\'t completely escaped the dream. some of the terror remains in her face.'),
							_('she looks away from you.'),
						],
						onLoad: function() {
							$SM.add('character.karma', 1);
						},
						buttons: {
							'leave': {
								text: _('leave'),
								nextScene: 'end'
							}
						}
					},
					'ignore': {
						text: [
							_('siting in silence, ignoring the builder\'s suffering.'),
							_('she starts to speak. she is mumbling about a war. she screams that the exile doomed us all.'),
							_('she bolts upright and awake.'),
							_('she sees you there staring at her.'),
							_('she fails to hide her anger.'),
						],
						onLoad: function() {
							$SM.add('character.karma', -1);
						},
						buttons: {
							'leave': {
								text: _('leave'),
								nextScene: 'end'
							}
						}
					}
				},
				audio: AudioLibrary.EVENT_NIGHTMARE
			});
		}
		if($SM.get('character.gather') == 95) {
			Events.startEvent({
				title: _('night sky'),
				scenes: {
					start: {
						text: [_("the builder is awake late, looking up at the sky. perhaps she is avoiding sleep. she looks longingly at the stars.")],
						buttons: {
							'yes': {
								text: _('ok'),
								nextScene: 'end',
							}
						}
					}
				},
				audio: AudioLibrary.EVENT_SKY
			});
		}
		if($SM.get('character.gather') == 115) {
			Events.startEvent({
				title: _('empty skies'),
				scenes: {
					start: {
						text: [_("every once in a while the builder looks up to the sky, as if to see something. she seems disappointed to find an empty sky.")],
						buttons: {
							'ignore her': {
								text: _('ignore her'),
								nextScene: {1: 'ignore'}
							},
							'look up': {
								text: _('look up'),
								nextScene: {1: 'look'}
							},
						}
					},
					'ignore': {
						text: [
							_('she isn\'t very talkative and that is fine by you.'),
							_('there are better things to do.'),
						],
						onLoad: function() {
							$SM.add('character.karma', -1);
						},
						buttons: {
							'leave': {
								text: _('leave'),
								nextScene: 'end'
							}
						}
					},
					'look': {
						text: [
							_('at first it just seems to be a still sky. there is nothing to see.'),
							_('but then noticing the nothing.'),
							_('areas where there are no stars even though it hasn\'t been cloudy.'),
							_('is something blocking some of the stars tonight?'),
						],
						buttons: {
							'leave': {
								text: _('leave'),
								nextScene: 'end'
							}
						}
					},
				},
				audio: AudioLibrary.EVENT_SKY
			});
		}
		if($SM.get('character.gather') == 135) {
			Events.startEvent({
				title: _('relic from the past'),
				scenes: {
					start: {
						text: [_("joints stiffen with the cold wind. the builder limps slightly but tries to hide it. just an old war injury she says.")],
						buttons: {
							'scoff': {
								text: _('scoff at her weakness'),
								nextScene: {1: 'scoff'}
							},
							'ask': {
								text: _('ask about her injury'),
								nextScene: {1: 'ask'}
							},
						}
					},
					'scoff': {
						text: [
							_('weakness is a liabity, especially out here.'),
							_('making a note of her limits.'),
						],
						onLoad: function() {
							$SM.add('character.karma', -1);
						},
						buttons: {
							'leave': {
								text: _('leave'),
								nextScene: 'end'
							}
						}
					},
					'ask': {
						text: [
							_('she seems confused when you ask as if you should know.'),
							_('then she offers the assurance that some things should stay in the past'),
							_('even if they don\'t want to stay in the past'),
						],
						onLoad: function() {
							$SM.add('character.karma', 1);
						},
						buttons: {
							'leave': {
								text: _('leave'),
								nextScene: 'end'
							}
						}
					},
				},
				audio: AudioLibrary.EVENT_LIMP
			});
		}
		if($SM.get('character.gather') == 155) {
			Events.startEvent({
				title: _('things unsaid'),
				scenes: {
					start: {
						text: [_("the builder looks as if to say something. ")],
						buttons: {
							'ignore': {
								text: _('ignore her'),
								nextScene: {1: 'ignore'}
							},
							'ask': {
								text: _('ask what is on her mind.'),
								nextScene: {1: 'ask'}
							},
						}
					},
					'ignore': {
						text: [
							_('she should be direct and speak up or not speak at all.'),
						],
						onLoad: function() {
							$SM.add('character.karma', -1);
						},
						buttons: {
							'leave': {
								text: _('leave'),
								nextScene: 'end'
							}
						}
					},
					'ask': {
						text: [
							_('she says it is kind kind to ask, but some things are best left unsaid.'),
							_('her meloncholy mood departs for a moment.'),
							_('there is a smile, only half-forced.'),
						],
						onLoad: function() {
							$SM.add('character.karma', 1);
						},
						buttons: {
							'leave': {
								text: _('leave'),
								nextScene: 'end'
							}
						}
					},
				},
				audio: AudioLibrary.EVENT_HMM
			});
		}
		if($SM.get('character.gather') == 175) {
			Events.startEvent({
				title: _('no escape'),
				scenes: {
					start: {
						text: [_("the builder is having another nightmare. she can be heard mumbling in her nightmare. something about how there is no escape, not even in death.")],
						buttons: {
							'yes': {
								text: _('ok'),
								nextScene: 'end',
							}
						}
					}
				},
				audio: AudioLibrary.EVENT_NIGHTMARE
			});
		}
		if($SM.get('character.gather') == 195) {
			Events.startEvent({
				title: _('exile'),
				scenes: {
					start: {
						text: [_("rumors. gossip. people talk about a scourge upon the land, one hated by all that they call the exile.")],
						buttons: {
							'yes': {
								text: _('ok'),
								nextScene: 'end',
							}
						}
					}
				},
				audio: AudioLibrary.EVENT_SOLDIER_ATTACK
			});
		}
		if($SM.get('character.gather') == 205) {
			Events.startEvent({
				title: _('thoughts'),
				scenes: {
					start: {
						text: [_("the builder's voice is in the background, but she isn't speaking. somehow her thoughts can be heard.")],
						buttons: {
							'yes': {
								text: _('ok'),
								nextScene: 'end',
							}
						}
					}
				},
				audio: AudioLibrary.EVENT_HMM
			});
		}
		if($SM.get('character.gather') == 225) {
			Events.startEvent({
				title: _('no memory'),
				scenes: {
					start: {
						text: [_("your minds touch again. her memories are guarded but suddenly aware how few memories you have. unable to remember anything before this dark, cold room.")],
						buttons: {
							'yes': {
								text: _('ok'),
								nextScene: 'end',
							}
						}
					}
				},
				audio: AudioLibrary.EVENT_SKY
			});
		}
		if($SM.get('character.gather') == 245) {
			Events.startEvent({
				title: _('blood red sky'),
				scenes: {
					start: {
						text: [_("your minds touch again. she recalls a battle under a blood-red sky. somehow you know you where there but don't remember. did you choose not to remember or are you not meant to remember?")],
						buttons: {
							'yes': {
								text: _('ok'),
								nextScene: 'end',
							}
						}
					}
				},
				audio: AudioLibrary.EVENT_SOLDIER_ATTACK
			});
		}
		if($SM.get('character.gather') == 265) {
			Events.startEvent({
				title: _('the exile and the profane'),
				scenes: {
					start: {
						text: [_("an old human is telling tales. they say the world is this way because of the profane and the exile.")],
						buttons: {
							'yes': {
								text: _('ok'),
								nextScene: 'end',
							}
						}
					}
				},
				audio: AudioLibrary.EVENT_GUILT
			});
		}
		if($SM.get('character.gather') == 285) {
			Events.startEvent({
				title: _('a wanderer'),
				scenes: {
					start: {
						text: [_("a human is drawn in by the light and warmth of the fire. they look at you, point and call you wanderer.")],
						buttons: {
							'yes': {
								text: _('ok'),
								nextScene: 'end',
							}
						}
					}
				},
				audio: AudioLibrary.EVENT_MYSTERIOUS_WANDERER
			});
		}
		if($SM.get('character.gather') == 305) {
			Events.startEvent({
				title: _('other wanderers'),
				scenes: {
					start: {
						text: [_("your minds touch again. knowing there are other wanderers out there, though far fewer than before.")],
						buttons: {
							'yes': {
								text: _('ok'),
								nextScene: 'end',
							}
						}
					}
				},
				audio: AudioLibrary.EVENT_MYSTERIOUS_WANDERER
			});
		}
		if($SM.get('character.gather') == 325) {
			Events.startEvent({
				title: _('stars in the sky'),
				scenes: {
					start: {
						text: [_("your minds touch again. somehow both remembering stars in the deep, dark sky.")],
						buttons: {
							'yes': {
								text: _('ok'),
								nextScene: 'end',
							}
						}
					}
				},
				audio: AudioLibrary.SPACE
			});
		}
		if($SM.get('character.gather') == 345) {
			Events.startEvent({
				title: _('a pang'),
				scenes: {
					start: {
						text: [_("your minds touch again. feeling a pang. it isn't the usual constant hunger. it is a pang of guilt.")],
						buttons: {
							'yes': {
								text: _('ok'),
								nextScene: 'end',
							}
						}
					}
				},
				audio: AudioLibrary.EVENT_GUILT
			});
		}
		if($SM.get('character.gather') == 365) {
			Events.startEvent({
				title: _('a pang'),
				scenes: {
					start: {
						text: [_("seeing it in their eyes. some fear or resent you. but why?")],
						buttons: {
							'yes': {
								text: _('ok'),
								nextScene: 'end',
							}
						}
					}
				},
				audio: AudioLibrary.EVENT_GUILT
			});
		}
		if($SM.get('character.gather') == 385) {
			Events.startEvent({
				title: _('a pang'),
				scenes: {
					start: {
						text: [_("the builder once said there was no escape, not even in death. this place only has cold, hunger, anger and pain. escape is imperative. somehow.")],
						buttons: {
							'yes': {
								text: _('ok'),
								nextScene: 'end',
							}
						}
					}
				},
				audio: AudioLibrary.EVENT_GUILT
			});
		}
		if($SM.get('character.gather') == 405) {
			Events.startEvent({
				title: _('exiled'),
				scenes: {
					start: {
						text: [_("is escape possible? somehow the land becomes even more bleak and unforgiving moving further from the fire. is this place some sort of exile?")],
						buttons: {
							'yes': {
								text: _('ok'),
								nextScene: 'end',
							}
						}
					}
				},
				audio: AudioLibrary.EVENT_GUILT
			});
		}
		if($SM.get('character.gather') == 425) {
			Events.startEvent({
				title: _('the call'),
				scenes: {
					start: {
						text: [_("each step into the bracing cold wilds is difficult, and yet somehow there is a calling impossibly far away from here. perhaps even to the stars.")],
						buttons: {
							'yes': {
								text: _('ok'),
								nextScene: 'end',
							}
						}
					}
				},
				audio: AudioLibrary.EVENT_SPACE
			});
		}
		if($SM.get('character.gather') == 445) {
			Events.startEvent({
				title: _('the call'),
				scenes: {
					start: {
						text: [_("everyone seems lost here, cold, hungry and alone. at least you can return to your fire. no one deserves to live like this.")],
						buttons: {
							'yes': {
								text: _('ok'),
								nextScene: 'end',
							}
						}
					}
				},
				audio: AudioLibrary.EVENT_GUILT
			});
		}
		if($SM.get('character.gather') == 465) {
			Events.startEvent({
				title: _('the call'),
				scenes: {
					start: {
						text: [_("memories seems as distant and as impossible to reach as those stars. have you been this way before?")],
						buttons: {
							'yes': {
								text: _('ok'),
								nextScene: 'end',
							}
						}
					}
				},
				audio: AudioLibrary.EVENT_GUILT
			});
		}
		if($SM.get('character.gather') == 485) {
			Events.startEvent({
				title: _('the call'),
				scenes: {
					start: {
						text: [_("in the distance soldiers battle over wars long past, some with spears and some with guns. they are unable to let go.")],
						buttons: {
							'yes': {
								text: _('ok'),
								nextScene: 'end',
							}
						}
					}
				},
				audio: AudioLibrary.EVENT_SOLDIER_ATTACK
			});
		}
		if($SM.get('character.gather') == 505) {
			Events.startEvent({
				title: _('arms'),
				scenes: {
					start: {
						text: [_("scavening wanderers pick over the bodies on an old battlefield. a wanderer finds a dead human in shining armor. they are disappointed they can't use the armor because it only has two arms.")],
						buttons: {
							'yes': {
								text: _('ok'),
								nextScene: 'end',
							}
						}
					}
				},
				audio: AudioLibrary.EVENT_HMM
			});
		}
		if($SM.get('character.gather') == 525) {
			Events.startEvent({
				title: _('her amulet'),
				scenes: {
					start: {
						text: [_("the builder reaches for something around her neck, but nothing is there. she says she forgot that amulet was only there in a former life.")], // reference to the mobile version of A Dark Room
						buttons: {
							'yes': {
								text: _('ok'),
								nextScene: 'end',
							}
						}
					}
				},
				audio: AudioLibrary.EVENT_HMM
			});
		}
		if($SM.get('character.gather') == 545) {
			Events.startEvent({
				title: _('wanderer empire'),
				scenes: {
					start: {
						text: [_("a journal on the battlefield next to a dead wanderer speaks of a wanderer empire that stretches across the stars. they had unique powers.")],
						buttons: {
							'yes': {
								text: _('ok'),
								nextScene: 'end',
							}
						}
					}
				},
				audio: AudioLibrary.EVENT_SPACE
			});
		}
		if($SM.get('character.gather') == 565) {
			Events.startEvent({
				title: _('neverending'),
				scenes: {
					start: {
						text: [_("the builder says many empires have come and gone. more will come in time. should a punishment outlive the empire itself?")],
						buttons: {
							'yes': {
								text: _('ok'),
								nextScene: 'end',
							}
						}
					}
				},
				audio: AudioLibrary.EVENT_GUILT
			});
		}
		if($SM.get('character.gather') == 585) {
			Events.startEvent({
				title: _('neverending'),
				scenes: {
					start: {
						text: [_("what is this room? what is this fire?")],
						buttons: {
							'yes': {
								text: _('ok'),
								nextScene: 'end',
							}
						}
					}
				},
				audio: AudioLibrary.EVENT_GUILT
			});
		}
		if($SM.get('character.gather') == 605) {
			Events.startEvent({
				title: _('neverending'),
				scenes: {
					start: {
						text: [_("will this fire die out if you manage to escape?")],
						buttons: {
							'yes': {
								text: _('ok'),
								nextScene: 'end',
							}
						}
					}
				},
				audio: AudioLibrary.EVENT_GUILT
			});
		}
		if($SM.get('character.gather') == 625) {
			Events.startEvent({
				title: _('neverending'),
				scenes: {
					start: {
						text: [_("this room does not matter. this fire does not matter. escape is all that matters.")],
						buttons: {
							'yes': {
								text: _('ok'),
								nextScene: 'end',
							}
						}
					}
				},
				audio: AudioLibrary.EVENT_HMM
			});
		}
	},
	
	checkTraps: function() {
		var drops = {};
		var msg = [];
		var numTraps = $SM.get('game.buildings["trap"]', true);
		var numBait = $SM.get('stores.bait', true);
		var numDrops = numTraps + (numBait < numTraps ? numBait : numTraps);
		for(var i = 0; i < numDrops; i++) {
			var roll = Math.random();
			for(var j in Outside.TrapDrops) {
				var drop = Outside.TrapDrops[j];
				if(roll < drop.rollUnder) {
					var num = drops[drop.name];
					if(typeof num == 'undefined') {
						num = 0;
						msg.push(drop.message);
					}
					drops[drop.name] = num + 1;
					break;
				}
			}
		}
		var whatObject = 0;
		/* numOfObjects used to be assigned with no declaration inside this
		 * closure, making it an implicit global (window.numOfObjects) shared
		 * with the identical function in checkUTraps below. Returning the
		 * value instead removes the shared global entirely. */
		function getItemNumeration(){
			var key = Object.keys(drops)[whatObject];
			whatObject++;
			return drops[key];
		}
		/* {0}/{1}-style positional args (lib/translate.js) let a translation
		 * reorder the sentence around the numbers. The previous concatenated
		 * form baked the numbers into the lookup key, so it could never match
		 * a translated string in any locale, including English. */
		/// TRANSLATORS: {0} is the trap count, {1} is how many of the first item. Mind the whitespace at the end.
		var numOfObjects = getItemNumeration();
		var s = _('{0} traps contain {1} ', numTraps, numOfObjects);
		for(var l = 0, len = msg.length; l < len; l++) {
			if(len > 1 && l > 0 && l < len - 1) {
				numOfObjects = getItemNumeration();
				s += _(', {0} ', numOfObjects);
			} else if(len > 1 && l == len - 1) {
				numOfObjects = getItemNumeration();
				/// TRANSLATORS: Mind the whitespaces at the beginning and end.
				s += _(' and {0} ', numOfObjects);
			}
			s += msg[l];
		}

		var baitUsed = numBait < numTraps ? numBait : numTraps;
		drops['bait'] = -baitUsed;

		Notifications.notify(Outside, s);
		$SM.addM('stores', drops);
		AudioEngine.playSound(AudioLibrary.CHECK_TRAPS);
	},

	checkUTraps: function(){
		var drops = {};
		var msg = [];
		var numTraps = $SM.get('game.buildings["utrap"]', true);
		var numBait = $SM.get('stores.bait', true);
		var numDrops = numTraps + (numBait < numTraps ? numBait*3 : numTraps*2);
		for(var i = 0; i < numDrops; i++) {
			var roll = Math.random();
			for(var j in Outside.UTrapDrops) {
				var drop = Outside.UTrapDrops[j];
				if(roll < drop.rollUnder) {
					var num = drops[drop.name];
					if(typeof num == 'undefined') {
						num = 0;
						msg.push(drop.message);
					}
					drops[drop.name] = num + 1;
					break;
				}
			}
		}
		var whatObject = 0;
		function getItemNumeration(){
			var key = Object.keys(drops)[whatObject];
			whatObject++;
			return drops[key];
		}
		/// TRANSLATORS: {0} is the trap count, {1} is how many of the first item. Mind the whitespace at the end.
		var numOfObjects = getItemNumeration();
		var s = _('{0} uber traps contain {1} ', numTraps, numOfObjects);
		for(var l = 0, len = msg.length; l < len; l++) {
			if(len > 1 && l > 0 && l < len - 1) {
				numOfObjects = getItemNumeration();
				s += _(', {0} ', numOfObjects);
			} else if(len > 1 && l == len - 1) {
				numOfObjects = getItemNumeration();
				/// TRANSLATORS: Mind the whitespaces at the beginning and end.
				s += _(' and {0} ', numOfObjects);
			}
			s += msg[l];
		}

		var baitUsed = numBait < numTraps ? numBait : numTraps;
		drops['bait'] = -baitUsed;

		Notifications.notify(Outside, s);
		$SM.addM('stores', drops);
		AudioEngine.playSound(AudioLibrary.CHECK_TRAPS);
	},

	handleStateUpdates: function(e){
		if(e.category == 'stores'){
			Outside.updateVillage();
		} else if(e.stateName.indexOf('game.workers') === 0 || e.stateName.indexOf('game.population') === 0){
			Outside.updateVillage();
			Outside.updateWorkersView();
			Outside.updateVillageIncome();
		}
	},

	scrollSidebar: function(direction, reset) {

		if( typeof reset != "undefined" ){
			$('#village').css('top', '0px');
			$('#storesContainer').css('top', '224px');
			Outside._STORES_OFFSET = 0;
			return false;
		}

		var momentum = 10;
		
		// If they hit up, we scroll everything down
		if( direction == 'up' )
			momentum = momentum * -1;

		/* Let's stop scrolling if the top or bottom bound is in the viewport, based on direction */
		if( direction == 'down' && inView( direction, $('#village') ) ){

			return false;

		}else if( direction == 'up' && inView( direction, $('#storesContainer') ) ){

			return false;

		}
		
		scrollByX( $('#village'), momentum );
		scrollByX( $('#storesContainer'), momentum );
		Outside._STORES_OFFSET += momentum;

	}
};
