/**
 * The Lone Wanderer.
 *
 * He was second-in-command to the Exile, back when there was a fleet and a
 * chain of command to be second in. He is the only other person on this world
 * who remembers that first-hand, and unlike the Builder he will talk about it.
 *
 * ============================================================================
 * WHAT HE IS FOR
 * ============================================================================
 *
 * The game's other lore sources are all indirect: gravestones, crystal
 * fragments, records in dead languages. He is the one primary source, and the
 * conversation is metered -- one charm buys one more piece of it. That makes
 * the backstory something the player spends on rather than something they
 * trip over, which suits a game where every other resource is also a choice.
 *
 * The charm is the Wanderer fleet's own emblem. That is why he takes it and
 * why it opens him up: it is not payment, it is recognition. Handing one over
 * is the player producing a symbol of a society that is dead because of them,
 * to the one man left who would know it on sight.
 *
 * ============================================================================
 * WHY THE MEMORY ASYMMETRY MATTERS
 * ============================================================================
 *
 * He and the Builder have died a handful of times. The Exile has died more
 * often than the Lab's furnace log has pages. Cloning degrades memory, so
 * they remember almost everything and the player remembers almost nothing --
 * and on top of that the player is actively refusing the parts that hurt.
 *
 * So he is not withholding. He is a man answering questions from someone who
 * used to be his commanding officer and no longer knows his face, and who has
 * asked him some of these questions before, on previous runs, and forgotten
 * the answers. He has accepted his exile. He has not accepted that.
 */
var Swamp = {

	/* How many times the player has paid a charm to talk. Persists across the
	 * whole playthrough. */
	COUNT: 'game.swamp.talks',

	talks: function() {
		return $SM.get(Swamp.COUNT, true) || 0;
	},

	advance: function() {
		$SM.set(Swamp.COUNT, Swamp.talks() + 1);
	},

	/* First-run conversation. Each entry is one charm's worth.
	 *
	 * Deliberately starts where the original game's scene left off -- fleets,
	 * fresh worlds, penance -- and then opens outward. Nothing here names the
	 * player as the Exile outright; he talks to them as the person they were
	 * without ever saying the word, and the player is left to close the gap.
	 */
	FIRST_RUN: [
		[
			_('the wanderer takes the charm and turns it over, and does not put it away.'),
			_('he says he has not seen one of these in a long time. that it is a fleet mark, and that there was a fleet.'),
			_('he speaks of once leading the great fleets to fresh worlds. unfathomable destruction to fuel wanderer hungers.'),
			_('his time here, now, is his penance.')
		],
		[
			_('he weighs the second charm against the first, one in each hand, as though checking they match.'),
			_('says the worlds were not empty. says that is the part people leave out when they tell it.'),
			_('there were humans on most of them. some of them fought. afterwards, some of them worked our ground and were called something other than slaves, and the word we used made it easier.'),
			_('"we did not think we were monsters. that is not a defence. it is just what was true."')
		],
		[
			_('he does not look at the third charm. he looks at you.'),
			_('says he served under a commander he would have followed anywhere and largely did.'),
			_('says the commander was not cruel. says that is what made the rest of it possible -- nobody follows a monster in those numbers.'),
			_('"i was second. whatever he signed, i countersigned."')
		],
		[
			_('the fourth one he does put away.'),
			_('says there was another after that. one who thought the fleets were being wasted on conquest that stopped.'),
			_('says they locked that one up, and they were right to, and everyone agreed, and it held for a long time.'),
			_('"and then a door was opened. i was not there. i have had a great deal of time to be grateful that i was not there."')
		],
		[
			_('he says the wars after that were not like the wars before.'),
			_('before, there was an end to each one, and a world at the end of it. after, there was only the next.'),
			_('says the fleet is gone. not scattered -- gone. says there is no wanderer society left to go back to, and that most of what is buried on this rock is the last of it.'),
			_('"you are holding its mark in your hand. that is where it ended up."')
		],
		[
			_('the last one he refuses.'),
			_('says a small number of people stood up when the sentence was read, and that standing up did not help, and that the same sentence was read over them.'),
			_('says he was one. says there was one other, and she is not here, and he does not say more than that.'),
			_('"i have made my peace with never leaving. i recommend it. it is the only thing out here that gets easier."')
		]
	],

	/* Prestige conversation. Once the player has finished the cycle at least
	 * once, he stops speaking in the third person about a commander and
	 * starts speaking to the person in front of him.
	 *
	 * This is the payoff for the memory asymmetry: he has had these
	 * conversations before. He knows the player will not remember this one
	 * either. He has it anyway. */
	PRESTIGE: [
		[
			_('he takes the charm, and then he takes your wrist, and turns your hand over to look at the back of it.'),
			_('"you have the scar. you always have the scar."'),
			_('he lets go. says he has done this before, with you, more times than he intends to say out loud.'),
			_('"you never remember. i have stopped finding that surprising and i have not stopped minding it."')
		],
		[
			_('he says the dying is not even between us.'),
			_('says he has gone perhaps a dozen times, and each one took a little off the top, and he can still tell you the name of the ship he was born on.'),
			_('says you have gone so many times the furnace downstairs keeps a book on it.'),
			_('"there is nothing left in you to lose. and some of what you have got left, you are holding shut on purpose. i can see you doing it."')
		],
		[
			_('he says you were not a bad commander. says he has thought about it for what amounts to several lifetimes and keeps arriving at the same place.'),
			_('says you were a good one, doing a thing that should not have been done, extremely well.'),
			_('"that is worse. i know it is worse. i countersigned all of it and it is worse for me too."')
		],
		[
			_('he asks whether anyone came out here with you. he asks it the way you ask a question you already know the answer to.'),
			_('when you say there is someone keeping the fire, he nods, and looks away, and takes a while.'),
			_('"she has been out here as long as i have and she did not have to be."'),
			_('he does not explain that. he says you should ask her, and then says, immediately, that you should not, because she will not tell you either.')
		],
		[
			_('he says the watchers have a phrase about observing fate and rarely changing it, and that they are not wrong, and that they are not much help.'),
			_('says the cycle is not a punishment anybody is still administering. says whoever passed the sentence is four hundred centuries dead and the machine is simply still running.'),
			_('"that is the part i had to make peace with. not that it was cruel. that it stopped being about us a very long time ago and did not stop."')
		],
		[
			_('he does not take the charm this time. he closes your hand around it.'),
			_('"keep it. you will not remember this and you will need something to be holding when you work it out again."'),
			_('says he will be here. says that is not a promise, it is just the only fact he has left.'),
			_('"go home, commander."')
		]
	],

	/* The line for a player who keeps handing over charms after he has said
	 * everything he has to say. He does not invent more; he repeats the one
	 * thing that is still true. */
	EXHAUSTED: [
		_('he takes the charm and sets it with the others, and does not add anything.'),
		_('after a while he says the same thing he said before, in the same words, and you get the sense he would say it a hundred more times if you kept coming.'),
		_('"i have made my peace with never leaving. you have not. that is the whole of the difference between us."')
	],

	/* Which script he is working from. Prestige players get the harder one. */
	script: function() {
		return Prestige.hasCompletedRun() ? Swamp.PRESTIGE : Swamp.FIRST_RUN;
	},

	/* The text for the talk the player is paying for right now. */
	currentText: function() {
		var script = Swamp.script();
		var i = Swamp.talks();
		return i < script.length ? script[i] : Swamp.EXHAUSTED;
	},

	/* True while he still has something new to say -- used to word the button
	 * so a player is not repeatedly charged a charm for the same answer
	 * without warning. */
	hasMore: function() {
		return Swamp.talks() < Swamp.script().length;
	},

	/* The perk is granted on the FIRST talk only, as it always was. Later
	 * talks are lore, not rewards. */
	grantFirstTalk: function() {
		if(Swamp.talks() === 0) {
			$SM.addPerk('gastronome');
		}
		/* Recorded on the first talk of any run: other content assumes the
		 * player has heard him say who he was. The Signal's muster order and
		 * the Builder's swamp reaction both key off this. */
		$SM.set('game.metOldWanderer', true);
		Swamp.advance();
	}
};
