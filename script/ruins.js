/**
 * Ruins glue.
 *
 * Connects Glyphs (the puzzle) to the event panel (the scene). Kept separate
 * from glyphs.js so the puzzle module stays independent of the event system
 * and can be reused by any other lock added later.
 */
var Ruins = {

	/* Which lock buttons the player has earned this visit.
	 *
	 * This has to be real state rather than a one-shot Button.setDisabled()
	 * call, because Events.updateButtons() re-evaluates every button's
	 * available() and re-disables anything that returns false. It runs on
	 * every 'stores'/'income' state update (see Events.handleStateUpdates),
	 * which in the world means every income tick -- so a lock button enabled
	 * only by a direct setDisabled() call would visibly turn grey again a few
	 * seconds after the puzzle was solved, stranding the player at a door
	 * they had already opened. available() must therefore report the truth,
	 * not a constant false.
	 *
	 * Keyed by button id so the outer and inner locks track independently. */
	_solved: {},

	isSolved: function(buttonId) {
		return Ruins._solved[buttonId] === true;
	},

	/* --- The psychic crystal -------------------------------------------
	 *
	 * Six fragments of somebody else's memory, in narrative order, covering
	 * how the Profane took the fleet and how its commander became the Exile.
	 * They are DELIVERED out of order and one at a time, because that's how
	 * the fiction frames them -- foreign, fleeting, confusing -- but they are
	 * written so that a player who collects all six can assemble the sequence
	 * themselves.
	 *
	 * Nothing here names the Exile as the player. The last fragment is the
	 * closest it comes, and it still only describes a sentence being read to
	 * a room.
	 */
	MEMORIES: [
		[
			_('a voice moving through a crowd without being spoken aloud.'),
			_('thousands of faces turning at once toward a thing they have all just decided to hate.'),
			_('the word in their mouths is freedom. it is not the right word and every one of them is certain that it is.')
		],
		[
			_('a record read out to a room that goes very quiet.'),
			_('the seal on it is genuine. that is the part that does the damage.'),
			_('one of their own opened his door. everyone knows it now, and nothing anybody says after today will be believed again.')
		],
		[
			_('it spreads the way damp spreads, from the inside of things, upward.'),
			_('the ones who argued hardest against him last season are arguing for him now.'),
			_('not one of them can remember changing their mind, and not one of them finds that strange.')
		],
		[
			_('a name being struck out of something that was meant to be permanent.'),
			_('a sentence read three times over so that nobody present can claim to have misheard it.'),
			_('traitor. anathema. from this day he has no name but the exile, and will have no other, ever.')
		],
		[
			_('a small number of them stand up, at the moment when standing up is the worst thing a person can do.'),
			_('it does not help him. it was never going to help him.'),
			_('the same sentence is read over them, faster the second time, because the room has already stopped listening.')
		],
		[
			_('worlds going quiet one after another, from orbit, patiently, in a fixed order.'),
			_('the fleet is his now, and it does exactly what it was built to do.'),
			_('it takes a very long time. he does not stop. by the end of it there is almost nobody left to stop him.')
		]
	],

	/* Picks a memory the player hasn't been shown yet, at random; once all six
	 * have been seen, picks freely at random.
	 *
	 * Straight random selection would mean a player working through five or
	 * more ruins mostly re-reads fragments they already have -- with six
	 * memories and six draws, they'd expect to see only about four distinct
	 * ones, and the story would never assemble. Preferring unseen fragments
	 * keeps the delivery order unpredictable (which is the point) while
	 * guaranteeing that persistence is rewarded with new information.
	 */
	pickMemory: function() {
		var seen = $SM.get('character.memories') || {};
		var unseen = [];
		for(var i = 0; i < Ruins.MEMORIES.length; i++) {
			if(!seen[i]) unseen.push(i);
		}
		var pool = unseen.length > 0 ? unseen : Ruins.MEMORIES.map(function(_m, i) { return i; });
		var index = pool[Math.floor(Math.random() * pool.length)];
		$SM.set('character.memories["' + index + '"]', true);
		return index;
	},

	/* The text shown when the crystal is touched. Wrapped in the same framing
	 * every time so the fragments read as intrusions rather than as narration
	 * the player's character is doing. */
	memoryText: function() {
		AudioEngine.playSound(AudioLibrary.CRYSTAL);
		var index = Ruins.pickMemory();
		var lines = [
			_('the crystal is warm, and it is not warm from the room.'),
			_('it does not come free of the rack. what comes free is everything else.')
		];
		return lines.concat(Ruins.MEMORIES[index]).concat([
			_('and then it is gone, and it was never yours, and you could not repeat a word of it.')
		]);
	},

	/* How many distinct fragments the player has been shown. Exposed so other
	 * content can key off it later. */
	memoriesSeen: function() {
		var seen = $SM.get('character.memories') || {};
		var n = 0;
		for(var i = 0; i < Ruins.MEMORIES.length; i++) {
			if(seen[i]) n++;
		}
		return n;
	},

	/* Draws a lock into the current scene's description and wires the named
	 * button to unlock when it's solved.
	 *
	 * The scene declares the button with available: () => Ruins.isSolved(id),
	 * so it renders disabled and stays disabled through any number of
	 * updateButtons() passes until this marks it solved.
	 *
	 * A fresh puzzle is generated per visit, so a player who leaves and comes
	 * back doesn't get the same grid, and a solution can't be memorised across
	 * runs. The solved flag is cleared here for the same reason -- re-entering
	 * the ruins must not inherit a previous visit's unlocked door. */
	renderLock: function(preset, buttonId) {
		Ruins._solved[buttonId] = false;
		var panel = Events.eventPanel();
		var desc = $('#description', panel);

		/* Force the button back to disabled as well as clearing the flag.
		 *
		 * drawButtons() has ALREADY run by the time onRender fires, and it
		 * evaluated available() while _solved still held the previous visit's
		 * value -- so on a second visit to the ruins the door renders already
		 * open, before this function gets a chance to reset anything. Clearing
		 * the flag alone fixes isSolved() but leaves that stale DOM state, and
		 * the player could walk straight through an unsolved lock. */
		var lockBtn = $('#' + buttonId, panel);
		if(lockBtn.length) {
			Button.setDisabled(lockBtn, true);
		}

		$('<div>')
			.addClass('glyphHint')
			.text(_('no glyph may repeat in any row, in any column, or inside any bordered block. red glyphs are fixed.'))
			.appendTo(desc);

		var puzzle = Glyphs.generate(preset);

		Glyphs.render(desc, puzzle, function() {
			/* Record it BEFORE touching the DOM: the flag is what keeps the
			 * button enabled across later updateButtons() passes, the
			 * setDisabled call below is just immediate feedback so the player
			 * doesn't wait for the next state update to see it open. */
			Ruins._solved[buttonId] = true;
			var btn = $('#' + buttonId, panel);
			if(btn.length) {
				Button.setDisabled(btn, false);
			}
			Notifications.notify(null, _('the glyphs settle, and something behind the door disengages.'));
			AudioEngine.playSound(AudioLibrary.CRAFT);
		});

		return puzzle;
	}
};
