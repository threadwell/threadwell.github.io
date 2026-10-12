import { replacePanel } from './panel-motion.js';
// Explore Threadwell: the playground. One session (js/store.js) drives every screen, and the tutorials' own
// renderers and actions (board, widgets, themes) are reused so manual play and guided help never disagree.
// Guidance lives outside the phone and only watches what the visitor does.
import { esc, $, $$ } from './core.js';
import { session, stateProxy, resetSession, setRemember, eraseSaved, hasSaved, loadSaved, save, nextId } from './store.js';
let savedStatus = 'none';
export const setSavedStatus = v => { savedStatus = v; };
import { setScopeLabel, dockButton } from './board.js';
import { boardActs } from './board-app.js';
import { settingsHome, statusbar, appbar, bindCarousels } from './phone-ui.js';
import { inbox } from './inbox.js';
import { widgetsHost, widgetOverlays, widgetActs, widgetsSettingsView, widgetPageView, widgetsSummary, WIDGETS } from './widgets-model.js';
import { themeSpec } from './demos/themes.js';
import { appearancePage } from './phone-ui.js';
import { readableAccents } from './accents.js';
import { views } from './play-views.js';
import { navActs, messageActs, panelActs, applySave } from './play-notes.js';
import { createNote, defaultSpace, saveCapture, setRemind, captureActs } from './play-notes.js';
import { TIMES, HOURS, parseChecklist, checklistBody, toChecklistBody, toggleItem, addItem, MAX_NOTE_LENGTH } from './notes.js';
import { tlist, tchat, chatAt, fullChat, playBoard, messagingPage, sharedOverlays, stripState, stripHtml, stripMode, STRIP_MODES, normalizeLink, capValid, WIDE } from './play-ui.js';
import { CHALLENGES, evaluate } from './challenges.js';
import { mountDemo } from './core.js';
import { createDemoController, DEMO } from './demo-controller.js';
import { DEMOS } from './challenge-demos.js';
import { TH, SPAM_KEY, SPAM_CATEGORY, spamQuarantined, filteredHits, spamPage, spamFolderView, BUILTIN } from './play-org.js';

const SEED_SPACES = ['trips', 'home', 'gifts', 'shop', 'dinner'];
const state = () => stateProxy();
let api = null, rootEl = null, cleanups = [];

/* ================= the widget strip: real scrolling and a real 5 second timer ================= */
const strip = { timer: null, travel: 0, lastInput: 0, ignore: false };
const S = () => api.s;
const homeEl = () => api.el('home');
const stripActive = () => !!api && S().layoutMode === 'board' && api.view === 'home' && !['today', 'search', 'spam'].includes(S().mode);


/** Same wording as SaveNotices.describe in the app. */
function describeSave(added, removed, important) {
  const list = n => (n.length === 1 ? n[0] : n.length === 2 ? n[0] + ' and ' + n[1] : n[0] + ' and ' + (n.length - 1) + ' more');
  const parts = [];
  if (added.length) parts.push('Saved to ' + list(added)); else if (removed.length) parts.push('Removed from ' + list(removed));
  if (important === true) parts.push(parts.length ? 'marked important' : 'Marked important');
  if (important === false) parts.push(parts.length ? 'removed from Important' : 'Removed from Important');
  return parts.length ? parts.join(' · ') : null;
}
let noticeEl = null, noticeTimer = null;
const motionOff = () => matchMedia('(prefers-reduced-motion: reduce)').matches || (api && api.s.reduceMotion);
function hideNotice(now) {
  clearTimeout(noticeTimer);
  if (!noticeEl || noticeEl.hidden) return;
  if (now || motionOff()) { noticeEl.hidden = true; return; }
  noticeEl.classList.add('out');
  setTimeout(() => { if (noticeEl && noticeEl.classList.contains('out')) noticeEl.hidden = true; }, 150);   // EXIT_MS
}
let noticeUndo = null;
/** The confirmation under the phone. `undo` (a function) replaces "Open Space" with an Undo button, as in the app. */
function showNotice(text, spaceId, undo = null) {
  if (!noticeEl) return;
  const canOpen = !undo && spaceId && S().layoutMode === 'board';
  noticeUndo = undo;
  noticeEl.innerHTML = '<span></span>' + (undo ? '<button type="button" class="notice-act" data-undo="1">Undo</button>' : canOpen ? '<button type="button" class="notice-act" data-space="' + esc(spaceId) + '">Open Space</button>' : '');
  noticeEl.firstChild.textContent = text;
  noticeEl.classList.remove('out'); noticeEl.hidden = false;
  noticeEl.style.animation = 'none'; void noticeEl.offsetWidth; noticeEl.style.animation = '';
  clearTimeout(noticeTimer); noticeTimer = setTimeout(() => hideNotice(), 6000);
  api.say(text);
}
function openSpaceFromNotice(id) {
  const a = api; if (!a || !noteSpace(id)) return;
  const s = a.s;
  Object.assign(s, { sheet: null, saveDlg: false, bar: false, cap: null, capMenu: false, peek: false, mode: 'libspace', channel: 'c:' + id, scopeAll: true, flash: null });
  hideNotice(true);
  if (a.view !== 'home') a.go('home'); else a.render();
  patchStrip();
}
const noteSpace = id => S().spaces.some(x => x.id === id);

/** A scroll made by the page itself (jump to a result) is not the visitor reading, so it must not collapse widgets. */
/**
 * The message (or the first message of a photo group) at the bottom edge of the Threadwell chat, or null when the newest
 * message is on screen. Mirrors the app: BoardChatPosition records the bottom-most visible row, and "open chat" lands on it.
 */
function readingPosition(a) {
  if (a.s.mode !== 'chat') return null;
  const box = a.$('[data-sk^="chat:"]');
  if (!box || box.scrollTop + box.clientHeight >= box.scrollHeight - 4) return null;
  const edge = box.getBoundingClientRect().bottom;
  let hit = null;
  for (const el of box.querySelectorAll('[id^="m-"], [id^="g-"]')) { if (el.getBoundingClientRect().top < edge - 1) hit = el; else break; }
  return hit ? hit.id.slice(2) : null;
}

function jumpTo(sel, block = 'center') {
  const el = homeEl()?.querySelector(sel); if (!el) return;
  strip.ignore = true; el.scrollIntoView({ block }); setTimeout(() => { strip.ignore = false; }, 400);
}

function stripSync(restart = false) {
  const armed = !suspended && stripActive() && stripState(S()).timerArmed;
  if (!armed) { clearTimeout(strip.timer); strip.timer = null; return; }
  if (restart) { clearTimeout(strip.timer); strip.timer = null; }
  if (!strip.timer) strip.timer = setTimeout(() => {
    strip.timer = null;
    if (stripActive() && stripState(S()).timerArmed) stripCollapse('timer');
  }, 5000);
}
function stripVisit() {
  // Each visit to a conversation starts fresh unless "Remember my last widget state" is on (rememberWidgetStripController).
  const s = S();
  s.stripExpanded = s.stripRemember ? s.stripLast : stripMode(s).key !== 'collapsed';
  s.stripManual = false; s.dockOpen = false;
}
function patchStrip(animate = false) {
  const el = homeEl(); if (!el) return;
  const s = S(), st = stripState(s);
  s.dockInfo = st.dock;
  const slot = $('.strip-slot', el), dslot = $('.dock-slot', el);
  if (!slot || !dslot) return;
  const hadFocus = slot.contains(document.activeElement);
  const show = !['today', 'search', 'spam'].includes(s.mode);
  const update = () => {
    slot._panelCleanup?.();
    slot.innerHTML = show ? stripHtml(s, st) : '';
    dslot.innerHTML = dockButton(s, show && st.presentation === 'dock');
  };
  if (animate) replacePanel(el, '.strip-slot', update, { reduced: motionOff(), widget: true });
  else update();
  if (hadFocus) (el.querySelector('#wdock, #stripshow, #stripcollapse') || el.querySelector('.bcontent'))?.focus({ preventScroll: true });
  stripSync();
  refreshState();
}
function stripCollapse(why) {
  const s = S();
  if (!s.stripExpanded) return;
  s.stripExpanded = false;
  if (s.stripRemember) s.stripLast = false;
  patchStrip(true);
  note(why === 'user' ? 'stripcollapse' : 'stripdock');
  const docks = stripMode(s).docks;
  api.say(docks ? 'Widgets moved into the Widgets button in the thread rail.' : 'Widgets collapsed to a one-line shelf.');
}
function stripExpand() {
  const s = S();
  s.stripExpanded = true; s.stripManual = true; s.dockOpen = false;
  if (s.stripRemember) s.stripLast = true;
  patchStrip(true);
  api.say('Widgets shown at the top.');
}

function bindScroll(screen) {
  const mark = () => { strip.lastInput = performance.now(); };
  ['wheel', 'touchmove', 'keydown', 'pointerdown'].forEach(t => screen.addEventListener(t, mark, { passive: true }));
  screen.addEventListener('pointerdown', e => { if (e.target.closest('.strip-slot')) stripSync(true); });
  screen.addEventListener('scroll', e => {
    const el = e.target;
    if (!(el instanceof Element) || !el.matches('.bcontent') || !stripActive()) return;
    const last = el.dataset.lt === undefined ? el.scrollTop : Number(el.dataset.lt);
    el.dataset.lt = String(el.scrollTop);
    if (strip.ignore || performance.now() - strip.lastInput > 700) return;    // only a finger or key counts, never a program
    strip.travel += Math.abs(el.scrollTop - last);
    if (strip.travel >= 24) {                                               // about 24dp of travel (WidgetStripLogic / widgetStripScrollSignal)
      strip.travel = 0;
      const st = stripState(S());
      if (st.mode.scroll && S().stripExpanded && !st.held && st.vis.length) stripCollapse('scroll');
    }
  }, true);
  cleanups.push(() => { clearTimeout(strip.timer); strip.timer = null; });
}

/* ================= notes, checklists, reminders ================= */
const spaceById = id => S().spaces.find(x => x.id === id);
const noteById = id => S().notes.find(x => x.id === id);
const stamp = () => nextId('');   // monotonic creation order
const newNote = (space, body, thread = null, extra = {}) => createNote(S(), space, body, thread, extra);
const where = ref => { const [kind, id] = ref.split(':'); return { kind, id, item: kind === 'note' ? noteById(id) : S().tags.find(x => x.id === id) }; };
const closeTools = () => { S().peek = false; };

/* ================= acts ================= */
const widgetOn = { event() {} };
const acts = {
  ...boardActs(),
  ...themeSpec.acts,
  ...widgetActs(widgetOn),
  noop: () => {},

  /* appearance: the slider restyles the whole phone without rebuilding the control being dragged */
  textsize: (a, _x, el) => { a.s.textScale = Number(el.value); const out = a.$('#ts-out'); if (out) out.textContent = a.s.textScale + '%'; a.refresh(); },

  /* navigation and settings */
  ...navActs(),
  ...messageActs(),
  ...panelActs(),
  setrail: a => { a.s.railCollapsed = !a.s.railCollapsed; a.render('messaging'); },
  settools: a => { a.s.toolsCollapsed = !a.s.toolsCollapsed; a.s.peek = false; a.render('messaging'); },
  stripmode: (a, key) => { a.s.stripMode = key; a.render('messaging'); a.callout(`Widget strip: <b>${esc(STRIP_MODES.find(m => m.key === key).label)}</b>. It takes effect the next time you open a conversation in Threadwell view.`); },
  striprem: a => { a.s.stripRemember = !a.s.stripRemember; a.render('messaging'); },
  defscope: (a, v) => { a.s.defaultScopeAll = v === 'true'; a.render('messaging'); },

  /* conversations */
  open: (a, k) => { a.s.thread = Number(k); if (!a.s.read.includes(a.s.thread)) a.s.read.push(a.s.thread); a.go('tchat'); },
  thread: (a, k) => {
    const s = a.s; s.thread = Number(k); s.boardThread = s.thread; s.mode = 'chat'; s.channel = 'CHAT'; s.sheet = null; s.bar = false; s.hl = null;
    if (!s.read.includes(s.thread)) s.read.push(s.thread);
    stripVisit(); a.render();
  },
  msgdraft: (a, _x, el) => {
    a.s.drafts[a.s.thread] = el.value;
    const b = a.$('#sendmsg'); if (b) b.disabled = !el.value.trim();
  },
  sendmsg: a => {
    const s = a.s, text = (s.drafts[s.thread] || '').trim();
    if (!text) return;
    s.msgs[s.thread].push({ id: nextId('p'), text, sent: true, t: '', from: '', pg: true });
    s.drafts[s.thread] = '';
    a.render(); a.el(a.view)?.querySelectorAll('[data-end]').forEach(n => { n.scrollTop = n.scrollHeight; });
    a.$('#msgin')?.focus({ preventScroll: true });
  },
  channel: (a, key) => {
    const s = a.s; s.sheet = null; s.bar = false;
    if (key === 'CHAT') { s.mode = 'chat'; s.channel = 'CHAT'; }
    else if (BUILTIN[key]) { s.mode = 'builtin'; s.channel = key; }
    else if (key.startsWith('c:')) { s.mode = 'space'; s.channel = key; s.scopeAll = s.defaultScopeAll; s.recents = [key.slice(2), ...s.recents.filter(x => x !== key.slice(2))].slice(0, 3); }
    a.render();
  },
  pickspace: (a, id) => { const s = a.s; s.sheet = null; s.mode = 'space'; s.channel = 'c:' + id; s.scopeAll = s.defaultScopeAll; s.recents = [id, ...s.recents.filter(x => x !== id)].slice(0, 3); a.render(); },
  today: a => { closeTools(); a.s.mode = 'today'; a.s.sheet = null; a.render(); patchStrip(); },
  showchat: (a, id) => { a.s.shown = id; a.go('chat'); },
  // Open chat (Threadwell view header): the full conversation, at the message that was at the bottom edge of the board's
  // chat (the app's BoardChatPosition → onOpenMessage), or at the newest message when the reader was already there.
  openfull: a => {
    const s = a.s, at = readingPosition(a);
    s.openAt = at; s.bar = false; s.sheet = null;
    a.go('fullchat');
    if (at != null) {
      const el = a.$('#' + CSS.escape('m-' + at)) || a.$('#' + CSS.escape('g-' + at));
      if (el) { strip.ignore = true; el.scrollIntoView({ block: 'end' }); setTimeout(() => { strip.ignore = false; }, 400); }
      setTimeout(() => { if (a.s.openAt === at) { a.s.openAt = null; a.el('fullchat')?.querySelectorAll('.jump').forEach(e => e.classList.remove('jump')); } }, 2200);
    }
    a.say(at != null ? 'Opened the full conversation at the message you were reading.' : 'Opened the full conversation.');
  },

  /* search, Links, Attachments, Important */
  search: a => { closeTools(); a.s.mode = 'search'; a.s.sheet = null; a.s.sq = ''; a.s.sfilter = null; a.render(); a.$('#bsq')?.focus({ preventScroll: true }); patchStrip(); },
  sq: (a, _x, el) => { a.s.sq = el.value; a.render(); },
  sfilter: (a, k) => { a.s.sfilter = k || null; a.render(); },
  hit: (a, i) => {
    const s = a.s, h = filteredHits(s)[Number(i)]; if (!h) return;
    if (h.mid) return showMsg(a, h.mid);
    if (h.space) {
      s.channel = 'c:' + h.space; s.flash = h.note || null;
      if (h.thread != null) { s.thread = h.thread; s.boardThread = s.thread; s.mode = 'space'; s.scopeAll = false; } else { s.mode = 'libspace'; s.scopeAll = true; }
      stripVisit(); a.render(); patchStrip(); if (h.note) jumpTo('#note-' + h.note); return;
    }
    s.thread = h.thread; s.boardThread = s.thread; s.mode = 'chat'; s.channel = 'CHAT'; if (!s.read.includes(h.thread)) s.read.push(h.thread);
    stripVisit(); a.render(); patchStrip();
  },
  showmsg: (a, mid) => showMsg(a, mid),
  star: a => { const m = a.s.msgs[a.s.thread].find(x => x.id === a.s.holdMid); if (m) m.star = !m.star; a.s.bar = false; a.s.menu = false; a.render(); },
  unstar: (a, mid) => { for (const l of Object.values(a.s.msgs)) { const m = l.find(x => x.id === mid); if (m) m.star = false; } a.render(); },

  /* spam protection (all sample data) */
  spamfolder: a => {
    closeTools();
    if (a.s.layoutMode === 'board') { a.s.mode = 'spam'; a.s.sheet = null; a.render(); patchStrip(); } else a.go('spamlist');
    a.callout('This is the Spam folder with one <b>sample</b> conversation. Open it to see why it was flagged.');
  },
  spamopen: a => {
    const s = a.s; s.thread = SPAM_KEY; if (!s.read.includes(SPAM_KEY)) s.read.push(SPAM_KEY);
    if (s.layoutMode === 'board') { s.mode = 'chat'; s.channel = 'CHAT'; stripVisit(); a.render(); patchStrip(); } else a.go('tchat');
    a.callout(`<b>Why it was flagged</b> (a playground explanation; the app shows only the category, “${SPAM_CATEGORY}”): the message promises a cash prize, comes from a number that is not in your contacts, and links to a .tk address, one of the web endings the filter treats as abused. <b>Restore once</b> removes the current flags and keeps checking new messages. <b>Always allow</b> stops filtering this conversation.`);
  },
  notspam: a => { a.s.spam = 'allowed'; a.render(); a.callout(`Won’t flag “${esc(TH[SPAM_KEY].n)}” as spam. It is back in your threads.`); a.say('Not spam. The conversation is back in your threads.'); },
  spamallow: a => { a.s.spam = 'allowed'; a.render(); a.callout('<b>Always allow</b>: this conversation is excluded from filtering, and it is in your threads now.'); a.say('Always allowed.'); },
  spamrestore: a => { a.s.spam = 'restored'; a.render(); a.callout('<b>Restore once</b>: the current flags are removed and the conversation is in your threads. New messages from this number are still checked.'); a.say('Restored once.'); },
  setsmart: a => { a.s.smart = !a.s.smart; a.render('spam'); a.callout(a.s.smart ? 'Smart detection is on again.' : 'Smart detection is off, so the sample conversation shows in your threads like any other.'); },
  setautoreport: a => { a.s.autoReport = !a.s.autoReport; a.render('spam'); },

  /* editing a Space */
  spedit: (a, id) => { const sp = spaceById(id); a.s.draft = { name: sp.name, emoji: sp.emoji, color: sp.color, editing: id }; a.s.sheet = 'spedit'; a.render(); a.$('#spname')?.focus({ preventScroll: true }); },
  spcancel: a => { a.s.draft = null; a.s.sheet = 'manage'; a.render(); },
  speditsave: a => {
    const d = a.s.draft, sp = spaceById(d.editing); if (!sp || !d.name.trim()) return;
    sp.name = d.name.trim(); sp.color = d.color; a.s.draft = null; a.s.sheet = 'manage'; a.s.flash = sp.id; a.render();
  },
  spdelete: a => { a.s.spDelete = a.s.draft.editing; a.render(); },
  spdeleteno: a => { a.s.spDelete = null; a.render(); },
  spdeleteyes: a => {
    const s = a.s, id = s.spDelete;
    s.spaces = s.spaces.filter(x => x.id !== id); s.tags = s.tags.filter(x => x.space !== id); s.notes = s.notes.filter(x => x.space !== id);
    s.favs = s.favs.filter(x => x !== id); s.recents = s.recents.filter(x => x !== id);
    if (s.channel === 'c:' + id) { s.mode = 'chat'; s.channel = 'CHAT'; }
    if (s.cap && s.cap.space === id) s.cap.space = defaultSpace(s);
    s.spDelete = null; s.draft = null; s.sheet = 'manage'; a.render();
  },

  /* tools column and Space list: real, saved collapse behaviour */
  stripcollapse: () => stripCollapse('user'),
  stripexpand: () => stripExpand(),
  wdock: a => { a.s.dockOpen = true; a.render(); },
  wdockclose: a => { a.s.dockOpen = false; a.render(); a.$('#wdock')?.focus({ preventScroll: true }); },
  wshowtop: () => stripExpand(),

  /* saving a message into a Space */
  savemsg: a => {
    const s = a.s, r = applySave(s);
    if (!r) { a.render(); return; }
    a.render();
    const text = describeSave(r.added.map(id => spaceById(id).name), r.removed.map(id => spaceById(id)?.name).filter(Boolean), r.important);
    if (text) showNotice(text, r.added.length === 1 && !r.removed.length ? r.added[0] : null);
  },
  makechecklist: (a, id) => {
    const tag = a.s.tags.find(x => x.id === id); if (!tag) return;
    let parts = tag.text.split('\n').map(x => x.trim()).filter(Boolean);
    if (parts.length === 1) parts = parts[0].split(/[,;]/).map(x => x.trim()).filter(Boolean);      // Make checklist (BoardChannels.kt)
    const n = newNote(tag.space, toChecklistBody(parts.join('\n')), tag.thread);
    a.s.flash = n.id; a.render(); a.$('#note-' + n.id)?.scrollIntoView({ block: 'nearest' });
  },
  tagpin: (a, id) => { const t = a.s.tags.find(x => x.id === id); t.pinned = !t.pinned; a.render(); },
  // The app removes a saved item at once and offers Undo in the confirmation ("Removed from Trips", BoardChannels.kt
  // `remove` + SaveNotices.reportRemoved). It never asks first; only multi-select Remove does, and the playground has none.
  tagremove: (a, id) => {
    const s = a.s, i = s.tags.findIndex(x => x.id === id); if (i < 0) return;
    const tag = s.tags[i], sp = spaceById(tag.space);
    s.tags = s.tags.filter(x => x.id !== id); a.render();
    showNotice(describeSave([], [sp ? sp.name : 'this Space'], null), null, () => {
      if (!api.s.tags.some(x => x.id === tag.id)) { const t = api.s.tags.slice(); t.splice(Math.min(i, t.length), 0, tag); api.s.tags = t; api.render(); }
    });
  },

  /* Add to Threadwell */
  ...captureActs(),
  capsave: a => {
    const s = a.s, saved = saveCapture(s); if (!saved) return;
    const { note: n, space, kind, at } = saved;
    a.render();
    const sp = spaceById(space);
    const what = { CHECKLIST: 'checklist', NOTE: 'note', REMINDER: 'reminder', LINK: 'link' }[kind];
    a.callout(`Saved to <b>${sp.emoji} ${esc(sp.name)}</b> as a personal ${what}. <button class="btn sm" type="button" data-open="${n.id}">Open saved ${what}</button> <span class="muted">Playground shortcut: the app has no such button. It opens the Space under All chats, where personal notes live.</span> ${at ? 'Playground reminders never show a notification.' : ''}`);
    a.say(`Saved to ${sp.name}. An Open saved ${what} button is below the phone.`);
  },

  /* a note or checklist */
  itemdraft: (a, id, el) => { (a.s.itemDraft ||= {})[id] = el.value; const b = a.$('#aib-' + id); if (b) b.disabled = !el.value.trim(); },
  itemadd: (a, id) => {
    const n = noteById(id), t = (a.s.itemDraft[id] || '');
    if (n && addItem(n, t)) { a.s.itemDraft[id] = ''; a.render(); a.$('#ai-' + id)?.focus({ preventScroll: true }); }
  },
  notemenu: (a, id) => { a.s.noteMenu = id; a.s.noteMode = null; a.render(); },
  notemenuclose: a => { a.s.noteMenu = null; a.s.noteMode = null; a.render(); },
  notemode: (a, mode) => { const n = noteById(a.s.noteMenu); a.s.noteMode = mode; if (mode === 'edit') a.s.noteDraft = n.body; a.render(); a.$('#noteedit')?.focus({ preventScroll: true }); },
  notemodeclose: a => { a.s.noteMode = null; a.render(); },
  noteeditdraft: (a, _x, el) => { a.s.noteDraft = el.value; const b = a.$('#noteeditsave'); if (b) b.disabled = !el.value.trim(); },
  noteeditsave: a => { const n = noteById(a.s.noteMenu); n.body = a.s.noteDraft.slice(0, MAX_NOTE_LENGTH); n.edited = true; a.s.noteMode = null; a.s.noteMenu = null; a.render(); },
  notedelete: a => { a.s.notes = a.s.notes.filter(x => x.id !== a.s.noteMenu); a.s.noteMode = null; a.s.noteMenu = null; a.render(); },
  notepin: (a, id) => { const n = noteById(id); n.pinned = !n.pinned; a.s.noteMenu = null; a.render(); },
  notescope: (a, id) => { const n = noteById(id); n.thread = n.thread != null ? null : a.s.thread; a.s.noteMenu = null; a.render(); },
  noteclear: (a, id) => { setRemind(noteById(id), null); a.s.noteMenu = null; a.render(); },
  notecomplete: (a, id) => { const n = noteById(id); n.done = true; setRemind(n, null); a.s.noteMenu = null; a.render(); a.callout('Completed notes move to <b>Completed</b> under Threads to Tend, and are kept for 30 days in the app.'); },
  notemove: (a, to) => {
    const n = noteById(a.s.noteMenu);
    if (a.s.noteMode === 'copy') newNote(to, n.body, n.thread); else n.space = to;
    a.s.noteMode = null; a.s.noteMenu = null; a.s.flash = to; a.render();
  },
  compcheck: a => { a.s.composer.check = !a.s.composer.check; a.render(); a.$('#compin')?.focus({ preventScroll: true }); },
  compdraft: (a, _x, el) => { a.s.composer.text = el.value; const b = a.$('#compsave'); if (b) b.disabled = !el.value.trim(); },
  compsave: a => {
    const s = a.s, c = s.composer, sp = s.channel.startsWith('c:') ? s.channel.slice(2) : null;
    if (!sp || !c.text.trim()) return;
    const n = newNote(sp, c.check ? toChecklistBody(c.text) : c.text.trim(), s.mode === 'space' && !s.scopeAll ? s.thread : null);
    s.composer = { text: '', check: c.check }; s.flash = n.id; a.render(); a.$('#note-' + n.id)?.scrollIntoView({ block: 'nearest' });
  },

  /* reminders: Come back to this, Snooze, Complete */
  comeback: (a, ref) => {
    const parts = ref.split(':'), snooze = parts[2] === 'snooze';
    a.s.noteMenu = null; a.s.noteMode = null;
    a.s.cb = { kind: parts[0], id: parts[1], snooze }; a.s.cbLabel = null; a.render();
  },
  time: (a, k) => { a.s.cbLabel = k; a.render(); a.$('#confirm')?.focus({ preventScroll: true }); },
  cancelcb: a => { a.s.cb = null; a.render(); },
  confirm: a => {
    const { item } = where(`${a.s.cb.kind}:${a.s.cb.id}`);
    if (item && a.s.cbLabel) setRemind(item, a.s.cbLabel);
    a.s.cb = null; a.render();
  },
  complete: (a, ref) => {
    const { kind, item } = where(ref);
    if (!item) return;
    if (kind === 'note') { item.done = true; setRemind(item, null); } else setRemind(item, null);
    a.s.done = true; a.render();
  },
};

function showMsg(a, mid) {
  const s = a.s;
  for (const k of Object.keys(s.msgs)) if (s.msgs[k].some(m => m.id === mid)) {
    s.thread = Number(k); s.boardThread = s.thread; s.mode = 'chat'; s.channel = 'CHAT'; s.hl = mid; if (!s.read.includes(s.thread)) s.read.push(s.thread);
    stripVisit(); a.render(); patchStrip(); jumpTo('#m-' + mid); return;
  }
}
/** Starter actions outside the phone. Each opens a screen in the existing session and leaves the app's own navigation intact. */
function starter(kind) {
  const a = api; if (!a) return;
  if (demo && demo.state !== DEMO.IDLE) demo.stop();      // a shortcut acts on the real playground, so the demonstration ends first
  const s = a.s;
  Object.assign(s, { capMenu: false, cap: null, noteMenu: null, noteMode: null, sheet: null, saveDlg: false, bar: false, cb: null, dlg: null, wsheet: null, spDelete: null, peek: false });
  if (kind === 'checklist') {
    const moved = s.layoutMode !== 'board'; if (moved) s.thread = s.boardThread ?? 0; s.layoutMode = 'board';
    a.go('home'); acts.capture(a, 'CHECKLIST'); patchStrip();
    a.say('Add to Threadwell is open with Checklist selected.');
    a.callout(moved ? 'Add to Threadwell lives in Threadwell view, so the layout was switched for you. Change it any time in Settings → Messaging &amp; notifications.' : '');
  } else if (kind === 'theme') { a.go('settings'); a.go('appearance'); a.go('gallery'); a.say('Browse themes is open.'); }
  else if (kind === 'photos') { a.go('settings'); a.go('appearance'); a.say('Appearance is open. Choose a photo group layout.'); }
  else { a.go('settings'); a.go('messaging'); a.say('Layout settings are open.'); }
  note('starter');
}

/** The "Open saved …" shortcut in the website's confirmation area. */
function openNote(id) {
  const a = api, n = a && noteById(id);
  if (!n) { a?.callout('That item has since been moved, completed or deleted.'); return; }
  const s = a.s;
  s.layoutMode = 'board'; s.capMenu = false; s.cap = null; s.sheet = null; s.bar = false; s.peek = false;
  s.mode = 'libspace'; s.channel = 'c:' + n.space; s.scopeAll = true; s.flash = n.id;
  if (a.view !== 'home') { a.go('home'); } else a.render();
  patchStrip(); jumpTo('#note-' + n.id, 'nearest');
  a.callout(''); a.say('Opened your saved item in its Space.');
}

/* ================= guidance (outside the phone) ================= */
function note(name) {
  const t = session.tut;
  t.events.push(name); if (t.events.length > 400) t.events.splice(0, t.events.length - 400);
  if (name === 'layout') t.layoutAt = t.events.length;      // a challenge counts only what happens after this
  check();
}
function check() {
  if (!rootEl) return;
  const fresh = evaluate(session, {
    sawChecklist: () => {
      const el = api && api.el('home');
      return !!(el && api.view === 'home' && !el.classList.contains('hidden') && S().layoutMode === 'board'
        && ['space', 'libspace'].includes(S().mode) && $('.nlist', el));
    },
  });
  if (fresh.length) {
    const c = CHALLENGES.find(x => x.id === fresh[0]);
    announce(`Done: ${c.title}`);
  }
  paintGuide();
}
let announceEl = null;
function announce(msg) { if (announceEl) announceEl.textContent = msg; }

function guideHtml() {
  const t = session.tut;
  return `<ul class="chal" aria-label="Challenges">${CHALLENGES.map(c => `<li class="${t.done[c.id] ? 'done' : ''}" data-id="${c.id}">
    <span class="tick" aria-hidden="true">${t.done[c.id] ? '✓' : ''}</span>
    <div><b>${c.title}</b><span class="sr-only">${t.done[c.id] ? ' (done)' : ''}</span>
      ${DEMOS[c.id] ? `<button class="btn sm chal-show" type="button" data-show="${c.id}" aria-label="Show me: ${c.title.replace(/\.$/, '')}">Show me</button>` : ''}
      <details><summary>Read the steps</summary><ol>${c.hint.map(h => `<li>${h}</li>`).join('')}</ol></details></div></li>`).join('')}</ul>
    <p class="caption">Each one ticks off from what you actually do. Skip any step, take another route, or ignore the list. You can keep exploring afterwards.</p>`;
}
function paintGuide() {
  if (!rootEl) return;
  const g = $('#pgGuide', rootEl); if (!g) return;
  const t = session.tut;
  g.hidden = t.mode !== 'guided';
  // Redraw only when the ticks change, so an open hint is not closed while someone reads it.
  const sig = CHALLENGES.map(c => (t.done[c.id] ? 1 : 0)).join('');
  if (g.dataset.sig !== sig) { g.dataset.sig = sig; const open = [...g.querySelectorAll('details[open]')].map(d => d.closest('li').dataset.id); g.innerHTML = guideHtml(); open.forEach(id => g.querySelector(`li[data-id="${id}"] details`)?.setAttribute('open', '')); }
  $$('[data-pgmode]', rootEl).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.pgmode === t.mode)));
  const inv = $('#pgInvite', rootEl); if (inv) inv.hidden = t.dismissed;
  const n = Object.values(t.done).filter(Boolean).length;
  const cnt = $('#pgCount', rootEl); if (cnt) cnt.textContent = t.mode === 'guided' ? `${n} of ${CHALLENGES.length} done` : '';
}
function refreshState() {
  if (!rootEl || !api) return;
  const el = $('#pgState', rootEl); if (!el) return;
  const s = S();
  if (s.layoutMode !== 'board') { el.textContent = 'Layout: Traditional. Switch to Threadwell view in Settings → Messaging & notifications to try the rail, the Space list and the widget strip.'; return; }
  const st = stripState(s);
  const bits = [`Layout: Threadwell view`, `Tools: ${s.toolsCollapsed ? 'collapsed' : 'open'}${s.peek ? ' (peeking)' : ''}`];
  if (WIDE.includes(s.device)) bits.push(`Space list: ${s.railCollapsed ? 'collapsed' : 'open'}`);
  bits.push(!st.vis.length ? 'Widgets: none shown here' : st.presentation === 'expanded' ? `Widgets: showing${st.timerArmed ? ' (they tuck away after 5 s or when you scroll)' : st.held ? ' (held open: a widget needs setup or a sheet is open)' : ''}` : st.presentation === 'dock' ? 'Widgets: docked' : 'Widgets: compact shelf');
  el.textContent = bits.join(' · ');
}

function shell() {
  return `
    <div class="entry-copy pg-copy">
      <h1 tabindex="-1">Explore Threadwell</h1>
      <p class="lede">An interactive browser playground with sample messages. Create things, change settings, switch layouts. Nothing is sent and nothing leaves this page.</p>
      <div class="pg-invite" id="pgInvite"><p><strong>Create a checklist, change the theme, or explore your Spaces.</strong></p>
        <button class="btn ghost sm" type="button" id="pgDismiss">Dismiss</button></div>
      <div class="pg-starters" role="group" aria-label="Starter actions">
        <button type="button" data-start="checklist">Create a checklist</button>
        <button type="button" data-start="theme">Try a theme</button>
        <button type="button" data-start="layouts">Explore layouts</button>
        <button type="button" data-start="photos">Try photo layouts</button></div>
      <div class="pg-modes" role="group" aria-label="How to explore">
        <button type="button" data-pgmode="free" aria-pressed="true"><b>Explore freely</b><span>Open anything, in any order</span></button>
        <button type="button" data-pgmode="guided" aria-pressed="false"><b>Guided help</b><span>Optional challenges that tick off as you go <em id="pgCount"></em></span></button>
      </div>
      <div id="pgGuide" hidden></div>
      <p class="pgstate" id="pgState" role="status" aria-live="off"></p>
    </div>
    ${phoneColumnStub()}
    <div class="pg-demo" id="pgDemo" hidden></div>
    <div class="entry-after">
      <details class="pg-more" id="pgMore"><summary>Your playground: reset, saving, and what is simulated</summary>
      <div class="pg-tools">
        <h3>Your playground</h3>
        <p class="caption">Everything you make lives only in this tab, in your browser’s memory. Changing screens, preview size or layout never resets it.</p>
        <div class="pg-row"><button class="btn ghost sm" type="button" id="pgReset">Reset playground</button>
          <span id="pgConfirm" hidden>Erase everything you made? <button class="btn sm" type="button" id="pgYes">Yes, reset</button> <button class="btn ghost sm" type="button" id="pgNo">Keep it</button></span></div>
        <label class="pg-keep"><input type="checkbox" id="pgRemember"> <span>Remember this playground on this browser</span></label>
        <p class="caption">Saves your sample content in this browser’s local storage so it is here next time. Nothing is uploaded, there is no account, and nothing is saved unless you tick this. The page tells you if the browser refuses to save. Untick it, or erase it, to delete the saved copy.</p>
        <div class="pg-row"><button class="btn ghost sm" type="button" id="pgErase" hidden>Erase saved copy</button><span class="caption" id="pgKeepNote" role="status" aria-live="polite"></span></div>
      </div>
      <p class="note"><strong>What is real, and what is sample.</strong> The screens, labels and behaviour follow the Android app. The conversations, the weather and the countdown are sample data. Messages you write are marked “Playground · not sent”. Controls the playground does not simulate say so when you try them. Android’s own dialogs (permissions, date picker) are not reproduced.</p>
      <p class="note">Want a walk-through instead? The <a href="#layout">tutorials</a> still play on their own sample session, so they never change what you built here.</p>
      </details>
    </div>
    <p class="sr-only" role="status" aria-live="polite" id="demoStatus"></p>
    <p class="sr-only" role="status" aria-live="polite" id="pgAnnounce"></p>`;
}
// The phone column is built by the engine's helper, injected by app.js so this module has no import cycle.
let phoneColumnStub = () => '';
export const setPhoneColumn = fn => { phoneColumnStub = () => fn(spec, { demoButtons: false, sampleNote: 'Sample data. Your changes are kept while you move around.', label: 'Threadwell playground phone. Everything here is sample data and nothing is sent.' }); };

let keepEl = null, lastSaveOk = true;
function keepMsg(text) { if (keepEl) { keepEl.textContent = text; const d = keepEl.closest('details'); if (d && text) d.open = true; } }
/** Save when remembering is on, and say so honestly if the browser refuses. */
function persist() {
  const ok = save();
  if (ok !== lastSaveOk) {
    lastSaveOk = ok;
    if (!ok) { session.persist = false; const r = $('#pgRemember', rootEl); if (r) r.checked = false; keepMsg('Couldn’t save to this browser (storage is blocked or full). Your playground still works, but it won’t survive closing this tab.'); }
  }
}

function mounted(a, root) {
  api = a; rootEl = root; cleanups = []; announceEl = $('#pgAnnounce', root);
  setScopeLabel('Not simulated in the playground');
  noticeEl = document.createElement('div'); noticeEl.className = 'notice'; noticeEl.hidden = true; noticeEl.setAttribute('role', 'status');
  $('.screen', root).appendChild(noticeEl);
  noticeEl.addEventListener('click', e => {
    const u = e.target.closest('[data-undo]');
    if (u) { const undo = noticeUndo; noticeUndo = null; hideNotice(true); if (undo) undo(); return; }
    const b = e.target.closest('[data-space]'); if (b) openSpaceFromNotice(b.dataset.space);
  });
  stripVisit();
  bindScroll($('.screen', root));

  const rem = $('#pgRemember', root), erase = $('#pgErase', root);
  keepEl = $('#pgKeepNote', root); lastSaveOk = true;
  const syncKeep = () => { rem.checked = session.persist; erase.hidden = !(session.persist || hasSaved()); };
  const STATUS = {
    loaded: 'Restored the playground you saved on this browser.',
    older: 'A saved playground from an earlier version couldn’t be used, so it was removed. You are starting fresh.',
    damaged: 'A saved playground was damaged and couldn’t be used, so it was removed. You are starting fresh.',
    blocked: 'This browser is blocking storage, so “Remember” won’t work. The playground still works in this tab.',
  };
  if (STATUS[savedStatus]) { keepMsg(STATUS[savedStatus]); savedStatus = 'none'; }
  syncKeep();
  rem.addEventListener('change', () => {
    const r = setRemember(rem.checked);
    if (!r.ok) { rem.checked = false; keepMsg('Couldn’t save to this browser (storage is blocked or full). Your playground still works, but it won’t survive closing this tab.'); }
    else keepMsg(rem.checked ? 'Saved on this browser. It will be here next time, until you erase it.' : 'Saved copy deleted.');
    lastSaveOk = true; syncKeep();
  });
  erase.addEventListener('click', () => {
    const ok = eraseSaved(); rem.checked = false;
    keepMsg(ok ? 'Saved copy erased. This tab still has your playground until you close it.' : 'Couldn’t erase the saved copy (the browser refused). Clear this site’s data in your browser settings to remove it.');
    syncKeep();
  });
  // the website's confirmation area: "Open saved ..." shortcuts
  $('#callout', root)?.addEventListener('click', e => { const b = e.target.closest('[data-open]'); if (b) openNote(b.dataset.open); });
  // starter actions: open the relevant screen in the same session
  $$('[data-start]', root).forEach(b => b.addEventListener('click', () => starter(b.dataset.start)));
  // limitation explanations work from the keyboard too: unavailable controls are focusable, and Enter or Space explains
  $('.screen', root).addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('[aria-disabled="true"]:not(button)')) { e.preventDefault(); e.target.click(); }
  });
  $('#pgDismiss', root).addEventListener('click', () => { session.tut.dismissed = true; paintGuide(); $('#pgState', root)?.focus?.(); });
  $$('[data-pgmode]', root).forEach(b => b.addEventListener('click', () => { session.tut.mode = b.dataset.pgmode; if (b.dataset.pgmode === 'guided') session.tut.dismissed = true; paintGuide(); }));
  const conf = $('#pgConfirm', root), rst = $('#pgReset', root);
  rst.addEventListener('click', () => { conf.hidden = false; rst.hidden = true; $('#pgNo', root).focus(); });
  $('#pgNo', root).addEventListener('click', () => { conf.hidden = true; rst.hidden = false; rst.focus(); });
  $('#pgYes', root).addEventListener('click', () => {
    clearTimeout(strip.timer); strip.timer = null;
    resetSession(); conf.hidden = true; rst.hidden = false;
    a.reset(); stripVisit(); patchStrip(); syncKeep(); paintGuide();
    a.say('Playground reset to the sample content.'); rst.focus();
  });
  setupDemos(root);
  paintGuide(); refreshState();
}


/* ================= demonstrations: "Show me" in Guided help ================= */
// A demonstration is a separate sample session mounted in place of the phone. The visitor's playground is not rebuilt or
// serialised: its phone is moved out of view and frozen where it is (drafts, screen, history and scroll all stay in the DOM
// and in the session), and its own timers are stopped until it comes back. Demonstration actions run against the demo's state,
// never the session, so they cannot reach the challenge event log, the saved copy or the visitor's content.
let suspended = false, demo = null, wasWide = false;
const FROZEN = ['.pg-starters', '.pg-modes', '#pgInvite', '#pgMore'];    // controls that would act on the hidden playground

function suspendHost() {
  suspended = true;
  wasWide = rootEl.classList.contains('wide');     // a demonstration may borrow a wider layout; this is what to give back
  clearTimeout(strip.timer); strip.timer = null;
  const col = $('.phonecol', rootEl);
  col.style.setProperty('--hold-w', col.offsetWidth + 'px');
  col.classList.add('suspended'); col.inert = true; col.setAttribute('aria-hidden', 'true');
  FROZEN.forEach(sel => { const n = $(sel, rootEl); if (n) n.inert = true; });
  $('#pgDemo', rootEl).hidden = false;
}
function restoreHost() {
  suspended = false;
  if (!rootEl) return;
  const col = $('.phonecol', rootEl);
  col.classList.remove('suspended'); col.inert = false; col.removeAttribute('aria-hidden'); col.style.removeProperty('--hold-w');
  FROZEN.forEach(sel => { const n = $(sel, rootEl); if (n) n.inert = false; });
  rootEl.classList.toggle('wide', wasWide);
  const d = $('#pgDemo', rootEl); d.hidden = true; d.innerHTML = '';
  stripSync(); refreshState();
}

function demoFrame(info) {
  return `<div class="demo-frame">
    <h2 class="demo-title" id="demoTitle" tabindex="-1">Demonstration · ${esc(info.title)}</h2>
    <p class="demo-sub">Watch with sample content. Your playground will be here when you return.</p>
    <div class="demo-ctl" role="group" aria-label="Demonstration controls">
      <button class="btn sm" type="button" data-dc="pause" data-in="playing">Pause</button>
      <button class="btn sm" type="button" data-dc="resume" data-in="paused">Resume</button>
      <button class="btn ghost sm" type="button" data-dc="restart" data-in="paused">Restart</button>
      <button class="btn sm" type="button" data-dc="try" data-in="finished">Try it yourself</button>
      <button class="btn ghost sm" type="button" data-dc="replay" data-in="finished">Replay</button>
      <button class="btn sm" type="button" data-dc="steps" data-in="failed">Read the steps</button>
      <button class="btn ghost sm" type="button" data-dc="exit" data-in="playing paused failed">Return to playground</button>
    </div>
    <p class="demo-msg" data-in="paused">Paused. Resume continues from the current step.</p>
    <p class="demo-msg" data-in="failed">This demonstration couldn’t play here. Your playground is unchanged; the written steps are still available.</p>
    <section class="demo-end" data-in="finished" aria-labelledby="demoEndH"><h3 id="demoEndH">Your turn</h3>
      <p>Try these steps in your own playground.</p>
      ${info.tools ? `<button class="btn ghost sm" type="button" data-dc="tools">${esc(info.tools.label)}</button>` : ''}</section>
    <div id="pgDemoBody"></div></div>`;
}
const DEMO_SAYS = {
  [DEMO.PLAYING]: 'Demonstration playing.', [DEMO.PAUSED]: 'Demonstration paused.',
  [DEMO.FINISHED]: 'Demonstration finished. Choose Try it yourself or Replay.',
  [DEMO.FAILED]: 'The demonstration could not play. Choose Read the steps or Return to playground.',
};
const focusDemo = () => $('#pgDemo [data-dc]:not([hidden])', rootEl)?.focus({ preventScroll: true });
function paintDemo(state) {
  const d = $('#pgDemo', rootEl); if (!d) return;
  d.dataset.state = state;
  $$('[data-in]', d).forEach(n => { n.hidden = !n.dataset.in.split(' ').includes(state); });
  const ae = document.activeElement;
  if (ae === document.body || (d.contains(ae) && ae.closest('[hidden]'))) focusDemo();
  announce(DEMO_SAYS[state] || '');
}

function leaveDemo(how) {
  const id = demo.current?.id;
  demo.stop();                                              // destroys the demonstration and gives the playground back
  const origin = id && $(`[data-show="${id}"]`, rootEl);
  if (how === 'steps' || how === 'try') origin?.closest('li')?.querySelector('details')?.setAttribute('open', '');
  origin?.focus();
}

function setupDemos(root) {
  demo = createDemoController({
    suspend: suspendHost, restore: restoreHost,
    mount: info => {
      $('#pgDemo', root).innerHTML = demoFrame(info);
      // A wide preview needs the page's wide layout, which moves the demonstration; keep it in view while it does.
      const setWide = on => { const was = root.classList.contains('wide'); root.classList.toggle('wide', on || wasWide); if (was !== root.classList.contains('wide')) $('#pgDemo', root).scrollIntoView({ block: 'start' }); };
      return mountDemo($('#pgDemoBody', root), info.make({ reduceMotion: motionOff(), setWide }));
    },
    onChange: (state) => { if (state !== DEMO.IDLE) paintDemo(state); },
  });
  $('#pgGuide', root).addEventListener('click', e => {
    const b = e.target.closest('[data-show]'); const entry = b && DEMOS[b.dataset.show]; if (!entry) return;
    const c = CHALLENGES.find(x => x.id === b.dataset.show);
    if (demo.start({ id: c.id, title: c.title.replace(/\.$/, ''), make: entry.make, tools: entry.tools })) {
      focusDemo(); $('#pgDemo', root).scrollIntoView({ block: 'start' });
    }
  });
  $('#pgDemo', root).addEventListener('click', e => {
    const b = e.target.closest('[data-dc]'); if (!b) return;
    switch (b.dataset.dc) {
      case 'pause': demo.pause(); break;
      case 'resume': demo.resume(); break;
      case 'restart': case 'replay': demo.restart(); break;
      case 'exit': leaveDemo('exit'); break;
      case 'try': leaveDemo('try'); break;
      case 'steps': leaveDemo('steps'); break;
      case 'tools': { const kind = demo.current?.tools?.starter; leaveDemo('try'); if (kind) starter(kind); break; }
    }
  });
}

/* ================= the spec ================= */
const spec = {
  id: 'explore', title: 'Explore Threadwell', playground: true, session: true, devices: true, calloutLabel: 'Playground note',
  shell,
  start: 'home', history: [],
  state,
  resume: () => { session.ui.peek = false; session.ui.cap = null; session.ui.capMenu = false; return { view: session.ui.view || 'home', history: session.ui.hist || [] }; },   // a peek and open dialogs do not outlive leaving the screen
  onNav: (name, hist) => { session.ui.view = name; session.ui.hist = [...hist]; },
  views, acts,
  chrome(screen, s) { themeSpec.chrome(screen, s); },
  mounted,
  startNow(kind) { starter(kind); },
  /** Set by a standalone tutorial's "Try it yourself" link; consumed once the playground is on screen in Guided help. */
  pending: null,
  focusPending() {
    const id = this.pending; this.pending = null;
    const li = id && rootEl && $(`#pgGuide li[data-id="${id}"]`, rootEl);
    if (!li) return;
    li.querySelector('details')?.setAttribute('open', '');
    li.scrollIntoView({ block: 'center' });
    (li.querySelector('[data-show]') || li.querySelector('summary'))?.focus({ preventScroll: true });
  },
  setMode(mode) { if (mode) { session.tut.mode = mode; session.tut.dismissed = true; paintGuide(); } },
  onView(a, name) {
    api = api || a;
    if (name === 'spam') a.callout('Keyword filters have their own tutorial: <a href="#spam-rules">Add my own spam rule</a>.');
    check();
    if (name === 'home' && S().layoutMode === 'board') { stripVisit(); patchStrip(); }
    stripSync(); refreshState();
  },
  onRender(a, name) {
    api = api || a;
    const el = a.el(name); if (!el) return;
    const ends = $$('[data-end]', el);
    strip.ignore = true;
    if (!ends.length) ENDS.delete(name);
    ends.forEach(n => { if (S().toEnd || ENDS.get(name) !== n.dataset.sk) { n.scrollTop = n.scrollHeight; ENDS.set(name, n.dataset.sk); } n.dataset.lt = String(n.scrollTop); });
    setTimeout(() => { strip.ignore = false; }, 60);
    S().toEnd = false;
    if (name === 'home') { const st = stripState(S()); S().dockInfo = st.dock; }
    readableAccents(el);
    bindCarousels(el, { motionOff: motionOff });
    el.querySelectorAll('[aria-disabled="true"]').forEach(n => {
      if (n.getAttribute('aria-hidden') === 'true') { n.setAttribute('tabindex', '-1'); return; }
      n.removeAttribute('tabindex'); if (n.tagName !== 'BUTTON') { n.setAttribute('role', 'button'); n.setAttribute('tabindex', '0'); }
    });
    stripSync(); check(); persist();
  },
  afterAct(a, name) {
    api = api || a;
    if (['today', 'capture', 'spaces', 'settings', 'gear', 'thread', 'open'].includes(name)) { /* tools closed their peek above */ }
    // A highlight lasts until the next thing the visitor does.
    if (S().hl && !['hit', 'showmsg', 'hold', 'moreactions', 'star'].includes(name)) S().hl = null;
    if (S().flash && !['capsave', 'savemsg', 'makechecklist', 'notemove', 'savespace', 'compsave', 'msgdraft', 'itemdraft', 'captext', 'compdraft'].includes(name)) S().flash = null;
    note(name);
    if (name === 'device') patchStrip();
    refreshState(); persist();
  },
  onInert(a, el) {
    const why = el.dataset.why || `“${(el.getAttribute('aria-label') || el.textContent || 'This control').trim().replace(/\s+/g, ' ')}” isn’t simulated in the playground. The real app does this on your phone.`;
    a.callout(esc(why)); a.say(why);
  },
  destroy() {
    demo?.stop(); demo = null;
    cleanups.forEach(f => f()); cleanups = [];
    clearTimeout(strip.timer); strip.timer = null;
    persist(); noticeEl = null; clearTimeout(noticeTimer); api = null; rootEl = null; announceEl = null;
  },
};
const ENDS = new Map();
export default spec;
export { loadSaved };
