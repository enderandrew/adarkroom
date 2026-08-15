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
	SIZE: [
		{ w: 15, h: 11 },
		{ w: 17, h: 13 },
		{ w: 19, h: 13 }
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
		var used = markers.length;
		var fightCount = 2 + level;
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
