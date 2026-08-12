# Build

    npm run lint        eslint over first-party code
    npm run validate    event-graph validator (dangling scenes, bad tables)
    npm run build       lint + drift check + bundle + minify -> dist/
    npm run build:fast  same, skipping lint
    npm run build:debug unminified bundle + source map, for debugging prod

`dist/` is a complete, deployable copy of the game: one script, one
stylesheet, an `index.html` rewritten to load them, and the static assets.

## What the build actually checks

**Drift.** `build/manifest.mjs` is the single source of truth for which
scripts exist and in what order. The build fails if `index.html` disagrees
with it, by membership *or* by order. This is the failure that used to be
easy to ship: add a new module, wire it into one place and not the other, and
get a game that works loose and breaks bundled (or the reverse).

**Lint.** See `eslint.config.mjs`. Deliberately not a style guide — every rule
enabled catches a bug that can actually ship. `lib/` is excluded: it is
vendored third-party code we don't own, and a permanently-failing lint stage
everyone learns to skip is worse than no lint at all.

## A note on minification and "keeping secrets"

Minification is **not** a security measure, and it is worth being blunt about
that. Everything shipped to a browser is readable by whoever receives it. The
bundle strips comments and mangles local variable names, which raises the
effort required to read the code from "open the file" to "spend an afternoon
with a beautifier" — but the strings, the event text, the item names, the
karma thresholds and every branch of every ending are all still right there in
plain text, because the game has to be able to display them.

If something genuinely must stay unknown to the player, the only reliable
place for it is a server they don't control. For a client-side game, treat
minification as compression that happens to be mildly inconvenient to read.

## Third-party JavaScript

The game now depends on exactly one third-party runtime plugin: jquery-color,
loaded from a CDN and kept working under jQuery 4 by `lib/jquery-type-shim.js`
(see that file for why).

`jquery.event.move` and `jquery.event.swipe` were removed. They were
unmaintained, and -- more importantly -- they were the only remaining code
reaching into jQuery's own internals (`jQuery.event.add/remove/trigger/
special`), which is the most fragile possible dependency to carry across a
major jQuery version. `script/swipe.js` replaces them with native Pointer
Events and emits the same four jQuery events, so the consuming code in
`Engine` and `World` was untouched.

That leaves jquery-color as the only remaining jQuery-4 compatibility risk,
and its exposure is one function (`$.type`) with a documented shim.

## Minification safety

Two constraints are load-bearing and are the reason this uses terser with
specific options rather than a bundler's defaults:

1. **`mangle.toplevel` is OFF.** Every module in the game is a global, and
   `index.html` has inline scripts referencing `Engine`, `Localization` and
   others by name. Renaming top-level bindings breaks all of it.

2. **`script/state_manager.js` is built on `eval`.** `$SM.get`/`set`/`remove`
   construct state paths as strings and eval them, including assigning to a
   *local* (`eval('whichState = (...)')`). Terser detects direct `eval` in a
   scope and disables mangling there — verified against the real file rather
   than assumed — but it is worth knowing that this file is why aggressive
   name mangling can never be turned on globally.

## Verifying the bundle

The strongest check available: run the game's own test suites against the
built artifact instead of the loose sources.

    cd ../audit
    node mkbootdist.mjs                      # regenerate from boot.js
    for t in test_*.js; do
      sed "s|require('./boot.js')|require('./bootdist.js')|" $t > dist_$t
      node dist_$t
    done

`bootdist.js` is derived from `boot.js` and differs in exactly one line — it
injects `dist/adarkroom.min.js` instead of the 38 loose files. Everything else
(the jsdom environment, the audio and animation shims) is identical, so any
behavioural difference between a suite run both ways is a real bundling bug
rather than a harness artifact.

This has already earned its keep: it caught two tests that regexed a
function's source for `'shield'` / `'brittle'` with single quotes, which
terser normalises to double. The behaviour was identical; the tests were
coupled to source formatting.
