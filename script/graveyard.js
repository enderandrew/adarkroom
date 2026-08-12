/**
 * The Graveyard.
 *
 * A place with no combat and nothing worth taking. The entire content is
 * reading what is written on the stones, and the stones are an indictment.
 *
 * Every epitaph names the Profane. Between them they cover the whole shape of
 * what he did -- the rebellion he incited, the orbital bombardment, the wars
 * that never stopped, the people he had executed, the settlements his supply
 * lines starved, the ones he killed personally and from behind. The player is
 * not told any of this; they read it off gravestones, in the order chance
 * gives them.
 *
 * The last stone is not random. See Graveyard.LAST.
 */
var Graveyard = {

	/* How many stones the player reads before the last one. Enough to
	 * establish the pattern -- one name, over and over, in every register from
	 * a soldier's to a child's -- without turning the location into a reading
	 * exercise. */
	READS: 5,

	/* The epitaph pool. Deliberately varied in voice: some are official, some
	 * are family, some are barely literate, one is a joke that stopped being
	 * funny. A uniform register would read as a list rather than a cemetery. */
	EPITAPHS: [
		[
			_('a soldier, by the shape of the plot, though the stone does not say which side.'),
			_('"she went out when the call came. she believed it. that was the whole of her crime."'),
			_('"taken in the rising. curse the profane."')
		],
		[
			_('the stone is cut deep and evenly, and somebody paid for that.'),
			_('"fell in the first bombardment, with the roof of his own house."'),
			_('"there was no warning given. the profane did not consider one necessary."')
		],
		[
			_('a small stone, and a short plot.'),
			_('"four years old. the sky came down."'),
			_('"curse the profane, who was told what would happen and did it anyway."')
		],
		[
			_('the lettering runs off the edge of the stone, as though whoever cut it kept thinking of more to say.'),
			_('"twenty-one years in the wars. he was released twice and recalled twice."'),
			_('"there was no end to them. the profane never intended one."')
		],
		[
			_('a plain marker, and somebody has kept the weeds off it.'),
			_('"she said in a room of nine people that the war should stop."'),
			_('"one of the nine reported it. the profane had her executed inside the week."')
		],
		[
			_('the stone is shared. three names, one date.'),
			_('"the convoys stopped coming. it took the settlement eleven weeks."'),
			_('"the profane needed the lanes for something else. curse him for it."')
		],
		[
			_('a heavy stone, laid flat, the way you weight something you do not want disturbed.'),
			_('"he stood at the profane\'s shoulder for nine years."'),
			_('"the wound is in his back. curse the profane, who could not even do that much to a man\'s face."')
		],
		[
			_('the oldest stone in this row, and the letters have nearly gone.'),
			_('"a physician. she treated both sides and said so out loud."'),
			_('"the profane had that called treason. curse him."')
		],
		[
			_('somebody has scratched an addition under the carved text, much later and much worse.'),
			_('"lost with all hands, orbital action."'),
			_('"they were not told what they were firing on. curse the profane, who was."')
		],
		[
			_('a stone with no name on it at all, only a date and a single line.'),
			_('"one of the many. there was not time to find out which."'),
			_('"curse the profane."')
		]
	],

	/* The last stone the player reads, always. Placed last because everything
	 * before it builds one accusation, and this one adds a second name to it
	 * -- the player's, though nothing here says so.
	 *
	 * This is the whole point of the location and it must never be randomised
	 * into the middle of the sequence, where it would land as one grievance
	 * among ten instead of the conclusion of them. */
	LAST: [
		_('one more stone, at the end of the row, newer than the ones around it.'),
		_('the hand is angry. the cuts are too deep in places and the line runs downhill.'),
		_('"curse the profane for all time, and curse the exile for releasing them."')
	],

	/* Draws an epitaph the player has not seen this visit.
	 *
	 * Tracked per-visit rather than per-save on purpose: the graveyard should
	 * read differently on a later trip, but within a single walk down the row
	 * the same grave turning up twice would break the illusion that these are
	 * distinct people. */
	_seen: [],

	reset: function() {
		Graveyard._seen = [];
	},

	next: function() {
		var pool = [];
		for(var i = 0; i < Graveyard.EPITAPHS.length; i++) {
			if(Graveyard._seen.indexOf(i) === -1) pool.push(i);
		}
		// Every stone read: fall back to the full set rather than running dry.
		if(pool.length === 0) {
			Graveyard._seen = [];
			for(i = 0; i < Graveyard.EPITAPHS.length; i++) pool.push(i);
		}
		var index = pool[Math.floor(Math.random() * pool.length)];
		Graveyard._seen.push(index);
		return Graveyard.EPITAPHS[index];
	},

	/* How many stones remain before the last one. */
	readsLeft: function() {
		return Math.max(0, Graveyard.READS - Graveyard._seen.length);
	},

	atLastStone: function() {
		return Graveyard.readsLeft() === 0;
	}
};
