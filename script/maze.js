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

	drawOpening: function(view, d, side) {
		var c0, c1;
		if(side < 0) { c0 = Maze.left(d); c1 = Maze.left(d + 1); }
		else { c0 = Maze.right(d + 1); c1 = Maze.right(d); }

		var t0 = Maze.top(d), t1 = Maze.top(d + 1);
		var b0 = Maze.bottom(d), b1 = Maze.bottom(d + 1);

		var nearCol = (side < 0) ? c0 : c1;
		for(var r = t0; r <= b0; r++) {
			var ch = (r === t0 || r === b0) ? '+' : '|';
			Maze.put(view, r, nearCol, ch, d);
		}

		var span = Math.max(1, Math.abs(c1 - c0));
		for(var i = 1; i <= span; i++) {
			var c = (side < 0) ? c0 + i : c1 - i;
			var frac = i / span;
			var rTop = Math.round(t0 + (t1 - t0) * frac);
			var rBot = Math.round(b0 - (b0 - b1) * frac);

			Maze.put(view, rTop, c, side < 0 ? '\\' : '/', d);
			Maze.put(view, rBot, c, side < 0 ? '/' : '\\', d);
		}

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

		Maze.bindKeys(id);
		Maze.redraw(id);
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
	}
};

function repeatChar(c, n) {
	var s = '';
	for(var i = 0; i < n; i++) s += c;
	return s;
}