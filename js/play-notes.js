// Capture (Add to Threadwell) and checklist-ticking, shared by the playground and the guided demonstrations.
// Everything works on the state object it is handed and never reaches for the playground's session, so a
// demonstration can run these same actions against its own sample data.
import { TIMES, HOURS, toChecklistBody, toggleItem, parseChecklist, MAX_NOTE_LENGTH } from './notes.js';
import { capValid, normalizeLink } from './play-ui.js';

export const setRemind = (item, label) => { item.remind = label ? TIMES[label] : null; item.remindH = label ? HOURS[label] : null; };

/** A new private note in `s`. Ids come from the state's own counter. */
export function createNote(s, space, body, thread = null, extra = {}) {
  const n = { id: 'n' + s.seq++, space, thread, body, at: s.seq++, date: 'Today', pinned: false, remind: null, remindH: null, done: false, edited: false, ...extra };
  s.notes.push(n);
  return n;
}
export function defaultSpace(s) {
  const cur = s.channel.startsWith('c:') ? s.channel.slice(2) : null;
  return [cur, ...s.recents].find(id => id && s.spaces.some(x => x.id === id)) || s.spaces[0]?.id || null;
}
/** With no Space at all, a capture makes an Inbox (as the app does). Returns its id, or null when one existed. */
export function ensureSpace(s) {
  if (s.spaces.length) return null;
  s.spaces.push({ id: 'inbox', name: 'Inbox', emoji: '📥', color: '#5b8def' });
  return 'inbox';
}

/** Save the open Add to Threadwell dialog. Returns { note, space, kind, at } or null when there is nothing valid to save. */
export function saveCapture(s) {
  const c = s.cap; if (!c || !capValid(c)) return null;
  const made = ensureSpace(s);
  const space = made || (s.spaces.some(x => x.id === c.space) ? c.space : defaultSpace(s));
  const body = c.kind === 'CHECKLIST' ? toChecklistBody(c.text) : c.kind === 'LINK' ? normalizeLink(c.text) : c.text.trim();
  const note = createNote(s, space, body.slice(0, MAX_NOTE_LENGTH), null);
  if (c.at) setRemind(note, c.at);
  s.recents = [space, ...s.recents.filter(x => x !== space)].slice(0, 3);
  s.cap = null; s.flash = space; s.hl = note.id;
  return { note, space, kind: c.kind, at: c.at };
}

/** The dialog actions that only change state. Callers add the ones that need their own screen (saving, opening a Space). */
export function captureActs() {
  return {
    capture: (a, kind) => {
      a.s.peek = false;
      if (kind) { a.s.cap = { kind, space: defaultSpace(a.s), text: '', at: null }; a.s.capMenu = false; }
      else a.s.capMenu = !a.s.capMenu;
      a.render();
      a.$('#captext')?.focus({ preventScroll: true });
    },
    capclose: a => { a.s.capMenu = false; a.render(); },
    capkind: (a, kind) => {
      const s = a.s;
      if (s.capMenu) { s.capMenu = false; s.cap = { kind, space: defaultSpace(s), text: '', at: null }; }
      else if (s.cap) { s.cap.kind = kind; if (kind === 'REMINDER' && !s.cap.at) s.cap.at = null; }
      a.render(); a.$('#captext')?.focus({ preventScroll: true });
    },
    capspace: (a, id) => { a.s.cap.space = id; a.render(); },
    captext: (a, _x, el) => {
      a.s.cap.text = el.value;
      const b = a.$('#capsave'); if (b) b.disabled = !capValid(a.s.cap);
      const bad = a.s.cap.kind === 'LINK' && el.value && !capValid(a.s.cap); el.toggleAttribute('aria-invalid', bad);
    },
    captime: (a, label) => { a.s.cap.at = label || null; a.render(); },
    capcancel: a => { a.s.cap = null; a.render(); },
    ntoggle: (a, arg) => {
      const [id, i] = arg.split(':'); const n = a.s.notes.find(x => x.id === id);
      if (n) toggleItem(n, Number(i));
      a.s.ckAnim = n ? { key: arg, on: !!parseChecklist(n.body)[Number(i)].done } : null;
      a.render();
      setTimeout(() => { a.s.ckAnim = null; }, 400);
    },
  };
}

/* ---------- navigation, saving a message, and collapsing panels (shared with the guided demonstrations) ---------- */
import { replacePanel } from './panel-motion.js';
import { esc } from './core.js';

const CAT_NAME = { backup: 'Backup & data', privacy: 'Privacy & data', help: 'Help & advanced' };
export const motionOff = a => matchMedia('(prefers-reduced-motion: reduce)').matches || !!a.s.reduceMotion;

/** Spaces that already hold this message (a threadmark made from it). */
export const tagSpaces = (s, m) => [...new Set(s.tags.filter(x => x.mid === m.id || (x.thread === s.thread && x.text === m.text)).map(x => x.space))];

/** Save the open "Add message to a Space" dialog. Returns what changed, or null when the message is gone. */
export function applySave(s) {
  const m = s.msgs[s.thread].find(x => x.id === s.holdMid);
  s.saveDlg = false; s.bar = false;
  if (!m) return null;
  const before = tagSpaces(s, m), after = s.tick.filter(id => s.spaces.some(x => x.id === id));
  const added = after.filter(id => !before.includes(id)), removed = before.filter(id => !after.includes(id));
  removed.forEach(id => { s.tags = s.tags.filter(x => !(x.space === id && (x.mid === m.id || (x.thread === s.thread && x.text === m.text)))); });
  added.forEach(id => s.tags.push({ id: 't' + s.seq++, space: id, thread: s.thread, mid: m.id, text: m.text || '[photo]', date: 'Today', kind: 'Message', important: s.important, at: s.seq++ }));
  const wasStar = !!m.star; m.star = s.important;               // the Important box stars the message (ChannelPickerDialog)
  s.flash = added[0] || null;
  return { added, removed, important: s.important !== wasStar ? s.important : null };
}

/** Moving around: Settings, its categories, the layout choice, Browse Spaces, a Space's saved items. */
export function navActs() {
  return {
    gear: a => { a.s.peek = false; a.s.pulse = ''; a.go('settings'); },
    settings: a => { a.s.peek = false; a.go('settings'); },
    cat: (a, id) => {
      const to = { appearance: 'appearance', widgets: 'wset', messaging: 'messaging', spam: 'spam' }[id];
      if (to) a.go(to); else a.callout(`<b>${esc(CAT_NAME[id] || id)}</b> isn’t part of the playground, and it doesn’t have a tutorial yet.`);
    },
    layout: (a, mode) => {
      // Verified in the app (MessageBoardScreen.kt `selectedId`): switching to Threadwell view selects the last conversation chosen
      // IN Threadwell view (else the first one), not the one being read in Traditional view. Traditional shows the list.
      if (mode === 'board' && a.s.layoutMode !== 'board') a.s.thread = a.s.boardThread ?? 0;
      a.s.layoutMode = mode; a.render('messaging'); a.say(`Layout: ${mode === 'board' ? 'Threadwell view' : 'Traditional'}. Your messages, Spaces and checklists are unchanged.`);
    },
    spaces: a => { a.s.peek = false; a.s.mode = 'library'; a.s.sheet = null; a.s.channel = 'CHAT'; a.render(); },
    openspace: (a, id) => { const s = a.s; s.mode = 'libspace'; s.channel = 'c:' + id; s.scopeAll = true; s.hl = null; a.render(); },
    libback: a => { a.s.mode = 'library'; a.render(); },
  };
}

/** Press and hold a message, then Add to a Space. Saving is separate because each caller reports it its own way. */
export function messageActs() {
  return {
    hold: (a, mid) => { const s = a.s; if (s.bar && s.holdMid === mid) s.bar = false; else { s.holdMid = mid; s.bar = true; } s.menu = false; a.render(); },
    addspace: a => { const s = a.s, m = s.msgs[s.thread].find(x => x.id === s.holdMid); s.bar = false; s.menu = false; s.saveDlg = true; s.tick = m ? tagSpaces(s, m) : []; s.important = !!(m && m.star); a.render(); },
  };
}

/** Collapsing the tools column and the Space list (saved settings in the app), with the same panel motion everywhere. */
export function panelActs() {
  return {
    collapsetools: a => { const s = a.s; replacePanel(a.el('home'), '.rstack', () => { if (s.toolsCollapsed) s.peek = false; else s.toolsCollapsed = true; a.render(); }, { reduced: motionOff(a) }); a.$(s.toolsCollapsed && !s.peek ? '#showtools' : '#collapsetools')?.focus({ preventScroll: true }); },
    showtools: a => { replacePanel(a.el('home'), '.rstack', () => { a.s.peek = true; a.render(); }, { reduced: motionOff(a) }); a.$('#collapsetools')?.focus({ preventScroll: true }); },
    togglechannels: a => { a.s.railCollapsed = !a.s.railCollapsed; a.render(); a.$('#togglepanel')?.focus({ preventScroll: true }); },
  };
}
