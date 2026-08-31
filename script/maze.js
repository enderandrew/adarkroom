/**
 * ASCII first-person maze with depth shading and enhanced visual geometry.
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

	// Set to true to force display the map during testing
	forceShowMap: false,

	DIRS: [
		{ dx: -1, dy: 0, name: 'north' },
		{ dx: 0, dy: 1, name: 'east' },
		{ dx: 1, dy: 0, name: 'south' },
		{ dx: 0, dy: -1, name: 'west' }
	],

	_defs: {},
	_active: null,
	_scene: null,
	_keyHandler: null,
	_stylesInjected: false,

	/* Set by checkTrigger() when the player steps onto a `once`-flagged
	 * combat cell, and consumed by confirmPendingClear() only if that fight
	 * is actually won -- see both for why. Deliberately NOT persisted
	 * through $SM: it only needs to bridge the gap between stepping onto
	 * the tile and the fight resolving, both of which happen within the
	 * same page session. */
	_pendingClear: null,

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

	/* ---- visited tracking for automap --------------------------------- */

	isVisited: function(id, x, y) {
		var visited = $SM.get(Maze.statePath(id, 'visited')) || {};
		return visited[x + ',' + y] === true;
	},

	markVisited: function(id, x, y) {
		var def = Maze.get(id);
		// Mark current cell and adjacent tiles so wall outlines are revealed
		for(var dx = -1; dx <= 1; dx++) {
			for(var dy = -1; dy <= 1; dy++) {
				var vx = x + dx, vy = y + dy;
				if(vx >= 0 && vx < def.grid.length && vy >= 0 && vy < def.grid[vx].length) {
					$SM.set(Maze.statePath(id, 'visited["' + vx + ',' + vy + '"]'), true, true);
				}
			}
		}
	},

	hasScout: function() {
		if(Maze.forceShowMap) return true;
		if(typeof World !== 'undefined' && typeof World.hasPerk === 'function') {
			if(World.hasPerk('scout')) return true;
		}
		return !!($SM.get('character.perks["scout"]') || $SM.get('character.perks.scout'));
	},

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

	/* ---- rendering & depth geometry ---------------------------------- */

	DEPTHS: [
		[0, 0],
		[5, 2],
		[9, 4],
		[12, 5],
		[14, 6]
	],

	left: function(d) { return Maze.DEPTHS[d][0]; },
	top: function(d) { return Maze.DEPTHS[d][1]; },
	right: function(d) { return Maze.VIEW_W - 1 - Maze.left(d); },
	bottom: function(d) { return Maze.VIEW_H - 1 - Maze.top(d); },

	blankView: function() {
		var view = [];
		for(var r = 0; r < Maze.VIEW_H; r++) {
			var row = [];
			for(var c = 0; c < Maze.VIEW_W; c++) {
				row.push({ ch: ' ', depth: 4 });
			}
			view.push(row);
		}
		return view;
	},

	put: function(view, r, c, ch, depth) {
		if(r < 0 || r >= Maze.VIEW_H || c < 0 || c >= Maze.VIEW_W) return;
		view[r][c] = { ch: ch, depth: (typeof depth === 'number') ? depth : 4 };
	},

	/* A side opening.
	 *
	 * The thing this has to communicate is "you can turn here", and the
	 * previous version only really said it at the end of a corridor. Three
	 * changes, all aimed at that:
	 *
	 *   - The near edge of the gap is drawn as a full-height doorway jamb
	 *     rather than the same '|' used for wall texture, so the eye reads a
	 *     frame rather than more corridor.
	 *   - The floor and ceiling of the gap are filled in receding, so the
	 *     opening reads as a volume you could walk into instead of a hole in
	 *     a line. This is the trick the reference images use: the branch is
	 *     shaded, not just outlined.
	 *   - The gap interior is left EMPTY (space), which against the filled
	 *     wall texture on either side makes the branch read instantly, even
	 *     in peripheral vision while moving. */
	drawOpening: function(view, d, side) {
		var c0, c1;
		if(side < 0) { c0 = Maze.left(d); c1 = Maze.left(d + 1); }
		else { c0 = Maze.right(d + 1); c1 = Maze.right(d); }

		var t0 = Maze.top(d), t1 = Maze.top(d + 1);
		var b0 = Maze.bottom(d), b1 = Maze.bottom(d + 1);

		var span = Math.max(1, Math.abs(c1 - c0));

		/* Ceiling and floor of the opening, receding to the far jamb. Drawn
		 * first so the jambs below overwrite their endpoints. */
		for(var i = 1; i < span; i++) {
			var cc = (side < 0) ? c0 + i : c1 - i;
			var fr = i / span;
			var rT = Math.round(t0 + (t1 - t0) * fr);
			var rB = Math.round(b0 - (b0 - b1) * fr);

			Maze.put(view, rT, cc, side < 0 ? '\\' : '/', d);
			Maze.put(view, rB, cc, side < 0 ? '/' : '\\', d);

			/* Nothing between them: the void is what makes it read as a way
			 * through rather than as decoration on a wall. */
			for(var rv = rT + 1; rv < rB; rv++) {
				Maze.put(view, rv, cc, ' ', d + 1);
			}
		}

		/* Near jamb -- the edge closest to the player, and the one that
		 * actually announces the turn. Corners get '+', the shaft gets a
		 * heavier rule than plain wall texture. */
		var nearCol = (side < 0) ? c0 : c1;
		for(var r = t0; r <= b0; r++) {
			var ch = (r === t0 || r === b0) ? '+' : '|';
			Maze.put(view, r, nearCol, ch, d);
		}

		/* Far jamb, one depth back so it shades lighter and the opening has
		 * an obvious near/far. */
		var farCol = (side < 0) ? c1 : c0;
		for(var rFar = t1; rFar <= b1; rFar++) {
			var chFar = (rFar === t1 || rFar === b1) ? '+' : '|';
			Maze.put(view, rFar, farCol, chFar, d + 1);
		}
	},

	drawSideWall: function(view, d, side) {
		var c0, c1;
		if(side < 0) { c0 = Maze.left(d); c1 = Maze.left(d + 1); }
		else { c0 = Maze.right(d + 1); c1 = Maze.right(d); }

		var t0 = Maze.top(d), t1 = Maze.top(d + 1);
		var b0 = Maze.bottom(d), b1 = Maze.bottom(d + 1);
		var span = Math.max(1, Math.abs(c1 - c0));

		for(var i = 0; i <= span; i++) {
			var c = (side < 0) ? c0 + i : c1 - i;
			var frac = i / span;
			var rTop = Math.round(t0 + (t1 - t0) * frac);
			var rBot = Math.round(b0 - (b0 - b1) * frac);

			Maze.put(view, rTop, c, '=', d);
			Maze.put(view, rBot, c, '=', d);

			for(var r = rTop + 1; r < rBot; r++) {
				var wallChar = (d === 0) ? '|' : (d === 1 ? ':' : '.');
				Maze.put(view, r, c, wallChar, d);
			}
		}

		var edgeCol = (side < 0) ? c1 : c0;
		for(var rEdge = t1; rEdge <= b1; rEdge++) {
			var edgeChar = (rEdge === t1 || rEdge === b1) ? '+' : '|';
			Maze.put(view, rEdge, edgeCol, edgeChar, d);
		}
	},

	drawFrontWall: function(view, d, label) {
		var l = Maze.left(d), r = Maze.right(d);
		var t = Maze.top(d), b = Maze.bottom(d);

		for(var row = t; row <= b; row++) {
			for(var col = l; col <= r; col++) {
				var isTopBot = (row === t || row === b);
				var isSide = (col === l || col === r);
				var ch = '+';

				if(isTopBot && isSide) ch = '+';
				else if(isTopBot) ch = '=';
				else if(isSide) ch = '|';
				else ch = (d <= 1) ? '+' : (d === 2 ? '#' : '.');

				Maze.put(view, row, col, ch, d);
			}
		}

		if(label) {
			var mid = Math.floor((t + b) / 2);
			var width = r - l + 1;
			if(width >= label.length + 2) {
				var startCol = l + Math.floor((width - label.length) / 2);
				for(var i = 0; i < label.length; i++) {
					Maze.put(view, mid, startCol + i, label[i], d);
				}
			}
		}
	},

	/* A single glyph on the floor at the centre of a cell's own depth.
	 *
	 * '*' for a scene, 'x' for a fight-in-waiting -- distinguishable from
	 * every character the corridor geometry itself uses ('+', '=', '|',
	 * '/', '\\', '.', '#'), so it cannot be mistaken for wall or floor
	 * texture at a glance. */
	drawFloorMark: function(view, d, ch) {
		var midCol = Math.floor((Maze.left(d) + Maze.right(d)) / 2);
		Maze.put(view, Maze.bottom(d), midCol, ch, d);
	},

	buildView: function(id) {
		var pos = Maze.getPos(id);
		var view = Maze.blankView();
		var dir = Maze.DIRS[pos.dir];
		var lDir = Maze.DIRS[(pos.dir + 3) % 4];
		var rDir = Maze.DIRS[(pos.dir + 1) % 4];

		var maxDepth = Maze.DEPTHS.length - 1;

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

			/* Mark a walkable point of interest on the floor ahead.
			 *
			 * A 'scene' or 'combat' cell -- doors already get a LOCKED label
			 * on their front wall, but these are floor tiles, not walls, and
			 * buildView never gave them ANY visual distinction from ordinary
			 * floor. checkTrigger fires correctly when you walk onto one --
			 * confirmed by simulation -- but nothing in the corridor told you
			 * it was there to walk onto, so finding it looked like nothing
			 * happened even when it worked exactly as designed.
			 *
			 * Skipped once cleared, so a one-shot scene (most of them are)
			 * stops drawing a marker for something that has already been
			 * read -- otherwise the floor keeps flagging a spot with nothing
			 * left to give. */
			if(depth > 0) {
				var poi = Maze.cellDef(id, x, y);
				if(poi && (poi.type === 'scene' || poi.type === 'combat')) {
					var tag = poi.tag || (x + ',' + y);
					if(!poi.once || !Maze.isCleared(id, tag)) {
						Maze.drawFloorMark(view, depth, poi.type === 'combat' ? 'x' : '*');
					}
				}
			}
		}

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

	/* ---- automap builder ------------------------------------------------ */

	buildMap: function(id) {
		var pos = Maze.getPos(id);
		var def = Maze.get(id);
		var grid = def.grid;
		var pChar = ['\u25B2', '\u25B6', '\u25BC', '\u25C0'][pos.dir];

		var html = '';
		for(var x = 0; x < grid.length; x++) {
			for(var y = 0; y < grid[x].length; y++) {
				if(x === pos.x && y === pos.y) {
					html += '<span class="maze-map-player">' + pChar + '</span>';
				} else if(Maze.isVisited(id, x, y)) {
					var ch = Maze.charAt(id, x, y);
					if(ch === '.') html += '<span class="maze-map-floor">.</span>';
					else if(ch === '#') html += '<span class="maze-map-wall">#</span>';
					else html += '<span class="maze-map-poi">' + ch + '</span>';
				} else {
					html += '&nbsp;';
				}
			}
			html += '\n';
		}
		return html;
	},

	/* ---- ambient flavour -------------------------------------------------
	 *
	 * A maze scene has ONE line of scene text, so after a few minutes of
	 * exploring you are reading the same sentence over and over while the
	 * view changes constantly. These pools give the space something to say
	 * as you move through it.
	 *
	 * Rerolled on ARRIVAL AT A NEW CELL, not on every redraw: rerolling on
	 * redraw means the line flickers every time you turn on the spot, which
	 * reads as noise rather than atmosphere. Tied to the cell so that turning
	 * around to look back gives you the same line the room gave you before --
	 * the place stays consistent while you are standing in it.
	 *
	 * Weighted so the base line still comes up often. It carries the actual
	 * mechanical hint (the lights follow you), so it should not be buried.
	 */
	AMBIENCE: {},

	defineAmbience: function(id, lines) {
		Maze.AMBIENCE[id] = lines;
	},

	ambienceFor: function(id) {
		var pool = Maze.AMBIENCE[id];
		if(!pool || pool.length === 0) { return null; }

		var pos = Maze.getPos(id);
		var key = pos.x + ',' + pos.y;
		var st = $SM.get(Maze.statePath(id, 'ambient'), true) || {};

		/* Same cell -> same line, so it does not churn while you look around. */
		if(st.key === key && typeof st.line === 'number' && pool[st.line]) {
			return Events.resolve(pool[st.line]);
		}

		var idx = Math.floor(Math.random() * pool.length);
		$SM.set(Maze.statePath(id, 'ambient'), { key: key, line: idx }, true);
		return Events.resolve(pool[idx]);
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
		var pos = Maze.getPos(id);
		var dir = Maze.DIRS[pos.dir];
		var bx = pos.x - dir.dx, by = pos.y - dir.dy;

		if(Maze.isBlocked(id, bx, by)) {
			var cell = Maze.cellDef(id, bx, by);
			if(cell && cell.type === 'door') {
				Notifications.notify(null, cell.lockedText || _('the door is locked.'));
			}
			return;
		}

		pos.x = bx; pos.y = by;
		Maze.setPos(id, pos);
		Maze.redraw(id);
		Maze.checkTrigger(id);
	},

	checkTrigger: function(id) {
		var pos = Maze.getPos(id);
		var cell = Maze.cellDef(id, pos.x, pos.y);
		if(!cell) return false;

		var tag = cell.tag || (pos.x + ',' + pos.y);
		if(cell.once && Maze.isCleared(id, tag)) return false;

		if(cell.type === 'combat' || cell.type === 'scene' || cell.type === 'exit') {
			if(cell.once) {
				if(cell.type === 'combat') {
					/* Deferred -- see confirmPendingClear(). Marking cleared
					 * here, before the fight even starts, meant the tag was
					 * permanently disarmed the instant the player stepped
					 * onto it, whether the fight that followed was won OR
					 * lost. A death sends the player home without touching
					 * any maze state (see World.die()), so a player who
					 * died here came back to find this encounter already
					 * cleared -- a free pass past an enemy they never beat. */
					Maze._pendingClear = { id: id, tag: tag };
				} else {
					Maze.markCleared(id, tag);
				}
			}
			if(typeof cell.onEnter === 'function') cell.onEnter();
			if(cell.scene) {
				Maze.teardown();
				Events.loadScene(cell.scene);
				return true;
			}
		}
		return false;
	},

	/* Applies a combat cell's deferred "cleared" mark, but only once the
	 * fight is actually won. Called from Events.winFight(), so every maze
	 * combat cell in every dungeon gets correct win/loss handling for free,
	 * with no per-scene wiring required in prison.js, lab.js, or any future
	 * maze. A death, or any other non-win exit from the fight, leaves
	 * _pendingClear unconsumed, so the encounter is still live the next
	 * time the player reaches that tile. */
	confirmPendingClear: function() {
		if(Maze._pendingClear) {
			Maze.markCleared(Maze._pendingClear.id, Maze._pendingClear.tag);
			Maze._pendingClear = null;
		}
	},

	/* Discards a deferred clear without applying it. Belt-and-braces: called
	 * from World.die() so a pending clear can never survive past the fight
	 * it belongs to and accidentally attach itself to a later, unrelated
	 * encounter. */
	discardPendingClear: function() {
		Maze._pendingClear = null;
	},

	/* ---- lifecycle & styles --------------------------------------------- */

	injectStyles: function() {
		if(Maze._stylesInjected) return;
		var css = 
			'/* Dynamically expand event panel modal width for maze view + map */\n' +
			'.eventPanel.maze-panel { width: 540px !important; margin-left: -100px; }\n' +
			'.mazeWrap { width: 100%; margin: 10px auto; display: flex; flex-direction: column; align-items: center; }\n' +
			'.mazeContainer { display: flex; gap: 16px; justify-content: center; align-items: flex-start; margin-bottom: 8px; }\n' +
			'pre.mazeView { font-family: "Courier New", Consolas, monospace !important; background: #000 !important; color: #fff !important; line-height: 1.0 !important; font-size: 13px !important; letter-spacing: 0px !important; user-select: none; margin: 0 !important; text-align: left !important; padding: 6px; border: 1px solid #333; }\n' +
			'pre.mazeMap { font-family: "Courier New", Consolas, monospace !important; background: #080808 !important; border: 1px solid #333 !important; padding: 6px; color: #666; line-height: 1.0 !important; font-size: 12px !important; letter-spacing: 0px !important; user-select: none; margin: 0 !important; display: none; text-align: left !important; }\n' +
			'.maze-map-player { color: #00ffff; font-weight: bold; }\n' +
			'.maze-map-wall { color: #444444; }\n' +
			'.maze-map-floor { color: #888888; }\n' +
			'.maze-map-poi { color: #ffaa00; font-weight: bold; }\n' +
			'.maze-d0 { color: #ffffff; opacity: 1.0; text-shadow: 0 0 2px #fff; }\n' +
			'.maze-d1 { color: #d0d0d0; opacity: 0.85; }\n' +
			'.maze-d2 { color: #999999; opacity: 0.65; }\n' +
			'.maze-d3 { color: #666666; opacity: 0.45; }\n' +
			'.maze-d4 { color: #333333; opacity: 0.25; }\n';

		$('<style>').text(css).appendTo('head');
		Maze._stylesInjected = true;
	},

	render: function(id, sceneName) {
		if(!Maze.get(id)) {
			Engine.log('ERROR: no maze defined with id ' + id);
			return;
		}
		Maze.injectStyles();
		Maze.teardown();
		Maze._active = id;
		Maze._scene = sceneName;

		var panel = Events.eventPanel();
		panel.addClass('maze-panel');
		var desc = $('#description', panel);

		var wrap = $('<div>').addClass('mazeWrap').appendTo(desc);
		var container = $('<div>').addClass('mazeContainer').appendTo(wrap);
		$('<pre>').addClass('mazeView').appendTo(container);
		$('<pre>').addClass('mazeMap').appendTo(container);
		$('<div>').addClass('mazeReadout').appendTo(wrap);

		var pad = $('<div>').addClass('mazePad').appendTo(wrap);
		$('<div>').addClass('mazeBtn mazeUp').text('\u25B2').appendTo(pad)
			.click(function() { Maze.forward(id); });
		$('<div>').addClass('mazeBtn mazeLeft').text('\u25C0').appendTo(pad)
			.click(function() { Maze.turn(id, -1); });
		$('<div>').addClass('mazeBtn mazeRight').text('\u25B6').appendTo(pad)
			.click(function() { Maze.turn(id, 1); });
		$('<div>').addClass('mazeBtn mazeDown').text('\u25BC').appendTo(pad)
			.click(function() { Maze.back(id); });

		Maze.setDistressContext(id);
		Maze.bindKeys(id);
		Maze.redraw(id);
	},

	/* Tells Distress which interior the player is standing in.
	 *
	 * Derived from the maze id by prefix rather than passed in, so a new maze
	 * in either location picks up the right ambience by naming alone and
	 * cannot be forgotten. Anything unrecognised gets no context, and so no
	 * effect -- silence is the safe default for a place with no ambience
	 * written for it. */
	setDistressContext: function(id) {
		if(typeof Distress === 'undefined' || typeof Distress.setContext !== 'function') {
			return;
		}
		if(id.indexOf('lab') === 0) { Distress.setContext('lab'); }
		else if(id.indexOf('prison') === 0) { Distress.setContext('prison'); }
		else { Distress.setContext(null); }
	},

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
		/* Clears the ambience too. This runs when the maze scene is replaced
		 * -- including by a combat or story scene INSIDE the maze -- so a
		 * fight is never held under a pulsing screen. */
		if(typeof Distress !== 'undefined' && typeof Distress.clearContext === 'function') {
			Distress.clearContext();
		}

		if(Maze._keyHandler) {
			$(document).off('keydown.maze');
			Maze._keyHandler = null;
		}
		var panel = Events.eventPanel();
		if(panel) panel.removeClass('maze-panel');
		Maze._active = null;
		Maze._scene = null;
	},

	redraw: function(id) {
		if(!Events.activeEvent()) { return; }
		var panel = Events.eventPanel();
		var pos = Maze.getPos(id);

		Maze.markVisited(id, pos.x, pos.y);

		var view = Maze.buildView(id);
		var html = '';
		for(var r = 0; r < Maze.VIEW_H; r++) {
			var currentDepth = -1;
			for(var c = 0; c < Maze.VIEW_W; c++) {
				var cell = view[r][c];
				if(cell.depth !== currentDepth) {
					if(currentDepth !== -1) html += '</span>';
					html += '<span class="maze-d' + cell.depth + '">';
					currentDepth = cell.depth;
				}
				var ch = cell.ch;
				if(ch === '<') ch = '&lt;';
				else if(ch === '>') ch = '&gt;';
				else if(ch === '&') ch = '&amp;';
				html += ch;
			}
			if(currentDepth !== -1) html += '</span>';
			html += '\n';
		}
		$('.mazeView', panel).html(html);

		if(Maze.hasScout()) {
			$('.mazeMap', panel).html(Maze.buildMap(id)).css('display', 'block');
		} else {
			$('.mazeMap', panel).hide();
		}

		var def = Maze.get(id);
		var label = def.label ? def.label + ' \u2014 ' : '';
		$('.mazeReadout', panel).text(
			label + _('facing {0}', _(Maze.DIRS[pos.dir].name)));

		/* Ambient line under the compass readout rather than replacing the
		 * scene text: the scene text is written for the moment you ARRIVE and
		 * should stay put, and rewriting #description on every step would
		 * fight the event system for ownership of that node. */
		var flavour = Maze.ambienceFor(id);
		var fEl = $('.mazeFlavour', panel);
		if(flavour) {
			if(fEl.length === 0) {
				fEl = $('<div>').addClass('mazeFlavour').appendTo($('.mazeWrap', panel));
			}
			if(fEl.text() !== flavour) {
				fEl.text(flavour).css('opacity', 0).animate({ opacity: 1 }, 400);
			}
		} else {
			fEl.remove();
		}
	}
};

function repeatChar(c, n) {
	var s = '';
	for(var i = 0; i < n; i++) s += c;
	return s;
}