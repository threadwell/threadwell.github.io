// Threadwell view (the "board"): a rail of threads with a tools column, the open conversation or Space beside it.
// Structure and labels follow MessageBoardScreen.kt (RecipientRail, BoardTools, BoardHeader, CompactChannelBar,
// LibraryHeader), CustomChannels.kt (Spaces dialogs) and ChannelTemplates.kt (New Space).
import { esc } from './core.js';
import { ico, statusbar, THREADS, bubble, photo } from './phone-ui.js';
import { TEMPLATES, COLORS, NAME_MAX, MAX_SPACES, countFor, orderedSpaces } from './space-model.js';

const svg = d => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const bico = {
  compose: svg('<path d="M4 20h4L19 9a2.1 2.1 0 0 0-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>'),
  today: svg('<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M9 3v4M15 3v4"/>'),
  spam: svg('<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M12 8v4M12 15.5v.1"/>'),
  filter: svg('<path d="M4 6h16l-6 7v5l-4 2v-7z"/>'),
  collapse: svg('<path d="M6 15l6-6 6 6"/>'),
  chat: svg('<path d="M5 6h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-7l-4 3v-3H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/>'),
  link: svg('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
  clip: svg('<path d="M20 11l-8 8a5 5 0 0 1-7-7l8-8a3.3 3.3 0 0 1 5 5l-8 8a1.7 1.7 0 0 1-2.4-2.4l7-7"/>'),
  star: svg('<path d="M12 4l2.4 5 5.6.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.6-.8z"/>'),
  dash: svg('<rect x="4" y="4" width="7" height="9" rx="2"/><rect x="13" y="4" width="7" height="5" rx="2"/><rect x="13" y="11" width="7" height="9" rx="2"/><rect x="4" y="15" width="7" height="5" rx="2"/>'),
  insights: svg('<path d="M5 19V11M12 19V5M19 19v-6"/>'),
  open: svg('<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/>'),
  expand: svg('<path d="M9 6l6 6-6 6"/>'),
  shrink: svg('<path d="M15 6l-6 6 6 6"/>'),
};
// Shown on controls that exist in the app but are not simulated here. The playground sets its own wording.
export let OUT_OF_SCOPE = 'Not part of this tutorial';
export const setScopeLabel = t => { OUT_OF_SCOPE = t; };

// A tool is only interactive when the running demo handles it (`live`); otherwise it is shown but inert,
// so keyboard users never land on a button that does nothing.
const tool = (act, label, icon, live, { badge = 0, on = false, pulse = false } = {}) => {
  const isLive = live.includes(act);
  return `<button class="rtool${on ? ' on' : ''}${pulse ? ' tapping-ring' : ''}" type="button" id="rt-${act}" ${isLive ? `data-act="${act}"` : `aria-disabled="true" tabindex="-1" title="${OUT_OF_SCOPE}"`} aria-label="${esc(label)}"${isLive ? '' : ` aria-description="${OUT_OF_SCOPE}"`}>${icon}${badge ? `<i class="badge">${badge}</i>` : ''}</button>`;
};

/** Widget Dock: widgets tuck into this button once you start reading (RecipientRail -> WidgetDockButton). */
export function dockButton(s, dock, pulse = '') {
  return dock ? `<button class="rtool${pulse === 'dock' ? ' tapping-ring' : ''}${s.dockInfo && s.dockInfo.dot ? ' hasbadge' : ''}" type="button" id="wdock" data-act="wdock" aria-label="Widgets, docked. Open widgets${s.dockInfo ? '. ' + s.dockInfo.desc : ''}">${bico.dash}${s.dockInfo && s.dockInfo.dot ? '<i class="pip"></i>' : ''}</button>` : '';
}

export function rail(s, { selected = 0, pulse = '', spamCount = 0, mode = '', live = [], compact = false, dock = false } = {}) {
  const threadsLive = live.includes('thread');
  // Collapsed tools can be peeked at: the ⋯ button shows them until a tool (or Collapse) is tapped (MessageBoardScreen.kt).
  const collapsed = !!s.toolsCollapsed && !s.peek;
  const dockBtn = dockButton(s, dock, pulse);
  const names = s.tlist || THREADS;
  const stack = collapsed
    ? `<button class="rtool${spamCount ? ' hasbadge' : ''}" type="button" id="showtools" data-act="showtools" aria-label="Show Threadwell tools${spamCount ? `. ${spamCount} spam conversation${spamCount === 1 ? '' : 's'}` : ''}" aria-expanded="false">${ico.more}${spamCount ? '<i class="pip"></i>' : ''}</button>`
    : `${tool('search', 'Search your threads', ico.search, live, { on: mode === 'search' })}
    ${tool('today', 'Open Today: what is due, unread chats and recent captures', bico.today, live)}
    ${tool('capture', 'Add to Threadwell: a note, checklist or reminder', ico.bolt, live, { pulse: pulse === 'capture' })}
    ${tool('spaces', 'Browse Spaces', ico.stack, live, { on: mode === 'spaces', pulse: pulse === 'spaces' })}
    ${tool('spamfolder', 'Open spam folder' + (spamCount ? `, ${spamCount} conversation${spamCount === 1 ? '' : 's'}` : ''), bico.spam, live, { badge: spamCount, on: mode === 'spam', pulse: pulse === 'spam' })}
    <button class="rtool plain" type="button" id="collapsetools" data-act="collapsetools" aria-label="Collapse Threadwell tools" aria-expanded="true">${bico.collapse}</button>`;
  // On a short screen (landscape) the whole rail scrolls, as RecipientRail does below 560dp of height.
  return `<div class="rail${compact ? ' compact' : ''}" aria-label="Threads and tools">
    ${tool('compose', 'New message', bico.compose, live)}
    <span class="dock-slot">${dockBtn}</span>
    <div class="rstack${s.railAnim ? ' rail-anim' : ''}">${stack}</div>
    <hr><small>Threads</small>
    <div class="rail-list">${names.map((t, k) => `<button class="avatar rtool-av${k === selected && !['spaces', 'search', 'spam'].includes(mode) ? ' sel' : ''}" type="button" ${threadsLive ? `data-act="thread" data-arg="${k}"` : `aria-disabled="true" tabindex="-1" title="${OUT_OF_SCOPE}"`} aria-label="${esc(t.n)}${t.unread ? ', unread' : ''}">${t.i}${t.unread ? '<i class="dot"></i>' : ''}</button>`).join('')}</div>
    <div class="rail-foot">
      ${tool('filter', 'Filter threads. Showing all.', bico.filter, live)}
      ${tool('settings', 'Settings', ico.gear, live, { pulse: pulse === 'settings' })}
    </div></div>`;
}

/** Compact channel bar: the four built-ins, up to three of your Spaces, then "More". Matches CompactChannelBar. */
export function channelBar(s, current = 'CHAT', { live = ['CHAT'], flash = null, more = false } = {}) {
  const customs = orderedSpaces(s), inline = 3;
  const first = customs.slice(0, inline);
  const sel = customs.find(sp => 'c:' + sp.id === current);
  const shown = sel && !first.includes(sel) ? [...first.slice(0, inline - 1), sel] : first;
  const extra = customs.length - shown.length;
  const builtin = [['CHAT', 'Messages'], ['LINKS', 'Links'], ['ATTACHMENTS', 'Attachments'], ['IMPORTANT', 'Important']];
  const btn = (key, text, on, isLive, extraCls = '') => `<button type="button" class="chip${on ? ' on' : ''}${extraCls}" ${isLive ? `data-act="channel" data-arg="${esc(key)}"` : `aria-disabled="true" tabindex="-1" title="${OUT_OF_SCOPE}"`} aria-pressed="${on}">${text}</button>`;
  return `<div class="chbar" role="group" aria-label="Channels">
    ${builtin.map(([k, t]) => btn(k, t, k === current, live.includes(k))).join('')}
    ${shown.map(sp => { const n = countFor(s, sp.id, s.thread); const key = 'c:' + sp.id; return btn(key, `${sp.emoji} ${esc(sp.name)}${n ? ' ' + n : ''}`, key === current, live.includes('spaces-in-chat') || live.includes(key), flash === sp.id ? ' flash' : ''); }).join('')}
    <button type="button" class="chip${more ? ' on' : ''}${flash && !shown.some(x => x.id === flash) ? ' flash' : ''}" id="morebtn" data-act="more" aria-haspopup="dialog">${extra > 0 ? `More (${extra})` : 'More'} ▾</button>
  </div>`;
}

const hicon = (label, icon) => `<span class="hico" role="img" aria-label="${esc(label)}" title="${OUT_OF_SCOPE}">${icon}</span>`;

/** BoardHeader: avatar, channel title, then the app's action icons. On a narrow window "Open chat" is an icon. */
export function boardHeader(title, sub, initial = 'S', { scope = null, narrow = true, open = false } = {}) {
  // `open` makes the open-conversation control a real button (the playground uses it; tutorials keep it as a label).
  const openBtn = narrow
    ? (open ? `<button class="hico hbtn" type="button" id="openfull" data-act="openfull" aria-label="Open full conversation">${bico.open}</button>` : hicon('Open full chat', bico.open))
    : (open ? '<button class="openchat openbtn" type="button" id="openfull" data-act="openfull">Open chat</button>' : '<span class="openchat" aria-hidden="true">Open chat</span>');
  return `<div class="bhead"><div class="avatar" aria-hidden="true">${initial}</div>
    <div class="btitle"><b>${title}</b><span>${sub}</span></div>
    ${hicon('Conversation actions: pin, mute, archive, favorite', ico.more)}${hicon('Conversation dashboard', bico.dash)}${hicon('Thread insights', bico.insights)}
    ${openBtn}</div>
    ${scope ? `<div class="scopebar" role="group" aria-label="Show this Space for">${[[false, 'This chat'], [true, 'All chats']].map(([all, t]) => `<button type="button" class="chip${scope.all === all ? ' on' : ''}" data-act="scope" data-arg="${all ? 'all' : 'this'}" aria-pressed="${scope.all === all}">${t}</button>`).join('')}</div>` : ''}`;
}

/**
 * The wide layout's Space list (ChannelRail): 168dp with labels, or 56dp icons only. Its toggle is the way to
 * reopen it once collapsed. Shown only while browsing a conversation, never in My Spaces, Today or Spam.
 */
export function channelPanel(s, current = 'CHAT', { live = [] } = {}) {
  const collapsed = !!s.railCollapsed;
  const customs = orderedSpaces(s);
  const important = s.starCount ?? s.tags.filter(t => t.important).length;
  const recent = customs.length < 4 ? [] : (s.recents || []).map(id => customs.find(x => x.id === id)).filter(x => x && !s.favs.includes(x.id)).slice(0, 3);
  const canPick = live.includes('spaces-in-chat');
  const rowAttrs = (key, isLive) => isLive ? `data-act="channel" data-arg="${esc(key)}"` : `aria-disabled="true" tabindex="-1" title="${OUT_OF_SCOPE}"`;
  const builtin = [['CHAT', 'Messages', bico.chat, 0], ['LINKS', 'Links', bico.link, 0], ['ATTACHMENTS', 'Attachments', bico.clip, 0], ['IMPORTANT', 'Important', bico.star, important]];
  const spaceRow = (sp, withLabel) => {
    const key = 'c:' + sp.id, n = countFor(s, sp.id, s.thread), on = key === current, fav = s.favs.includes(sp.id);
    const desc = `${sp.name}${fav ? ', favorite' : ''}${n ? `, ${n} saved here` : ''}`;
    return withLabel
      ? `<button class="crow${on ? ' on' : ''}${s.flash === sp.id ? ' flash' : ''}" type="button" id="crow-${sp.id}" ${rowAttrs(key, canPick)} aria-label="${esc(desc)}" aria-pressed="${on}"><i class="sdot" style="background:${sp.color}"></i><span class="cemo">${sp.emoji}</span><span class="cname">${esc(sp.name)}</span>${fav ? '<em class="cfav">★</em>' : ''}${n ? `<small>${n}</small>` : ''}</button>`
      : `<button class="ctile${on ? ' on' : ''}${s.flash === sp.id ? ' flash' : ''}" type="button" id="crow-${sp.id}" ${rowAttrs(key, canPick)} aria-label="${esc(desc)}" aria-pressed="${on}"><span class="cemo">${sp.emoji}</span><i class="sdot" style="background:${sp.color}"></i>${n ? `<b class="cnt">${n}</b>` : ''}${fav ? '<em class="cfav">★</em>' : ''}</button>`;
  };
  const bRow = ([key, title, icon, n], withLabel) => {
    const on = key === current, isLive = key === 'CHAT' || live.includes(key);
    return withLabel
      ? `<button class="crow${on ? ' on' : ''}" type="button" ${rowAttrs(key, isLive)} aria-label="${title}${n ? `, ${n} saved here` : ''}" aria-pressed="${on}"><span class="cico">${icon}</span><span class="cname">${title}</span>${n ? `<small>${n}</small>` : ''}</button>`
      : `<button class="ctile${on ? ' on' : ''}" type="button" ${rowAttrs(key, isLive)} aria-label="${title}" aria-pressed="${on}"><span class="cico">${icon}</span></button>`;
  };
  const label = !collapsed;
  return `<div class="cpanel${collapsed ? ' collapsed' : ''}" role="group" aria-label="Spaces for this conversation">
    <div class="chead">${label ? '<b>Browse Spaces</b>' : ''}<button class="ic" type="button" id="togglepanel" data-act="togglechannels" aria-label="${collapsed ? 'Expand Space list' : 'Collapse Space list'}" aria-expanded="${!collapsed}">${collapsed ? bico.expand : bico.shrink}</button></div>
    ${label ? '<p class="clabel">This conversation</p>' : ''}
    ${builtin.map(b => bRow(b, label)).join('')}
    ${recent.length ? (label ? '<p class="clabel">Recent</p>' : '<hr>') + recent.map(sp => spaceRow(sp, label)).join('') : ''}
    ${customs.length ? (label ? '<p class="clabel">Your Spaces</p>' : '<hr>') : ''}
    ${customs.map(sp => spaceRow(sp, label)).join('')}
    ${label
      ? `<button class="txt-btn cnew" type="button" id="managebtn" data-act="manage">＋ New / manage</button><p class="ctip">Long-press a Space to favorite it. Long-press a message in a thread to threadmark it into a Space.</p>`
      : `<button class="ic cplus" type="button" id="managebtn" data-act="manage" aria-label="New or manage Spaces">${ico.plus}</button>`}
  </div>`;
}

/** The board shell. `wide` swaps the phone channel bar for the Space list panel, as the app does at 600dp and up. */
export function board(s, { selected = 0, pulse = '', spamCount = 0, mode = '', live = [], header = '', bar = '', panel = '', main = '', compact = false, top = '', dock = false, sk = '', foot = '', endScroll = false } = {}) {
  return statusbar() + `<div class="board">${rail(s, { selected, pulse, spamCount, mode, live, compact, dock })}${panel}<div class="board-main"><div class="strip-slot">${top}</div>${header}${bar}<div class="bcontent"${sk ? ` data-sk="${sk}"` : ''}${endScroll ? ' data-end="1"' : ''} tabindex="0">${main}</div>${foot}</div></div>`;
}

/** The sample conversation shown in the Messages channel. */
export const conversation = (opts = {}) => `
  ${bubble('Found the place I was telling you about')}
  ${opts.hold ? `<button class="b recv msg-btn${opts.holdOn ? ' held' : ''}" type="button" data-act="hold" id="msg1" aria-label="Late Night Noodle Bar, 7 PM tonight. Press and hold for message actions.">Late Night Noodle Bar. Table for two at 7?</button>` : bubble('Late Night Noodle Bar. Table for two at 7?')}
  ${bubble('Perfect, see you there 🍜', true)}`;

/* ---------- Spaces sheet and dialogs ---------- */
const dot = c => `<i class="sdot" style="background:${c}" aria-hidden="true"></i>`;

/** "Spaces" bottom sheet behind the More button. */
export function spacesSheet(s) {
  const list = orderedSpaces(s);
  return `<div class="sheet" role="dialog" aria-label="Spaces" id="spacesheet" data-esc="closesheet"><h5 class="sheet-title">Spaces</h5>
    <div class="sheet-list" tabindex="0">${list.map(sp => {
      const n = countFor(s, sp.id, s.thread), key = 'c:' + sp.id;
      return `<button class="srow${s.channel === key ? ' on' : ''}${s.flash === sp.id ? ' flash' : ''}" type="button" id="row-${sp.id}" data-act="pickspace" data-arg="${sp.id}">${dot(sp.color)}<span>${sp.emoji} ${esc(sp.name)}</span><small>${n || ''}</small></button>`;
    }).join('')}</div>
    <button class="sheet-btn" type="button" id="managebtn" data-act="manage">＋  New / manage Spaces</button>
    <button class="sheet-btn" type="button" data-act="closesheet">Close</button></div>`;
}

/** "Spaces" management dialog (reorder, favorite, edit, New Space). */
export function manageDialog(s) {
  const list = orderedSpaces(s);
  return `<div class="scrim"><div class="dialog tall" role="dialog" aria-label="Spaces" data-esc="closemanage"><h5>Spaces</h5>
    <p class="caption">Messages, Links, Attachments and Important are built in. Your Spaces collect messages, links and photos from any thread: long-press one, or tap its # button.</p>
    <div class="dlg-scroll" tabindex="0">${list.map((sp, i) => `<div class="mrow${s.flash === sp.id ? ' flash' : ''}" id="mrow-${sp.id}"><span class="mname">${dot(sp.color)} ${sp.emoji} ${esc(sp.name)}</span>
      <span class="mctl"><button class="ic" type="button" data-act="mvup" data-arg="${sp.id}" aria-label="Move ${esc(sp.name)} up" ${i === 0 ? 'disabled' : ''}>▲</button>
      <button class="ic" type="button" data-act="mvdn" data-arg="${sp.id}" aria-label="Move ${esc(sp.name)} down" ${i === list.length - 1 ? 'disabled' : ''}>▼</button>
      <button class="ic" type="button" data-act="fav" data-arg="${sp.id}" aria-label="${s.favs.includes(sp.id) ? 'Remove' : 'Add'} ${esc(sp.name)} ${s.favs.includes(sp.id) ? 'from' : 'to'} favorites">${s.favs.includes(sp.id) ? '★' : '☆'}</button>
      ${s.pg ? `<button class="txt-btn" type="button" data-act="spedit" data-arg="${sp.id}" aria-label="Edit ${esc(sp.name)}">Edit</button>` : `<button class="txt-btn" type="button" aria-disabled="true" tabindex="-1" title="${OUT_OF_SCOPE}">Edit</button>`}</span></div>`).join('')}</div>
    <button class="txt-btn" type="button" id="newspace" data-act="newspace" ${s.spaces.length >= MAX_SPACES ? 'disabled' : ''}>＋ New Space</button>
    <div class="dlg-actions"><button class="txt-btn strong" type="button" data-act="closemanage">Done</button></div></div></div>`;
}

/** "New Space": blank or one of the ten templates. */
export function templateDialog() {
  return `<div class="scrim"><div class="dialog tall" role="dialog" aria-label="New Space" data-esc="cancelflow"><h5>New Space</h5>
    <div class="dlg-scroll" tabindex="0">
      <button class="trow" type="button" data-act="tpl" data-arg="blank"><span class="temo">＋</span><span><b>Blank Space</b><small>Name it and pick an icon yourself</small></span></button>
      <p class="caption" style="margin:8px 0 0">Or start from a template</p>
      ${TEMPLATES.map(t => `<button class="trow" type="button" id="tpl-${t.id}" data-act="tpl" data-arg="${t.id}"><span class="temo">${t.emoji}</span><span><b>${esc(t.name)}</b><small>${esc(t.desc)}</small></span></button>`).join('')}
    </div>
    <div class="dlg-actions"><button class="txt-btn" type="button" data-act="cancelflow">Cancel</button></div></div></div>`;
}

/** Name, icon and color for the new Space. */
export function editDialog(s) {
  const d = s.draft;
  return `<div class="scrim"><div class="dialog" role="dialog" aria-label="New Space" data-esc="cancelflow"><h5>New Space</h5>
    <label class="flabel" for="spname">Name</label>
    <input id="spname" class="field" type="text" maxlength="${NAME_MAX}" value="${esc(d.name)}" data-act="draftname" data-enter="#spsave" autocomplete="off">
    <div class="iconcard"><span class="caption" style="margin:0">Icon</span><span class="iconprev" aria-hidden="true">${d.emoji}</span></div>
    <span class="caption" style="margin:4px 0 0">Color</span>
    <div class="sws" role="group" aria-label="Color">${COLORS.map(([c, n]) => `<button type="button" class="sw${d.color === c ? ' on' : ''}" style="background:${c}" data-act="draftcolor" data-arg="${c}" aria-label="${n}" aria-pressed="${d.color === c}"></button>`).join('')}</div>
    <div class="dlg-actions"><button class="txt-btn" type="button" data-act="cancelflow">Cancel</button><button class="txt-btn strong" type="button" id="spsave" data-act="savespace" ${d.name.trim() ? '' : 'disabled'}>Save</button></div></div></div>`;
}

/* ----- Photo picker (stands in for Android's system photo picker) ----- */
export function pickerView(selected, { title = 'Select photos', max = 30 } = {}) {
  return statusbar() + `<div class="appbar">${`<button class="icon-btn" type="button" data-act="pickcancel" aria-label="Cancel">${ico.close}</button>`}<h3 tabindex="-1">${title}</h3></div>
    <p class="caption pad">Android's photo picker. Tap to choose more than one. Your albums, including Google Photos, appear here.</p>
    <div class="pgrid" role="group" aria-label="Photos">${[0, 1, 2, 3, 4, 5].map(i =>
      `<button class="pcell${selected.includes(i) ? ' sel' : ''}" type="button" data-act="pick" data-arg="${i}" aria-pressed="${selected.includes(i)}" aria-label="${['Sunset over water', 'Mountain ridge', 'Pine trees', 'City at dusk', 'Beach at noon', 'Lake at dawn'][i]}">${photo(i)}<i class="tick">${selected.includes(i) ? '✓' : ''}</i></button>`).join('')}</div>
    <div class="pfoot"><button class="btn-s" type="button" data-act="pickdone" ${selected.length ? '' : 'disabled'}>${selected.length ? `Add ${selected.length}` : 'Choose photos'}</button></div>`;
}
