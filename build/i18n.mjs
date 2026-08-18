#!/usr/bin/env node
/**
 * Translation pipeline.
 *
 *   node build/i18n.mjs extract    regenerate lang/adarkroom.pot from source
 *   node build/i18n.mjs merge      fold new strings into every lang/<x>/strings.po
 *   node build/i18n.mjs compile    build lang/<x>/strings.js from each .po
 *   node build/i18n.mjs status     report coverage per language
 *   node build/i18n.mjs all        extract, merge, compile, status
 *
 * ============================================================================
 * WHY THIS EXISTS
 * ============================================================================
 *
 * The repo had a lang/adarkroom.pot template, per-language .po files, and
 * per-language strings.js files that the game actually loads at runtime --
 * but nothing connecting them. lang/babel.cfg implies pybabel was run by hand
 * at some point; the template was last regenerated in 2021 and had 805
 * strings against roughly 3300 translatable call sites in the current source.
 * The .po files matched the old template, and the strings.js files were
 * hand-maintained JSON blobs that had drifted from both.
 *
 * The practical effect: every string this fork has added -- which is most of
 * the game's text now -- was invisible to translators. There was no way for
 * anyone to even SEE what was missing, let alone translate it.
 *
 * This does the whole loop in Node, with no Python/gettext dependency, so it
 * can live alongside the existing build rather than being a separate manual
 * ritual somebody has to remember.
 *
 * ============================================================================
 * WHAT IT DELIBERATELY DOES NOT DO
 * ============================================================================
 *
 * It never invents or machine-translates anything. An untranslated string
 * stays untranslated and simply falls through to the English source at
 * runtime (see lib/translate.js), which is the correct behaviour -- a wrong
 * translation is worse than an obviously-absent one.
 *
 * It also never DROPS an existing translation. Merging is additive: strings
 * that have left the source are marked obsolete rather than deleted, because
 * text gets reworded and moved constantly in this project and throwing away a
 * human translation because a line moved file is unrecoverable.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LANG = join(ROOT, 'lang');
const POT = join(LANG, 'adarkroom.pot');

/* Directories scanned for _() calls. Matches lang/babel.cfg's `**.js`, but
 * scoped to the source we own -- lib/ is vendored and lang/ is output. */
const SOURCE_DIRS = ['script'];

/* ---------------------------------------------------------------------------
 * Extraction
 *
 * Finds _('...') and _("...") calls. Deliberately a focused regex rather than
 * a JS parser: the codebase uses one convention consistently, and a parser
 * would pull in a dependency to handle cases that do not occur.
 *
 * Handles escaped quotes inside the string, which the game uses constantly
 * ("he stood at the profane\'s shoulder"), and skips _( calls whose first
 * argument is not a literal -- Events.resolve(fn) style indirection cannot be
 * extracted statically and would produce garbage msgids.
 * ------------------------------------------------------------------------ */

function walk(dir, out = []) {
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) walk(full, out);
		else if (entry.endsWith('.js')) out.push(full);
	}
	return out;
}

/* Matches _('...') / _("...") with escape-aware string bodies. */
const CALL_RE = /\b_\(\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/g;

/* Additional call shapes whose FIRST argument is user-facing text that is
 * translated somewhere other than the call site.
 *
 * `line(...)` is the endgame outro. All ~100 of those pass English literals
 * and are translated inside Space.outroLine rather than at each call site,
 * so they are invisible to a plain _() scan while still very much needing
 * to be in the template. Scoped to script/space.js so an unrelated `line(`
 * elsewhere cannot start injecting junk msgids. */
const EXTRA_CALLS = [
	{ file: 'script/space.js', re: new RegExp(String.raw`\bline\(\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")`, 'g') }
];

function unescapeJs(s) {
	return s.replace(/\\(['"\\nrt])/g, (m, c) =>
		({ "'": "'", '"': '"', '\\': '\\', n: '\n', r: '\r', t: '\t' }[c]));
}

function extract() {
	/* msgid -> Set of "file:line" */
	const strings = new Map();

	for (const dir of SOURCE_DIRS) {
		const abs = join(ROOT, dir);
		if (!existsSync(abs)) continue;
		for (const file of walk(abs)) {
			const src = readFileSync(file, 'utf8');
			const rel = relative(ROOT, file).replace(/\\/g, '/');
			const patterns = [CALL_RE];
			for (const extra of EXTRA_CALLS) {
				if (rel === extra.file) patterns.push(extra.re);
			}

			for (const re of patterns) {
				let m;
				re.lastIndex = 0;
				while ((m = re.exec(src)) !== null) {
					const raw = m[1] !== undefined ? m[1] : m[2];
					const msgid = unescapeJs(raw);
					if (!msgid.trim()) continue;
					const line = src.slice(0, m.index).split('\n').length;
					if (!strings.has(msgid)) strings.set(msgid, new Set());
					strings.get(msgid).add(`${rel}:${line}`);
				}
			}
		}
	}
	return strings;
}

/* ---------------------------------------------------------------------------
 * PO parsing / serialising
 * ------------------------------------------------------------------------ */

function poEscape(s) {
	return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

function poUnescape(s) {
	return s.replace(/\\(n|t|r|"|\\)/g, (m, c) =>
		({ n: '\n', t: '\t', r: '\r', '"': '"', '\\': '\\' }[c]));
}

/* Returns { header, entries, obsolete }.
 *
 * `obsolete` MUST be returned rather than discarded. Dropping it here means
 * the first merge writes the #~ entries out correctly and the SECOND merge
 * silently deletes them, because they were never read back in -- which
 * destroys human translations permanently and looks like it worked. Found by
 * a test asserting obsolete entries survive; the first version of this
 * parser had exactly that bug. */
function parsePo(text) {
	const entries = new Map();
	const obsoleteEntries = new Map();
	let header = '';
	const blocks = text.split(/\n\s*\n/);

	for (const block of blocks) {
		const lines = block.split('\n');
		let msgid = null, msgstr = null, target = null;
		const refs = [];
		let obsolete = false;

		for (const rawLine of lines) {
			const line = rawLine.trim();
			if (!line) continue;
			if (line.startsWith('#:')) { refs.push(line.slice(2).trim()); continue; }
			if (line.startsWith('#~')) {
				obsolete = true;
				/* Re-parse the payload after the marker so the entry can be
				 * carried forward rather than thrown away. */
				const body = line.slice(2).trim();
				if (body.startsWith('msgid ')) {
					target = 'id';
					msgid = poUnescape(body.slice(6).trim().replace(/^"|"$/g, ''));
				} else if (body.startsWith('msgstr ')) {
					target = 'str';
					msgstr = poUnescape(body.slice(7).trim().replace(/^"|"$/g, ''));
				} else if (body.startsWith('"')) {
					const cont = poUnescape(body.replace(/^"|"$/g, ''));
					if (target === 'id') msgid += cont;
					else if (target === 'str') msgstr += cont;
				}
				continue;
			}
			if (line.startsWith('#')) continue;

			if (line.startsWith('msgid ')) {
				target = 'id';
				msgid = poUnescape(line.slice(6).trim().replace(/^"|"$/g, ''));
			} else if (line.startsWith('msgstr ')) {
				target = 'str';
				msgstr = poUnescape(line.slice(7).trim().replace(/^"|"$/g, ''));
			} else if (line.startsWith('"')) {
				const cont = poUnescape(line.replace(/^"|"$/g, ''));
				if (target === 'id') msgid += cont;
				else if (target === 'str') msgstr += cont;
			}
		}

		if (msgid === null) continue;
		if (msgid === '') { header = msgstr || ''; continue; }
		if (obsolete) {
			if (msgstr) obsoleteEntries.set(msgid, { msgstr, refs: [] });
			continue;
		}
		entries.set(msgid, { msgstr: msgstr || '', refs });
	}
	return { header, entries, obsolete: obsoleteEntries };
}

function serialisePo(header, entries, obsolete) {
	const out = [];
	out.push('msgid ""');
	out.push('msgstr ""');
	for (const line of (header || '').split('\n')) {
		if (line) out.push(`"${poEscape(line)}\\n"`);
	}
	out.push('');

	for (const [msgid, data] of entries) {
		for (const ref of (data.refs || [])) out.push(`#: ${ref}`);
		out.push(`msgid "${poEscape(msgid)}"`);
		out.push(`msgstr "${poEscape(data.msgstr || '')}"`);
		out.push('');
	}

	if (obsolete && obsolete.size) {
		out.push('# Strings no longer present in the source.');
		out.push('# Kept rather than deleted: text is reworded and moved constantly here,');
		out.push('# and discarding a human translation because a line moved is unrecoverable.');
		out.push('');
		for (const [msgid, data] of obsolete) {
			out.push(`#~ msgid "${poEscape(msgid)}"`);
			out.push(`#~ msgstr "${poEscape(data.msgstr || '')}"`);
			out.push('');
		}
	}
	return out.join('\n');
}

/* ---------------------------------------------------------------------------
 * Commands
 * ------------------------------------------------------------------------ */

function languages() {
	return readdirSync(LANG).filter(d => {
		const full = join(LANG, d);
		return statSync(full).isDirectory() && existsSync(join(full, 'strings.po'));
	});
}

function cmdExtract(strings) {
	const stamp = new Date().toISOString().replace('T', ' ').slice(0, 16) + '+0000';
	const out = [
		'# Translations template for A Darker Room.',
		'# Generated by build/i18n.mjs -- do not edit by hand.',
		'#',
		'msgid ""',
		'msgstr ""',
		'"Project-Id-Version: A Darker Room\\n"',
		`"POT-Creation-Date: ${stamp}\\n"`,
		'"MIME-Version: 1.0\\n"',
		'"Content-Type: text/plain; charset=utf-8\\n"',
		'"Content-Transfer-Encoding: 8bit\\n"',
		'"Generated-By: build/i18n.mjs\\n"',
		''
	];
	for (const [msgid, refs] of [...strings].sort((a, b) => a[0].localeCompare(b[0]))) {
		for (const ref of [...refs].sort()) out.push(`#: ${ref}`);
		out.push(`msgid "${poEscape(msgid)}"`);
		out.push('msgstr ""');
		out.push('');
	}
	writeFileSync(POT, out.join('\n'));
	console.log(`  extract   ${strings.size} strings -> lang/adarkroom.pot`);
}

function cmdMerge(strings) {
	for (const lang of languages()) {
		const poPath = join(LANG, lang, 'strings.po');
		const { header, entries, obsolete: priorObsolete } = parsePo(readFileSync(poPath, 'utf8'));

		const merged = new Map();
		let added = 0, kept = 0;

		for (const [msgid, refs] of [...strings].sort((a, b) => a[0].localeCompare(b[0]))) {
			const existing = entries.get(msgid);
			if (existing && existing.msgstr) { kept++; }
			else if (!existing) { added++; }
			merged.set(msgid, {
				msgstr: existing ? existing.msgstr : '',
				refs: [...refs].sort()
			});
		}

		/* Anything in the .po that is no longer in the source. Never deleted.
		 *
		 * Seeded with the obsolete entries already in the file so they carry
		 * across every subsequent merge, then topped up with newly-orphaned
		 * ones. If a string later RETURNS to the source it is picked up by
		 * the loop above and quietly stops being obsolete, which is the
		 * behaviour you want when text gets reworded back. */
		const obsolete = new Map(priorObsolete);
		for (const [msgid, data] of entries) {
			if (!strings.has(msgid) && data.msgstr) obsolete.set(msgid, data);
		}
		for (const msgid of strings.keys()) obsolete.delete(msgid);

		writeFileSync(poPath, serialisePo(header, merged, obsolete));
		console.log(`  merge     ${lang.padEnd(6)} +${String(added).padStart(4)} new, ` +
			`${String(kept).padStart(4)} kept, ${String(obsolete.size).padStart(4)} obsolete`);
	}
}

function cmdCompile() {
	for (const lang of languages()) {
		const { entries } = parsePo(readFileSync(join(LANG, lang, 'strings.po'), 'utf8'));
		const map = {};
		for (const [msgid, data] of entries) {
			/* Only real translations are emitted. An empty msgstr must NOT be
			 * written as "" -- lib/translate.js would then hand the game an
			 * empty string instead of falling through to the English source,
			 * which is how you get a blank UI in a partly-translated
			 * language. */
			if (data.msgstr) map[msgid] = data.msgstr;
		}
		writeFileSync(join(LANG, lang, 'strings.js'),
			'_.setTranslation(' + JSON.stringify(map) + ');\n');
		console.log(`  compile   ${lang.padEnd(6)} ${Object.keys(map).length} translated strings`);
	}
}

function cmdStatus(strings) {
	const total = strings.size;
	console.log(`\n  ${total} translatable strings in source\n`);
	const rows = [];
	for (const lang of languages()) {
		const { entries } = parsePo(readFileSync(join(LANG, lang, 'strings.po'), 'utf8'));
		let done = 0;
		for (const msgid of strings.keys()) {
			const e = entries.get(msgid);
			if (e && e.msgstr) done++;
		}
		rows.push([lang, done, Math.round(done / total * 100)]);
	}
	rows.sort((a, b) => b[1] - a[1]);
	for (const [lang, done, pct] of rows) {
		const bar = '#'.repeat(Math.round(pct / 5)).padEnd(20, '.');
		console.log(`  ${lang.padEnd(7)} ${bar} ${String(pct).padStart(3)}%  ${done}/${total}`);
	}
	console.log('');
}

/* ------------------------------------------------------------------------ */

const cmd = process.argv[2] || 'all';
console.log('\n  translations\n');
const strings = extract();

if (cmd === 'extract') cmdExtract(strings);
else if (cmd === 'merge') cmdMerge(strings);
else if (cmd === 'compile') cmdCompile();
else if (cmd === 'status') cmdStatus(strings);
else if (cmd === 'all') {
	cmdExtract(strings);
	cmdMerge(strings);
	cmdCompile();
	cmdStatus(strings);
} else {
	console.error(`  unknown command: ${cmd}`);
	process.exit(1);
}
console.log('  done\n');
