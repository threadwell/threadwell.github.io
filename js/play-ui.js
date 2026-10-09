// Screens for the playground. Everything is drawn from one session (js/store.js); nothing here keeps its own copy.
// Behaviour is checked against the Android app: Add to Threadwell + NoteCard + Edit note (BoardCapture.kt,
// BoardChannels.kt, NoteReminders.kt), Threads to Tend (BoardCapture.kt), the widget strip (CollapsibleWidgetHost.kt),
// tools and Space list collapse (MessageBoardScreen.kt) and Settings -> Messaging (SettingsScreen.kt, BoardSettings.kt).
import { esc } from './core.js';
import { ico, statusbar, appbar, settingsBody, label, caption, seg, THREADS, bubble } from './phone-ui.js';
import { inbox } from './inbox.js';
import { board, boardHeader, channelBar, channelPanel, spacesSheet, manageDialog, templateDialog, editDialog } from './board.js';
import { orderedSpaces, countFor, MAX_SPACES } from './space-model.js';
import { widgetsHost, widgetOverlays, todayView, visibleOn, status, chip, byId, hasNews } from './widgets-model.js';
import { parseChecklist, TIMES, followUps, activeNotes, MAX_NOTE_LENGTH } from './notes.js';
import { TH, SPAM_KEY, spamQuarantined, searchView, builtinView, spamFolderView, spamBanner, editSpaceDlg, deleteSpaceDlg, BUILTIN } from './play-org.js';
import { photo, photoGroup } from './phone-ui.js';
import { groupRuns } from './photo-runs.js';

export const WIDE = ['phoneL', 'foldOpen'];
const spaceOf = (s, id) => s.spaces.find(x => x.id === id);
const sortNew = (a, b) => (Number(!!b.pinned) - Number(!!a.pinned)) || (b.at - a.at);

/* The app's five widget strip behaviours (WidgetStripMode in CollapsibleWidgetHost.kt). */
export const STRIP_MODES = [
  { key: 'scroll', label: 'Expanded until I scroll, then dock left', summary: 'Widgets move into a button in the left rail once you start reading, or after 5 seconds', docks: true, scroll: true, timer: true, rec: true },
  { key: 'scroll_shelf', label: 'Expanded until I scroll, then compact shelf', summary: 'Keeps a one-line summary above the conversation', docks: false, scroll: true, timer: true },
  { key: 'timer', label: 'Collapse after 5 seconds, then dock left', summary: 'Scrolling doesn’t hide them sooner', docks: true, scroll: false, timer: true },
  { key: 'always', label: 'Always expanded', summary: 'Only the collapse button docks them', docks: true, scroll: false, timer: false },
  { key: 'collapsed', label: 'Start docked left', summary: 'Open them from the widgets button in the left rail', docks: true, scroll: true, timer: false },
];
export const stripMode = s => STRIP_MODES.find(m => m.key === s.stripMode) || STRIP_MODES[0];

/** Threads with their latest message as the preview. Unread clears once opened; a quarantined spam thread is left out. */
export function tlist(s) {
  return TH.map((t, k) => {
    const last = s.msgs[k][s.msgs[k].length - 1];
    return { ...t, key: k, s: (last.sent ? 'You: ' : '') + (last.text || 'Photo'), t: last.pg ? 'Now' : t.t, unread: t.unread && !s.read.includes(k) };
  }).filter(t => !(t.key === SPAM_KEY && spamQuarantined(s)));
}

/* ---------- conversation ---------- */
function messages(s, k, { hold = false } = {}) {
  const style = s.photoStyle || 'stack', loose = style === 'carousel' || style === 'ring';
  // Which photo messages form a group is decided in photo-runs.js (the app's rule). The group's identity, for actions and
  // for "open at my position", is its FIRST message, as in the app (long-press on a group acts on that message).
  return groupRuns(s.msgs[k]).map(u => {
    if (u.kind === 'single') return oneMessage(s, k, u.m, hold);
    const m0 = u.msgs[0], held = hold && s.bar && s.holdMid === m0.id;
    const grp = photoGroup(u.uris.length, style, {
      sent: m0.sent, spread: s.stackSpread ?? 50, photos: u.uris, key: `g:${k}:${m0.id}`, rid: `g-${m0.id}`,
      jump: s.hl != null && u.msgs.some(x => x.id === s.hl),
      ...(hold && loose ? { pageAct: 'hold', pageArg: m0.id } : {}),
    });
    const body = hold && !loose
      ? `<button class="pg-btn${held ? ' held' : ''}" type="button" data-act="hold" data-arg="${m0.id}" aria-label="${u.uris.length} photos. Press and hold for message actions.">${grp}</button>`
      : grp;
    return `${m0.t ? `<p class="tsep">${esc(m0.t)}</p>` : ''}${m0.from && !m0.sent ? `<small class="from">${esc(m0.from)}</small>` : ''}${body}`;
  }).join('');
}

function oneMessage(s, k, m, hold) {
  {
    const cls = `b ${m.sent ? 'sent' : 'recv'}`;
    const inner = `${m.photo != null ? photo(m.photo) : ''}${esc(m.text)}${m.star ? ' <span class="starmark" title="Important">★</span>' : ''}`;
    const body = hold
      ? `<button class="${cls} msg-btn${s.holdMid === m.id && s.bar ? ' held' : ''}${s.hl === m.id ? ' jump' : ''}" type="button" id="m-${m.id}" data-act="hold" data-arg="${m.id}" aria-label="${m.photo != null ? 'Photo. ' : ''}${esc(m.text)}${m.star ? '. Important' : ''}. Press and hold for message actions.">${inner}</button>`
      : `<div class="${cls}${s.hl === m.id ? ' jump' : ''}" id="m-${m.id}">${inner}</div>`;
    return `${m.t ? `<p class="tsep">${esc(m.t)}</p>` : ''}${m.from && !m.sent ? `<small class="from">${esc(m.from)}</small>` : ''}${body}${m.pg ? '<small class="pgmark">Playground · not sent</small>' : ''}`;
  }
}

export function composer(s) {
  const text = s.drafts[s.thread] || '';
  return `<div class="composer"><p class="pgline">Playground: nothing you type here is sent.</p>
    <div class="crow2"><input id="msgin" class="field" type="text" placeholder="Write a message" aria-label="Message" value="${esc(text)}" data-act="msgdraft" data-enter="#sendmsg" autocomplete="off">
    <button class="btn-s" type="button" id="sendmsg" data-act="sendmsg" ${text.trim() ? '' : 'disabled'}>Send</button></div></div>`;
}

/** Traditional layout: a full-screen conversation. */
export function tchat(s) {
  const t = s.tlist[s.thread];
  return statusbar() + appbar(esc(t.n), { back: true }) + `<div class="thread" data-sk="t:${s.thread}" data-end="1" tabindex="0">${spamBanner(s)}${messages(s, s.thread)}</div>${composer(s)}`;
}

/** "Show in chat": the same conversation, with the saved message outlined. */
export function chatAt(s) {
  const tag = s.tags.find(x => x.id === s.shown);
  const k = tag ? tag.thread : s.thread, t = s.tlist[k];
  const hit = tag && s.msgs[k].find(m => m.id === tag.mid || m.text === tag.text);
  const sp = tag && spaceOf(s, tag.space);
  return statusbar() + appbar(esc(t.n), { back: true }) + `<div class="thread" data-sk="at:${s.shown}" tabindex="0">${(() => { const keep = s.hl; s.hl = hit && hit.id; const h = messages(s, k); s.hl = keep; return h; })()}
    ${sp ? `<p class="jumpnote">${sp.emoji} Saved in ${esc(sp.name)}</p>` : ''}</div>`;
}

/**
 * "Open chat" from the Threadwell view: the full conversation screen. `s.openAt` is the id of the message (or the first
 * message of a photo group) that was at the bottom edge of the board's chat, or null when the reader was at the newest
 * message. It opens there and outlines it briefly, as the app does (BoardChatPosition → onOpenMessage).
 */
export function fullChat(s) {
  const k = s.thread, t = s.tlist[k], keep = s.hl;
  s.hl = s.openAt;
  const body = messages(s, k);
  s.hl = keep;
  return statusbar() + appbar(esc(t.n), { back: true }) + `<div class="thread" data-sk="full:${k}" ${s.openAt == null ? 'data-end="1" ' : ''}tabindex="0">${spamBanner(s)}${body}</div>${composer(s)}`;
}

/* ---------- widget strip (expanded, compact shelf or docked) ---------- */
const pill = (text, act, arg, id) => `<button class="wpill" type="button" ${id ? `id="${id}"` : ''} data-act="${act}" ${arg ? `data-arg="${arg}"` : ''}>${text}</button>`;

export function stripState(s) {
  const vis = visibleOn(s, 'board');
  const needs = vis.some(w => status(s, w));
  const held = !!s.wsheet || needs;
  const mode = stripMode(s);
  const dueNow = false;                                            // the playground has no clock, so nothing is ever overdue
  const urgent = vis.filter(w => ['calendar', 'countdown', 'followups'].includes(w.id) && !status(s, w) && hasNews(s, w)).length;
  const dot = dueNow || needs;
  const desc = dot ? 'Something needs attention' : urgent ? `${urgent} ${urgent === 1 ? 'item' : 'items'} coming up` : `${vis.length} enabled`;
  const presentation = !vis.length ? 'none' : s.stripExpanded ? 'expanded' : mode.docks ? 'dock' : 'shelf';
  return { vis, held, mode, presentation, dock: { dot, desc }, timerArmed: s.stripExpanded && !s.stripManual && !held && mode.timer && vis.length > 0, vis_n: vis.length };
}

export function stripHtml(s, st = stripState(s)) {
  if (st.presentation === 'expanded') {
    return `<div class="strip-row">${widgetsHost(s, 'board')}<button class="wcollapse" type="button" id="stripcollapse" data-act="stripcollapse" aria-label="Collapse widgets"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg></button></div>`;
  }
  if (st.presentation === 'shelf') {
    // Setup gaps first, then urgent news, then other news, then the rest (WidgetStripLogic.summarize).
    const rank = w => (status(s, w) ? 0 : ['calendar', 'countdown', 'followups'].includes(w.id) && hasNews(s, w) ? 1 : hasNews(s, w) ? 2 : 3);
    const ranked = st.vis.map((w, i) => [w, i]).sort((a, b) => rank(a[0]) - rank(b[0]) || a[1] - b[1]).map(x => x[0]);
    const shown = ranked.slice(0, 2), more = ranked.length - shown.length;
    return `<div class="shelf" aria-label="Widgets, compact"><div class="shelf-pills">${shown.map(w => { const stt = status(s, w); return stt ? pill(stt.action, 'wsettings', w.id) : pill(esc(chip(s, w)), 'wopen', w.id); }).join('')}${more > 0 ? pill(`+${more}`, 'stripexpand', '', 'shelfmore') : ''}</div>
      <button class="wcollapse" type="button" id="stripshow" data-act="stripexpand" aria-label="Show widgets"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button></div>`;
  }
  return '';
}

function dockPanel(s) {
  return `<div class="sheet" role="dialog" aria-label="Widgets dock" data-esc="wdockclose"><div class="dockhead"><h5 class="sheet-title">Widgets</h5>
    <button class="txt-btn" type="button" id="showtop" data-act="wshowtop">Show at top</button><button class="txt-btn" type="button" data-act="wdockclose">Close</button></div>
    ${widgetsHost(s, 'board')}</div>`;
}

/* ---------- cards in a Space ---------- */
const inert = (text, why) => `<button class="tact" type="button" aria-disabled="true" tabindex="-1" data-why="${esc(why)}">${text}</button>`;

function tagCard(s, tag, { source }) {
  const chat = TH[tag.thread];
  const canList = tag.kind === 'Message' && tag.text.trim();
  const actions = [
    canList ? `<button class="tact" type="button" id="mk-${tag.id}" data-act="makechecklist" data-arg="${tag.id}">Make checklist</button>` : '',
    `<button class="tact" type="button" data-act="tagpin" data-arg="${tag.id}">${tag.pinned ? 'Unpin' : 'Pin to top'}</button>`,
    `<button class="tact" type="button" id="cb-${tag.id}" data-act="comeback" data-arg="tag:${tag.id}">${tag.remind ? 'Change reminder' : 'Come back to this'}</button>`,
    `<button class="tact" type="button" id="show-${tag.id}" data-act="showchat" data-arg="${tag.id}">Show in chat</button>`,
    inert('Add comment', 'Comments on a saved message are not part of the playground yet.'),
    `<button class="tact" type="button" data-act="tagremove" data-arg="${tag.id}">Remove from Space</button>`,
  ].join('');
  return `<article class="tcard${s.flash === tag.id ? ' flash' : ''}" id="tag-${tag.id}">
    ${source ? `<div class="tsrc"><span class="avatar sm" aria-hidden="true">${chat.i}</span><b>${esc(chat.n)}</b><small>${tag.kind}</small></div>` : ''}
    <div class="thead">${source ? '' : `<b>${esc(chat.n)}</b>`}<small>${tag.pinned ? '📌 ' : ''}${tag.date}</small></div>
    <p class="ttext">${esc(tag.text)}</p>
    ${tag.remind ? `<span class="due">⏰ ${esc(tag.remind)}</span>` : ''}
    <div class="tactions" role="group" aria-label="Saved item actions">${actions}</div></article>`;
}

function noteCard(s, n, { source }) {
  const sp = spaceOf(s, n.space), cl = parseChecklist(n.body);
  const chat = n.thread != null ? TH[n.thread] : null;
  const done = cl ? cl.filter(i => i.done).length : 0;
  const draft = (s.itemDraft && s.itemDraft[n.id]) || '';
  return `<article class="ncard${s.flash === n.id ? ' flash' : ''}" id="note-${n.id}" style="--accent:${sp.color}">
    <div class="nhead"><b>${n.pinned ? '📌 ' : ''}📝 You · Private note${cl ? ` · ${done} of ${cl.length} done` : ''}</b><small>${esc(n.date)}</small>
      <button class="nmore" type="button" id="nm-${n.id}" data-act="notemenu" data-arg="${n.id}" aria-label="Note actions" aria-haspopup="dialog">⋮</button></div>
    ${source ? `<small class="nsrc">${chat ? 'About ' + esc(chat.n) : 'Personal note'}</small>` : ''}
    ${cl ? `<div class="nlist" role="group" aria-label="Checklist, ${done} of ${cl.length} done">${cl.map((i, k) =>
        `<label class="nitem"><input type="checkbox" class="ncheck" id="nc-${n.id}-${k}" data-act="ntoggle" data-arg="${n.id}:${k}" ${i.done ? 'checked' : ''}><span class="${i.done ? 'ck-done' : ''}${s.ckAnim && s.ckAnim.key === n.id + ':' + k ? (s.ckAnim.on ? ' ck-anim-on' : ' ck-anim-off') : ''}">${esc(i.text)}</span></label>`).join('')}
      <div class="additem"><input class="field" id="ai-${n.id}" type="text" maxlength="200" placeholder="Add an item" aria-label="Add an item" value="${esc(draft)}" data-act="itemdraft" data-arg="${n.id}" data-enter="#aib-${n.id}" autocomplete="off">
        <button class="txt-btn" type="button" id="aib-${n.id}" data-act="itemadd" data-arg="${n.id}" ${draft.trim() ? '' : 'disabled'}>Add</button></div></div>`
      : `<p class="ttext">${esc(n.body)}</p>`}
    ${n.remind ? `<span class="due">⏰ To tend · ${esc(n.remind)}</span>` : ''}
    ${n.edited ? '<small class="nsrc">Edited</small>' : ''}</article>`;
}

function spaceItems(s, sp, all) {
  const tags = s.tags.filter(x => x.space === sp.id && (all || x.thread === s.thread)).map(x => ({ at: x.at ?? 0, pinned: x.pinned, html: tagCard(s, x, { source: all }) }));
  const notes = activeNotes(s).filter(x => x.space === sp.id && (all || x.thread === s.thread)).map(x => ({ at: x.at, pinned: x.pinned, html: noteCard(s, x, { source: all }) }));
  return [...tags, ...notes].sort(sortNew).map(x => x.html).join('');
}

const spaceEmpty = (s, sp) => `Nothing tucked into ${sp.emoji} ${esc(sp.name)} yet${s.scopeAll ? '' : ' for this chat'}. Write a private note below, use Add to Threadwell (the bolt) for a checklist or reminder, or open a message and add it to a Space.${s.scopeAll ? '' : ' Notes made with Add to Threadwell are personal, so look under All chats.'}`;

function composerBar(s, sp) {
  const c = s.composer;
  return `<div class="ncomposer"><div class="ncrow"><button type="button" class="chip${c.check ? ' on' : ''}" id="ccheck" data-act="compcheck" aria-pressed="${c.check}">☑ Checklist</button>
    <small class="pgline">${s.scopeAll ? 'Saves to All chats' : 'Saves to this chat'}. Nothing is sent.</small></div>
    <div class="crow2"><textarea class="field" id="compin" rows="2" maxlength="${MAX_NOTE_LENGTH}" aria-label="${c.check ? 'Checklist items' : 'Private note'}" placeholder="${c.check ? `One item per line for ${sp.emoji} ${esc(sp.name)}…` : `Write a private note to ${sp.emoji} ${esc(sp.name)}…`}" data-act="compdraft">${esc(c.text)}</textarea>
    <button class="btn-s" type="button" id="compsave" data-act="compsave" ${c.text.trim() ? '' : 'disabled'}>Save</button></div></div>`;
}

/* ---------- Threads to Tend ---------- */
function tendView(s) {
  const rows = followUps(s);
  const doneNotes = (s.notes || []).filter(n => n.done);
  return `<div class="bhead"><button class="icon-btn sm" type="button" id="libback" data-act="libback" aria-label="Back to My Spaces">${ico.back}</button><div class="btitle"><b>${ico.clock.replace('<svg', '<svg class="inl"')} Threads to Tend</b>${rows.length ? '' : '<span>Reminders on notes and threadmarks, across every Space</span>'}</div></div>` + (rows.length
    ? `<h6 class="sec-h">Upcoming · ${rows.length}</h6>${rows.map(x => `<div class="followup"><div class="fu-top"><b>${esc(x.kind)} · ${x.space.emoji} ${esc(x.space.name)}</b><span>${esc(x.remind)}</span></div><p>${esc(x.preview)}</p><small>${x.thread != null ? 'From ' + esc(TH[x.thread].n) : 'Personal note'}</small>
        <div class="fu-actions"><button class="btn-s" type="button" id="done-${x.id}" data-act="complete" data-arg="${x.isNote ? 'note' : 'tag'}:${x.id}">Complete</button><button class="txt-btn" type="button" id="snz-${x.id}" data-act="comeback" data-arg="${x.isNote ? 'note' : 'tag'}:${x.id}:snooze">Snooze</button></div></div>`).join('')}`
    : `<div class="emptybox">${s.done ? 'All done. A threadmark stays in its Space; a completed note moves to Completed below.' : 'No threads to tend yet. Open Come back to this on a note or threadmark. Nothing here is ever sent as a text.'}</div>`)
    + (doneNotes.length ? `<h6 class="sec-h">Completed · ${doneNotes.length}</h6>${doneNotes.map(n => { const cl = parseChecklist(n.body); return `<div class="followup dimmed"><p>${cl ? `Checklist · ${cl.filter(i => i.done).length} of ${cl.length} done` : esc(n.body)}</p><small>${esc(spaceOf(s, n.space)?.name || '')} · Kept for 30 days, then removed.</small></div>`; }).join('')}` : '');
}

/* ---------- Today ---------- */
function todayFull(s) {
  const recent = activeNotes(s).sort((a, b) => b.at - a.at).slice(0, 4);
  return todayView(s) + `<div class="chips" role="group" aria-label="Quick capture"><button type="button" class="chip" id="newcheck" data-act="capture" data-arg="CHECKLIST">☑ New checklist</button></div>
    <h6 class="sec-h">Recent captures</h6>${recent.length ? recent.map(n => { const cl = parseChecklist(n.body); const sp = spaceOf(s, n.space); return `<button class="space-row" type="button" data-act="openspace" data-arg="${sp.id}"><b>${cl ? 'Checklist' : 'Note'}</b><span>${cl ? `${cl.length} items` : esc(n.body.slice(0, 30))} · ${sp.emoji} ${esc(sp.name)}</span></button>`; }).join('') : '<p class="caption pad">Nothing captured yet.</p>'}`;
}

/* ---------- the Threadwell view ---------- */
export function playBoard(s) {
  const t = s.tlist[s.thread] || s.tlist[0];
  const wide = WIDE.includes(s.device), compactRail = s.device === 'phoneL';
  const live = ['thread', 'today', 'capture', 'spaces', 'settings', 'search', 'spamfolder', 'collapsetools', 'showtools', 'spaces-in-chat'];
  const st = stripState(s);
  const sp = s.channel.startsWith('c:') ? spaceOf(s, s.channel.slice(2)) : null;
  const chatLive = ['CHAT', 'spaces-in-chat', 'LINKS', 'ATTACHMENTS', 'IMPORTANT'];
  s.starCount = Object.values(s.msgs).reduce((n, l) => n + l.filter(m => m.star).length, 0);
  let header = '', bar = '', panel = '', main = '', foot = '';
  const nav = key => (wide ? (panel = channelPanel(s, key, { live: chatLive })) : (bar = channelBar(s, key, { live: chatLive, flash: s.flash, more: s.sheet === 'more' })));
  if (s.mode === 'chat') {
    header = boardHeader('Messages', esc(t.n), t.i, { narrow: !wide, open: true });
    nav('CHAT');
    main = spamBanner(s) + widgetsHost(s, 'thread') + messages(s, s.thread, { hold: true });
    foot = composer(s);
  } else if (s.mode === 'builtin') {
    header = boardHeader(BUILTIN[s.channel], esc(t.n), t.i, { narrow: !wide, open: true });
    nav(s.channel);
    main = builtinView(s, s.channel);
  } else if (s.mode === 'space' && sp) {
    header = boardHeader(`${sp.emoji} ${esc(sp.name)}`, s.scopeAll ? 'All conversations' : esc(t.n), t.i, { scope: { all: s.scopeAll }, narrow: !wide, open: true });
    nav('c:' + sp.id);
    main = spaceItems(s, sp, s.scopeAll) || `<div class="emptybox">${spaceEmpty(s, sp)}</div>`;
    foot = composerBar(s, sp);
  } else if (s.mode === 'search') {
    main = searchView(s);
  } else if (s.mode === 'spam') {
    main = spamFolderView(s);
  } else if (s.mode === 'library') {
    header = `<div class="bhead"><div class="btitle"><b>${ico.stack.replace('<svg', '<svg class="inl"')} My Spaces</b><span>Everything you've saved, from every chat</span></div></div>`;
    const pending = followUps(s).length;
    main = `<button class="tend-link" type="button" id="tendrow" data-act="opentend">${ico.clock}<b>Threads to Tend</b><span>${pending ? `${pending} upcoming` : 'none yet'}</span><i>›</i></button>
      ${orderedSpaces(s).map(x => `<button class="space-row${s.flash === x.id ? ' flash' : ''}" type="button" id="lib-${x.id}" data-act="openspace" data-arg="${x.id}"><i class="sdot" style="background:${x.color}"></i><b>${x.emoji} ${esc(x.name)}</b><span>${countFor(s, x.id) || ''}</span></button>`).join('')}`;
  } else if (s.mode === 'libspace' && sp) {
    header = `<div class="bhead"><button class="icon-btn sm" type="button" id="libback" data-act="libback" aria-label="Back to My Spaces">${ico.back}</button><div class="btitle"><b>${sp.emoji} ${esc(sp.name)}</b><span>All conversations</span></div></div>`;
    main = spaceItems(s, sp, true) || `<div class="emptybox">${spaceEmpty(s, sp)}</div>`;
    foot = composerBar(s, sp);
  } else if (s.mode === 'tend') {
    main = tendView(s);
  } else if (s.mode === 'today') {
    main = todayFull(s);
  }
  const modeKey = ['library', 'libspace', 'tend'].includes(s.mode) ? 'spaces' : ['today', 'search', 'spam'].includes(s.mode) ? s.mode : '';
  const showStrip = !['today', 'search', 'spam'].includes(s.mode);
  let html = board(s, { selected: s.thread, mode: modeKey, live, header, bar, panel, main, foot, compact: compactRail, spamCount: spamQuarantined(s) ? 1 : 0, top: showStrip ? stripHtml(s, st) : '', dock: showStrip && st.presentation === 'dock', sk: `${s.mode}:${s.channel}:${s.thread}:${s.scopeAll}`, endScroll: s.mode === 'chat' });
  html += overlays(s, st);
  return html;
}

/** Dialogs and sheets that sit on top of the board. */
function overlays(s, st) {
  let h = '';
  if (s.bar) h += actionBar(s);
  if (s.sheet === 'more') h += spacesSheet(s);
  if (s.sheet === 'manage') h += manageDialog(s);
  if (s.sheet === 'tpl') h += templateDialog();
  if (s.sheet === 'edit') h += editDialog(s);
  if (s.saveDlg) h += saveDialog(s);
  if (s.sheet === 'spedit') h += editSpaceDlg(s);
  if (s.spDelete) h += deleteSpaceDlg(s);
  h += widgetOverlays(s, 'board') + (s.dockOpen && st.presentation === 'dock' ? dockPanel(s) : '');
  return h + sharedOverlays(s);
}

/** Overlays available from both layouts: capture, note actions, reminders. */
export function sharedOverlays(s) {
  let h = '';
  if (s.capMenu) h += capMenu();
  if (s.cap) h += captureDialog(s);
  if (s.noteMenu) h += noteMenuDlg(s);
  if (s.noteMode === 'edit') h += editNoteDlg(s);
  if (s.noteMode === 'delete') h += deleteNoteDlg(s);
  if (s.noteMode === 'move' || s.noteMode === 'copy') h += moveNoteDlg(s);
  if (s.cb) h += comebackDlg(s);
  return h;
}

const CAP_KINDS = [['NOTE', '📝 Private note', 'Write a private note'], ['CHECKLIST', '☑ Checklist', 'One item per line'], ['REMINDER', '⏰ Reminder', 'What should we remind you about?'], ['LINK', '🔗 Threadmarked link', 'Paste a link (https://…)']];

const capMenu = () => `<div class="menu cap-menu" role="menu" aria-label="Add to Threadwell" data-esc="capclose">${CAP_KINDS.map(([k, t]) => `<button class="mi" type="button" role="menuitem" id="ck-${k}" data-act="capkind" data-arg="${k}">${t}</button>`).join('')}</div>`;

export function normalizeLink(raw) {
  const t = raw.trim();
  if (!t || /\s/.test(t)) return null;
  const u = /^https?:\/\//i.test(t) ? t : 'https://' + t;
  return /^https?:\/\/[^\s/.]+\.[^\s/.]{2,}(\/\S*)?$/i.test(u) ? u : null;
}
export function capValid(c) {
  if (c.kind === 'LINK') return !!normalizeLink(c.text);
  if (c.kind === 'REMINDER') return !!c.text.trim() && !!c.at;
  return !!c.text.trim();
}

function timeChips(sel, allowNone, act) {
  return `<div class="chips" role="group" aria-label="When">${allowNone ? `<button type="button" class="chip${!sel ? ' on' : ''}" data-act="${act}" data-arg="" aria-pressed="${!sel}">None</button>` : ''}${Object.keys(TIMES).map(k => `<button type="button" class="chip${sel === k ? ' on' : ''}" data-act="${act}" data-arg="${k}" aria-pressed="${sel === k}">${k}</button>`).join('')}
    <button type="button" class="chip" aria-disabled="true" tabindex="-1" data-why="A custom date and time picker is the phone’s own, so it isn’t simulated here.">Choose time…</button></div>`;
}

function captureDialog(s) {
  const c = s.cap, kind = CAP_KINDS.find(k => k[0] === c.kind), valid = capValid(c);
  return `<div class="scrim"><div class="dialog tall" role="dialog" aria-label="Add to Threadwell" data-esc="capcancel"><h5>Add to Threadwell</h5>
    <div class="dlg-scroll" tabindex="0" data-sk="cap">
      <div class="chips nowrap" role="group" aria-label="What to add">${CAP_KINDS.map(([k, t]) => `<button type="button" class="chip${c.kind === k ? ' on' : ''}" data-act="capkind" data-arg="${k}" aria-pressed="${c.kind === k}">${t}</button>`).join('')}</div>
      <p class="caption" style="margin:8px 0 4px">Save to</p>
      ${s.spaces.length ? `<div class="chips nowrap" role="group" aria-label="Save to">${orderedSpaces(s).map(sp => `<button type="button" class="chip${c.space === sp.id ? ' on' : ''}" id="cs-${sp.id}" data-act="capspace" data-arg="${sp.id}" aria-pressed="${c.space === sp.id}">${sp.emoji} ${esc(sp.name)}</button>`).join('')}</div>`
        : '<p class="caption">📥 A new Inbox Space will be created for this.</p>'}
      <textarea class="field" id="captext" rows="4" maxlength="${MAX_NOTE_LENGTH}" aria-label="${esc(kind[2])}" placeholder="${esc(kind[2])}" data-act="captext" ${c.kind === 'LINK' && c.text && !valid ? 'aria-invalid="true"' : ''}>${esc(c.text)}</textarea>
      ${c.kind === 'LINK' && c.text && !valid ? '<p class="caption err">That doesn’t look like a link yet.</p>' : ''}
      <p class="caption" style="margin:8px 0 4px">Come back to this</p>
      ${timeChips(c.at, c.kind !== 'REMINDER', 'captime')}
      <p class="caption">Saved only in Threadwell. Reminders are notifications on this phone; nothing is sent as a text. In the playground no notification is ever shown.</p></div>
    <div class="dlg-actions"><button class="txt-btn" type="button" data-act="capcancel">Cancel</button><button class="txt-btn strong" type="button" id="capsave" data-act="capsave" ${valid ? '' : 'disabled'}>${c.at ? 'Save reminder' : 'Save'}</button></div></div></div>`;
}

function noteMenuDlg(s) {
  const n = s.notes.find(x => x.id === s.noteMenu);
  return `<div class="scrim"><div class="dialog" role="dialog" aria-label="Private note" data-esc="notemenuclose"><h5>📝 Private note</h5>
    <div class="menulist">
      <button class="txt-btn left" type="button" id="nm-edit" data-act="notemode" data-arg="edit">Edit</button>
      <button class="txt-btn left" type="button" data-act="notepin" data-arg="${n.id}">${n.pinned ? 'Unpin from top' : 'Pin to top'}</button>
      <button class="txt-btn left" type="button" data-act="comeback" data-arg="note:${n.id}">${n.remind ? 'Change reminder' : 'Come back to this…'}</button>
      ${n.remind ? `<button class="txt-btn left" type="button" data-act="noteclear" data-arg="${n.id}">Clear reminder</button>` : ''}
      <button class="txt-btn left" type="button" data-act="notescope" data-arg="${n.id}">${n.thread != null ? 'Change to All chats' : `Change to This chat (${esc(TH[s.thread].n)})`}</button>
      <button class="txt-btn left" type="button" id="nm-complete" data-act="notecomplete" data-arg="${n.id}">Complete and archive</button>
      <button class="txt-btn left" type="button" data-act="notemode" data-arg="move">Move to another Space</button>
      <button class="txt-btn left" type="button" data-act="notemode" data-arg="copy">Copy to another Space</button>
      <button class="txt-btn left danger" type="button" id="nm-delete" data-act="notemode" data-arg="delete">Delete note</button></div>
    <div class="dlg-actions"><button class="txt-btn" type="button" data-act="notemenuclose">Close</button></div></div></div>`;
}

const editNoteDlg = s => {
  const n = s.notes.find(x => x.id === s.noteMenu);
  return `<div class="scrim"><div class="dialog" role="dialog" aria-label="Edit note" data-esc="notemodeclose"><h5>Edit note</h5>
    <textarea class="field" id="noteedit" rows="6" maxlength="${MAX_NOTE_LENGTH}" aria-label="Note text" data-act="noteeditdraft">${esc(s.noteDraft)}</textarea>
    ${parseChecklist(n.body) ? '<p class="caption">Checklist lines start with [ ] or [x]. To remove an item, delete its line.</p>' : ''}
    <div class="dlg-actions"><button class="txt-btn" type="button" data-act="notemodeclose">Cancel</button><button class="txt-btn strong" type="button" id="noteeditsave" data-act="noteeditsave" ${s.noteDraft.trim() ? '' : 'disabled'}>Save</button></div></div></div>`;
};
const deleteNoteDlg = s => `<div class="scrim"><div class="dialog" role="dialog" aria-label="Delete this note?" data-esc="notemodeclose"><h5>Delete this note?</h5>
  <p class="caption" style="margin:0">It is only stored in Threadwell. No text message is affected.</p>
  <div class="dlg-actions"><button class="txt-btn" type="button" data-act="notemodeclose">Cancel</button><button class="txt-btn danger" type="button" id="notedelete" data-act="notedelete">Delete</button></div></div></div>`;
const moveNoteDlg = s => {
  const n = s.notes.find(x => x.id === s.noteMenu), others = s.spaces.filter(x => x.id !== n.space);
  return `<div class="scrim"><div class="dialog tall" role="dialog" aria-label="${s.noteMode === 'move' ? 'Move note to' : 'Copy note to'}" data-esc="notemodeclose"><h5>${s.noteMode === 'move' ? 'Move note to…' : 'Copy note to…'}</h5>
    <div class="dlg-scroll" tabindex="0">${others.length ? others.map(sp => `<button class="trow" type="button" data-act="notemove" data-arg="${sp.id}"><span class="temo">${sp.emoji}</span><span><b>${esc(sp.name)}</b></span></button>`).join('') : '<p class="caption">You have no other Spaces.</p>'}</div>
    <div class="dlg-actions"><button class="txt-btn" type="button" data-act="notemodeclose">Cancel</button></div></div></div>`;
};

function comebackDlg(s) {
  const { kind, id, snooze } = s.cb;
  const item = kind === 'note' ? s.notes.find(x => x.id === id) : s.tags.find(x => x.id === id);
  const text = kind === 'note' ? (parseChecklist(item.body) ? 'Checklist' : item.body) : item.text;
  return `<div class="scrim"><div class="dialog" role="dialog" aria-label="${snooze ? 'Snooze until' : 'Come back to this'}" data-esc="cancelcb"><h5>${snooze ? '⏰ Snooze until' : '⏰ Come back to this'}</h5>
    <p class="caption" style="margin:0">${esc(text)}</p>
    ${timeChips(s.cbLabel, false, 'time')}
    <p class="caption">${s.cbLabel ? `<b class="acc">Reminds you ${TIMES[s.cbLabel]}</b>` : 'Pick when to be reminded'}</p>
    <div class="dlg-actions"><button class="txt-btn" type="button" data-act="cancelcb">Cancel</button><button class="btn-s" type="button" id="confirm" data-act="confirm" ${s.cbLabel ? '' : 'disabled'}>${snooze ? 'Snooze' : 'Come back to this'}</button></div></div></div>`;
}

function actionBar(s) {
  const cur = s.msgs[s.thread].find(x => x.id === s.holdMid);
  const why = 'This message action is not part of the playground yet.';
  const dead = (icon, t) => `<button class="ab" type="button" aria-disabled="true" tabindex="-1" data-why="${why}">${icon}<span>${t}</span></button>`;
  return `<div class="actionbar" role="toolbar" aria-label="Message actions" data-esc="hold">
    <div class="react-row" aria-hidden="true">👍 ❤️ 😂 😮</div>
    <div class="ab-row">${dead('📋', 'Copy text')}${dead('↩', 'Reply')}${dead('↪', 'Forward')}
      <button class="ab${s.menu ? ' on' : ''}" type="button" id="more" data-act="moreactions" aria-label="More message actions" aria-expanded="${s.menu}">⋯<span>More</span></button></div>
    ${s.menu ? `<div class="menu" role="menu" data-esc="moreactions"><button class="mi" type="button" role="menuitem" id="starbtn" data-act="star">${cur && cur.star ? '★  Remove star' : '☆  Star'}</button>
      <button class="mi" type="button" role="menuitem" id="addspace" data-act="addspace">＃  Add to a Space</button>
      <button class="mi" type="button" role="menuitem" aria-disabled="true" tabindex="-1" data-why="${why}">ℹ  Message info</button>
      <button class="mi danger" type="button" role="menuitem" aria-disabled="true" tabindex="-1" data-why="${why}">🗑  Delete</button></div>` : ''}</div>`;
}

function saveDialog(s) {
  const m = s.msgs[s.thread].find(x => x.id === s.holdMid);
  return `<div class="scrim"><div class="dialog tall" role="dialog" aria-label="Add message to a Space" data-esc="cancelsave"><h5>Add message to a Space</h5>
    <p class="caption" style="margin:0 0 4px">${m ? esc(m.text) : ''}</p>
    <div class="dlg-scroll" tabindex="0" data-sk="save">
      <label class="check"><input type="checkbox" data-act="important" ${s.important ? 'checked' : ''}><span class="star">★</span> Important</label>
      ${orderedSpaces(s).map(sp => `<label class="check${s.flash === sp.id ? ' flash' : ''}"><input type="checkbox" id="chk-${sp.id}" data-act="tick" data-arg="${sp.id}" ${s.tick.includes(sp.id) ? 'checked' : ''}><i class="sdot" style="background:${sp.color}"></i><span>${sp.emoji} ${esc(sp.name)}</span></label>`).join('')}
      <button class="txt-btn" type="button" id="newspace" data-act="newspace" ${s.spaces.length >= MAX_SPACES ? 'disabled' : ''}>＋ New Space</button></div>
    <div class="dlg-actions"><button class="txt-btn" type="button" data-act="cancelsave">Cancel</button><button class="txt-btn strong" type="button" id="save" data-act="savemsg">Save</button></div></div></div>`;
}

/* ---------- Settings ---------- */
export function messagingPage(s) {
  const board = s.layoutMode === 'board';
  const sw = (act, text, on, cap = '') => `<div class="switch-row"><div><div class="label" style="font-size:13px">${text}</div>${cap ? `<div class="caption">${cap}</div>` : ''}</div><button class="switch" type="button" role="switch" aria-checked="${on}" aria-label="${esc(text)}" data-act="${act}"><span></span></button></div>`;
  const dead = (t, sub, why) => `<div class="set-item" aria-disabled="true" tabindex="-1" data-why="${why}">${t}<span>${sub}</span></div>`;
  const nope = 'This setting changes how the phone sends or alerts, so it is not simulated in the playground.';
  return statusbar() + appbar('Messaging &amp; notifications', { back: true }) + settingsBody(`
    <h4>Messaging</h4>
    ${label('Layout')}
    ${caption('Traditional keeps the familiar inbox. Threadwell view adds a rail of your threads, plus Spaces for links, attachments, and important messages.')}
    ${seg('layout', [['traditional', 'Traditional'], ['board', 'Threadwell view']], s.layoutMode, { label: 'Layout' })}
    ${board ? `<h4 style="margin-top:20px">Threadwell view</h4>
      ${sw('setrail', 'Start with the Space list collapsed', s.railCollapsed, 'Used on wide screens, where the Space list sits beside the conversation.')}
      ${sw('settools', 'Start with utility tools collapsed', s.toolsCollapsed, 'Tucks Search, Today, Add to Threadwell and Spaces behind one ⋯ button.')}
      <div class="caption" style="margin-top:12px">Widget strip behavior</div>
      <div class="radios" role="radiogroup" aria-label="Widget strip behavior">${STRIP_MODES.map(m => `<button class="radio" type="button" role="radio" aria-checked="${s.stripMode === m.key}" data-act="stripmode" data-arg="${m.key}"><i></i><span>${m.label}${m.rec ? ' (recommended)' : ''}<small>${m.summary}</small></span></button>`).join('')}</div>
      ${sw('striprem', 'Remember my last widget state', s.stripRemember)}
      <div class="caption" style="margin-top:12px">New Spaces open showing</div>
      <div class="chips" role="group" aria-label="New Spaces open showing">${[[false, 'This chat'], [true, 'All chats']].map(([all, t]) => `<button type="button" class="chip${s.defaultScopeAll === all ? ' on' : ''}" data-act="defscope" data-arg="${all}" aria-pressed="${s.defaultScopeAll === all}">${t}</button>`).join('')}</div>
      <p class="caption" style="margin-top:12px">The app has more Threadwell view options (tips, new-since-last-visit badges, default sort, Today sections). They are not part of the playground.</p>` : ''}
    <div class="set-gap"></div>
    ${dead('Signature', 'Added to messages you type', nope)}${dead('Swipe actions', 'Choose what swiping a thread does', nope)}${dead('Undo send delay', 'Off', nope)}`);
}
