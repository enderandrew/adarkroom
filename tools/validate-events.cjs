#!/usr/bin/env node
/*
 * Event data validator.
 *
 *   node tools/validate-events.cjs
 *
 * (.cjs because package.json sets "type": "module".)
 *
 * Loads the event modules in a stubbed sandbox and walks the whole event graph
 * looking for the kinds of mistake that produce no error at load time and are
 * easy to miss in play. Exits non-zero if anything is found, so it can go in a
 * pre-commit hook or CI step.
 *
 * What it catches:
 *
 *   MISSING START SCENE   scenes: {...} with no 'start' key. loadScene('start')
 *                         dereferences undefined and the encounter hard-crashes.
 *   MISSING SCENE         a nextScene points at a scene name that doesn't exist.
 *   MISSING EVENT         a nextEvent names a setpiece that isn't defined.
 *   UNREACHABLE ROLL      nextScene thresholds are cumulative and must reach 1.0.
 *                         If they top out lower, that share of rolls matches
 *                         nothing and the event silently ends -- after any
 *                         button cost has already been charged.
 *   DUPLICATE THRESHOLD   two identical keys in a nextScene table. The first is
 *                         silently discarded by the JS object literal.
 *   ORPHAN SCENE          a scene nothing ever routes to. Usually a typo or the
 *                         victim of a duplicate threshold; occasionally just
 *                         unfinished content.
 *   COMBAT                a combat scene missing enemy/health/damage/loot.
 *   DEAD END              a scene with no buttons and no way onward.
 *
 * Known-good exceptions live in ALLOWED below -- purchase buttons that
 * deliberately stay in the current scene rather than advancing.
 */

const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// Buttons that intentionally have no nextScene: they buy something and the
// scene stays put. Listed as "<event title>::<button id>".
const ALLOWED_STATIONARY_BUTTONS = [
	'The Nomad::buy25Scales', 'The Nomad::buy15Teeth', 'The Nomad::buyScales',
	'The Nomad::buyTeeth', 'The Nomad::buyBait', 'The Nomad::buyCompass',
	'Plague::buyMedicine', 'Penrose::give in'
];

/* ---- sandbox ------------------------------------------------------------ */

function stub(name) {
	return new Proxy(function () {}, {
		get(target, prop) {
			if (prop === 'then') return undefined;
			if (prop === Symbol.toPrimitive) return () => name;
			if (!(prop in target)) target[prop] = stub(name + '.' + String(prop));
			return target[prop];
		},
		set(target, prop, value) { target[prop] = value; return true; },
		apply() { return stub(name + '()'); },
		has() { return true; }
	});
}

const sandbox = {
	_: (s) => s,
	ngettext: (a, b, n) => (n === 1 ? a : b),
	console, Math, JSON, Date, Object, Array, String, Number, Boolean, RegExp, Error,
	isNaN, parseInt, parseFloat,
	setTimeout: () => 0, setInterval: () => 0, clearTimeout: () => 0, clearInterval: () => 0,
	document: stub('document'), navigator: { userAgent: '' }, localStorage: {},
	$: stub('$'), jQuery: stub('jQuery')
};
sandbox.window = sandbox;
sandbox.$.extend = Object.assign;
['Engine', 'State', '$SM', 'Room', 'Outside', 'World', 'Path', 'Ship', 'Space',
	'Notifications', 'Button', 'Header', 'AudioEngine', 'Fabricator', 'Prestige',
	'Score', 'Dropbox', 'Localization', 'Hotkeys'].forEach(m => { sandbox[m] = stub(m); });

/* A nextScene may be a function whose result depends on live game state --
 * karma-weighted outcomes use this. To resolve those here, $SM needs to return
 * real numbers rather than the generic proxy, or the arithmetic inside
 * Events.karmaOdds() yields NaN and the resulting table can't be validated. */
let smGetCalls = 0;
sandbox.$SM = {
	/* Numeric when a zero default is requested, so the arithmetic inside
	 * Events.karmaOdds() produces a real table rather than NaN.
	 *
	 * Otherwise this alternates truthy/falsy on each call. A nextScene may
	 * branch on a story flag ($SM.get('game.metOldWanderer'), say) and a stub
	 * that always returned undefined would only ever walk one side of that
	 * branch -- the other scene would then look unreachable and get reported
	 * as an orphan. Alternating means repeated calls explore both. */
	get: (key, requestZero) => {
		/* Cycles through representative values rather than returning a fixed
		 * 0. A nextScene may band on a numeric stat -- character.karma, most
		 * obviously -- and a stub pinned at 0 would only ever reach the middle
		 * band, leaving every other outcome scene looking like an orphan.
		 * Spans negative, zero and positive at both small and large magnitude
		 * so all bands are reachable across repeated resolution. */
		if (requestZero) {
			const values = [0, 40, 10, -10, -40];
			return values[smGetCalls++ % values.length];
		}
		return (smGetCalls++ % 2 === 0) ? undefined : true;
	},
	hasPerk: () => false,
	set: () => {}, add: () => {}, addM: () => {}, remove: () => {}, addPerk: () => {},
	setM: () => {}, num: () => 0
};

const context = vm.createContext(sandbox);

const FILES = [
	'script/audioLibrary.js', 'script/events.js',
	'script/events/global.js', 'script/events/room.js', 'script/events/outside.js',
	'script/events/path.js', 'script/events/road.js',
	'script/events/encounters.js', 'script/events/setpieces.js',
	'script/events/marketing.js', 'script/events/executioner.js'
];

let loadFailed = false;
for (const file of FILES) {
	try {
		vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), context, { filename: file });
	} catch (err) {
		console.error(`could not load ${file}: ${err.message}`);
		loadFailed = true;
	}
}
if (loadFailed) process.exit(2);

/* ---- checks ------------------------------------------------------------- */

const Events = sandbox.Events;
const problems = [];
const record = (kind, where, detail) => problems.push({ kind, where, detail });

const setpieceNames = new Set(Object.keys(Events.Setpieces || {}));
const executionerNames = new Set(Object.keys(Events.Executioner || {}));
const eventExists = (name) => setpieceNames.has(name) || executionerNames.has(name);

function auditEvent(event, label) {
	if (!event || !event.scenes) return;

	const scenes = event.scenes;
	const names = new Set(Object.keys(scenes));
	const referenced = new Set();

	if (!names.has('start')) {
		record('MISSING START SCENE', label,
			`scenes has [${[...names].join(', ')}] but no 'start' -- this will throw when the event fires`);
		return;
	}

	for (const [sceneName, scene] of Object.entries(scenes)) {
		if (!scene || typeof scene !== 'object') continue;
		const where = `${label} :: scene '${sceneName}'`;

		const checkNextScene = (table, description) => {
			if (table === undefined) return;

			/* A nextScene may be a function returning a scene name or a
			 * probability table, so its outcomes depend on live state. Call it
			 * a number of times and validate the union of everything it can
			 * return -- a karma-weighted table returns different thresholds at
			 * different karma levels, but the same set of scene names, which is
			 * what actually needs checking for dangling references. */
			if (typeof table === 'function') {
				const seen = [];
				for (let i = 0; i < 25; i++) {
					let result;
					try {
						result = table();
					} catch (err) {
						record('MISSING SCENE', where, `${description} threw when called: ${err.message}`);
						return;
					}
					if (result === undefined || result === null) {
						record('MISSING SCENE', where, `${description} returned nothing`);
						return;
					}
					seen.push(result);
				}
				seen.forEach(r => checkNextScene(r, `${description} (dynamic)`));
				return;
			}

			if (typeof table === 'string') {
				if (table !== 'end') {
					referenced.add(table);
					if (!names.has(table)) record('MISSING SCENE', where, `${description} -> '${table}'`);
				}
				return;
			}
			if (typeof table !== 'object') {
				record('MISSING SCENE', where, `${description} is a ${typeof table}`);
				return;
			}

			const keys = Object.keys(table);
			if (!keys.length) {
				record('MISSING SCENE', where, `${description} is empty`);
				return;
			}

			const numeric = keys.map(Number).sort((a, b) => a - b);
			const highest = numeric[numeric.length - 1];
			if (highest < 1) {
				record('UNREACHABLE ROLL', where,
					`${description} tops out at ${highest} -- ${Math.round((1 - highest) * 100)}% of rolls match nothing`);
			}

			for (const value of Object.values(table)) {
				if (value === 'end') continue;
				referenced.add(value);
				if (!names.has(value)) record('MISSING SCENE', where, `${description} -> '${value}'`);
			}
		};

		checkNextScene(scene.nextScene, 'nextScene');
		if (scene.nextEvent && !eventExists(scene.nextEvent)) {
			record('MISSING EVENT', where, `nextEvent -> '${scene.nextEvent}'`);
		}

		if (scene.buttons) {
			for (const [buttonId, button] of Object.entries(scene.buttons)) {
				if (!button) { record('DEAD END', where, `button '${buttonId}' is null`); continue; }

				checkNextScene(button.nextScene, `button '${buttonId}'.nextScene`);

				if (button.nextEvent && !eventExists(button.nextEvent)) {
					record('MISSING EVENT', where, `button '${buttonId}'.nextEvent -> '${button.nextEvent}'`);
				}
				if (button.text === undefined) {
					record('DEAD END', where, `button '${buttonId}' has no text`);
				}

				const allowKey = `${event.title}::${buttonId}`;
				if (!button.nextScene && !button.nextEvent && !button.onChoose &&
					!ALLOWED_STATIONARY_BUTTONS.includes(allowKey)) {
					record('DEAD END', where,
						`button '${buttonId}' has no nextScene, nextEvent or onChoose ` +
						`(add "${allowKey}" to ALLOWED_STATIONARY_BUTTONS if that's deliberate)`);
				}
			}
		}

		if (scene.combat) {
			['enemy', 'health', 'damage', 'loot'].forEach(field => {
				if (scene[field] === undefined) record('COMBAT', where, `combat scene has no ${field}`);
			});
		}

		if (!scene.combat && !scene.buttons && !scene.nextScene && !scene.nextEvent && !scene.onLoad) {
			record('DEAD END', where, 'no buttons and no continuation');
		}
	}

	for (const name of names) {
		if (name !== 'start' && !referenced.has(name)) {
			record('ORPHAN SCENE', label, `scene '${name}' is never routed to`);
		}
	}
}

// Duplicate thresholds are invisible once the object literal is evaluated, so
// they have to be caught in the source text.
function auditDuplicateThresholds() {
	for (const file of FILES) {
		const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
		source.split('\n').forEach((line, index) => {
			const match = line.match(/nextScene:\s*\{([^}]*)\}/);
			if (!match) return;
			const keys = [...match[1].matchAll(/(?:^|,)\s*'?"?([\d.]+)'?"?\s*:/g)].map(m => m[1]);
			const seen = new Set();
			keys.forEach(key => {
				if (seen.has(key)) {
					record('DUPLICATE THRESHOLD', `${file}:${index + 1}`,
						`threshold ${key} appears twice -- the first outcome is discarded`);
				}
				seen.add(key);
			});
		});
	}
}

/* ---- run ---------------------------------------------------------------- */

const pools = {
	Global: Events.Global, Room: Events.Room, Outside: Events.Outside,
	Path: Events.Path, Road: Events.Road, Encounters: Events.Encounters, Marketing: Events.Marketing
};
for (const [poolName, pool] of Object.entries(pools)) {
	(pool || []).forEach((event, index) => auditEvent(event, `${poolName}[${index}] "${event && event.title}"`));
}
for (const [name, event] of Object.entries(Events.Setpieces || {})) auditEvent(event, `Setpieces.${name}`);
for (const [name, event] of Object.entries(Events.Executioner || {})) auditEvent(event, `Executioner.${name}`);
auditDuplicateThresholds();

const eventCount =
	Object.values(pools).reduce((n, pool) => n + ((pool && pool.length) || 0), 0) +
	Object.keys(Events.Setpieces || {}).length +
	Object.keys(Events.Executioner || {}).length;

if (!problems.length) {
	console.log(`validate-events: ${eventCount} events checked, no problems found.`);
	process.exit(0);
}

const byKind = {};
problems.forEach(p => { (byKind[p.kind] = byKind[p.kind] || []).push(p); });
for (const kind of Object.keys(byKind).sort()) {
	console.log(`\n${kind} (${byKind[kind].length})`);
	byKind[kind].forEach(p => console.log(`  ${p.where}\n    ${p.detail}`));
}
console.log(`\nvalidate-events: ${problems.length} problem(s) across ${eventCount} events.`);
process.exit(1);
