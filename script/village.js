/**
 * Village threats.
 *
 * ============================================================================
 * THE EXPLOIT THIS FIXES
 * ============================================================================
 *
 * Every event in Events.Outside gated itself on
 * `Engine.activeModule == Outside`. The event timer runs globally, but when
 * it fired the availability filter excluded every village threat unless the
 * player happened to be looking at the village at that moment.
 *
 * So a player who idled on the Room screen, or spent their time out on the
 * world map, was simply never raided, never burned, never plagued. Villagers
 * only died if you watched them. That is not a difficulty setting anybody
 * chose -- it is an accident of where the camera was pointing, and it made
 * the whole village-defence layer (and now the automated turret) close to
 * decorative.
 *
 * Threats now fire from the Room as well, framed as news arriving rather than
 * something witnessed. They still do NOT fire from the world map: the player
 * is days away, the event would resolve without them, and a raid you find out
 * about in a notification while standing in a swamp is worse than one you
 * come home to. World.goHome already exists as the place that could report
 * that later if it's ever wanted.
 *
 * ============================================================================
 * RELEVANCE GATING
 * ============================================================================
 *
 * `hasVillage()` is the floor for anything that kills villagers. On a
 * solitary run the population is permanently zero, so those events can never
 * be relevant -- and a hutless player gets their own threats instead (see
 * Events.Room additions), because "nothing can ever happen to you at home" is
 * the same failure in the other direction.
 */
var Village = {

	/* Events that hurt villagers may only fire when there are villagers.
	 * Deliberately reads population rather than hut count: a player whose
	 * village has just been wiped out should not immediately be raided
	 * again for zero casualties. */
	hasVillage: function() {
		return $SM.get('game.population', true) > 0;
	},

	/* Where a village threat is allowed to reach the player.
	 *
	 * Room and Outside both count. The Room is the fix -- news reaches you
	 * by the fire. Path and World do not: the player is days from home and
	 * cannot act on it, and Space obviously not. */
	canReachPlayer: function() {
		return Engine.activeModule === Room || Engine.activeModule === Outside;
	},

	/* The standard gate for a village-threatening event. */
	threatAvailable: function() {
		return Village.canReachPlayer() && Village.hasVillage();
	},

	/* True when the player is not currently looking at the village, so the
	 * scene can open with somebody bringing word instead of describing
	 * something the player would have seen happen. */
	isRemote: function() {
		return Engine.activeModule !== Outside;
	},

	/* Prefixes a threat's text with the news arriving, when the player is
	 * indoors. Takes and returns the array the scene would otherwise show,
	 * so wiring an existing event up is one call. */
	frame: function(lines) {
		if(!Village.isRemote()) { return lines; }
		return [Village.arrivalLine()].concat(lines);
	},

	ARRIVALS: [
		function() { return _('somebody is at the door, out of breath, and does not knock first.'); },
		function() { return _('the noise from outside changes before anybody comes to tell you what it is.'); },
		function() { return _('the builder puts down what she is holding and goes to the door before you have heard anything.'); },
		function() { return _('word comes in from the {0} before the sound does.', Outside.villagerNoun()); }
	],

	arrivalLine: function() {
		return Events.pick(Village.ARRIVALS)();
	},

	/* ---- fire, on a run with no village to burn ------------------------
	 *
	 * The original Fire event needs a hut to destroy and villagers to kill;
	 * neither exists on a solitary run, so it was simply unreachable there.
	 * Left as-is that is one more way a hutless run stops needing wood in
	 * the back half of the game, on top of everything the doctrine gate
	 * already removes.
	 *
	 * Instead of a fourth new solitary Room event, this branches the
	 * EXISTING Fire event: same title, same slot in the pool, same audio,
	 * but on a solitary run it burns one of the few structures a hutless
	 * player can actually build, rather than a hut. That keeps the event's
	 * identity (the thing that burns things) consistent across both kinds
	 * of run instead of quietly meaning something different depending on
	 * doctrine.
	 *
	 * Deliberately excludes anything doctrine-gated (turret, recycler) and
	 * anything worker-gated (lodge, tannery, steelworks...) -- those either
	 * cannot exist on a solitary run or are capstones a fire event burning
	 * for a modest wood cost would trivialise. */
	SOLITARY_BURNABLE: ['trap', 'uber trap', 'cart', 'workshop', 'trading post'],

	/* Human-readable name and the line describing the loss, keyed the same
	 * as SOLITARY_BURNABLE. Kept as data so a fifth burnable building is one
	 * row, not a new branch of prose logic. */
	BURN_DESC: {
		'trap': function() { return _('one of the traps catches, and by the time it is noticed the frame is already gone.'); },
		'uber trap': function() { return _('the uber trap goes up fast -- whatever wanderer part made it better made it burn better too.'); },
		'cart': function() { return _('the cart is close enough to the fire to have been kindling from the start.'); },
		'workshop': function() { return _('the workshop goes up with everything in it. it takes the longest to burn and the longest to rebuild.'); },
		'trading post': function() { return _('the trading post burns, and there is nobody left to trade with until it is rebuilt.'); }
	},

	/* Which of the solitary-eligible buildings does the player currently
	 * own? Only these can burn -- nothing is destroyed that was never
	 * built. */
	burnableBuildings: function() {
		return Village.SOLITARY_BURNABLE.filter(function(k) {
			return $SM.get('game.buildings["' + k + '"]', true) > 0;
		});
	},

	hasBurnable: function() {
		return Village.burnableBuildings().length > 0;
	},

	/* Destroys one of the player's eligible buildings at random and records
	 * which one, so the scene's text() (which runs after onLoad -- see
	 * Events.loadScene) can describe the right loss without needing its own
	 * separate state-passing mechanism. */
	burnBuilding: function() {
		var options = Village.burnableBuildings();
		if(options.length === 0) { return null; }
		var key = options[Math.floor(Math.random() * options.length)];
		$SM.add('game.buildings["' + key + '"]', -1);
		$SM.set('game.village.lastBurned', key);
		return key;
	},

	lastBurnedText: function() {
		var key = $SM.get('game.village.lastBurned');
		var desc = Village.BURN_DESC[key];
		return desc ? desc() : _('something catches fire, and by the time it is noticed there is nothing left to save.');
	},

	/* ---- beast attack variants ------------------------------------------
	 *
	 * Drawn from creatures the player actually meets on the world map, so a
	 * raid on the village reads as the same ecology rather than a generic
	 * "pack of beasts" every time. Tiered by distance-equivalent danger:
	 * the nastier ones only turn up once the settlement is big enough to be
	 * worth the trip. */
	BEASTS: [
		{
			min: 0,
			name: function() { return _('a pack of snarling beasts pours out of the trees.'); },
			after: function() { return _('the fight is short and bloody, but the beasts are repelled.'); }
		},
		{
			min: 0,
			name: function() { return _('glass wolves come down off the ridge, four of them, moving the way water moves.'); },
			after: function() { return _('two are killed. the others break off, unhurried, and are gone before anyone can follow.'); }
		},
		{
			min: 20,
			name: function() { return _('a chitinous elk walks into the middle of the settlement and does not stop walking.'); },
			after: function() { return _('it takes most of the settlement to put it down, and it takes a long time.'); }
		},
		{
			min: 20,
			name: function() { return _('man-eaters. three of them, working together, which they are not supposed to do.'); },
			after: function() { return _('they are driven off. nobody is comfortable about how coordinated it was.'); }
		},
		{
			min: 40,
			name: function() { return _('a cyborg bear comes through the fence without appearing to notice the fence.'); },
			after: function() { return _('what finally stops it is not a weapon. it is the thing inside it giving out.'); }
		},
		{
			min: 40,
			name: function() { return _('something the {0} call a feral terror is in among the huts before anyone sees it arrive.', Outside.villagerNoun()); },
			after: function() { return _('it is killed. it should not have been possible for it to get that close.'); }
		}
	],

	/* ---- military raid variants ------------------------------------------
	 *
	 * Different human antagonists, matching factions the player fights out
	 * in the world. Who comes for the village should depend on what the
	 * player has stirred up out there. */
	RAIDERS: [
		{
			min: 0,
			name: function() { return _('a band of scavengers comes out of the treeline in loose order, and they are not here to talk.'); },
			after: function() { return _('they are beaten back. they were not well armed and they knew the ground better than we did.'); }
		},
		{
			min: 0,
			name: function() { return _('escaped convicts, still in the remains of prison issue, and there are more of them than there should be.'); },
			after: function() { return _('they break and run once it turns. some of them are barely fighting at all.'); }
		},
		{
			min: 20,
			name: function() { return _('a proper military column. matched kit, a line that holds, somebody in it giving orders.'); },
			after: function() { return _('the line breaks eventually. it costs to break it.'); }
		},
		{
			min: 20,
			name: function() { return _('mech warriors, two of them, walking in from the east at a speed that makes running pointless.'); },
			after: function() { return _('one is brought down. the other withdraws in good order, which is somehow worse.'); }
		},
		{
			min: 40,
			name: function() { return _('profane cultists, and they are singing, and they do not stop singing when the fighting starts.'); },
			after: function() { return _('none of them surrender. none of them run. the singing stops one voice at a time.'); }
		}
	],

	/* Picks a variant appropriate to how big and how deep the settlement has
	 * got. Population stands in for "worth attacking". */
	pickVariant: function(table) {
		var pop = $SM.get('game.population', true);
		var eligible = table.filter(function(v) { return pop >= v.min; });
		if(eligible.length === 0) { eligible = [table[0]]; }
		return Events.pick(eligible);
	}
};
