/**
 * Easter eggs.
 *
 * Four rewards for attention rather than luck. None of them is announced,
 * none is achievement-gated, and none gives the player anything they can
 * carry -- the payoff is entirely that they noticed.
 *
 * Kept in one module so the conditions are stated once and are easy to audit,
 * rather than scattered as one-off `if` statements across five files where
 * they'd be impossible to find again.
 */
var EasterEggs = {

	/* ---- 1. The fifty-first death -------------------------------------
	 *
	 * character.deaths is already tracked and already survives prestige
	 * (World.die increments it; nothing clears it), so this quietly counts
	 * across every run the player has ever made. */
	DEATH_MILESTONE: 50,

	deaths: function() {
		return $SM.get('character.deaths', true) || 0;
	},

	/* True on exactly the run AFTER the fiftieth death -- the cairn is
	 * counting completed deaths, so it reads "the fifty-first" while the
	 * player is walking around on their fifty-first life. */
	atDeathMilestone: function() {
		return EasterEggs.deaths() >= EasterEggs.DEATH_MILESTONE;
	},

	deathCairnText: function() {
		return [
			_('another cairn, and this one has been counted.'),
			_('the marks are cut in fifties, and the last fifty is closed.'),
			_('this is the fifty-first.')
		];
	},

	/* ---- 2. The builder's name ----------------------------------------
	 *
	 * Said once, in passing, after a long single session, and never again.
	 * No flag the player can see, no notification history entry worth
	 * hunting for -- if they were away from the screen they missed it, and
	 * that is the intended behaviour of a thing that is not a reward.
	 *
	 * Keyed on time in ONE run rather than total playtime: the point is that
	 * she has been in the room with you, uninterrupted, for a very long
	 * time. */
	NAME_DELAY: 10 * 60 * 60 * 1000,   // ten hours
	_nameTimer: null,

	scheduleBuilderName: function() {
		if(EasterEggs._nameTimer) { return; }
		if($SM.get('game.builderNamed')) { return; }
		EasterEggs._nameTimer = Engine.setTimeout(
			EasterEggs.sayBuilderName, EasterEggs.NAME_DELAY);
	},

	sayBuilderName: function() {
		EasterEggs._nameTimer = null;
		if($SM.get('game.builderNamed')) { return; }
		// Only if she's actually present and the player is in the room to hear it.
		if($SM.get('game.builder.level', true) < 4) { return; }
		if(Engine.activeModule !== Room) {
			// Try again later rather than burning the moment on an empty room.
			EasterEggs._nameTimer = Engine.setTimeout(
				EasterEggs.sayBuilderName, 5 * 60 * 1000);
			return;
		}
		$SM.set('game.builderNamed', true);
		Notifications.notify(Room,
			_('she mentions, without looking up, that her name is Ayla. she does not bring it up again.'));
	},

	/* ---- 3. The original opening ---------------------------------------
	 *
	 * On a playthrough after a completed run, the fire occasionally gutters
	 * and the room reads, for one notification, as the game this one is a
	 * fork of. A nod to Townsend, consistent with the fork notice shown on
	 * first lighting the fire.
	 *
	 * Rare and non-repeating within a run, so it reads as a glitch in the
	 * world rather than a recurring gag. */
	ORIGINAL_CHANCE: 0.04,

	maybeOriginalOpening: function() {
		if(!Prestige.hasCompletedRun()) { return false; }
		if($SM.get('game.sawOriginalOpening')) { return false; }
		if(Engine.activeModule !== Room) { return false; }
		if(Math.random() >= EasterEggs.ORIGINAL_CHANCE) { return false; }
		$SM.set('game.sawOriginalOpening', true);
		Notifications.notify(Room, _('the fire is dead. the room is freezing.'));
		return true;
	},

	/* ---- 4. Refusing everything ----------------------------------------
	 *
	 * A run in which the player never once moved their karma -- no cruelty,
	 * but no kindness either. Not neutrality by balance (a murderer who
	 * later donates is not this); neutrality by never having engaged.
	 *
	 * Tracked by counting karma CHANGES rather than reading the final value,
	 * because +5 and -5 cancelling out is a completely different run from
	 * one where nothing was ever chosen. $SM.add on character.karma is the
	 * single funnel for every karma change in the game, so hooking it there
	 * catches all of them. */
	karmaChanges: function() {
		return $SM.get('character.karmaChanges', true) || 0;
	},

	noteKarmaChange: function() {
		$SM.add('character.karmaChanges', 1);
	},

	hasRefusedEverything: function() {
		return EasterEggs.karmaChanges() === 0;
	},

	/* The monks' answer when they look at somebody who has never chosen
	 * anything. Deliberately not a rebuke -- the Watcher observes judgement,
	 * it does not pass it. */
	perceptionText: function() {
		if(EasterEggs.hasRefusedEverything()) {
			return [
				_('all three of its eyes are open, and none of them are pointed at you.'),
				_('"nothing."'),
				_('"that is not a judgement."'),
				_('nobody says anything after that for a long time.')
			];
		}
		return [
			_('all three of its eyes are open, and none of them are pointed at you.'),
			_('"one weighed down with the weight of the stars in a prison without walls."'),
			_('nobody says anything after that for a long time.')
		];
	}
};
