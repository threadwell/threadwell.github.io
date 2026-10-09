// The Threadwell view as a small simulated app: one state shape, one renderer, one set of actions.
// Every Spaces tutorial (save, find, create, come back later) is built on this so they behave identically.
// Verified against MessageBoardScreen.kt, BoardChannels.kt, BoardCapture.kt, CustomChannels.kt, ChannelTemplates.kt.
import { esc } from './core.js';
import { ico, statusbar, appbar, THREADS, bubble } from './phone-ui.js';
import { board, boardHeader, channelBar, channelPanel, conversation, spacesSheet, manageDialog, templateDialog, editDialog, OUT_OF_SCOPE } from './board.js';
import { seedSpaces, orderedSpaces, countFor, TEMPLATES, COLORS, MAX_SPACES, SAVED_TEXT } from './space-model.js';
import { widgetsHost, widgetOverlays, todayView } from './widgets-model.js';

export const TIMES = { 'In 1 hour': 'Today, 10:41 AM', 'Later today': 'Today, 5:00 PM', 'Tomorrow morning': 'Tomorrow, 9:00 AM', 'This weekend': 'Sat, 9:00 AM' };

export function boardState(seed = {}, over = {}) {
  return {
    ...seedSpaces(seed), favs: [], thread: 0, mode: 'chat', channel: 'CHAT', scopeAll: false,
    sheet: null, flow: null, draft: null, flash: null, pulse: '',
    bar: false, menu: false, saveDlg: false, tick: [], important: false, saved: [],
    cb: null, cbLabel: null, hl: null, done: false,
    railCollapsed: false, toolsCollapsed: false, recents: [], device: 'phone', ...over,
  };
}

const thr = s => THREADS[s.thread];
const spaceOf = (s, id) => s.spaces.find(x => x.id === id);
const keyOf = sp => 'c:' + sp.id;

/* ---------- saved item cards ---------- */
const inertBtn = t => `<button class="tact" type="button" aria-disabled="true" tabindex="-1" title="${OUT_OF_SCOPE}">${t}</button>`;

function tagCard(s, tag, { source = false, live = [] } = {}) {
  const chat = THREADS[tag.thread];
  const actions = [
    inertBtn('Make checklist'), inertBtn('Pin to top'),
    live.includes('comeback')
      ? `<button class="tact" type="button" id="cb-${tag.id}" data-act="comeback" data-arg="${tag.id}">${tag.remind ? 'Change reminder' : 'Come back to this'}</button>`
      : inertBtn(tag.remind ? 'Change reminder' : 'Come back to this'),
    `<button class="tact" type="button" id="show-${tag.id}" data-act="showchat" data-arg="${tag.id}">Show in chat</button>`,
    inertBtn('Add comment'), inertBtn('Remove from Space'),
  ].join('');
  return `<article class="tcard${s.hl === tag.id ? ' flash' : ''}" id="tag-${tag.id}">
    ${source ? `<div class="tsrc"><span class="avatar sm" aria-hidden="true">${chat.i}</span><b>${esc(chat.n)}</b><small>${tag.kind}</small></div>` : ''}
    <div class="thead">${source ? '' : `<b>${esc(chat.n)}</b>`}<small>${tag.date}</small></div>
    <p class="ttext">${esc(tag.text)}</p>
    ${tag.remind ? `<span class="due">⏰ ${tag.remind}</span>` : ''}
    <div class="tactions" role="group" aria-label="Saved item actions">${actions}</div></article>`;
}

function spaceEmpty(sp) {
  const t = TEMPLATES.find(x => x.id === sp.template);
  const hints = { dinner: 'Save restaurant links, recipes, photos, and private notes here.', travel: 'Save booking links, screenshots and directions, then add a packing checklist and reminders.' };
  return t && hints[t.id]
    ? `${hints[t.id]} Long-press a message to threadmark it here, or use Add to Threadwell for a private note or reminder.`
    : `Nothing tucked into ${sp.emoji} ${esc(sp.name)} yet. Write a private note below, tap ＃ on a link or photo, or long-press a message to threadmark it. Use Add to Threadwell for a note or reminder.`;
}

/* ---------- main renderer ---------- */
/** Device sizes the previews stand in for. The app reacts to window width and height only (no fold detection). */
export const WIDE_DEVICES = ['phoneL', 'foldOpen'];

export function boardView(s, { live = [], hold = false, spamCount = 0 } = {}) {
  const t = thr(s);
  const wide = WIDE_DEVICES.includes(s.device);          // 600dp and up: Space list panel instead of the channel bar
  const compactRail = s.device === 'phoneL';             // under 560dp of height: the thread rail scrolls as one list
  const railLive = [...live, 'collapsetools', 'showtools'];
  const browsing = ['chat', 'space'].includes(s.mode);
  const chatLive = ['CHAT', ...(live.includes('spaces-in-chat') ? ['spaces-in-chat'] : [])];
  const hasW = !!s.en;                                     // widget tutorials add widget settings to the state
  let header = '', bar = '', main = '', panel = '', top = '';
  if (hasW && !s.docked && s.mode !== 'today') top = widgetsHost(s, 'board');
  const sp = s.channel.startsWith('c:') ? spaceOf(s, s.channel.slice(2)) : null;

  if (s.mode === 'chat') {
    header = boardHeader('Messages', esc(t.n), t.i, { narrow: !wide });
    if (wide) panel = channelPanel(s, 'CHAT', { live: chatLive }); else bar = channelBar(s, 'CHAT', { live: chatLive, flash: s.flash, more: s.sheet === 'more' });
    main = (hasW ? widgetsHost(s, 'thread') : '') + (s.thread === 0 ? conversation({ hold, holdOn: s.bar }) : bubble(esc(t.s)));
  } else if (s.mode === 'space' && sp) {
    header = boardHeader(`${sp.emoji} ${esc(sp.name)}`, s.scopeAll ? 'All conversations' : esc(t.n), t.i, { scope: { all: s.scopeAll }, narrow: !wide });
    if (wide) panel = channelPanel(s, keyOf(sp), { live: chatLive }); else bar = channelBar(s, keyOf(sp), { live: chatLive, flash: s.flash, more: s.sheet === 'more' });
    const items = s.tags.filter(x => x.space === sp.id && (s.scopeAll || x.thread === s.thread));
    main = items.length ? items.map(x => tagCard(s, x, { source: s.scopeAll, live })).join('') : `<div class="emptybox">${spaceEmpty(sp)}</div>`;
  } else if (s.mode === 'library') {
    header = `<div class="bhead"><div class="btitle"><b>${ico.stack.replace('<svg', '<svg class="inl"')} My Spaces</b><span>Everything you've saved, from every chat</span></div></div>`;
    const pending = s.tags.filter(x => x.remind && !x.done).length;
    main = `<button class="tend-link${live.includes('tend') ? '' : ' plain'}" type="button" ${live.includes('tend') ? 'data-act="opentend" id="tendrow"' : `aria-disabled="true" tabindex="-1" title="${OUT_OF_SCOPE}"`}>${ico.clock}<b>Threads to Tend</b><span>${pending ? `${pending} upcoming` : 'none yet'}</span><i>›</i></button>
      ${orderedSpaces(s).map(x => `<button class="space-row${s.flash === x.id ? ' flash' : ''}" type="button" id="lib-${x.id}" data-act="openspace" data-arg="${x.id}"><i class="sdot" style="background:${x.color}"></i><b>${x.emoji} ${esc(x.name)}</b><span>${countFor(s, x.id) || ''}</span></button>`).join('')}`;
  } else if (s.mode === 'today' && hasW) {
    main = todayView(s);
  } else if (s.mode === 'libspace' && sp) {
    header = `<div class="bhead"><button class="icon-btn sm" type="button" id="libback" data-act="libback" aria-label="Back to My Spaces">${ico.back}</button><div class="btitle"><b>${sp.emoji} ${esc(sp.name)}</b><span>All conversations</span></div></div>`;
    const items = s.tags.filter(x => x.space === sp.id);
    main = items.length ? items.map(x => tagCard(s, x, { source: true, live })).join('') : `<div class="emptybox">${spaceEmpty(sp)}</div>`;
  } else if (s.mode === 'tend') {
    const rows = s.tags.filter(x => x.remind && !x.done);
    header = `<div class="bhead"><button class="icon-btn sm" type="button" id="libback" data-act="libback" aria-label="Back to My Spaces">${ico.back}</button><div class="btitle"><b>${ico.clock.replace('<svg', '<svg class="inl"')} Threads to Tend</b>${rows.length ? '' : '<span>Reminders on notes and threadmarks, across every Space</span>'}</div></div>`;
    main = rows.length
      ? `<h6 class="sec-h">Upcoming · ${rows.length}</h6>${rows.map(x => `<div class="followup"><div class="fu-top"><b>${x.kind} · ${spaceOf(s, x.space).emoji} ${esc(spaceOf(s, x.space).name)}</b><span>${x.remind}</span></div><p>${esc(x.text)}</p><small>From ${esc(THREADS[x.thread].n)}</small>
          <div class="fu-actions"><button class="btn-s" type="button" id="complete" data-act="complete" data-arg="${x.id}">Complete</button><button class="txt-btn" type="button" aria-disabled="true" tabindex="-1" title="${OUT_OF_SCOPE}">Snooze</button></div></div>`).join('')}`
      : `<div class="emptybox">${s.done ? 'All done. The threadmark stays in its Space.' : 'No threads to tend yet. Write a note to yourself above, or open Come back to this on a threadmark. Nothing here is ever sent as a text.'}</div>`;
  }

  const modeKey = ['library', 'libspace', 'tend'].includes(s.mode) ? 'spaces' : '';
  let html = board(s, { selected: s.thread, mode: modeKey, live: railLive, spamCount, pulse: s.pulse, header, bar, panel, main, compact: compactRail, top, dock: hasW && !!s.docked });

  // overlays
  if (s.bar) html += actionBar(s);
  if (s.sheet === 'more') html += spacesSheet(s);
  if (s.sheet === 'manage') html += manageDialog(s);
  if (s.sheet === 'tpl') html += templateDialog();
  if (s.sheet === 'edit') html += editDialog(s);
  if (s.saveDlg) html += saveDialog(s);
  if (s.cb) html += comebackDialog(s);
  if (hasW) html += widgetOverlays(s, 'board') + (s.dockOpen ? dockPanel(s) : '');
  return html;
}

/** The docked widgets, opened from the rail's Widgets button: a sheet on phones (CollapsibleWidgetHost). */
function dockPanel(s) {
  return `<div class="sheet" role="dialog" aria-label="Widgets dock" data-esc="wdockclose"><div class="dockhead"><h5 class="sheet-title">Widgets</h5>
    <button class="txt-btn" type="button" id="showtop" data-act="wshowtop">Show at top</button><button class="txt-btn" type="button" data-act="wdockclose">Close</button></div>
    ${widgetsHost(s, 'board')}</div>`;
}

function actionBar(s) {
  return `<div class="actionbar" role="toolbar" aria-label="Message actions" data-esc="hold">
    <div class="react-row" aria-hidden="true">👍 ❤️ 😂 😮</div>
    <div class="ab-row"><button class="ab" type="button" aria-disabled="true" tabindex="-1" title="${OUT_OF_SCOPE}">📋<span>Copy text</span></button>
      <button class="ab" type="button" aria-disabled="true" tabindex="-1" title="${OUT_OF_SCOPE}">↩<span>Reply</span></button>
      <button class="ab" type="button" aria-disabled="true" tabindex="-1" title="${OUT_OF_SCOPE}">↪<span>Forward</span></button>
      <button class="ab${s.menu ? ' on' : ''}" type="button" id="more" data-act="moreactions" aria-label="More message actions" aria-expanded="${s.menu}">⋯<span>More</span></button></div>
    ${s.menu ? `<div class="menu" role="menu" data-esc="moreactions"><button class="mi" type="button" role="menuitem" aria-disabled="true" tabindex="-1" title="${OUT_OF_SCOPE}">☆  Star</button>
      <button class="mi" type="button" role="menuitem" id="addspace" data-act="addspace">＃  Add to a Space</button>
      <button class="mi" type="button" role="menuitem" aria-disabled="true" tabindex="-1" title="${OUT_OF_SCOPE}">ℹ  Message info</button>
      <button class="mi danger" type="button" role="menuitem" aria-disabled="true" tabindex="-1" title="${OUT_OF_SCOPE}">🗑  Delete</button></div>` : ''}</div>`;
}

function saveDialog(s) {
  return `<div class="scrim"><div class="dialog tall" role="dialog" aria-label="Add message to a Space" data-esc="cancelsave"><h5>Add message to a Space</h5>
    <div class="dlg-scroll" tabindex="0">
      <label class="check"><input type="checkbox" data-act="important" ${s.important ? 'checked' : ''}><span class="star">★</span> Important</label>
      ${orderedSpaces(s).map(sp => `<label class="check${s.flash === sp.id ? ' flash' : ''}"><input type="checkbox" id="chk-${sp.id}" data-act="tick" data-arg="${sp.id}" ${s.tick.includes(sp.id) ? 'checked' : ''}><i class="sdot" style="background:${sp.color}"></i><span>${sp.emoji} ${esc(sp.name)}</span></label>`).join('')}
      <button class="txt-btn" type="button" id="newspace" data-act="newspace" ${s.spaces.length >= MAX_SPACES ? 'disabled' : ''}>＋ New Space</button></div>
    <div class="dlg-actions"><button class="txt-btn" type="button" data-act="cancelsave">Cancel</button><button class="txt-btn strong" type="button" id="save" data-act="savemsg">Save</button></div></div></div>`;
}

function comebackDialog(s) {
  const tag = s.tags.find(x => x.id === s.cb);
  return `<div class="scrim"><div class="dialog" role="dialog" aria-label="Come back to this" data-esc="cancelcb"><h5>⏰ Come back to this</h5>
    <p class="caption" style="margin:0">${esc(tag.text)}</p>
    <div class="chips" role="group" aria-label="When">${Object.keys(TIMES).map(k => `<button type="button" class="chip${s.cbLabel === k ? ' on' : ''}" data-act="time" data-arg="${k}" aria-pressed="${s.cbLabel === k}">${k}</button>`).join('')}
      <button type="button" class="chip" aria-disabled="true" tabindex="-1" title="${OUT_OF_SCOPE}">Choose time…</button></div>
    <p class="caption">${s.cbLabel ? `<b class="acc">Reminds you ${TIMES[s.cbLabel]}</b>` : 'Pick when to be reminded'}</p>
    <div class="dlg-actions"><button class="txt-btn" type="button" data-act="cancelcb">Cancel</button><button class="btn-s" type="button" id="confirm" data-act="confirm" ${s.cbLabel ? '' : 'disabled'}>Come back to this</button></div></div></div>`;
}

/** Full-screen conversation, reached by "Show in chat". The saved message is outlined. */
export function chatScreen(s) {
  const tag = s.tags.find(x => x.id === s.shown) || s.tags[0];
  const t = THREADS[tag.thread];
  const sp = spaceOf(s, tag.space);
  return statusbar() + appbar(esc(t.n), { back: true }) + `<div class="thread" tabindex="0">
    ${tag.thread === 0 ? bubble('Found the place I was telling you about') : ''}
    <div class="b recv jump" id="jump">${esc(tag.text)}</div>
    ${tag.thread === 0 ? bubble('Perfect, see you there 🍜', true) : ''}
    <p class="jumpnote">${sp.emoji} Saved in ${esc(sp.name)}</p></div>`;
}

/* ---------- shared actions ---------- */
/**
 * `on` lets a tutorial react to the same actions (advance steps, show a callout):
 *   on.event(api, name, detail)
 */
export function boardActs(on = {}) {
  const ev = (api, name, d) => on.event && on.event(api, name, d);
  const flowReturn = api => { api.s.sheet = api.s.flow === 'save' ? null : 'manage'; };
  return {
    thread: (api, i) => { api.s.thread = Number(i); api.s.mode = 'chat'; api.s.channel = 'CHAT'; api.s.sheet = null; api.render(); ev(api, 'thread'); },
    channel: (api, key) => {
      api.s.sheet = null;
      if (key === 'CHAT') { api.s.mode = 'chat'; api.s.channel = 'CHAT'; }
      else if (key.startsWith('c:')) { api.s.mode = 'space'; api.s.channel = key; api.s.scopeAll = false; api.s.recents = [key.slice(2), ...api.s.recents.filter(x => x !== key.slice(2))].slice(0, 3); }
      api.render(); ev(api, key.startsWith('c:') ? 'pickspace' : 'channel', key.startsWith('c:') ? key.slice(2) : key);
    },
    togglechannels: api => { api.s.railCollapsed = !api.s.railCollapsed; api.render(); ev(api, 'togglechannels', api.s.railCollapsed); focusId(api, 'togglepanel'); },
    // Collapse stays collapsed (a saved setting). The ⋯ button only peeks at the tools; tapping a tool or Collapse closes the peek.
    collapsetools: api => { if (api.s.toolsCollapsed) api.s.peek = false; else api.s.toolsCollapsed = true; api.render(); ev(api, 'collapsetools'); focusId(api, 'showtools'); },
    showtools: api => { api.s.peek = true; api.render(); ev(api, 'showtools'); focusId(api, 'collapsetools'); },
    more: api => { api.s.sheet = api.s.sheet === 'more' ? null : 'more'; api.render(); api.$('.srow.flash')?.scrollIntoView({ block: 'nearest' }); ev(api, 'more'); },
    closesheet: api => { api.s.sheet = null; api.render(); },
    pickspace: (api, id) => { api.s.sheet = null; api.s.mode = 'space'; api.s.channel = 'c:' + id; api.s.scopeAll = false; api.render(); ev(api, 'pickspace', id); },
    scope: (api, which) => { api.s.scopeAll = which === 'all'; api.render(); ev(api, 'scope', which); },
    spaces: api => { api.s.mode = 'library'; api.s.sheet = null; api.s.pulse = ''; api.render(); api.$('.space-row.flash')?.scrollIntoView({ block: 'nearest' }); ev(api, 'library'); },
    openspace: (api, id) => {
      api.s.mode = 'libspace'; api.s.channel = 'c:' + id; api.s.scopeAll = true; api.render();
      // The action row scrolls sideways, as in the app. Bring "Show in chat" into view so it is not hidden.
      api.$$('.tactions').forEach(row => { const b = row.querySelector('[id^="show-"]'); if (b) row.scrollLeft = Math.max(0, b.offsetLeft - 56); });
      ev(api, 'libspace', id);
    },
    libback: api => { api.s.mode = 'library'; api.render(); ev(api, 'library'); },
    showchat: (api, id) => { api.s.shown = id; api.go('chat'); ev(api, 'showchat', id); },
    // message actions (save flow)
    hold: api => { api.s.bar = !api.s.bar; api.s.menu = false; api.render(); ev(api, 'hold'); },
    moreactions: api => { api.s.menu = !api.s.menu; api.render(); ev(api, 'moreactions'); },
    addspace: api => { api.s.bar = false; api.s.menu = false; api.s.saveDlg = true; api.s.tick = []; api.s.important = false; api.render(); ev(api, 'addspace'); },
    important: (api, _a, el) => { api.s.important = el.checked; },
    tick: (api, id, el) => { api.s.tick = el.checked ? [...new Set([...api.s.tick, id])] : api.s.tick.filter(x => x !== id); },
    cancelsave: api => { api.s.saveDlg = false; api.render(); },
    savemsg: api => {
      const dest = api.s.tick.map(id => spaceOf(api.s, id)).filter(Boolean);
      api.s.saveDlg = false;
      dest.forEach(sp => {
        if (!api.s.tags.some(x => x.space === sp.id && x.text === SAVED_TEXT && x.thread === 0))
          api.s.tags.push({ id: 'noodle-' + sp.id, space: sp.id, thread: 0, text: SAVED_TEXT, date: 'Today', kind: 'Message', important: api.s.important });
      });
      api.s.flash = dest[0]?.id || null;
      api.render(); ev(api, 'saved', dest);
    },
    // Spaces management and creation
    manage: api => { api.s.flow = 'manage'; api.s.sheet = 'manage'; api.render(); ev(api, 'manage'); },
    closemanage: api => { api.s.sheet = null; api.s.flow = null; api.render(); },
    mvup: (api, id) => move(api, id, -1), mvdn: (api, id) => move(api, id, 1),
    fav: (api, id) => { const f = api.s.favs; api.s.favs = f.includes(id) ? f.filter(x => x !== id) : [...f, id]; api.render(); },
    newspace: api => { if (api.s.saveDlg) api.s.flow = 'save'; api.s.sheet = 'tpl'; api.render(); ev(api, 'newspace'); },
    tpl: (api, id) => {
      const t = TEMPLATES.find(x => x.id === id);
      api.s.draft = t ? { name: t.name, emoji: t.emoji, color: COLORS[TEMPLATES.indexOf(t) % COLORS.length][0], template: t.id } : { name: '', emoji: '📌', color: COLORS[0][0], template: null };
      api.s.sheet = 'edit'; api.render(); ev(api, 'tpl', id);
      api.$('#spname')?.focus();
    },
    draftname: (api, _a, el) => { api.s.draft.name = el.value.slice(0, 24); const b = api.$('#spsave'); if (b) b.disabled = !api.s.draft.name.trim(); },
    draftcolor: (api, c) => { api.s.draft.color = c; api.render(); },
    cancelflow: api => { const back = api.s.flow === 'save' ? null : 'manage'; api.s.sheet = back; api.s.draft = null; api.render(); },
    savespace: api => {
      const d = api.s.draft; if (!d || !d.name.trim() || api.s.spaces.length >= MAX_SPACES) return;
      const id = 'sp' + (api.s.spaces.length + 1) + '-' + d.name.trim().toLowerCase().replace(/\W+/g, '');
      api.s.spaces.push({ id, name: d.name.trim(), emoji: d.emoji, color: d.color, template: d.template });
      api.s.flash = id; api.s.draft = null;
      if (api.s.flow === 'save') api.s.tick = [...api.s.tick, id];      // the app ticks a Space created from the save dialog
      flowReturn(api);
      api.render(); ev(api, 'created', id);
    },
    // Come back to this (inline action on a saved message)
    comeback: (api, id) => { api.s.cb = id; api.s.cbLabel = null; api.render(); ev(api, 'comeback'); },
    time: (api, k) => { api.s.cbLabel = k; api.render(); },
    cancelcb: api => { api.s.cb = null; api.render(); },
    confirm: api => { const tag = api.s.tags.find(x => x.id === api.s.cb); tag.remind = TIMES[api.s.cbLabel]; api.s.cb = null; api.render(); ev(api, 'reminded'); },
    opentend: api => { api.s.mode = 'tend'; api.render(); ev(api, 'tend'); },
    complete: (api, id) => { const tag = api.s.tags.find(x => x.id === id); tag.done = true; api.s.done = true; api.render(); ev(api, 'completed'); },
  };
}

/** Keep keyboard focus on the control that replaced the one just used (collapse <-> expand). */
function focusId(api, id) { if (api.userActed()) api.$('#' + id)?.focus({ preventScroll: true }); }

function move(api, id, d) {
  const l = api.s.spaces, i = l.findIndex(x => x.id === id), j = i + d;
  if (i < 0 || j < 0 || j >= l.length) return;
  [l[i], l[j]] = [l[j], l[i]]; api.render();
}

export { chatScreen as chatView };
