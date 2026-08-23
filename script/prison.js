/**
 * The Prison.
 *
 * The oldest structure on this world and the last one the player opens.
 *
 * ============================================================================
 * THE DOOR
 * ============================================================================
 *
 * There are no seams, no windows, nothing but vent slits. There is no way in,
 * and no puzzle that opens it -- the lock is a memory, and the player does not
 * have it until the Cloning Lab has told them what they are.
 *
 * Gated on game.lab.complete for that reason: once the player has stood in
 * front of a room full of themselves, enough has come back that their hands
 * know what to do. Six handprints, simultaneously, on sensors that are not
 * marked -- which is a lock that only a six-armed Wanderer can open alone,
 * and which the player opens alone without being able to say how.
 *
 * ============================================================================
 * STRUCTURE
 * ============================================================================
 *
 * Three wings in any order, Executioner-style, each a randomly generated maze
 * (Lab's generator, reused) with a memory crystal at the far end. Three
 * crystals open the fourth wing.
 *
 * Each wing was a holding cell during the trial -- one each for the Lone
 * Wanderer, the Builder and the Exile -- but each is much older than that,
 * and its shape is a fossil of what it originally was:
 *
 *   CUBE         The Infinite Expanse's assay hall. Where a unit of measure
 *                was DEFINED, and every other unit in the Expanse was cut to
 *                match this one. A cube because a cube is the shape you build
 *                when you need a thing to be identical from every side.
 *                Held: the Lone Wanderer. The man who countersigned, kept in
 *                the room where the Expanse decided what "correct" meant.
 *
 *   TETRAHEDRON  The room the Expanse's collapse was managed from. Four
 *                faces, four legs -- the simplest structure that cannot be
 *                made to wobble, built when everything else was wobbling.
 *                Held: the Builder. The one who makes things stand up, in the
 *                last room the old civilisation built to stay standing.
 *
 *   SPHERE       The Wanderers' own addition, sunk into the older prison
 *                when they inherited it. No corners, no direction, no way to
 *                orient yourself. Held: the Exile. The Temple's answer --
 *                "a prison without walls" -- is a description of this room.
 *
 * The fourth wing is the Profane's cell.
 */
var Prison = {

	WINGS: ['cube', 'tetra', 'sphere'],

	/* Wing dimensions. Odd numbers -- the generator carves on a 2-step grid.
	 * Larger than the Lab's: this is the last location in the game. */
	SIZE: {
		cube:   { w: 17, h: 13 },
		tetra:  { w: 19, h: 13 },
		sphere: { w: 19, h: 15 },
		core:   { w: 15, h: 11 }
	},

	/* ---- the door ------------------------------------------------------ */

	/* The Lab is the key. Nothing else opens this. */
	canEnter: function() {
		return $SM.get('game.lab.complete') === true;
	},

	hasOpened: function() {
		return $SM.get('game.prison.opened') === true;
	},

	open: function() {
		$SM.set('game.prison.opened', true);
	},

	/* ---- crystals ------------------------------------------------------ */

	hasCrystal: function(wing) {
		return $SM.get('game.prison.crystals["' + wing + '"]') === true;
	},

	takeCrystal: function(wing) {
		$SM.set('game.prison.crystals["' + wing + '"]', true);
	},

	crystalCount: function() {
		var n = 0;
		Prison.WINGS.forEach(function(wing) {
			if(Prison.hasCrystal(wing)) n++;
		});
		return n;
	},

	/* All three open the core. */
	coreUnlocked: function() {
		return Prison.crystalCount() === Prison.WINGS.length;
	},

	/* The last crystal, taken with gloves and not activated. This is the flag
	 * the endings key off -- see Space. The player is carrying something they
	 * have decided not to look at yet. */
	hasFinalCrystal: function() {
		return $SM.get('game.prison.finalCrystal') === true;
	},

	takeFinalCrystal: function() {
		$SM.set('game.prison.finalCrystal', true);
	},

	isComplete: function() {
		return Prison.hasFinalCrystal();
	},

	/* ---- maze generation ------------------------------------------------
	 *
	 * Reuses Lab's seeded recursive-backtracker rather than duplicating it,
	 * but draws from its OWN seed so the prison's layout is independent of
	 * the lab's while still being fixed for the playthrough. Same contract:
	 * different every run, identical for the whole of any given run, stable
	 * across save and reload.
	 */
	seed: function() {
		var s = $SM.get('game.prison.seed', true);
		if(!s) {
			s = Math.floor(Math.random() * 0x7FFFFFFF) + 1;
			$SM.set('game.prison.seed', s);
		}
		return s;
	},

	/* Distinct offsets per wing so no two wings can generate the same maze
	 * from the same seed. */
	WING_SALT: { cube: 104729, tetra: 224737, sphere: 350377, core: 486187 },

	buildWing: function(wing) {
		var size = Prison.SIZE[wing];
		var rand = Lab.rng(Prison.seed() + Prison.WING_SALT[wing]);
		var grid = Lab.generate(size.w, size.h, rand);

		var start = [1, 1];
		Lab.setCell(grid, start, 'S');

		var cells = Lab.floorCells(grid).filter(function(c) {
			return !(c[0] === start[0] && c[1] === start[1]);
		});

		/* Furthest-first, as in the Lab: the prize goes at the far end so the
		 * wing always has to be crossed, and the set pieces sit deep rather
		 * than clustering by the door. */
		cells.sort(function(a, b) {
			var da = Math.abs(a[0] - start[0]) + Math.abs(a[1] - start[1]);
			var db = Math.abs(b[0] - start[0]) + Math.abs(b[1] - start[1]);
			return db - da;
		});

		var markers = wing === 'core' ? ['P'] : ['C', 'H', 'O'];
		for(var i = 0; i < markers.length && i < cells.length; i++) {
			Lab.setCell(grid, cells[i], markers[i]);
		}

		/* Fights through the middle. The core has none -- there is nothing
		 * left alive in there, and a fight would be the wrong note for the
		 * last room in the game. */
		if(wing !== 'core') {
			var used = markers.length;
			var fights = 3;
			var stride = Math.max(1, Math.floor((cells.length - used) / (fights + 1)));
			for(var f = 0; f < fights; f++) {
				var idx = used + stride * (f + 1);
				if(idx < cells.length) {
					Lab.setCell(grid, cells[idx], 'X');
				}
			}
		}

		return grid;
	},

	/* Registers all four wings with the Maze framework. Idempotent. */
	defineMazes: function() {
		Prison.WINGS.concat(['core']).forEach(function(wing) {
			Prison.defineWing(wing);
		});
		Prison.defineAmbience();
	},

	/* Ambient lines, one pool per wing.
	 *
	 * Each wing is built on a single solid, and the lines lean on what that
	 * geometry does to a person walking through it -- the cube's relentless
	 * sameness, the tetrahedron's lack of any two matching surfaces, the
	 * sphere's refusal to give you a straight line to fix on. The prison was
	 * designed by people who understood that shape is a punishment.
	 *
	 * The core gets its own, quieter pool: it is a corridor to one cell, and
	 * it should not feel like more maze. */
	AMBIENCE: {
		cube: [
			function() { return _('square in section, exactly, and it stays exactly square.'); },
			function() { return _('every corner is the same corner. you have stopped trusting your count.'); },
			function() { return _('the joins are so fine you cannot find them by touch.'); },
			function() { return _('marks on the wall at shoulder height, grouped in fives.'); },
			function() { return _('the light is even everywhere. nothing casts a shadow to steer by.'); },
			function() { return _('a cell door, open, the inside as clean as the corridor.'); },
			function() { return _('tools for measurement, but only for one specific size.'); },
			function() { return _('every room of unerring consistency beyond what any machine can do.'); },
			function() { return _('glyphs in every tongue: peace through equity. equity through consistency.'); },
			function() { return _('someone drew a symbol in this cell. it looks like your charms.'); },
			function() { return _('a special meeting room abandoned.'); },
			function() { return _('an office converted to a cell. but why?'); },
		],
		tetra: [
			function() { return _('the walls lean in overhead and meet.'); },
			function() { return _('every surface is a triangle, and no two are the same triangle.'); },
			function() { return _('the floor is not quite level and never quite the same slope twice.'); },
			function() { return _('you keep ducking for a ceiling that is higher than it looks.'); },
			function() { return _('scratches on a sloped face, made by someone lying down.'); },
			function() { return _('the angles are wrong in a way you can feel in your jaw.'); },
			function() { return _('you see modern repairs in this ancient structure.'); },
			function() { return _('a room with 11 chairs and a 12th empty spot.'); },
			function() { return _('a stone monolith of what to dismantle and what to leave behind.'); },
			function() { return _('this wing represents a simple shape that should be stable for failed for some reason.'); },
			function() { return _('a prisoner tried to repair this cell from the inside.'); },
			function() { return _('a room where the galaxy was once condemned and later an innocent was imprisoned.'); },
		],
		sphere: [
			function() { return _('there are no corners anywhere in this wing.'); },
			function() { return _('the floor is the wall is the ceiling, and the curve never resolves.'); },
			function() { return _('your own footsteps come back to you from the wrong direction.'); },
			function() { return _('nothing here gives you a straight line to fix on.'); },
			function() { return _('a smear on the curve at head height, polished by repetition.'); },
			function() { return _('you have been walking level the whole time. you are no longer sure.'); }
			function() { return _('a morphing projection of this room and this planet.'); }
			function() { return _('no focal point. you observe everything and nothing.'); }
			function() { return _('the entire structure may be rotating around you. you are not sure.'); }
			function() { return _('you move forward but a sphere has no end.'); }
			function() { return _('a round wing with no point. there is no point. nothing to gleam.'); }
			function() { return _('turn back rather than face an infinity of no meaning.'); }
			function() { return _('there are no walls but that which we make.'); }
			function() { return _('ⰑⰖⰔⱂⰃⰠ2ⰉⰉ Ⱀⱂ ⰄⰀ ⰒⰑⰆⰉ me2Ⱐ ⰄⰀ ⰂⰉⰄⰉ2Ⱐ ⰍⰑⰐⰠⰜⰠ ⰉⰆⰅ ⰔⰠⰄⰡⱂⰞⰨ'); }
		],
		core: [
			function() { return _('the corridor runs straight, and it only runs one way.'); },
			function() { return _('the walls here were finished by hand. someone cared how this looked.'); },
			function() { return _('no cells. no doors. this passage was built for one arrival.'); },
			function() { return _('it is very quiet, and the quiet has the shape of a held breath.'); },
			function() { return _('nullified sound. what prisoner would necessitate should a prison'); },
			function() { return _('ⰑⰖⰔⱂⰃⰠ2ⰉⰉ Ⱀⱂ ⰄⰀ ⰒⰑⰆⰉ me2Ⱐ ⰄⰀ ⰂⰉⰄⰉ2Ⱐ ⰍⰑⰐⰠⰜⰠ ⰉⰆⰅ ⰔⰠⰄⰡⱂⰞⰨ'); }
		]
	},

	defineAmbience: function() {
		Prison.WINGS.concat(['core']).forEach(function(wing) {
			var pool = Prison.AMBIENCE[wing];
			if(pool) { Maze.defineAmbience('prison_' + wing, pool); }
		});
	},

	LABELS: {
		cube:   function() { return _('the cube'); },
		tetra:  function() { return _('the tetrahedron'); },
		sphere: function() { return _('the sphere'); },
		core:   function() { return _('the deepest cell'); }
	},

	defineWing: function(wing) {
		Maze.define('prison_' + wing, {
			label: Prison.LABELS[wing](),
			grid: Prison.buildWing(wing),
			start: { dir: 1 },
			cells: {
				'X': { type: 'combat', scene: 'fight_' + wing, once: true },
				'C': { type: 'scene', scene: 'hist_' + wing, once: true },
				'H': { type: 'scene', scene: 'cell_' + wing, once: true },
				'O': { type: 'scene', scene: 'crystal_' + wing },
				'P': { type: 'scene', scene: 'profane' }
			}
		});
		return 'prison_' + wing;
	}
};
