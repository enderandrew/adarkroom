/**
 * The one authoritative list of what the game is made of, and in what order.
 *
 * Load order matters: these are not modules, they're plain scripts that
 * declare globals and depend on each other being present at parse or init
 * time. Concatenating them in the wrong order produces a bundle that fails in
 * ways that are tedious to trace.
 *
 * Until now that order lived in TWO places -- index.html and combine.sh --
 * with nothing keeping them in step. Every feature added over this project
 * meant remembering to edit both, and forgetting one produces a game that
 * works in development and breaks only in the built bundle, or vice versa.
 * build.mjs now treats this file as the source of truth and FAILS THE BUILD
 * if index.html disagrees with it, so that drift is caught at build time
 * instead of in someone's browser.
 */
export const JS_SOURCES = [
	// Third-party and i18n first: everything else assumes these exist.
	'lib/base64.js',
	'lib/icu.js',
	'lib/translate.js',
	'lang/langs.js',

	// Core engine.
	'script/Button.js',
	'script/swipe.js',
	'script/easterEggs.js',
	'script/audioLibrary.js',
	'script/audio.js',
	'script/engine.js',
	'script/state_manager.js',
	'script/header.js',
	'script/notifications.js',

	// Feature modules that the event data references.
	'script/distress.js',
	'script/glyphs.js',
	'script/ruins.js',
	'script/temple.js',
	'script/crater.js',
	'script/hazard.js',
	'script/builder.js',
	'script/swamp.js',
	'script/village.js',
	'script/prison.js',
	'script/achievements.js',
	'script/mobile.js',
	'script/maze.js',
	'script/lab.js',
	'script/graveyard.js',

	'script/events.js',
	'script/dropbox.js',

	// Location modules.
	'script/room.js',
	'script/outside.js',
	'script/world.js',
	'script/path.js',
	'script/ship.js',
	'script/space.js',
	'script/fabricator.js',

	// Scoring and input.
	'script/prestige.js',
	'script/scoring.js',
	'script/hotkeys.js',

	// Event data. Must come after the modules it references at load time.
	'script/events/global.js',
	'script/events/room.js',
	'script/events/outside.js',
	'script/events/path.js',
	'script/events/road.js',
	'script/events/encounters.js',
	'script/events/setpieces.js',
	'script/events/marketing.js',
	'script/events/executioner.js',

	'script/localization.js'
];

export const CSS_SOURCES = [
	'lang/main.css',
	'css/main.css',
	'css/room.css',
	'css/outside.css',
	'css/path.css',
	'css/world.css',
	'css/ship.css',
	'css/space.css',
	'css/fabricator.css',
	'css/responsive.css',
	// Last, so its overlay and opt-out rules win over the per-area sheets.
	'css/distress.css'
];

/* Stylesheets that are NOT part of the always-loaded bundle above, but are
 * still required at runtime -- Engine injects them by hardcoded path
 * ($('head').append('<link ... href="css/dark.css">')) only when a feature
 * actually turns on: lights-off mode, the April Fools easter egg. Bundling
 * them would ship their rules to every player permanently; the build instead
 * copies them into dist/css/ unminified, alongside the bundle, so the
 * runtime path the game already hardcodes keeps resolving.
 *
 * This list exists so the build states explicitly which loose files belong
 * in a shipped build, rather than copying the whole css/ directory -- which
 * would also ship css/combined.css (combine.sh's old output) and any stray
 * .bak file left lying around. Listed here for the same reason JS_SOURCES
 * and CSS_SOURCES are: so a new one added later is a one-line addition
 * instead of something the build has to discover was missing from a 404. */
export const CSS_RUNTIME_ASSETS = [
	'css/dark.css',
	'css/april.css'
];

/* Scripts that must exist and be served, but are deliberately NOT part of the
 * JS_SOURCES bundle above -- because where they sit in the load order
 * relative to third-party CDN scripts is the entire point of them.
 *
 * lib/jquery-type-shim.js has to run after jQuery loads (including the
 * document.write CDN-blocked fallback) and before jquery-color, a
 * third-party plugin loaded from its own CDN tag that this repairs
 * compatibility with -- see the file itself for why. Bundling it into
 * adarkroom.min.js, which loads after every other script tag in the page,
 * would run it far too late: jquery-color's cssHooks would already be
 * registered against a missing jQuery.type by the time the shim restored it.
 *
 * Same rationale and same failure mode as CSS_RUNTIME_ASSETS: without an
 * explicit list, these are invisible to the build (there is nothing to
 * bundle them INTO), and the first anyone hears about a missing one is a
 * 404, or worse, a silent runtime crash three clicks into the ending. */
export const JS_STANDALONE_ASSETS = [
	'lib/jquery-type-shim.js'
];
