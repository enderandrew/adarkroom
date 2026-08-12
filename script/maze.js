/**
 * ASCII first-person maze.
 *
 * A framework for maze locations rendered as a first-person ASCII corridor
 * view, navigated with arrow keys / WASD / on-screen touch zones.
 *
 * ============================================================================
 * DESIGN
 * ============================================================================
 *
 * The maze is a SCENE inside an ordinary setpiece event, not a new module.
 * That is the whole trick, and it's what makes combat and story beats work
 * without any new machinery:
 *
 *   - Stepping onto a trigger cell calls Events.loadScene() on a sibling
 *     scene in the SAME event. That scene is a completely ordinary combat or
 *     story scene -- it gets the existing status effects, loot tables, karma
 *     hooks, buttons, everything.
 *   - Its exit button routes back to the maze scene, which re-renders from
 *     persisted position and facing, so the player resumes exactly where they
 *     were standing.
 *
 * Nothing here reimplements combat, events, or the event stack. A maze cell
 * that starts a fight is a normal fight.
 *
 * ============================================================================
 * AUTHORING A MAZE
 * ============================================================================
 *
 *   Maze.define('lab', {
 *       grid: [
 *           '###########',
 *           '#S..#....A#',
 *           '#.#.#.###.#',
 *           '#.#...#...#',
 *           '#.#####.#d#',
 *           '#.......#E#',
 *           '###########'
 *       ],
 *       start: { dir: 1 },
 *       cells: {
 *           'A': { type: 'combat', scene: 'labGuard', once: true },
 *           'd': { type: 'door',   key: 'game.lab.keycard',
 *                  lockedText: _('the door does not open. there is a slot beside it.') },
 *           'E': { type: 'scene',  scene: 'labVault' }
 *       }
 *   });
 *
 * Grid characters:
 *   '#'  wall
 *   '.'  floor
 *   'S'  start position (floor)
 *   anything else -> looked up in `cells`
 *
 * Cell types:
 *   combat / scene   loadScene() the named scene on entry. `once: true`
 *                    records it as cleared so it won't fire again -- which is
 *                    what makes a maze safe to re-enter across trips.
 *   door             impassable until $SM.get(key) is truthy. Shows
 *                    lockedText when bumped. This is the multi-trip
 *                    progression primitive: the key is set by a scene
 *                    elsewhere, and the door opens on a later visit.
 *   exit             leaves the maze via `scene`.
 *
 * ============================================================================
 * PERSISTENCE
 * ============================================================================
 *
 * Position, facing and cleared triggers live in save state under
 * game.mazes[id], so a player can leave a maze half-explored, go home,
 * restock, and come back to find the doors they opened still open and the
 * fights they won still won -- the Executioner's structure, which is what
 * these locations are meant to feel like.
 */
var Maze = {

	VIEW_W: 31,
	VIEW_H: 13,

	// north, east, south, west -- index matches the `dir` value.
	DIRS: [
		{ dx: -1, dy: 0, name: 'north' },
		{ dx: 0, dy: 1, name: 'east' },
		{ dx: 1, dy: 0, name: 'south' },
		{ dx: 0, dy: -1, name: 'west' }
	],

	_defs: {},
	_active: null,      // id of the maze currently on screen
	_scene: null,       // the maze scene to return to after a trigger
	_keyHandler: null,

	/* ---- authoring ---------------------------------------------------- */

	define: function(id, def) {
		def.cells = def.cells || {};
		Maze._defs[id] = def;
		return def;
	},

	get: function(id) {
		return Maze._defs[id];
	},

	/* ---- persisted state ---------------------------------------------- */

	statePath: function(id, key) {
		return 'game.mazes["' + id + '"].' + key;
	},

	/* Current position/facing, falling back to the maze's declared start.
	 * Kept in save state rather than a runtime variable so leaving and
	 * returning across separate expeditions resumes where the player was. */
	getPos: function(id) {
		var def = Maze.get(id);
		var saved = $SM.get(Maze.statePath(id, 'pos'));
		if(saved && typeof saved.x === 'number') {
			return { x: saved.x, y: saved.y, dir: saved.dir };
		}
		var start = Maze.findStart(id);
		return {
			x: start.x,
			y: start.y,
			dir: (def.start && typeof def.start.dir === 'number') ? def.start.dir : 1
		};
	},

	setPos: function(id, pos) {
		$SM.set(Maze.statePath(id, 'pos'), { x: pos.x, y: pos.y, dir: pos.dir }, true);
	},

	findStart: function(id) {
		var def = Maze.get(id);
		for(var x = 0; x < def.grid.length; x++) {
			var col = def.grid[x].indexOf('S');
			if(col !== -1) return { x: x, y: col };
		}
		// No 'S' authored -- fall back to the first floor tile so a malformed
		// maze is still enterable rather than throwing on entry.
		for(x = 0; x < def.grid.length; x++) {
			for(var y = 0; y < def.grid[x].length; y++) {
				if(def.grid[x][y] === '.') return { x: x, y: y };
			}
		}
		return { x: 1, y: 1 };
	},

	isCleared: function(id, tag) {
		var cleared = $SM.get(Maze.statePath(id, 'cleared')) || {};
		return cleared[tag] === true;
	},

	markCleared: function(id, tag) {
		$SM.set(Maze.statePath(id, 'cleared["' + tag + '"]'), true, true);
	},

	/* Resets a maze back to its start. Does NOT clear progress -- doors stay
	 * unlocked and cleared fights stay cleared. Used when re-entering the
	 * location from the world map. */
	rewind: function(id) {
		var start = Maze.findStart(id);
		var def = Maze.get(id);
		Maze.setPos(id, {
			x: start.x, y: start.y,
			dir: (def.start && typeof def.start.dir === 'number') ? def.start.dir : 1
		});
	},

	/* ---- grid queries -------------------------------------------------- */

	charAt: function(id, x, y) {
		var def = Maze.get(id);
		if(x < 0 || x >= def.grid.length) return '#';
		var row = def.grid[x];
		if(y < 0 || y >= row.length) return '#';
		return row[y];
	},

	cellDef: function(id, x, y) {
		var c = Maze.charAt(id, x, y);
		if(c === '#' || c === '.' || c === 'S') return null;
		return Maze.get(id).cells[c] || null;
	},

	/* A cell blocks movement if it is a wall, or a door whose key isn't held.
	 * Everything else -- including a trigger the player has already cleared --
	 * is walkable. */
	isBlocked: function(id, x, y) {
		var c = Maze.charAt(id, x, y);
		if(c === '#') return true;
		var cell = Maze.cellDef(id, x, y);
		if(cell && cell.type === 'door') {
			return !Maze.doorOpen(cell);
		}
		return false;
	},

	doorOpen: function(cell) {
		if(typeof cell.open === 'function') return !!cell.open();
		if(cell.key) return !!$SM.get(cell.key);
		return true;
	},

	/* ---- rendering ------------------------------------------------------
	 *
	 * The view is built by starting from the perspective lines (an X of
	 * receding diagonals) and stamping wall panels over the top, nearest
	 * depth last so closer geometry occludes further geometry. Same approach
	 * as the classic ASCII maze renderers, generalised so the depth bands are
	 * data rather than a hardcoded ladder of if-statements.
	 *
	 * Each band is [leftCol, width] for the side walls at that depth, and the
	 * front wall spans between them.
	 * ------------------------------------------------------------------- */

	/* Perspective geometry.
	 *
	 * DEPTHS[d] gives the corridor opening at depth d as [leftCol, topRow].
	 * The opening is symmetric, so the right edge is VIEW_W-1-left and the
	 * bottom is VIEW_H-1-top. Openings shrink with distance, which is what
	 * produces the vanishing point.
	 *
	 * A side wall at depth d is the trapezoid between opening d and opening
	 * d+1; a front wall fills opening d entirely. Keeping this as data rather
	 * than a ladder of hardcoded coordinates means the view size and depth
	 * can be retuned by editing one table.
	 */
	DEPTHS: [
		[0, 0],
		[4, 2],
		[7, 4],
		[9, 5],
		[10, 6]
	],

	left: function(d) { return Maze.DEPTHS[d][0]; },
	top: function(d) { return Maze.DEPTHS[d][1]; },
	right: function(d) { return Maze.VIEW_W - 1 - Maze.left(d); },
	bottom: function(d) { return Maze.VIEW_H - 1 - Maze.top(d); },

	blankView: function() {
		var view = [];
		for(var r = 0; r < Maze.VIEW_H; r++) {
			view.push(repeatChar(' ', Maze.VIEW_W));
		}
		return view;
	},

	put: function(view, r, c, ch) {
		if(r < 0 || r >= Maze.VIEW_H || c < 0 || c >= Maze.VIEW_W) return;
		view[r] = view[r].substring(0, c) + ch + view[r].substring(c + 1);
	},

	/* Receding diagonals for ONE side of ONE depth band.
	 *
	 * Drawn only where a side wall ISN'T -- an open side reads as a gap with
	 * the floor and ceiling lines running away from the player, which is how
	 * the player spots a turning. If diagonals were drawn everywhere they'd
	 * be decoration; drawn only at openings they're information. */
	drawOpening: function(view, d, side) {
		var c0, c1;
		if(side < 0) { c0 = Maze.left(d); c1 = Maze.left(d + 1); }
		else { c0 = Maze.right(d + 1); c1 = Maze.right(d); }

		var t0 = Maze.top(d), t1 = Maze.top(d + 1);
		var span = Math.max(1, c1 - c0);
		for(var i = 0; i <= span; i++) {
			var c = c0 + i;
			var frac = (side < 0) ? (i / span) : (1 - i / span);
			var rTop = Math.round(t0 + (t1 - t0) * frac);
			var rBot = Maze.VIEW_H - 1 - rTop;
			Maze.put(view, rTop, c, side < 0 ? '\\' : '/');
			Maze.put(view, rBot, c, side < 0 ? '/' : '\\');
		}
	},

	/* A side wall: the trapezoid between opening d and opening d+1.
	 * `side` is -1 for left, +1 for right. */
	drawSideWall: function(view, d, side) {
		var c0, c1;
		if(side < 0) { c0 = Maze.left(d); c1 = Maze.left(d + 1); }
		else { c0 = Maze.right(d + 1); c1 = Maze.right(d); }

		var t0 = Maze.top(d), t1 = Maze.top(d + 1);
		var span = Math.max(1, c1 - c0);

		for(var i = 0; i <= span; i++) {
			var c = c0 + i;
			// Interpolate the wall's top and bottom edge along the diagonal.
			var frac = (side < 0) ? (i / span) : (1 - i / span);
			var rTop = Math.round(t0 + (t1 - t0) * frac);
			var rBot = Maze.VIEW_H - 1 - rTop;
			Maze.put(view, rTop, c, '=');
			Maze.put(view, rBot, c, '=');
			for(var r = rTop + 1; r < rBot; r++) {
				Maze.put(view, r, c, '.');
			}
		}

		// Vertical edge at the far end of the panel, so adjacent cells read as
		// separate walls rather than one continuous smear.
		var edge = (side < 0) ? c1 : c0;
		for(var r2 = Maze.top(d + 1); r2 <= Maze.VIEW_H - 1 - Maze.top(d + 1); r2++) {
			Maze.put(view, r2, edge, '|');
		}
	},

	/* A front wall fills opening d completely. */
	drawFrontWall: function(view, d, label) {
		var l = Maze.left(d), r = Maze.right(d);
		var t = Maze.top(d), b = Maze.bottom(d);
		for(var row = t; row <= b; row++) {
			for(var col = l; col <= r; col++) {
				var edge = (row === t || row === b);
				Maze.put(view, row, col, edge ? '=' : '.');
			}
		}
		if(label) {
			var mid = Math.floor((t + b) / 2);
			var width = r - l + 1;
			if(width >= label.length + 2) {
				var startCol = l + Math.floor((width - label.length) / 2);
				for(var i = 0; i < label.length; i++) {
					Maze.put(view, mid, startCol + i, label[i]);
				}
			}
		}
	},

	/* Builds the ASCII view from the player's position and facing.
	 *
	 * Drawn far-to-near so nearer geometry overwrites further geometry --
	 * that painter's ordering is what makes occlusion work without any
	 * depth buffer. */
	buildView: function(id) {
		var pos = Maze.getPos(id);
		var view = Maze.blankView();
		var dir = Maze.DIRS[pos.dir];
		var lDir = Maze.DIRS[(pos.dir + 3) % 4];
		var rDir = Maze.DIRS[(pos.dir + 1) % 4];

		var maxDepth = Maze.DEPTHS.length - 1;

		// How far the corridor runs before something blocks it.
		var blockedAt = maxDepth;
		for(var d = 1; d <= maxDepth; d++) {
			if(Maze.isBlocked(id, pos.x + dir.dx * d, pos.y + dir.dy * d)) {
				blockedAt = d;
				break;
			}
		}

		for(var depth = Math.min(blockedAt, maxDepth) - 1; depth >= 0; depth--) {
			var x = pos.x + dir.dx * depth;
			var y = pos.y + dir.dy * depth;

			// Wall or opening, per side, at this depth.
			if(Maze.isBlocked(id, x + lDir.dx, y + lDir.dy)) {
				Maze.drawSideWall(view, depth, -1);
			} else {
				Maze.drawOpening(view, depth, -1);
			}
			if(Maze.isBlocked(id, x + rDir.dx, y + rDir.dy)) {
				Maze.drawSideWall(view, depth, 1);
			} else {
				Maze.drawOpening(view, depth, 1);
			}
		}

		// The wall the corridor ends at, drawn last at its own depth.
		if(blockedAt <= maxDepth) {
			var fx = pos.x + dir.dx * blockedAt;
			var fy = pos.y + dir.dy * blockedAt;
			var cell = Maze.cellDef(id, fx, fy);
			var label = null;
			if(cell && cell.type === 'door') {
				label = Maze.doorOpen(cell) ? null : _('LOCKED');
			}
			Maze.drawFrontWall(view, blockedAt, label);
		}

		return view;
	},

	/* ---- interaction ---------------------------------------------------- */

	turn: function(id, delta) {
		var pos = Maze.getPos(id);
		pos.dir = (pos.dir + delta + 4) % 4;
		Maze.setPos(id, pos);
		Maze.redraw(id);
	},

	forward: function(id) {
		var pos = Maze.getPos(id);
		var dir = Maze.DIRS[pos.dir];
		var nx = pos.x + dir.dx, ny = pos.y + dir.dy;

		if(Maze.isBlocked(id, nx, ny)) {
			var cell = Maze.cellDef(id, nx, ny);
			if(cell && cell.type === 'door') {
				Notifications.notify(null, cell.lockedText || _('the door is locked.'));
			}
			return;
		}

		pos.x = nx; pos.y = ny;
		Maze.setPos(id, pos);
		Maze.redraw(id);
		Maze.checkTrigger(id);
	},

	back: function(id) {
		// Turn around rather than reversing blindly, so the player's facing
		// always matches what they're looking at.
		Maze.turn(id, 2);
	},

	/* Fires the cell the player just stepped onto, if any.
	 *
	 * Routes to a SIBLING SCENE of the same event, so the target is an
	 * ordinary combat/story scene with all the usual machinery. It must route
	 * back to the maze scene to resume. */
	checkTrigger: function(id) {
		var pos = Maze.getPos(id);
		var cell = Maze.cellDef(id, pos.x, pos.y);
		if(!cell) return false;

		var tag = cell.tag || (pos.x + ',' + pos.y);
		if(cell.once && Maze.isCleared(id, tag)) return false;

		if(cell.type === 'combat' || cell.type === 'scene' || cell.type === 'exit') {
			if(cell.once) Maze.markCleared(id, tag);
			if(typeof cell.onEnter === 'function') cell.onEnter();
			if(cell.scene) {
				Maze.teardown();
				Events.loadScene(cell.scene);
				return true;
			}
		}
		return false;
	},

	/* ---- lifecycle ------------------------------------------------------ */

	/* Called from a scene's onRender. Draws the maze into the event panel and
	 * binds controls. */
	render: function(id, sceneName) {
		if(!Maze.get(id)) {
			Engine.log('ERROR: no maze defined with id ' + id);
			return;
		}
		Maze.teardown();
		Maze._active = id;
		Maze._scene = sceneName;

		var panel = Events.eventPanel();
		var desc = $('#description', panel);

		var wrap = $('<div>').addClass('mazeWrap').appendTo(desc);
		$('<pre>').addClass('mazeView').appendTo(wrap);
		$('<div>').addClass('mazeReadout').appendTo(wrap);

		/* Touch/click zones on the four edges. Sized generously and given
		 * their own labels because this has to work on a phone, where there
		 * is no keyboard at all -- the arrow-key path cannot be the only way
		 * to play a location. */
		var pad = $('<div>').addClass('mazePad').appendTo(wrap);
		$('<div>').addClass('mazeBtn mazeUp').text('\u25B2').appendTo(pad)
			.click(function() { Maze.forward(id); });
		$('<div>').addClass('mazeBtn mazeLeft').text('\u25C0').appendTo(pad)
			.click(function() { Maze.turn(id, -1); });
		$('<div>').addClass('mazeBtn mazeRight').text('\u25B6').appendTo(pad)
			.click(function() { Maze.turn(id, 1); });
		$('<div>').addClass('mazeBtn mazeDown').text('\u25BC').appendTo(pad)
			.click(function() { Maze.back(id); });

		Maze.bindKeys(id);
		Maze.redraw(id);
	},

	/* Events set Engine.keyLock = true for their whole duration, which stops
	 * Engine's own keyDown dispatcher from routing anything to a module. So
	 * the maze binds its own document listener while it is on screen, and
	 * removes it again in teardown(). Anything that leaves a listener behind
	 * would keep stealing arrow keys after the player has left the maze. */
	bindKeys: function(id) {
		Maze._keyHandler = function(e) {
			var handled = true;
			switch(e.which) {
				case 38: case 87: Maze.forward(id); break;   // up / W
				case 37: case 65: Maze.turn(id, -1); break;  // left / A
				case 39: case 68: Maze.turn(id, 1); break;   // right / D
				case 40: case 83: Maze.back(id); break;      // down / S
				default: handled = false;
			}
			if(handled) {
				e.preventDefault();
				e.stopPropagation();
			}
		};
		$(document).on('keydown.maze', Maze._keyHandler);
	},

	teardown: function() {
		if(Maze._keyHandler) {
			$(document).off('keydown.maze');
			Maze._keyHandler = null;
		}
		Maze._active = null;
		Maze._scene = null;
	},

	redraw: function(id) {
		/* Guarded: redraw is reachable from a key handler, and a key can land
		 * in the gap after the event has torn down but before teardown() has
		 * unbound the listener. Without this the player gets a console error
		 * for pressing an arrow key at the wrong moment. */
		if(!Events.activeEvent()) { return; }
		var panel = Events.eventPanel();
		var view = Maze.buildView(id);
		$('.mazeView', panel).text(view.join('\n'));

		var pos = Maze.getPos(id);
		var def = Maze.get(id);
		var label = def.label ? def.label + ' \u2014 ' : '';
		$('.mazeReadout', panel).text(
			label + _('facing {0}', _(Maze.DIRS[pos.dir].name)));
	}
};

/* String.repeat isn't available in every environment this ships to, and the
 * renderer calls this on every frame -- kept as a tiny helper rather than
 * assuming. */
function repeatChar(c, n) {
	var s = '';
	for(var i = 0; i < n; i++) s += c;
	return s;
}
