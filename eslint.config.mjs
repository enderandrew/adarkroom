/**
 * Lint config.
 *
 * Deliberately NOT a style guide. This codebase is a 2013 game plus a decade
 * of fork on top; turning on a modern style ruleset would produce thousands of
 * findings, all of which would be ignored, which is worse than no linting at
 * all. Every rule enabled here is one that catches a bug that can actually
 * ship.
 *
 * The rules earning their place, with the specific history behind them:
 *
 *   no-dupe-keys      Real bugs found in this project more than once -- the
 *                     Executioner had a duplicate scene key that silently
 *                     discarded a guaranteed alloy drop, and The Sick Man's
 *                     probability table had a repeated 0.3 that discarded an
 *                     entire outcome and ended 60% of rolls early. Both were
 *                     invisible at runtime. This rule alone justifies linting.
 *   no-undef          Catches a module referenced before it's registered --
 *                     the exact failure mode of adding a new script and
 *                     forgetting to wire it into the manifest.
 *   no-unreachable    Dead code after a return, usually a sign of a bad merge.
 *   no-dupe-args,
 *   no-func-assign,
 *   no-import-assign  Silent overwrites.
 *   valid-typeof      `typeof x == 'nubmer'` is always false and never warns.
 *   use-isnan         `x == NaN` is always false. Relevant here: NaN has
 *                     already caused one real save-corruption bug (World.hp).
 *   no-cond-assign    `if (x = 1)` where `==` was meant.
 *   no-fallthrough    Switch fallthrough without an explicit comment.
 *   no-sparse-arrays  `[1,,2]` is nearly always a typo.
 *   no-self-assign,
 *   no-self-compare   Always a mistake.
 *   no-constant-condition  Except loops, where `while(true)` is legitimate.
 *
 * no-unused-vars is set to 'warn', not 'error': it's genuinely useful signal
 * but there's enough legacy scaffolding that failing the build on it would
 * mean disabling it within a week.
 */

const BROWSER_GLOBALS = {
	window: 'readonly', document: 'readonly', navigator: 'readonly',
	location: 'writable', history: 'readonly', console: 'readonly',
	localStorage: 'readonly', sessionStorage: 'readonly',
	setTimeout: 'readonly', clearTimeout: 'readonly',
	setInterval: 'readonly', clearInterval: 'readonly',
	requestAnimationFrame: 'readonly',
	fetch: 'readonly', Promise: 'readonly', URL: 'readonly', Blob: 'readonly',
	FileReader: 'readonly', TextEncoder: 'readonly', crypto: 'readonly',
	btoa: 'readonly', atob: 'readonly', matchMedia: 'readonly',
	Audio: 'readonly', AudioContext: 'readonly', webkitAudioContext: 'readonly',
	XMLHttpRequest: 'readonly', Request: 'readonly', Response: 'readonly',
	Image: 'readonly', Option: 'readonly',
	alert: 'readonly', confirm: 'readonly', escape: 'readonly', unescape: 'readonly'
};

/* Every global the game declares. Listing them is the point: a new module
 * that isn't added here will trip no-undef the first time anything references
 * it, which is exactly the "I forgot to wire up the new file" failure the
 * manifest check also guards against, caught from the other direction. */
const GAME_GLOBALS = {
	$: 'readonly', jQuery: 'readonly', _: 'readonly',
	State: 'writable', $SM: 'readonly',
	Engine: 'readonly', Button: 'readonly', Notifications: 'readonly',
	AudioEngine: 'readonly', AudioLibrary: 'readonly', Header: 'readonly',
	Events: 'readonly', Room: 'readonly', Outside: 'readonly', World: 'readonly',
	Path: 'readonly', Ship: 'readonly', Space: 'readonly', Fabricator: 'readonly',
	Prestige: 'readonly', Score: 'readonly', Localization: 'readonly',
	Distress: 'readonly', Glyphs: 'readonly', Ruins: 'readonly',
	Temple: 'readonly', Crater: 'readonly', Hazard: 'readonly', Builder: 'readonly', Swamp: 'readonly', Village: 'readonly', Maze: 'readonly', Lab: 'readonly', Swipe: 'readonly', EasterEggs: 'readonly', Graveyard: 'readonly',
	repeatChar: 'readonly',   // declared in maze.js
	hotKeys: 'readonly', bindHotKeys: 'readonly',
	Dropbox: 'readonly', Client: 'readonly',
	Enemies: 'writable',          // declared in events/executioner.js
	langs: 'readonly',            // declared in lang/langs.js
	gtag: 'readonly',             // injected by the Google Analytics snippet
	ICU: 'readonly', Base64: 'readonly',
	eventNullifier: 'readonly', eventPassthrough: 'readonly',
	inView: 'readonly', scrollByX: 'readonly',   // declared in engine.js
	oldIE: 'readonly'
};

export default [
	{
		/* lib/ is deliberately NOT linted. It is vendored third-party code
		 * (base64, icu, translate, the jQuery event plugins) that we don't
		 * own and shouldn't be editing. It does contain genuine findings --
		 * base64.js leaks c2/c3 as implicit globals, icu.js leaks s -- but
		 * "fix a working vendored library to satisfy our linter" is a worse
		 * trade than leaving it alone, and a permanently-failing lint stage
		 * that everyone learns to skip is worse than both. Lint what you own. */
		files: ['lang/**/*.js', 'script/**/*.js'],
		ignores: ['script/combined.js', 'js/**', 'dist/**', 'node_modules/**', 'lib/**'],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'script',
			globals: { ...BROWSER_GLOBALS, ...GAME_GLOBALS }
		},
		rules: {
			'no-dupe-keys': 'error',
			'no-dupe-args': 'error',
			'no-dupe-else-if': 'error',
			'no-duplicate-case': 'error',
			'no-undef': 'error',
			'no-unreachable': 'error',
			'no-func-assign': 'error',
			'no-const-assign': 'error',
			'valid-typeof': 'error',
			'use-isnan': 'error',
			'no-cond-assign': 'error',
			'no-fallthrough': 'error',
			'no-sparse-arrays': 'error',
			'no-self-assign': 'error',
			'no-self-compare': 'error',
			'no-constant-condition': ['error', { checkLoops: false }],
			'no-unsafe-negation': 'error',
			'no-obj-calls': 'error',
			/* vars: 'local' only. These files declare module globals
			 * (AudioLibrary, hotKeys, langs...) that are consumed from OTHER
			 * files, and ESLint analyses one file at a time -- so every
			 * module declaration in the game reads as "assigned but never
			 * used". Reporting those trains people to ignore the rule, which
			 * costs more than it catches. Genuinely unused LOCALS are still
			 * reported, which is where the real signal is. */
			'no-unused-vars': ['warn', {
				vars: 'local',
				args: 'none',
				varsIgnorePattern: '^_',
				caughtErrors: 'none'
			}]
		}
	},
	{
		// Build tooling and the validator run in Node, not the browser.
		files: ['build/**/*.mjs', 'tools/**/*.cjs'],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'module',
			globals: {
				process: 'readonly', console: 'readonly', __dirname: 'readonly',
				require: 'readonly', module: 'writable', Buffer: 'readonly'
			}
		},
		rules: {
			'no-dupe-keys': 'error',
			'no-undef': 'error',
			'no-unreachable': 'error'
		}
	}
];
