// Run with: node tools/test-consistency.mjs
// Two kinds of drift this catches without a browser:
//  1. Inside the site: tutorial ids, "next" links, Try it yourself targets, Guided help challenges and Show me demos must line up.
//  2. Against the app: emoji catalog, icon set, Space templates, colors and limits are parsed straight from the app's Kotlin.
// The app checks are skipped (and say so) when the app source is not found. Set THREADWELL_APP to its repo root to point at it.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { CHALLENGES } from '../js/challenges.js';
import { TRY } from '../js/try-it.js';
import { DEMOS } from '../js/challenge-demos.js';
import { EMOJI_CATEGORIES, singleEmoji, searchEmoji } from '../js/icon-studio.js';
import { TEMPLATES, COLORS, MAX_SPACES, NAME_MAX } from '../js/space-model.js';

const here = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
let n = 0, skipped = 0;
const test = (name, fn) => { fn(); n++; console.log('ok  ' + name); };
const read = p => readFileSync(join(here, p), 'utf8');

// ---------- inside the site ----------
const demoFiles = readdirSync(join(here, 'js/demos')).filter(f => f.endsWith('.js'));
const tutorials = {};
for (const f of demoFiles) tutorials[f] = (await import(`../js/demos/${f}`)).default;

test('every tutorial has a unique id, a title, steps and an answer', () => {
  const ids = Object.values(tutorials).map(t => t.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate tutorial id');
  for (const [f, t] of Object.entries(tutorials)) {
    assert.ok(t.id && t.title && t.answer, `${f}: id, title and answer are required`);
    assert.ok(Array.isArray(t.steps) && t.steps.length >= 2, `${f}: needs steps`);
    assert.equal(typeof t.play, 'function', `${f}: needs a Show me script`);
  }
});
test('every tutorial file is imported by app.js', () => {
  const app = read('js/app.js');
  for (const [f, t] of Object.entries(tutorials)) {
    assert.ok(app.includes(`./demos/${f}`), `${f} is not imported by app.js`);
  }
});
test('every "next" link points at a real tutorial', () => {
  const ids = new Set(Object.values(tutorials).map(t => t.id));
  for (const t of Object.values(tutorials)) for (const x of t.next || []) assert.ok(ids.has(x.id), `${t.id} links to missing "${x.id}"`);
});
test('Try it yourself: every source is a tutorial and every target is a challenge that has Show me', () => {
  const ids = new Set(Object.values(tutorials).map(t => t.id)), ch = new Set(CHALLENGES.map(c => c.id));
  for (const [id, t] of Object.entries(TRY)) {
    assert.ok(ids.has(id), `TRY has "${id}" but there is no such tutorial`);
    assert.ok(ch.has(t.challenge), `TRY "${id}" targets missing challenge "${t.challenge}"`);
    assert.ok(DEMOS[t.challenge], `TRY "${id}" targets "${t.challenge}", which has no Show me`);
    assert.ok(/^Try it yourself/.test(t.label), `TRY "${id}" label should start with "Try it yourself"`);
  }
});
test('every Show me demo belongs to a challenge and has a factory', () => {
  const ch = new Map(CHALLENGES.map(c => [c.id, c]));
  for (const [id, d] of Object.entries(DEMOS)) {
    assert.ok(ch.has(id), `DEMOS has "${id}" but no such challenge`);
    assert.equal(typeof d.make, 'function', `${id}: make must be a function`);
    if (d.tools) assert.ok(d.tools.label && d.tools.starter, `${id}: tools needs label and starter`);
  }
});
test('challenges have the fields the playground reads', () => {
  for (const c of CHALLENGES) assert.ok(c.id && c.title && c.hint && c.hint.length, `challenge ${c.id}`);
  assert.equal(new Set(CHALLENGES.map(c => c.id)).size, CHALLENGES.length);
});

// ---------- icon studio logic ----------
test('singleEmoji accepts one emoji (including ZWJ sequences, flags, keycaps) and nothing else', () => {
  for (const ok of ['🍕', '❤️', '👨‍👩‍👧‍👦', '🇺🇸', '#️⃣', '✈️', ' 🍕 ']) assert.ok(singleEmoji(ok), `should accept ${ok}`);
  for (const bad of ['', '  ', 'a', 'ab', '🍕🍕', '🍕a', 'x1', 'hello']) assert.equal(singleEmoji(bad), null, `should reject "${bad}"`);
});
test('every emoji in the catalog is a single emoji, and no category repeats one', () => {
  for (const [name, list] of EMOJI_CATEGORIES) {
    assert.ok(list.length >= 8, `${name} is thin`);
    assert.equal(new Set(list).size, list.length, `${name} repeats an emoji`);
    for (const e of list) assert.ok(singleEmoji(e), `${name}: "${e}" is not a single emoji`);
  }
});
test('category search is case-insensitive, matches category names only, and is empty for blank', () => {
  assert.deepEqual(searchEmoji(''), []); assert.deepEqual(searchEmoji('   '), []);
  assert.ok(searchEmoji('PETS').includes('🐶')); assert.ok(searchEmoji('food').includes('🍕'));
  assert.deepEqual(searchEmoji('zzz'), []);
  assert.deepEqual(searchEmoji('pizza'), [], 'search is by category name, as in the app');
  assert.equal(new Set(searchEmoji('o')).size, searchEmoji('o').length, 'results are de-duplicated');
});

// ---------- against the app ----------
const appRoot = process.env.THREADWELL_APP || 'C:/Users/minja/AndroidStudioProjects/MoogleMessages';
const kt = name => {
  const p = join(appRoot, 'app/src/main/java/com/example/mooglemessages', name);
  return existsSync(p) ? readFileSync(p, 'utf8') : null;
};
const appTest = (name, file, fn) => {
  const src = kt(file);
  if (!src) { skipped++; console.log(`skip ${name} (app source not found: ${file})`); return; }
  test(name, () => fn(src));
};

appTest('emoji catalog matches SpaceEmojiCatalog in the app', 'SpaceIcons.kt', src => {
  const block = src.slice(src.indexOf('object SpaceEmojiCatalog'));
  const cats = [...block.matchAll(/"([A-Za-z ]+)" to listOf\(([^)]*)\)/g)].map(m => [m[1], [...m[2].matchAll(/"([^"]+)"/g)].map(x => x[1])]);
  assert.ok(cats.length >= 10, 'could not parse the app catalog');
  assert.deepEqual(EMOJI_CATEGORIES.map(([k]) => k), cats.map(([k]) => k), 'category names / order');
  for (const [k, list] of cats) assert.deepEqual(EMOJI_CATEGORIES.find(([x]) => x === k)[1], list, `emoji in ${k}`);
});
appTest('the Icons tab lists the same 20 built-in icons as SpaceIconSet', 'SpaceIcons.kt', src => {
  const ids = src.match(/val IDS = listOf\(([\s\S]*?)\)/)[1].match(/"(\w+)"/g);
  assert.equal(ids.length, 20, 'the app has 20 icons; the tutorial note and the Icons tab say 20');
});
appTest('Space templates match ChannelTemplates (ids, names, emoji, descriptions, order)', 'ChannelTemplates.kt', src => {
  const app = [...src.matchAll(/ChannelTemplate\("(\w+)", "([^"]+)", "([^"]+)", "([^"]+)"/g)].map(m => ({ id: m[1], name: m[2], emoji: m[3], desc: m[4] }));
  assert.equal(app.length, 10);
  assert.deepEqual(TEMPLATES, app);
});
appTest('Space colors and limits match CustomChannels', 'CustomChannels.kt', src => {
  const block = src.match(/val COLORS: List<Int> = listOf\(([\s\S]*?)\)\.map/)[1];
  const hex = [...block.matchAll(/0xFF([0-9A-Fa-f]{6})/g)].map(m => '#' + m[1].toLowerCase());
  assert.deepEqual(COLORS.map(c => c[0]), hex);
  assert.equal(Number(src.match(/MAX_CHANNELS = (\d+)/)[1]), MAX_SPACES);
  assert.ok(src.includes('name.trim().take(24)') && NAME_MAX === 24, 'name limit');
});
appTest('the settings labels the tutorials name exist in the app', 'SettingsCategories.kt', src => {
  for (const label of ['Messaging & notifications', 'Widgets & dashboard']) assert.ok(src.includes(label), label);
});

console.log(`\n${n} passed${skipped ? `, ${skipped} skipped (app source not found)` : ''}`);
