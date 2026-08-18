#!/usr/bin/env node
/**
 * Build.
 *
 *   node build/build.mjs            lint, check, bundle, minify -> dist/
 *   node build/build.mjs --no-lint  skip linting (for a fast iteration loop)
 *   node build/build.mjs --debug    keep names and emit a source map
 *
 * Produces dist/ containing a single minified script, a single minified
 * stylesheet, and an index.html rewritten to load them. Everything else the
 * game needs (audio, images, lang) is copied across unchanged.
 *
 * Four stages, in order, each of which can fail the build:
 *
 *   1. Drift check -- index.html and build/manifest.mjs must agree on which
 *      scripts exist and in what order.
 *   2. Lint -- see eslint.config.mjs for why these specific rules.
 *   3. Bundle -- concatenate in manifest order.
 *   4. Minify -- terser for JS, clean-css for CSS.
 *
 * On minification safety: terser does NOT mangle names in any scope that
 * contains a direct eval(), and script/state_manager.js is built almost
 * entirely on eval'd state paths ($SM.get/set/remove all do it). That
 * behaviour was verified against the real file rather than assumed, and
 * `mangle.toplevel` is left OFF regardless so every global the game declares
 * -- and that index.html's inline scripts reference by name -- survives.
 */

import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { minify } from 'terser';
import CleanCSS from 'clean-css';
import { JS_SOURCES, CSS_SOURCES, CSS_RUNTIME_ASSETS, JS_STANDALONE_ASSETS } from './manifest.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

const args = process.argv.slice(2);
const SKIP_LINT = args.includes('--no-lint');
const DEBUG = args.includes('--debug');

const BUNDLE_JS = 'adarkroom.min.js';
const BUNDLE_CSS = 'adarkroom.min.css';

function read(rel) {
	return readFileSync(join(ROOT, rel), 'utf8');
}

function fail(stage, message) {
	console.error(`\n  BUILD FAILED (${stage})\n`);
	console.error('  ' + message.split('\n').join('\n  ') + '\n');
	process.exit(1);
}

function kb(str) {
	return (Buffer.byteLength(str, 'utf8') / 1024).toFixed(1) + 'kb';
}

/* ---------------------------------------------------------------------------
 * 1. Drift check
 *
 * The failure this exists to prevent: adding a new script file, wiring it into
 * index.html, forgetting the manifest (or the reverse), and shipping a bundle
 * that is missing a module -- which typically shows up as a confusing
 * ReferenceError deep in an unrelated feature rather than anything that points
 * at the real cause.
 * ------------------------------------------------------------------------ */
function checkManifestDrift() {
	let html = read('index.html');

	/* Strip inline <script> blocks before scanning for tags.
	 *
	 * index.html document.write()s two script tags from inside inline JS: the
	 * local jQuery fallback used when the CDN is blocked, and the per-language
	 * strings file whose path is built at runtime. Neither is a static tag and
	 * neither can be bundled -- the first is a fallback that must NOT load
	 * when the CDN works, the second has a path that isn't known until the
	 * page runs. Scanning the raw HTML picks them up as literal strings and
	 * reports them as drift, so they're excluded here rather than
	 * special-cased by name. */
	const scannable = html.replace(/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/gi, '');

	const inHtml = [...scannable.matchAll(/<script src="((?:lib|lang|script)\/[^"]+)"/g)]
		.map(m => m[1]);

	const missingFromManifest = inHtml.filter(f => !JS_SOURCES.includes(f) && !JS_STANDALONE_ASSETS.includes(f));
	const missingFromHtml = JS_SOURCES.filter(f => !inHtml.includes(f));

	/* Standalone assets must be referenced by a page -- just not bundled.
	 *
	 * Checked against index.html AND mobile.html together: script/mobileUI.js
	 * belongs only to the mobile page, and an index.html-only check rejected
	 * it. The purpose of this check is "is it actually served anywhere",
	 * which either page satisfies. */
	const mobileHtmlPath = join(ROOT, 'mobile.html');
	const inMobileHtml = existsSync(mobileHtmlPath)
		? [...readFileSync(mobileHtmlPath, 'utf8').matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1])
		: [];
	const referencedAnywhere = new Set([...inHtml, ...inMobileHtml]);

	const standaloneMissingFromHtml = JS_STANDALONE_ASSETS.filter(f => !referencedAnywhere.has(f));
	if (standaloneMissingFromHtml.length) {
		fail('manifest drift',
			'In build/manifest.mjs (JS_STANDALONE_ASSETS) but NOT referenced in index.html or mobile.html:\n  - ' +
			standaloneMissingFromHtml.join('\n  - ') +
			'\nThese scripts need their own <script src> tag; they are not part of the bundle.');
	}

	const problems = [];
	if (missingFromManifest.length) {
		problems.push('In index.html but NOT in build/manifest.mjs:\n  - ' +
			missingFromManifest.join('\n  - ') +
			'\nThe built bundle would be missing these entirely.');
	}
	if (missingFromHtml.length) {
		problems.push('In build/manifest.mjs but NOT in index.html:\n  - ' +
			missingFromHtml.join('\n  - ') +
			'\nDevelopment (loose files) would be missing these entirely.');
	}

	// Order matters as much as membership -- but only among the tags that
	// actually get bundled. Standalone assets can sit anywhere relative to
	// them (jquery-type-shim.js in particular HAS to sit before the bundle,
	// nowhere near JS_SOURCES' own position), so they're excluded from this
	// comparison rather than corrupting the positional diff below.
	if (!problems.length) {
		const bundledInHtml = inHtml.filter(f => !JS_STANDALONE_ASSETS.includes(f));
		const htmlOrder = bundledInHtml.join('|');
		const manifestOrder = JS_SOURCES.join('|');
		if (htmlOrder !== manifestOrder) {
			const first = bundledInHtml.findIndex((f, i) => f !== JS_SOURCES[i]);
			problems.push(
				'index.html and build/manifest.mjs list the same files in a DIFFERENT ORDER.\n' +
				`First difference at position ${first}: ` +
				`index.html has "${bundledInHtml[first]}", manifest has "${JS_SOURCES[first]}".\n` +
				'Load order is load-bearing here -- these are plain scripts, not modules.');
		}
	}

	for (const f of JS_SOURCES.concat(CSS_SOURCES, CSS_RUNTIME_ASSETS, JS_STANDALONE_ASSETS)) {
		if (!existsSync(join(ROOT, f))) {
			problems.push(`Listed in the manifest but missing from disk: ${f}`);
		}
	}

	if (problems.length) {
		fail('manifest drift', problems.join('\n\n'));
	}
	console.log(`  drift check   ok (${JS_SOURCES.length} scripts, ${CSS_SOURCES.length} stylesheets)`);

	/* Translation template staleness.
	 *
	 * A warning, deliberately not a failure: an out-of-date template does not
	 * break the game (untranslated strings fall through to English), so it
	 * must not block a build. But it went unnoticed for four years and ~2500
	 * strings, so silence is clearly not working either. */
	try {
		const potPath = join(ROOT, 'lang', 'adarkroom.pot');
		if (existsSync(potPath)) {
			const potIds = (readFileSync(potPath, 'utf8').match(/^msgid "/gm) || []).length - 1;
			let sourceIds = 0;
			for (const f of JS_SOURCES) {
				const p = join(ROOT, f);
				if (!existsSync(p)) continue;
				sourceIds += (readFileSync(p, 'utf8').match(/\b_\(\s*['"]/g) || []).length;
			}
			// Rough: call sites include duplicates, so only flag a large gap.
			if (potIds > 0 && sourceIds > potIds * 1.5) {
				console.log(`  i18n          WARNING: template has ${potIds} strings but source has ` +
					`~${sourceIds} call sites -- run \`npm run i18n\``);
			} else {
				console.log(`  i18n          ok (${potIds} strings in template)`);
			}
		}
	} catch {
		/* Never let a reporting nicety break the build. */
	}
}

/* ---------------------------------------------------------------------------
 * 2. Lint
 * ------------------------------------------------------------------------ */
async function lint() {
	if (SKIP_LINT) {
		console.log('  lint          SKIPPED (--no-lint)');
		return;
	}
	const { ESLint } = await import('eslint');
	const eslint = new ESLint({ cwd: ROOT });
	const results = await eslint.lintFiles(['lang', 'script', 'build', 'tools']);

	const errors = results.reduce((n, r) => n + r.errorCount, 0);
	const warnings = results.reduce((n, r) => n + r.warningCount, 0);

	if (errors > 0) {
		const formatter = await eslint.loadFormatter('stylish');
		fail('lint', await formatter.format(results));
	}
	console.log(`  lint          ok (${errors} errors, ${warnings} warnings)`);
}

/* ---------------------------------------------------------------------------
 * 3 & 4. Bundle and minify
 * ------------------------------------------------------------------------ */
async function buildJs() {
	// Each file gets a marker comment so a stack trace from the debug build
	// still says which source file it came from.
	const raw = JS_SOURCES
		.map(f => `\n/* ==== ${f} ==== */\n` + read(f))
		.join('\n;\n');   // leading semicolon: guards against a file that ends
		                  // without one running into the next file's parens.

	const result = await minify(raw, {
		compress: DEBUG ? false : {
			drop_console: false,   // Engine.log routes through console and is
			                       // genuinely useful in the field
			passes: 2
		},
		mangle: DEBUG ? false : {
			/* toplevel OFF, deliberately. index.html contains inline scripts
			 * that reference Engine, Localization and others by name, the
			 * game's own eval'd state paths reference `State` by name, and
			 * anything a player might poke at from the console would break.
			 * Mangling locals is where nearly all the size win is anyway. */
			toplevel: false
		},
		format: {
			comments: false,
			ascii_only: true   // the game uses a lot of non-ASCII glyphs
			                   // (Glagolitic, map tiles); escaping them means
			                   // the bundle survives a server serving it as
			                   // latin-1.
		},
		sourceMap: DEBUG ? { filename: BUNDLE_JS, url: BUNDLE_JS + '.map' } : false
	});

	if (result.error) {
		fail('minify js', String(result.error));
	}

	writeFileSync(join(DIST, BUNDLE_JS), result.code);
	if (result.map) {
		writeFileSync(join(DIST, BUNDLE_JS + '.map'), result.map);
	}
	console.log(`  bundle js     ${JS_SOURCES.length} files, ${kb(raw)} -> ${kb(result.code)}` +
		(DEBUG ? '  (debug: unminified, source map emitted)' : ''));
	return result.code;
}

function buildCss() {
	const raw = CSS_SOURCES.map(f => read(f)).join('\n');
	if (DEBUG) {
		writeFileSync(join(DIST, BUNDLE_CSS), raw);
		console.log(`  bundle css    ${CSS_SOURCES.length} files, ${kb(raw)} (debug: unminified)`);
		return;
	}
	/* clean-css rather than a hand-rolled whitespace strip: distress.css
	 * embeds inline SVG data URIs containing literal spaces and quotes, and a
	 * naive regex would corrupt them. Level 1 only -- level 2 restructures
	 * rules across selectors, which is exactly the kind of "clever" that
	 * silently changes cascade order. */
	const out = new CleanCSS({ level: 1 }).minify(raw);
	if (out.errors.length) {
		fail('minify css', out.errors.join('\n'));
	}
	writeFileSync(join(DIST, BUNDLE_CSS), out.styles);
	console.log(`  bundle css    ${CSS_SOURCES.length} files, ${kb(raw)} -> ${kb(out.styles)}`);
}

/* ---------------------------------------------------------------------------
 * index.html for the built game
 * ------------------------------------------------------------------------ */
function buildHtml() {
	let html = read('index.html');

	/* Replace each tag individually rather than collapsing the span between
	 * the first and last one.
	 *
	 * index.html interleaves them: the scripts run from line 41 to line 127,
	 * and the stylesheet <link>s sit at 106-116, INSIDE that range. A
	 * "replace everything between the first and last script" approach deletes
	 * every stylesheet on the way past -- which is exactly what the first
	 * version of this function did, and what the build's own "could not
	 * locate any stylesheet tags" error then caught.
	 *
	 * Per-tag replacement is immune to however the file is ordered: the first
	 * occurrence becomes the bundle, the rest are dropped, and nothing else
	 * in the document is touched.
	 */
	function collapse(files, bundleTag, label) {
		let inserted = false;
		let replaced = 0;
		for (const f of files) {
			const re = new RegExp(
				`[\\t ]*<(?:script|link)[^>]*(?:src|href)="${f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>(?:</script>)?\\n?`,
				'g');
			if (!re.test(html)) continue;
			re.lastIndex = 0;
			html = html.replace(re, () => {
				replaced++;
				if (inserted) return '';
				inserted = true;
				return bundleTag;
			});
		}
		if (!replaced) {
			fail('html', `Could not locate any ${label} tags to replace in index.html.`);
		}
		return replaced;
	}

	const jsCount = collapse(
		JS_SOURCES,
		`\t<script src="${BUNDLE_JS}"></script>\n`,
		'script');

	/* lang/main.css is written by an inline script (its path depends on the
	 * selected language), not a static tag, so it is bundled but has no tag
	 * to remove. */
	const cssCount = collapse(
		CSS_SOURCES.filter(f => f !== 'lang/main.css'),
		`\t<link rel="stylesheet" type="text/css" href="${BUNDLE_CSS}" />\n`,
		'stylesheet');

	if (jsCount !== JS_SOURCES.length) {
		fail('html', `Bundled ${JS_SOURCES.length} scripts but only found ${jsCount} tags to remove. ` +
			`Some loose <script> tags would still be loaded alongside the bundle.`);
	}

	writeFileSync(join(DIST, 'index.html'), html);
	console.log(`  index.html    ${jsCount} script + ${cssCount} stylesheet tags -> 2 bundles`);
}

/* mobile.html gets the same treatment: without it the mobile page loads ~50
 * loose scripts while the desktop page loads one bundle, which is the worst
 * possible split given mobile is the connection-constrained one.
 *
 * Its stylesheet is deliberately NOT bundled -- that page loads only
 * css/mobile.css and none of the desktop sheets, so it keeps its own <link>
 * and the file is shipped via CSS_RUNTIME_ASSETS. */
function buildMobileHtml() {
	const src = join(ROOT, 'mobile.html');
	if (!existsSync(src)) { return; }
	let html = readFileSync(src, 'utf8');

	let replaced = 0;
	for (const file of JS_SOURCES) {
		const tag = new RegExp(`[\\t ]*<script src="${file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"></script>\\n?`);
		if (tag.test(html)) {
			html = html.replace(tag, replaced === 0 ? '\t<script src="adarkroom.min.js"></script>\n' : '');
			replaced++;
		}
	}

	if (replaced !== JS_SOURCES.length) {
		fail('html', `mobile.html: bundled ${JS_SOURCES.length} scripts but replaced ${replaced} tags. ` +
			`It would load loose scripts alongside the bundle, or miss some entirely.`);
	}

	/* Inline the stylesheet rather than linking it.
	 *
	 * This page's ENTIRE appearance depends on one external file, so a single
	 * 404 there does not degrade it -- it produces an unusable wall of
	 * unstyled markup, which is exactly what a report showed (bulleted
	 * language list, no layout). Causes are varied and all out of the
	 * build's control: a partly-applied patch that dropped the
	 * CSS_RUNTIME_ASSETS entry, a stale dist/, a server that will not serve
	 * the path.
	 *
	 * It is 8kb. Inlining removes the dependency, removes a request, and
	 * means the built page cannot render unstyled no matter what happens to
	 * the css/ directory. The source mobile.html keeps its <link> so
	 * development against loose files still works. */
	const mobileCss = join(ROOT, 'css', 'mobile.css');
	if (existsSync(mobileCss)) {
		const linkTag = /[\t ]*<link rel="stylesheet" type="text\/css" href="css\/mobile\.css" \/>\n?/;
		if (!linkTag.test(html)) {
			fail('html', 'mobile.html: could not find the css/mobile.css link tag to inline.');
		}
		html = html.replace(linkTag,
			'\t<style>\n' + readFileSync(mobileCss, 'utf8') + '\n\t</style>\n');
	} else {
		fail('html', 'css/mobile.css is missing; the mobile page would render unstyled.');
	}

	writeFileSync(join(DIST, 'mobile.html'), html);
	console.log(`  mobile.html   ${replaced} script tags -> 1 bundle, css inlined`);
}

/* ---------------------------------------------------------------------------
 * Static assets
 * ------------------------------------------------------------------------ */
function copyAssets() {
	/* browserWarning.html is redirected to by Engine.init when HTML5 support
	 * is missing, and was never copied here -- so the one user who needed it
	 * got a 404 instead of an explanation. Found alongside the same bug in
	 * mobileWarning.html (whose redirect has now been removed entirely). */
	const dirs = ['audio', 'img', 'lang', 'favicon.ico', 'manifest.json',
		'browserWarning.html'];
	/* NOT mobile.html: buildMobileHtml() writes a rewritten copy that points
	 * at the bundle, and this runs afterwards -- copying the raw file here
	 * silently overwrote it, so the built mobile page shipped ~50 loose
	 * script tags while reporting success. */
	let copied = 0;
	for (const a of dirs) {
		const src = join(ROOT, a);
		// Best-effort: these are broad categories, not everything on this
		// list exists in every checkout (favicon/manifest are optional).
		if (!existsSync(src)) continue;
		cpSync(src, join(DIST, a), { recursive: true });
		copied++;
	}

	/* Runtime-injected stylesheets, copied individually rather than folded
	 * into the directory loop above.
	 *
	 * These are NOT optional the way favicon.ico is: they're in
	 * CSS_RUNTIME_ASSETS specifically because Engine hardcodes a href to
	 * them (see the comment on that list in manifest.mjs), so a missing one
	 * is a guaranteed 404 the moment the matching feature is used, not a
	 * cosmetic gap. Fails the build rather than silently shipping a bundle
	 * with a dead link, which is exactly what happened before this existed:
	 * css/ was never in the directory list at all, so dark.css and
	 * april.css were dropped with no warning at build time -- the 404 was
	 * the first anyone heard about it, in a browser, after deploying. */
	for (const f of CSS_RUNTIME_ASSETS) {
		const src = join(ROOT, f);
		if (!existsSync(src)) {
			fail('assets', `${f} is listed in CSS_RUNTIME_ASSETS but does not exist on disk.\n` +
				`Engine hardcodes a link to this path; a build without it 404s at runtime.`);
		}
		mkdirSync(dirname(join(DIST, f)), { recursive: true });
		cpSync(src, join(DIST, f));
		copied++;
	}

	/* Same treatment for standalone scripts -- see the comment on
	 * JS_STANDALONE_ASSETS in manifest.mjs for why these can't just be
	 * folded into the JS_SOURCES bundle. Copied verbatim rather than run
	 * through terser: these are tiny, load-order-critical compatibility
	 * shims, and minifying them saves negligible bytes at the cost of make
	 * them harder to read in place if anyone needs to. */
	for (const f of JS_STANDALONE_ASSETS) {
		const src = join(ROOT, f);
		if (!existsSync(src)) {
			fail('assets', `${f} is listed in JS_STANDALONE_ASSETS but does not exist on disk.`);
		}
		mkdirSync(dirname(join(DIST, f)), { recursive: true });
		cpSync(src, join(DIST, f));
		copied++;
	}

	console.log(`  assets        ${copied} copied`);
}

/* ------------------------------------------------------------------------ */
async function main() {
	console.log('\n  building a dark room\n');

	checkManifestDrift();
	await lint();

	rmSync(DIST, { recursive: true, force: true });
	mkdirSync(DIST, { recursive: true });

	await buildJs();
	buildCss();
	buildHtml();
	copyAssets();
	/* After copyAssets, deliberately: see the note in the asset list. */
	buildMobileHtml();

	console.log(`\n  done -> dist/\n`);
}

main().catch(e => fail('unexpected', e.stack || String(e)));
