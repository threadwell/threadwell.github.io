// The playground's one shared session. Three separate things live here:
//   data : what the visitor owns (conversations, Spaces, saved messages, notes, checklists, reminders, theme,
//          layout and widget settings). Survives screens, help, layout and preview-size changes.
//   ui   : where they are right now (screen, open dialog, scroll-linked widget state). Never saved.
//   tut  : guided-help progress. Separate from the product, so help can never change someone's content.
// Old renderers read one flat state object `s`; stateProxy() gives them that, routed to data or ui.
// The widget display style is `wstyle` and the board's screen is `mode`; the countdown form is `cdraft` and
// the new-Space form is `draft`, so no field is shared between the two.
import { seedSpaces } from './space-model.js';
import { WIDGETS } from './widgets-model.js';

const KEY = 'threadwell.playground.v1';
export const DATA_KEYS = new Set([
  'spaces', 'tags', 'favs', 'notes', 'msgs', 'read', 'thread', 'seq', 'drafts', 'recents', 'defaultScopeAll',
  'layoutMode', 'railCollapsed', 'toolsCollapsed', 'stripMode', 'stripRemember', 'stripLast',
  'appliedTheme', 'knobs', 'bubbleSent', 'bubbleRecv', 'photos', 'dim', 'rot', 'photoIdx', 'reduceMotion', 'colorMode', 'textScale', 'photoStyle', 'stackSpread',
  'en', 'wstyle', 'pl', 'th', 'hidden', 'order', 'cal', 'cd', 'todayMax', 'compact', 'wxReady', 'sampleData',
  'spam', 'smart', 'autoReport',
]);
const VERSION = 2;

/* ---------- sample conversations ---------- */
const m = (id, text, sent = false, t = '', from = '') => ({ id, text, sent, t, from });
const ph = (id, photo, sent = false, t = '', from = '') => ({ id, text: '', photo, sent, t, from });
function seedMsgs() {
  return {
    0: [
      m('a1', 'Hey! Are we still on for dinner this week?', false, 'Mon 6:12 PM'),
      m('a2', 'Yes! Thursday works for me', true),
      m('a3', 'Any ideas where? I’m craving noodles', false),
      m('a4', 'Let me look around tonight', true),
      m('a5', 'Also, are you bringing the camera Saturday?', false, 'Tue 8:30 AM'),
      m('a6', 'Definitely. Maya wants photos of the climb', true),
      m('a7', 'Perfect. I’ll bring snacks', false),
      m('a8', 'Ooh, can you grab those salted pretzels?', true),
      m('a9', 'On it', false, 'Today 4:48 PM'),
      ph('a9p', 2, false),
      ph('a9q', 0, false),
      ph('a9r', 4, false),
      m('a9l', 'Menu is up: https://example.com/late-night-noodle-bar/menu', false),
      m('a10', 'Found the place I was telling you about', false, 'Today 6:55 PM'),
      m('a11', 'Late Night Noodle Bar. Table for two at 7?', false),
      m('a12', 'Perfect, see you there 🍜', true),
    ],
    1: [
      m('b1', 'Saturday still on?', false, 'Mon 9:10 AM', 'Maya'),
      m('b2', 'I’m in. Meeting at the trailhead at 8', false, '', 'Jon'),
      m('b3', 'Same. Bringing the rope', true),
      m('b4', 'Cabin near Bishop, 3 nights, $240 total', false, 'Tue 7:02 PM', 'Maya'),
      m('b4l', 'Listing: https://example.com/bishop-cabin', false, '', 'Maya'),
      m('b5', 'That’s a good price. Booking it tonight?', true),
      m('b6', 'Maya wants the trail headlamp', false, '', 'Jon'),
      m('b7', 'I can grab one on the way', true),
      m('b8', 'Maya: Saturday still on?', false, 'Today 6:40 PM', 'Maya'),
    ],
    2: [
      m('c1', 'How was the week, sweetheart?', false, 'Sun 5:20 PM'),
      m('c2', 'Busy but good. Just booked flights', true),
      m('c3', 'Flight lands Thursday at 6:15 PM', true),
      m('c4', 'We’ll pick you up. Dad says hi', false),
      m('c5', 'Paint color: Soft Linen, two coats', false, 'Mon 11:02 AM'),
      m('c6', 'Dad: wool socks, size 11', false),
      m('c7', 'Garden hose, 50 ft', false),
      m('c8', 'I’ll write all that down', true),
      ph('c8p', 5, false, 'Tue 8:40 AM'),
      m('c9', 'Love you', false, 'Tue 9:00 AM'),
    ],
    4: [
      m('s1', 'You’ve won a $500 reward! Claim it now: http://claim-your-prize.tk/x7', false, 'Today 8:02 AM'),
      m('s2', 'Offer ends today. Reply STOP to opt out.', false),
    ],
    3: [
      m('d1', 'Hi, this is Lakeside Dental. Reply C to confirm your cleaning.', false, 'Mon 8:00 AM'),
      m('d2', 'C', true),
      m('d3', 'Your appointment is confirmed for Oct 14', false),
      m('d4', 'We’ll text a reminder the day before.', false),
    ],
  };
}

function seedData() {
  const { spaces } = seedSpaces();
  let n = 0;
  const tag = (space, thread, text, extra = {}) => ({ id: 't' + ++n, space, thread, text, date: 'Oct 2', kind: 'Message', at: n, ...extra });
  return {
    spaces,
    tags: [
      tag('trips', 1, 'Cabin near Bishop, 3 nights, $240 total'), tag('trips', 2, 'Flight lands Thursday at 6:15 PM'),
      tag('home', 2, 'Paint color: Soft Linen, two coats'),
      tag('gifts', 1, 'Maya wants the trail headlamp'), tag('gifts', 2, 'Dad: wool socks, size 11'),
      tag('shop', 2, 'Garden hose, 50 ft'),
    ],
    favs: [], notes: [], msgs: seedMsgs(), read: [0], thread: 0, seq: 100, drafts: {}, recents: [], defaultScopeAll: false,
    layoutMode: 'board', railCollapsed: false, toolsCollapsed: false, stripMode: 'scroll', stripRemember: false, stripLast: true,
    appliedTheme: 'default', knobs: {}, bubbleSent: {}, bubbleRecv: {}, photos: [], dim: 1, rot: 'restart3', photoIdx: 0,
    reduceMotion: false, colorMode: 'system', textScale: 100, photoStyle: 'stack', stackSpread: 50,
    // The app starts with every widget off. The playground turns on three so the dashboard has something to show.
    en: { countdown: true, checklists: true, weather: true }, wstyle: {}, pl: {}, th: {}, hidden: {},
    order: ['countdown', 'checklists', 'weather', ...WIDGETS.map(w => w.id).filter(id => !['countdown', 'checklists', 'weather'].includes(id))],
    spam: 'quarantined', smart: true, autoReport: false,
    cal: 'ask', cd: [{ id: 'c1', emoji: '🎂', name: 'Sam’s birthday', days: 3 }], todayMax: 3, compact: false, wxReady: true, sampleData: true,
  };
}

const seedUi = () => ({
  view: 'home', hist: [], mode: 'chat', channel: 'CHAT', scopeAll: false, sheet: null, flow: null, draft: null, flash: null, pulse: '',
  bar: false, menu: false, saveDlg: false, tick: [], important: false, cb: null, cbLabel: null, cbSnooze: false, hl: null, done: false, shown: null, openAt: null, boardThread: null,
  holdMid: null, peek: false, pg: true, sq: '', sfilter: null, spDelete: null, device: 'phone', followSystem: true, stripExpanded: true, stripManual: false, dockOpen: false, docked: false,
  wsheet: null, preset: null, dlg: null, wid: null, cdraft: { emoji: '🎂', name: '', day: '' },
  capMenu: false, cap: null, noteMenu: null, noteMode: null, noteDraft: '',
  previewing: null, query: '', filter: 'All', picked: [], composer: { text: '', check: false }, itemDraft: {},
});

const seedTut = () => ({ dismissed: false, mode: 'free', done: {}, events: [], layoutAt: -1, armed: false, openHint: null });

export const session = { data: seedData(), ui: seedUi(), tut: seedTut(), persist: false };

const jclone = v => JSON.parse(JSON.stringify(v));

/** Is a saved copy something we can safely load? Checks the version and the shape of what the screens rely on. */
export function validSaved(saved) {
  if (!saved || typeof saved !== 'object') return 'damaged';
  if (saved.v !== VERSION) return 'older';
  const d = saved.data, arr = Array.isArray;
  const ok = d && typeof d === 'object' && arr(d.spaces) && arr(d.tags) && arr(d.notes) && arr(d.read) && arr(d.order) && arr(d.favs)
    && d.msgs && typeof d.msgs === 'object' && [0, 1, 2, 3, 4].every(k => arr(d.msgs[k])) && d.en && typeof d.en === 'object'
    && ['board', 'traditional'].includes(d.layoutMode) && typeof d.appliedTheme === 'string'
    && d.spaces.every(x => x && typeof x.id === 'string' && typeof x.name === 'string')
    && d.notes.every(n => n && typeof n.id === 'string' && typeof n.body === 'string')
    && d.tags.every(x => x && typeof x.id === 'string' && typeof x.text === 'string')
    && Object.values(d.msgs).every(l => l.every(x => x && typeof x.id === 'string' && typeof x.text === 'string'));
  return ok ? 'ok' : 'damaged';
}

/** "Remember this playground" is optional. Returns what happened so the page only says "saved" when it was. */
export function loadSaved() {
  let raw;
  try { raw = localStorage.getItem(KEY); } catch { return 'blocked'; }
  if (raw === null) return 'none';
  let saved;
  try { saved = JSON.parse(raw); } catch { saved = null; }
  const verdict = validSaved(saved);
  if (verdict !== 'ok') { try { localStorage.removeItem(KEY); } catch { /* ignore */ } return verdict; }   // unusable: discard rather than half-load
  const seed = seedData();
  DATA_KEYS.forEach(k => { session.data[k] = k in saved.data ? saved.data[k] : seed[k]; });
  session.persist = true;
  return 'loaded';
}
/** Saves when remembering is on. Returns false (and records it) if the browser refused. */
export function save() {
  if (!session.persist) return true;
  try { localStorage.setItem(KEY, JSON.stringify({ v: VERSION, data: session.data })); session.saveFailed = false; return true; }
  catch { session.saveFailed = true; return false; }
}
export function hasSaved() { try { return localStorage.getItem(KEY) !== null; } catch { return false; } }
/** Turn remembering on or off. On only succeeds if the copy really was written and can be read back. */
export function setRemember(on) {
  if (!on) { session.persist = false; session.saveFailed = false; try { localStorage.removeItem(KEY); } catch { /* ignore */ } return { ok: true }; }
  session.persist = true;
  let ok = save();
  if (ok) { try { ok = localStorage.getItem(KEY) !== null; } catch { ok = false; } }
  if (!ok) session.persist = false;
  return { ok };
}
export function eraseSaved() {
  session.persist = false; session.saveFailed = false;
  try { localStorage.removeItem(KEY); return true; } catch { return false; }
}
export const freshState = () => ({ ...seedData(), ...seedUi() });
/** Reset playground: back to the sample content. Keeps the preview size (a website setting) and the remember choice. */
export function resetSession() {
  const device = session.ui.device;
  Object.keys(session.data).forEach(k => delete session.data[k]);
  Object.assign(session.data, seedData());
  Object.keys(session.ui).forEach(k => delete session.ui[k]);
  Object.assign(session.ui, seedUi(), { device });
  Object.assign(session.tut, seedTut());
  if (session.persist) save();
}

/** A flat state object for the shared renderers: product fields go to `data`, everything else to `ui`. */
export function stateProxy() {
  const { data, ui } = session;
  const where = k => (DATA_KEYS.has(k) ? data : ui);
  return new Proxy({}, {
    get: (_, k) => (typeof k === 'symbol' ? undefined : where(k)[k]),
    set: (_, k, v) => { where(k)[k] = v; return true; },
    has: (_, k) => k in data || k in ui,
    deleteProperty: (_, k) => { delete where(k)[k]; return true; },
    ownKeys: () => [...Object.keys(data), ...Object.keys(ui)],
    getOwnPropertyDescriptor: (_, k) => ({ enumerable: true, configurable: true, value: where(k)[k], writable: true }),
  });
}

export const nextId = (p = 'n') => p + (session.data.seq++);
export { jclone };
