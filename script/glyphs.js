/**
 * Glyph puzzles.
 *
 * Latin-square-with-regions puzzles (the Mass Effect: Andromeda remnant
 * decryption rules) rendered into an event panel:
 *
 *   - a grid of glyph symbols
 *   - locked glyphs, which cannot be changed
 *   - open glyphs, which the player cycles through the symbol set
 *   - no symbol may repeat in any row or any column
 *   - no symbol may repeat inside a bounded region (the heavy interior lines)
 *
 * Two presets. 4x4 with 2x2 regions is the standard lock. 6x6 with 3x2
 * regions is the deep chamber. Note that a 5x5 grid can't be used with these
 * rules as written: 5 is prime, so the square can't be tiled into equal
 * rectangular regions, and the region constraint would have nothing to bound.
 * 6x6 gives a genuinely harder puzzle while keeping every stated rule intact.
 *
 * Puzzles are generated at runtime rather than hardcoded, and every generated
 * puzzle is verified to have exactly one solution before it's handed over --
 * an ambiguous lock the player can't reason their way out of would be worse
 * than no lock at all.
 *
 * Glyphs are Glagolitic (U+2C00 onward).
 */
var Glyphs = {

	// Ⰰ Ⰱ Ⰲ Ⰳ Ⰴ Ⰵ
	SYMBOLS: ['\u2C00', '\u2C01', '\u2C02', '\u2C03', '\u2C04', '\u2C05'],

	PRESETS: {
		standard: { size: 4, boxW: 2, boxH: 2, givens: 7 },
		deep:     { size: 6, boxW: 3, boxH: 2, givens: 14 }
	},

	/* ---- generation ---------------------------------------------------- */

	/* A valid filled grid, built by the standard shifted-band construction
	 * and then scrambled with transformations that preserve validity:
	 * relabelling symbols, swapping rows inside a band, swapping bands, and
	 * the same for columns. */
	generateSolution: function(cfg) {
		var size = cfg.size, boxW = cfg.boxW, boxH = cfg.boxH;
		var grid = [];
		for(var r = 0; r < size; r++) {
			grid[r] = [];
			for(var c = 0; c < size; c++) {
				/* Standard shifted-band construction. The row shift must be
				 * boxW * (r % boxH) + floor(r / boxH) -- using boxH as the
				 * multiplier only happens to work when the regions are square,
				 * which is why the 4x4 preset was fine and 6x6 (3x2) was not. */
				grid[r][c] = (cfg.boxW * (r % boxH) + Math.floor(r / boxH) + c) % size;
			}
		}

		// relabel
		var perm = [];
		for(var i = 0; i < size; i++) perm.push(i);
		Glyphs.shuffle(perm);
		for(r = 0; r < size; r++) {
			for(c = 0; c < size; c++) {
				grid[r][c] = perm[grid[r][c]];
			}
		}

		// swap rows within each band, and swap whole bands
		var bands = size / boxH;
		for(var b = 0; b < bands; b++) {
			for(var n = 0; n < boxH; n++) {
				var r1 = b * boxH + Math.floor(Math.random() * boxH);
				var r2 = b * boxH + Math.floor(Math.random() * boxH);
				var tmp = grid[r1]; grid[r1] = grid[r2]; grid[r2] = tmp;
			}
		}

		// transpose, repeat, transpose back -- gives the column equivalents
		grid = Glyphs.transpose(grid);
		var stacks = size / boxW;
		for(b = 0; b < stacks; b++) {
			for(n = 0; n < boxW; n++) {
				var c1 = b * boxW + Math.floor(Math.random() * boxW);
				var c2 = b * boxW + Math.floor(Math.random() * boxW);
				var t2 = grid[c1]; grid[c1] = grid[c2]; grid[c2] = t2;
			}
		}
		grid = Glyphs.transpose(grid);

		return grid;
	},

	transpose: function(grid) {
		var out = [];
		for(var r = 0; r < grid.length; r++) {
			for(var c = 0; c < grid[r].length; c++) {
				out[c] = out[c] || [];
				out[c][r] = grid[r][c];
			}
		}
		return out;
	},

	shuffle: function(arr) {
		for(var i = arr.length - 1; i > 0; i--) {
			var j = Math.floor(Math.random() * (i + 1));
			var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
		}
		return arr;
	},

	/* Is placing `val` at (r,c) legal given what's already on the board? */
	isLegal: function(grid, cfg, r, c, val) {
		var size = cfg.size;
		for(var i = 0; i < size; i++) {
			if(i !== c && grid[r][i] === val) return false;
			if(i !== r && grid[i][c] === val) return false;
		}
		var r0 = Math.floor(r / cfg.boxH) * cfg.boxH;
		var c0 = Math.floor(c / cfg.boxW) * cfg.boxW;
		for(var rr = r0; rr < r0 + cfg.boxH; rr++) {
			for(var cc = c0; cc < c0 + cfg.boxW; cc++) {
				if((rr !== r || cc !== c) && grid[rr][cc] === val) return false;
			}
		}
		return true;
	},

	/* Counts solutions, stopping as soon as `limit` is reached. Used to reject
	 * any puzzle that isn't uniquely solvable. */
	countSolutions: function(grid, cfg, limit) {
		var size = cfg.size;
		var found = 0;

		function solve() {
			var br = -1, bc = -1;
			for(var r = 0; r < size && br < 0; r++) {
				for(var c = 0; c < size; c++) {
					if(grid[r][c] === null) { br = r; bc = c; break; }
				}
			}
			if(br < 0) { found++; return; }
			for(var v = 0; v < size; v++) {
				if(Glyphs.isLegal(grid, cfg, br, bc, v)) {
					grid[br][bc] = v;
					solve();
					grid[br][bc] = null;
					if(found >= limit) return;
				}
			}
		}

		solve();
		return found;
	},

	/* Builds a puzzle: a solution, plus a mask of which cells start locked.
	 * Cells are removed one at a time and any removal that makes the puzzle
	 * ambiguous is put back, so the result always has exactly one solution. */
	generate: function(presetName) {
		var cfg = Glyphs.PRESETS[presetName] || Glyphs.PRESETS.standard;
		var size = cfg.size;
		var solution = Glyphs.generateSolution(cfg);

		var working = [];
		var locked = [];
		for(var r = 0; r < size; r++) {
			working[r] = solution[r].slice();
			locked[r] = [];
			for(var c = 0; c < size; c++) locked[r][c] = true;
		}

		var cells = [];
		for(r = 0; r < size; r++) {
			for(var c2 = 0; c2 < size; c2++) cells.push([r, c2]);
		}
		Glyphs.shuffle(cells);

		var remaining = size * size;
		for(var i = 0; i < cells.length && remaining > cfg.givens; i++) {
			var cr = cells[i][0], cc = cells[i][1];
			var saved = working[cr][cc];
			working[cr][cc] = null;
			locked[cr][cc] = false;
			if(Glyphs.countSolutions(working, cfg, 2) !== 1) {
				// Ambiguous without this clue -- put it back.
				working[cr][cc] = saved;
				locked[cr][cc] = true;
			} else {
				remaining--;
			}
		}

		return {
			cfg: cfg,
			solution: solution,
			locked: locked,
			// what the player starts with: locked values, nulls elsewhere
			start: working
		};
	},

	/* ---- rendering ------------------------------------------------------ */

	/* Draws the puzzle into `container` and calls onSolved() once every cell
	 * is filled and every constraint holds. onSolved fires at most once. */
	render: function(container, puzzle, onSolved) {
		var cfg = puzzle.cfg;
		var size = cfg.size;
		var state = [];
		var solved = false;

		for(var r = 0; r < size; r++) {
			state[r] = puzzle.start[r].slice();
		}

		var grid = $('<div>').addClass('glyphGrid').attr('data-size', size).appendTo(container);

		function conflicted(r, c) {
			var v = state[r][c];
			if(v === null) return false;
			return !Glyphs.isLegal(state, cfg, r, c, v);
		}

		function refresh() {
			var complete = true;
			var clean = true;
			for(var rr = 0; rr < size; rr++) {
				for(var cc = 0; cc < size; cc++) {
					var cell = $('#glyph_' + rr + '_' + cc, grid);
					var v = state[rr][cc];
					cell.text(v === null ? '' : Glyphs.SYMBOLS[v]);
					var bad = conflicted(rr, cc);
					cell.toggleClass('conflict', bad);
					if(v === null) complete = false;
					if(bad) clean = false;
				}
			}
			if(complete && clean && !solved) {
				solved = true;
				grid.addClass('solved');
				if(typeof onSolved === 'function') onSolved();
			}
		}

		for(r = 0; r < size; r++) {
			var row = $('<div>').addClass('glyphRow').appendTo(grid);
			for(var c = 0; c < size; c++) {
				var isLocked = puzzle.locked[r][c];
				var cell = $('<div>')
					.attr('id', 'glyph_' + r + '_' + c)
					.addClass('glyphCell')
					.addClass(isLocked ? 'locked' : 'open')
					.appendTo(row);

				// heavy lines on region boundaries
				if((c + 1) % cfg.boxW === 0 && c !== size - 1) cell.addClass('boxRight');
				if((r + 1) % cfg.boxH === 0 && r !== size - 1) cell.addClass('boxBottom');

				if(!isLocked) {
					(function(rr, cc, el) {
						el.click(function() {
							if(solved) return;
							/* Cycle blank -> first symbol -> ... -> last -> blank.
							 * Cycling rather than a picker keeps this playable
							 * with one input, the way every other control in
							 * the game is. */
							var v = state[rr][cc];
							state[rr][cc] = (v === null) ? 0 : (v + 1 >= size ? null : v + 1);
							refresh();
						});
					})(r, c, cell);
				}
			}
		}

		refresh();
		return {
			isSolved: function() { return solved; },
			reveal: function() {
				for(var rr = 0; rr < size; rr++) state[rr] = puzzle.solution[rr].slice();
				refresh();
			}
		};
	}
};
