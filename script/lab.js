/**
 * The Cloning Lab.
 *
 * Three levels of maze beneath a door the player cannot open on their first
 * playthrough, and cannot open at all without going back to the Temple.
 *
 * ============================================================================
 * THE GATES, IN ORDER
 * ============================================================================
 *
 *   1. The Builder. She leaves the Room and the fire -- the only two things
 *      she has -- and walks out into the wastes to stand in front of this
 *      door and ask the player not to open it. Turning back locks the Lab for
 *      the rest of the playthrough (game.lab.refused). That is a real,
 *      permanent cost, and it is meant to be: she is right, and the player
 *      gets to decide whether that matters.
 *
 *   2. The door. Locked, and on a first playthrough the player has no idea
 *      what would open it. There is no way through. This is not a puzzle to
 *      solve; it's a wall to come back to.
 *
 *   3. Prestige. On a playthrough where the player has finished the game at
 *      least once, they notice a Watcher symbol worked into the door frame --
 *      three eyes, three ears, no mouth. Same recognition-after-completion
 *      device as the road cairns and the register: the information was always
 *      there, they only now know how to read it.
 *
 *   4. The Temple. Asking the monks about the Lab is available at ANY karma,
 *      because the answer is a point of doctrine rather than a favour: the
 *      Watcher would not forbid someone from observing their own fate. The
 *      one thing that closes it is being permanently barred for robbing or
 *      killing -- the monks are not there to be asked anything after that.
 *
 * ============================================================================
 * MAZE GENERATION
 * ============================================================================
 *
 * Layouts are generated once per playthrough from a seed stored in save
 * state, exactly like the world map: different every run, identical for the
 * whole of any given run, and stable across save/reload. See Lab.seed().
 */
var Lab = {

	LEVELS: 3,

	// Maze dimensions per level, in cells. Odd numbers: the generator carves
	// on a 2-step grid, so even dimensions would waste a row and column.
	//
	// Deliberately larger than the original layouts. The automap (see
	// Maze.hasScout()/render()) removes almost all of the navigational
	// difficulty a maze is supposed to provide -- once the player can see
	// the whole floor plan, "find the way through" stops being a real
	// obstacle. Bigger levels, with proportionally more fights below, are
	// the compensation: more ground to cover and more resistance while
	// covering it, rather than relying on the player simply not being able
	// to see where they're going.
	SIZE: [
		{ w: 21, h: 15 },
		{ w: 23, h: 17 },
		{ w: 25, h: 17 }
	],

	/* ---- gating ---------------------------------------------------------- */

	/* True once the player turned back at the Builder's request. Permanent for
	 * the playthrough -- deliberately not clearable. */
	hasRefused: function() {
		return $SM.get('game.lab.refused') === true;
	},

	refuse: function() {
		$SM.set('game.lab.refused', true);
	},

	/* The Watcher symbol on the door frame is only legible to somebody who has
	 * been through the whole cycle at least once. */
	seesSymbol: function() {
		return Prestige.hasCompletedRun() && !Lab.hasRefused();
	},

	noticeSymbol: function() {
		$SM.set('game.lab.symbolSeen', true);
	},

	symbolNoticed: function() {
		return $SM.get('game.lab.symbolSeen') === true;
	},

	hasKey: function() {
		return $SM.get('game.lab.key') === true;
	},

	giveKey: function() {
		$SM.set('game.lab.key', true);
	},

	/* Whether the Temple should offer the "ask about the lab" option. Any
	 * karma -- the answer is doctrine, not a favour. */
	templeCanAdvise: function() {
		return Lab.symbolNoticed() && !Lab.hasKey() && !Temple.isBarred();
	},

	/* ---- progression ------------------------------------------------------ */

	deepest: function() {
		return $SM.get('game.lab.deepest', true) || 0;
	},

	reachLevel: function(n) {
		if(n > Lab.deepest()) {
			$SM.set('game.lab.deepest', n);
		}
	},

	isComplete: function() {
		return $SM.get('game.lab.complete') === true;
	},

	/* The whole reward. No loot, no upgrade -- the player learns something
	 * about themselves and that is the entire payout. The flag exists so the
	 * Prison can key off it later. */
	complete: function() {
		$SM.set('game.lab.complete', true);
	},

	/* Radiation on the deepest level.
	 *
	 * Charged once per ENTRY to level three rather than per step: a per-move
	 * drain would turn the maze into an endurance timer and punish the
	 * exploration the level exists for. A flat entry toll is a decision --
	 * "do I have enough left to go down there and get back?" -- which is the
	 * question the whole location is built around.
	 *
	 * Halved by the hazard suit, never removed: the suit should make the
	 * bottom of the lab reachable, not free. */
	DEPTH_RADIATION: 20,

	applyDepthRadiation: function() {
		var dmg = Hazard.mitigate(Lab.DEPTH_RADIATION);
		World.setHp(Math.max(1, World.health - dmg));
		Notifications.notify(null, Hazard.hasSuit() ?
			_('the counter climbs. the suit takes most of it.') :
			_('the air down here is doing something to you.'));
	},

	/* ---- seeded generation ------------------------------------------------
	 *
	 * One seed per playthrough, drawn on first use and stored. Every level's
	 * layout derives from it, so the Lab is a fixed place within a run and a
	 * different place between runs.
	 * -------------------------------------------------------------------- */

	seed: function() {
		var s = $SM.get('game.lab.seed', true);
		if(!s) {
			s = Math.floor(Math.random() * 0x7FFFFFFF) + 1;
			$SM.set('game.lab.seed', s);
		}
		return s;
	},

	/* Mulberry32. Small, fast, and -- the part that matters here --
	 * deterministic and self-contained, so a given seed produces the same
	 * maze on every machine and every reload. Math.random() cannot be used
	 * for this: the layout has to survive the player closing the tab. */
	rng: function(seed) {
		var a = seed >>> 0;
		return function() {
			a = (a + 0x6D2B79F5) >>> 0;
			var t = Math.imul(a ^ (a >>> 15), 1 | a);
			t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		};
	},

	/* Recursive-backtracker maze. Produces a perfect maze (exactly one path
	 * between any two cells), which is what makes the levels feel like
	 * corridors rather than open rooms.
	 *
	 * Returns an array of strings, '#' wall and '.' floor, with a solid
	 * border. */
	generate: function(w, h, rand) {
		var grid = [];
		var x, y;
		for(y = 0; y < h; y++) {
			var row = [];
			for(x = 0; x < w; x++) row.push('#');
			grid.push(row);
		}

		var stack = [[1, 1]];
		grid[1][1] = '.';
		var dirs = [[0, -2], [0, 2], [-2, 0], [2, 0]];

		while(stack.length > 0) {
			var cur = stack[stack.length - 1];
			var options = [];
			for(var i = 0; i < dirs.length; i++) {
				var nx = cur[0] + dirs[i][0];
				var ny = cur[1] + dirs[i][1];
				if(nx > 0 && nx < w - 1 && ny > 0 && ny < h - 1 && grid[ny][nx] === '#') {
					options.push([nx, ny, dirs[i]]);
				}
			}
			if(options.length === 0) {
				stack.pop();
				continue;
			}
			var pick = options[Math.floor(rand() * options.length)];
			// Carve the wall between the current cell and the chosen one.
			grid[cur[1] + pick[2][1] / 2][cur[0] + pick[2][0] / 2] = '.';
			grid[pick[1]][pick[0]] = '.';
			stack.push([pick[0], pick[1]]);
		}

		return grid.map(function(r) { return r.join(''); });
	},

	/* All floor cells, in a stable order, so trigger placement is as
	 * deterministic as the layout itself. */
	floorCells: function(grid) {
		var out = [];
		for(var y = 0; y < grid.length; y++) {
			for(var x = 0; x < grid[y].length; x++) {
				if(grid[y][x] === '.') out.push([y, x]);
			}
		}
		return out;
	},

	/* Places a character into the grid at [row, col]. */
	setCell: function(grid, pos, ch) {
		var row = grid[pos[0]];
		grid[pos[0]] = row.substring(0, pos[1]) + ch + row.substring(pos[1] + 1);
	},

	/* Builds one level: carves the maze, then scatters its markers.
	 *
	 * Placement is by distance from the entrance rather than at random:
	 * the stairs down go to the FURTHEST cell, so a level always has to be
	 * crossed rather than occasionally opening onto its own exit, and the set
	 * pieces go at the next-furthest cells so they aren't clustered by the
	 * door. A purely random scatter produced levels that were sometimes over
	 * in three steps. */
	buildLevel: function(level) {
		var size = Lab.SIZE[level - 1];
		var rand = Lab.rng(Lab.seed() + level * 7919);
		var grid = Lab.generate(size.w, size.h, rand);

		var start = [1, 1];
		Lab.setCell(grid, start, 'S');

		var cells = Lab.floorCells(grid).filter(function(c) {
			return !(c[0] === start[0] && c[1] === start[1]);
		});

		// Manhattan distance from the entrance -- cheap, and good enough to
		// separate "near the door" from "deep in".
		cells.sort(function(a, b) {
			var da = Math.abs(a[0] - start[0]) + Math.abs(a[1] - start[1]);
			var db = Math.abs(b[0] - start[0]) + Math.abs(b[1] - start[1]);
			return db - da;
		});

		var markers = Lab.LEVEL_MARKERS[level - 1];
		for(var i = 0; i < markers.length && i < cells.length; i++) {
			Lab.setCell(grid, cells[i], markers[i]);
		}

		// Fights fill the mid-distance cells, so the player meets resistance
		// on the way in rather than only at the far end.
		//
		// Roughly doubled from the original 2 + level (3/4/5) to go with the
		// larger SIZE above -- see the comment there. Enemy stats are
		// untouched; this is about there being more of them to get through,
		// not any single one hitting harder.
		var used = markers.length;
		var fightCount = 4 + level * 2;
		var stride = Math.max(1, Math.floor((cells.length - used) / (fightCount + 1)));
		for(var f = 0; f < fightCount; f++) {
			var idx = used + stride * (f + 1);
			if(idx < cells.length) {
				Lab.setCell(grid, cells[idx], 'X');
			}
		}

		return grid;
	},

	/* First character of each level's marker list is the deepest thing on it
	 * (the stairs down, or the glyph door on level 3), because buildLevel
	 * assigns markers to the furthest cells first. */
	LEVEL_MARKERS: [
		['D', 'N'],        // stairs down, the drone notes
		['D', 'E', 'F'],   // stairs down, the assay bench, the furnace
		['G']              // the glyph door
	],

	/* Registers all three levels with the Maze framework. Idempotent -- safe
	 * to call on every entry, which is what keeps the layout in step with the
	 * seed after a reload. */
	defineMazes: function() {
		for(var level = 1; level <= Lab.LEVELS; level++) {
			Lab.defineLevel(level);
		}
		Lab.defineAmbience();
	},

	/* Ambient lines for the maze readout.
	 *
	 * The lab's note is that it is WORKING, not ruined. Nothing here is
	 * collapsed or overgrown; the lights answer, the air moves, the floors
	 * are clean. What is wrong with it is that it is still running with
	 * nobody in it, and that the work it was doing was on people.
	 *
	 * Deepening by level: level one is merely tidy, level two is
	 * uncomfortable, level three stops pretending. */
	AMBIENCE: {
		1: [
			function() { return _('the lights come on a corridor at a time, ahead of you.'); },
			function() { return _('the lab is empty, but not abandoned. nothing here is dusty.'); },
			function() { return _('the air moves. something is still running the filtration.'); },
			function() { return _('a bench, wiped down. the tools on it are laid out in order of size.'); },
			function() { return _('notes on the wall in ancient glyphs, in a small tidy hand.'); },
			function() { return _('a floor drain, and a faint slope in the concrete leading to it.'); },
			function() { return _('somewhere behind the wall, a pump cycles, stops, and cycles again.'); },
			function() { return _('cameras everwhere. but who is watching if anyone?'); },
			function() { return _('sterile and clinical but with an almost organic thrum'); },
			function() { return _('a jar of teeth and examination notes in weird glyphs.'); },
			function() { return _('every path impossibly seems to slope down and deeper.'); },
			function() { return _('modern. ancient. familiar. alien.'); },
			function() { return _('how did the watcher temple have a key to thos place?'); },
			function() { return _('there was a sound behind you and then suddenly nothing.'); },
		],
		2: [
			function() { return _('colder here. the filtration is louder.'); },
			function() { return _('a faint scent of smoke, and under it something organic.'); },
			function() { return _('specimen racks, emptied and washed. the labels were peeled off.'); },
			function() { return _('the glyphs down here are corrections. someone kept revising the same line.'); },
			function() { return _('a chair bolted to the floor. the bolts are recent work.'); },
			function() { return _('condensation on the pipes. it has been this cold for a very long time.'); },
			function() { return _('a door with a window at standing height, and a bar across the outside.'); },
			function() { return _('this room has impossible star charts.'); },
			function() { return _('this area has been overly sanitized as if to erase something foul.'); },
			function() { return _('what did the builder not want you to find down here?'); },
			function() { return _('how deep do these tunnels go? why is it so cold?'); },
			function() { return _('going in circles? that handprint looks like your own.'); },
			function() { return _('an archive with incomprehensible records'); },
			function() { return _('there appear to be body-sized drag marks.'); },
		],
		3: [
			function() { return _('remnants of genetic work, and notes in ancient glyphs.'); },
			function() { return _('rows of tanks, drained. the fittings at the base are sized for a body.'); },
			function() { return _('the smell is stronger here. smoke, and decomposition, and something sweet.'); },
			function() { return _('a ledger of numbers, no names. the numbers run to five figures.'); },
			function() { return _('handprints on the inside of the glass. six fingers, and some with five.'); },
			function() { return _('the equipment down here was built to be cleaned quickly.'); },
			function() { return _('a room with no fittings at all, and a drain in the middle of the floor.'); },
			function() { return _('there are subtle carvings of three eyes and three ears.'); },
			function() { return _('lost? déjà vu? or have you been here before and forgot?'); },
			function() { return _('something in the back of your mind says to turn back now.'); },
			function() { return _('you long for the warm fire in your room.'); },
			function() { return _('that cannot be right. those glyphs seem to suggest...'); },
			function() { return _('you could backtrack and climb out this very moment.'); },
			function() { return _('unseen workers must be keeping this operation going'); },
			function() { return _('invisible death - radiation floods most of this level'); },
		]
	},

	defineAmbience: function() {
		for(var level = 1; level <= Lab.LEVELS; level++) {
			var pool = Lab.AMBIENCE[level] || Lab.AMBIENCE[1];
			Maze.defineAmbience('lab' + level, pool);
		}
	},

	defineLevel: function(level) {
		var id = 'lab' + level;
		var grid = Lab.buildLevel(level);

		var cells = {
			'X': { type: 'combat', scene: 'fight' + level, once: true },
			'D': { type: 'scene', scene: 'descend' + level },
			'N': { type: 'scene', scene: 'notes', once: true },
			'E': { type: 'scene', scene: 'assay', once: true },
			'F': { type: 'scene', scene: 'furnace', once: true },
			'G': { type: 'scene', scene: 'glyphDoor' }
		};

		Maze.define(id, {
			label: _('sublevel {0}', level),
			grid: grid,
			start: { dir: 1 },
			cells: cells
		});
		return id;
	}
};
