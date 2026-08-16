/**
 * Run-scoped ending conditions.
 *
 * Three short endings that depend on facts about HOW a playthrough was
 * played, rather than what the player found in it. They share a problem the
 * rest of the ending code does not have: every one of them needs state that
 * is scoped to the current run and reset when a new one starts, which is not
 * how anything else in save state behaves.
 *
 *   Speed        elapsed play time this run
 *   No-death     whether the player has died THIS run (character.deaths is
 *                cumulative across every run ever and survives prestige, so
 *                it cannot answer this)
 *   April Fools  a joke ending, gated on the actual date
 *
 * All three are additive: they prefix or replace nothing that the main
 * ending branches do, except where the player has explicitly earned it.
 */
var Achievements = {

	/* ---- run clock -----------------------------------------------------
	 *
	 * Wall-clock elapsed time since the run started, accumulated across
	 * sessions so closing the tab and coming back does not reset or inflate
	 * it. Stored as a total plus a session start, and flushed on save --
	 * a single "started at" timestamp would count every hour the tab was
	 * closed, which is the opposite of what a speedrun timer should measure.
	 */
	SPEEDRUN_LIMIT: 150 * 60 * 1000,   // 150 minutes

	_sessionStart: null,

	startSession: function() {
		Achievements._sessionStart = Date.now();
	},

	/* Folds the current session into the stored total. Called on save, so an
	 * interrupted run keeps whatever it had accumulated. */
	flush: function() {
		if(Achievements._sessionStart === null) { return; }
		var elapsed = Date.now() - Achievements._sessionStart;
		Achievements._sessionStart = Date.now();
		if(elapsed > 0) {
			$SM.set('game.runTime', (($SM.get('game.runTime', true) || 0) + elapsed), true);
		}
	},

	/* Total play time for this run, including the session in progress. */
	runTime: function() {
		var stored = $SM.get('game.runTime', true) || 0;
		if(Achievements._sessionStart !== null) {
			stored += Date.now() - Achievements._sessionStart;
		}
		return stored;
	},

	/* Reset at the start of a new run. Called from Prestige.save(), which is
	 * the one place that knows a run has ended and another is beginning. */
	resetRun: function() {
		$SM.set('game.runTime', 0, true);
		$SM.set('game.diedThisRun', false, true);
		Achievements._sessionStart = Date.now();
	},

	/* True if the CURRENT save entered play via an import (paste, file, or
	 * Dropbox -- Engine.import64 is the single funnel for all three, and
	 * marks the state directly; see there for why it isn't set through
	 * $SM). Cleared implicitly by starting a fresh game, since that never
	 * goes through import64 at all. */
	wasImported: function() {
		return $SM.get('game.imported') === true;
	},

	isSpeedRun: function() {
		/* Prestige-gated deliberately: a first-time player cannot know the
		 * route well enough for a fast finish to mean what this ending says
		 * it means, and 150 minutes on a blind run would be a fluke rather
		 * than mastery.
		 *
		 * Imported saves are disqualified outright, regardless of what
		 * game.runTime claims. Reported directly: a save imported from
		 * before this feature existed (or any save missing the field) reads
		 * as 0 elapsed time, so importing a near-finished save and beating
		 * it seconds later satisfied "under 150 minutes" for a run that was
		 * never actually timed. This is not a narrower version of the same
		 * check -- runTime could be perfectly accurate on an imported save
		 * and it would still fail here, because the achievement is about a
		 * continuous, real-time play session, and importing breaks that
		 * continuity by definition regardless of what any clock says. */
		return Prestige.hasCompletedRun() && !Achievements.wasImported() &&
			Achievements.runTime() < Achievements.SPEEDRUN_LIMIT;
	},

	/* ---- deaths this run ------------------------------------------------
	 *
	 * character.deaths is a lifetime counter that survives prestige (the
	 * fifty-first cairn easter egg depends on that), so it cannot be used to
	 * ask "did I die this run". This is the separate, run-scoped flag. */
	noteDeath: function() {
		$SM.set('game.diedThisRun', true);
	},

	diedThisRun: function() {
		return $SM.get('game.diedThisRun') === true;
	},

	/* The no-death ending needs the Lab too: without having seen the vats,
	 * the player has no idea what a death would actually cost them, and the
	 * text would be describing a nightmare they never had. */
	isFlawless: function() {
		return !Achievements.diedThisRun() &&
			(typeof Lab !== 'undefined') && Lab.isComplete();
	},

	/* ---- april fools ---------------------------------------------------
	 *
	 * Two conditions, both required: the game must be in April Fools mode
	 * (the ?april=1 CSS joke build) AND it must actually be the day. The
	 * URL parameter alone would let anybody see it whenever they liked,
	 * which would make it a feature rather than a joke. */
	APRIL_MONTH: 3,   // zero-indexed: April
	APRIL_DATE: 1,

	isAprilFoolsDay: function(now) {
		now = now || new Date();
		return now.getMonth() === Achievements.APRIL_MONTH &&
			now.getDate() === Achievements.APRIL_DATE;
	},

	/* Reads Engine.aprilFoolsActive rather than the URL.
	 *
	 * Reported directly: the ?april=1 parameter is not actually load-bearing
	 * in the real trigger path. april() is called exactly once, from the
	 * automatic date check at the bottom of engine.js
	 * (`if (isItAprilFoolDay()) { april(); }`), and that call never touches
	 * the URL -- it appends the stylesheet directly. The player in the
	 * report saw the joke CSS load (proving april() ran) but never got the
	 * ending, because nothing had ever set the parameter this was checking
	 * for. The parameter's only real function was preventing the stylesheet
	 * being appended twice; it was never a signal this code could read.
	 *
	 * Engine.aprilFoolsActive is set inside april() itself, at the exact
	 * point the joke content is actually applied -- true reflects reality
	 * regardless of which path got there. */
	inAprilMode: function() {
		return typeof Engine !== 'undefined' && Engine.aprilFoolsActive === true;
	},

	isAprilEnding: function() {
		return Achievements.inAprilMode() && Achievements.isAprilFoolsDay();
	}
};
