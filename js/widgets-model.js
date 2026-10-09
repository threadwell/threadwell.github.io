// In-app widgets and the dashboard. Verified against Widgets.kt (registry, WidgetHost, More sheet, detail sheet),
// WidgetsSettingsScreen.kt (Settings -> Widgets & dashboard and each widget's page), WidgetCoordinator.kt (presets,
// requirements, statuses), WidgetsCalendar.kt / WidgetsProviders.kt (chips, permission flow) and BoardToday.kt.
// Threadwell has NO Android home-screen widgets. These are inside the app only.
import { esc } from './core.js';
import { ico, statusbar, appbar, settingsBody, label, caption, THREADS } from './phone-ui.js';
import { OUT_OF_SCOPE } from './board.js';
import { checklists, followCounts } from './notes.js';

/** The ten widgets, in the app's order. All are off until turned on. */
export const WIDGETS = [
  { id: 'weather', icon: '⛅', name: 'Weather', desc: 'Current conditions and a five-day forecast over any theme.', net: true, source: 'Open-Meteo (no key)' },
  { id: 'calendar', icon: '📅', name: 'Calendar', desc: 'Your next events from the calendars already on this phone.', perm: 'Calendar (read only)', setup: true, threads: true, source: 'Your device calendar (read only)', refresh: 'When you open the app, if older than 15 min' },
  { id: 'sports', icon: '🏆', name: 'Sports', desc: 'Scores and start times for your favorite teams.', net: true, setup: true },
  { id: 'packages', icon: '📦', name: 'Packages', desc: 'Keep track of deliveries you are expecting, with a shortcut to the carrier.', setup: true },
  { id: 'watchlist', icon: '📈', name: 'Watchlist', desc: 'Quotes and a one-month trend for the symbols you care about.', net: true, setup: true },
  { id: 'countdown', icon: '⏳', name: 'Countdowns', desc: 'Keep an important date visible across your dashboard.', setup: true, threads: true, source: 'Stored only on this phone', refresh: 'When you open the app, if older than 10 min' },
  { id: 'checklists', icon: '☑', name: 'Checklist progress', desc: 'How far along your Space checklists are.' },
  { id: 'followups', icon: '⏰', name: 'Threads to Tend summary', desc: 'What is due today and tomorrow from your threads to tend.' },
  { id: 'memory', icon: '🕰', name: 'Memory Lane', desc: 'A few meaningful past messages, photos and links, resurfaced from earlier years.' },
  { id: 'commute', icon: '🚗', name: 'Commute', desc: 'Work, home or school travel time and when to leave for your next event.', setup: true },
];
export const byId = id => WIDGETS.find(w => w.id === id);

/** Quick presets. They never ask for permissions; Calendar is only added if already allowed. */
export const PRESETS = [
  { id: 'minimal', title: 'Minimal', blurb: 'Just the weather', ids: ['weather'] },
  { id: 'commuter', title: 'Commuter', blurb: 'Weather, calendar and packages', ids: ['weather', 'calendar', 'packages', 'commute'] },
  { id: 'gameday', title: 'Game Day', blurb: 'Weather, sports and watchlist', ids: ['weather', 'sports', 'watchlist'] },
  { id: 'weekend', title: 'Weekend', blurb: 'Weather, sports and countdowns', ids: ['weather', 'sports', 'countdown', 'memory'] },
  { id: 'productivity', title: 'Productivity', blurb: 'Calendar, threads to tend, checklists and countdowns', ids: ['calendar', 'followups', 'checklists', 'countdown'] },
];

export const reqSummary = w => [
  w.net ? 'Internet (public data only)' : null, w.perm ? `${w.perm} permission` : null, w.setup ? 'A little setup' : null,
].filter(Boolean).join(' · ') || 'Nothing: uses only data on this phone';

const defPlace = id => ({ trad: !['followups', 'checklists'].includes(id), board: id !== 'followups', today: true });

export function widgetState(over = {}) {
  return {
    en: {}, wstyle: {}, pl: {}, th: {}, hidden: {}, order: WIDGETS.map(w => w.id),
    cal: 'ask',                         // ask | granted | denied (Android permission)
    cd: [],                             // countdowns
    todayMax: 3, compact: false,
    wsheet: null, preset: null, dlg: null, wid: null, cdraft: { emoji: '🎂', name: '', day: '' },
    ...over,
  };
}
export const pl = (s, id) => (s.pl[id] ||= defPlace(id));
const isOn = (s, id) => !!s.en[id];

/* ---------- status, chip text, visibility ---------- */
/** Ready, or the prompt chip the host shows instead (permission or setup). */
export function status(s, w) {
  if (w.id === 'calendar') return s.cal === 'granted' ? null : { kind: 'perm', action: '📅 Connect Calendar' };
  const prompts = { sports: '🏆 Choose your teams', packages: '📦 Add a package', watchlist: '📈 Add a symbol', commute: '🚗 Add a destination' };
  return prompts[w.id] ? { kind: 'setup', action: prompts[w.id] } : null;
}
const phrase = d => (d === 0 ? 'today' : d === 1 ? 'tomorrow' : `${d} days`);
export const upcoming = s => s.cd.filter(c => c.days >= 0).sort((a, b) => a.days - b.days);
export function chip(s, w) {
  switch (w.id) {
    case 'weather': return s.wxReady ? '🌤️ 64° · Partly cloudy' + (s.sampleData ? ' · sample' : '') : 'Weather';   // plain "Weather" until a location is set
    case 'calendar': return s.cal === 'granted' ? '📅 Dentist · 2:30 PM' : '📅 Allow calendar';
    case 'countdown': { const n = upcoming(s)[0]; return n ? `${n.emoji} ${n.name} · ${phrase(n.days)}` : '⏳ Add a countdown'; }
    case 'checklists': { const f = s.notes && checklists(s)[0]; return f ? `${f.space.emoji} ${f.space.name} · ${f.done}/${f.total}` : '☑ No checklists'; }
    case 'memory': return '🕰 No memories today';
    case 'followups': {
      if (!s.notes) return '⏰ Threads to Tend';
      const c = followCounts(s);
      return c.today > 0 ? `⏰ ${c.today} today` : c.tomorrow > 0 ? `⏰ ${c.tomorrow} tomorrow` : '⏰ Nothing due';
    }
    default: return `${w.icon} ${w.name}`;
  }
}
export const hasNews = (s, w) => (w.id === 'countdown' ? upcoming(s).length > 0 : w.id === 'calendar' ? s.cal === 'granted' : w.id === 'followups' && s.notes ? followCounts(s).all > 0 : false);

export function visibleOn(s, surface) {
  return s.order.map(byId).filter(w => {
    if (!isOn(s, w.id) || s.hidden[w.id]) return false;
    if (surface === 'thread') return w.threads && s.th[w.id] && !status(s, w) && hasNews(s, w);
    return pl(s, w.id)[surface];
  });
}

/* ---------- the widget strip on a screen (WidgetHost) ---------- */
const pill = (text, act, arg, id) => `<button class="wpill" type="button" ${id ? `id="${id}"` : ''} data-act="${act}" ${arg ? `data-arg="${arg}"` : ''}>${text}</button>`;

export function widgetsHost(s, surface) {
  const vis = visibleOn(s, surface);
  if (!vis.length) return '';
  const home = surface === 'trad' || surface === 'board';
  const shown = home ? vis.slice(0, 2) : vis, rest = home ? vis.slice(2) : [];
  let cards = 0;
  const cardsHtml = [], chips = [];
  shown.forEach(w => {
    const ready = !status(s, w), asCard = ready && surface !== 'thread' && s.wstyle[w.id] === 'card' && cards < (home ? 1 : s.todayMax);
    if (asCard) { cards++; cardsHtml.push(widgetCard(s, w)); }
    else {
      const st = status(s, w);
      chips.push(st ? pill(st.action, 'wsettings', w.id, `wp-${w.id}`) : pill(chip(s, w), 'wopen', w.id, `wp-${w.id}`));
    }
  });
  if (rest.length) chips.push(pill(`＋ ${rest.length} more`, 'wmore', '', 'wmorebtn'));
  return `<div class="whost${s.compact ? ' compact' : ''}" aria-label="Widgets">${cardsHtml.join('')}${chips.length ? `<div class="wrow">${chips.join('')}</div>` : ''}</div>`;
}

function widgetCard(s, w) {
  if (w.id === 'countdown') {
    const up = upcoming(s).slice(0, 3);
    return `<div class="wcard"><b>Countdowns</b>${up.length ? up.map(c => `<span>${c.emoji} ${esc(c.name)} · ${phrase(c.days)}</span>`).join('') : '<span class="muted">Nothing counting down. Open details to add one.</span>'}<button class="txt-btn" type="button" data-act="wopen" data-arg="${w.id}">Details</button></div>`;
  }
  if (w.id === 'checklists' && s.notes) {
    const all = checklists(s).slice(0, 2);
    return `<div class="wcard"><b>Checklist progress</b>${all.length ? all.map(c => `<span>${c.space.emoji} ${esc(c.space.name)} · ${c.done} of ${c.total} done</span><progress max="${c.total}" value="${c.done}" aria-label="${esc(c.space.name)}: ${c.done} of ${c.total} done"></progress>`).join('') : '<span class="muted">Make a checklist with Add to Threadwell and it will show up here.</span>'}<button class="txt-btn" type="button" data-act="wopen" data-arg="${w.id}">Details</button></div>`;
  }
  return `<div class="wcard"><b>${esc(w.name)}</b><span>${esc(chip(s, w))}</span><button class="txt-btn" type="button" data-act="wopen" data-arg="${w.id}">Details</button></div>`;
}

function checklistDetail(s) {
  const all = checklists(s).slice(0, 8);
  if (!all.length) return '<p>No checklists yet. Use Add to Threadwell and choose Checklist.</p>';
  return `<div class="wcl">${all.map(c => `<p><b>${c.space.emoji} ${esc(c.space.name)} · ${c.done}/${c.total}</b></p><progress max="${c.total}" value="${c.done}" aria-label="${esc(c.space.name)}: ${c.done} of ${c.total} done"></progress>
    ${c.items.map((i, k) => `<label class="check"><input type="checkbox" id="wc-${c.note.id}-${k}" data-act="ntoggle" data-arg="${c.note.id}:${k}" ${i.done ? 'checked' : ''}><span class="${i.done ? 'ck-done' : ''}">${esc(i.text)}</span></label>`).join('')}`).join('')}</div>`;
}
function followDetail(s) {
  const c = followCounts(s);
  return `<p>0 overdue or due now · ${c.today} later today · ${c.tomorrow} tomorrow</p>${c.today + c.tomorrow ? '' : '<p class="caption">Nothing due today or tomorrow.</p>'}`;
}

/** "＋ N more" sheet. */
export function moreSheet(s, surface) {
  const vis = visibleOn(s, surface);
  return `<div class="sheet" role="dialog" aria-label="Widgets" data-esc="wclose"><h5 class="sheet-title">Widgets</h5>
    <div class="sheet-list" tabindex="0">${vis.map(w => { const st = status(s, w);
      return `<button class="srow" type="button" id="wm-${w.id}" data-act="${st ? 'wsettings' : 'wopen'}" data-arg="${w.id}"><span class="wicon">${w.icon}</span><span><b>${esc(w.name)}</b><small>${esc(st ? st.action : chip(s, w))}</small></span></button>`; }).join('')}</div>
    <button class="sheet-btn" type="button" data-act="wclose">Close</button></div>`;
}

/** A widget's detail sheet: what every widget shares (Close, Hide widget, Settings, hide for a while, Today). */
export function detailSheet(s) {
  const w = byId(s.wsheet.id);
  const body = w.id === 'countdown'
    ? (upcoming(s).length ? upcoming(s).map(c => `<p>${c.emoji} <b>${esc(c.name)}</b><br><small>${phrase(c.days)}</small></p>`).join('') : '<p>Add a trip, birthday, reservation or bill to count down to it.</p>')
    : w.id === 'checklists' && s.notes ? checklistDetail(s)
    : w.id === 'followups' && s.notes ? followDetail(s)
    : `<p class="muted">${esc(chip(s, w))}</p><p class="caption">${s.sampleData ? (w.net ? `Sample data. The real widget loads this from ${esc(w.source || 'a public source')}.` : 'Each widget shows its own details here.') : 'Each widget shows its own details here. This tutorial shows the controls they all share.'}</p>`;
  return `<div class="sheet" role="dialog" aria-label="${esc(w.name)} widget" data-esc="wclose"><h5 class="sheet-title">${w.icon} ${esc(w.name)}</h5>${body}
    <div class="wactions"><button class="txt-btn" type="button" data-act="wclose">Close</button><button class="txt-btn" type="button" data-act="whide" data-arg="${w.id}">Hide widget</button><button class="txt-btn" type="button" data-act="wsettings" data-arg="${w.id}">Settings</button></div>
    <div class="wactions"><button class="txt-btn" type="button" data-act="whideuntil" data-arg="${w.id}:tomorrow">Hide until tomorrow</button><button class="txt-btn" type="button" data-act="whideuntil" data-arg="${w.id}:week">Hide for a week</button></div>
    <button class="txt-btn" type="button" data-act="wpin" data-arg="${w.id}">${pl(s, w.id).today ? 'Remove from Today' : 'Pin to Today'}</button></div>`;
}

/* ---------- Settings -> Widgets & dashboard ---------- */
const placeLabel = p => [p.trad && 'Inbox', p.board && 'Threadwell view', p.today && 'Today'].filter(Boolean).join(' + ') || 'Not shown anywhere yet · tap to choose where';

export function widgetsSummary(s) {
  const en = WIDGETS.filter(w => isOn(s, w.id));
  if (!en.length) return 'None enabled · Weather, calendar, sports and more';
  const where = [en.some(w => pl(s, w.id).board) && 'Threadwell view', en.some(w => pl(s, w.id).today) && 'Today', en.some(w => pl(s, w.id).trad) && 'inbox'].filter(Boolean);
  return `${en.length} enabled${where.length ? ' · ' + where.slice(0, -1).join(', ') + (where.length > 1 ? ', and ' : '') + where.at(-1) : ''}`;
}

const wrow = (title, sub, act, arg, right, id = '') => `<div class="wlrow"><button class="wlmain" type="button" ${id ? `id="${id}"` : ''} data-act="${act}" data-arg="${arg}"><b>${title}</b><small>${sub}</small></button>${right}</div>`;

export function widgetsSettingsView(s, { live = null } = {}) {
  const en = s.order.map(byId).filter(w => isOn(s, w.id)), avail = s.order.map(byId).filter(w => !isOn(s, w.id));
  const cfg = en.map(w => pl(s, w.id));
  const isLive = id => !live || live.includes(id);
  return statusbar() + appbar('Widgets &amp; dashboard', { back: true }) + settingsBody(`
    <div class="card-lite"><div class="label">${en.length ? `${en.length} widget${en.length === 1 ? '' : 's'} enabled` : 'No widgets enabled'}</div>
      <p class="caption">${cfg.filter(p => p.board).length} in Threadwell view · ${cfg.filter(p => p.today).length} on Today · ${cfg.filter(p => p.trad).length} in Inbox</p></div>
    <h4>Presets</h4>
    <p class="caption">Quickly switch which widgets are on. Your other settings are kept.</p>
    <div class="chips" role="group" aria-label="Presets">${PRESETS.map(p => `<button type="button" class="chip" id="pre-${p.id}" data-act="wpreset" data-arg="${p.id}">${p.title}</button>`).join('')}</div>
    <h4>Enabled widgets</h4>
    ${en.length ? en.map((w, i) => wrow(`${w.icon} ${esc(w.name)}`, `${s.wstyle[w.id] === 'card' ? 'Card' : 'Chip'} · ${placeLabel(pl(s, w.id))}`, 'wopenpage', w.id,
        `<span class="mctl"><button class="ic" type="button" data-act="wmv" data-arg="${w.id}:-1" aria-label="Move ${esc(w.name)} up" ${i === 0 ? 'disabled' : ''}>▲</button><button class="ic" type="button" data-act="wmv" data-arg="${w.id}:1" aria-label="Move ${esc(w.name)} down" ${i === en.length - 1 ? 'disabled' : ''}>▼</button></span>`)).join('')
      : '<p class="caption">Nothing here yet. Add a widget below.</p>'}
    <h4>Add widgets</h4>
    ${avail.length ? avail.map(w => isLive(w.id)
        ? wrow(`${w.icon} ${esc(w.name)}`, esc(w.desc), 'wadd', w.id, '<span class="plus" aria-hidden="true">＋</span>', `add-${w.id}`)
        : `<div class="wlrow dim" title="${OUT_OF_SCOPE}" aria-disabled="true"><span class="wlmain"><b>${w.icon} ${esc(w.name)}</b><small>${esc(w.desc)}</small></span><span class="plus" aria-hidden="true">＋</span></div>`).join('')
      : '<p class="caption">Every widget is enabled.</p>'}
    <h4>Dashboard layout</h4>
    <p class="caption">One order is shared by the Inbox, Threadwell view and Today. Use ▲ ▼ above to change it. Home screens show two widgets (one card) and put the rest under "＋ more". Today shows them all, with up to the number of cards below.</p>
    <div class="label" style="font-size:13px">Cards shown on Today</div>
    <div class="chips" role="group" aria-label="Cards shown on Today">${[1, 2, 3, 5].map(n => `<button type="button" class="chip${s.todayMax === n ? ' on' : ''}" data-act="wtmax" data-arg="${n}" aria-pressed="${s.todayMax === n}">${n}</button>`).join('')}</div>
    <div class="switch-row"><div class="label" style="font-size:13px">Compact spacing</div><button class="switch" type="button" role="switch" aria-checked="${s.compact}" aria-label="Compact spacing" data-act="wcompact"><span></span></button></div>
    <h4>Privacy &amp; data</h4>
    <p class="caption">Widgets are optional and quiet. They show saved data first and refresh only when needed, never before your messages appear. Local widgets (Countdowns, Checklists, Threads to Tend, Packages) use only what is stored on this phone.</p>
    ${WIDGETS.filter(w => w.net || w.perm).map(w => `<p class="caption" style="margin:0 0 4px">${w.icon} ${esc(w.name)}: ${esc(reqSummary(w))}</p>`).join('')}`)
    + (s.preset ? presetDialog(s) : '');
}

function presetDialog(s) {
  const p = PRESETS.find(x => x.id === s.preset);
  return `<div class="scrim"><div class="dialog" role="dialog" aria-label="Use the ${p.title} preset?" data-esc="wpresetno"><h5>Use the ${p.title} preset?</h5>
    <p class="caption" style="margin:0">${p.blurb}. Other widgets will be turned off (not deleted). Calendar is only included if it is already allowed.</p>
    <div class="dlg-actions"><button class="txt-btn" type="button" data-act="wpresetno">Cancel</button><button class="txt-btn strong" type="button" id="preapply" data-act="wpresetyes">Apply</button></div></div></div>`;
}

/* ---------- a widget's own page ---------- */
export function widgetPageView(s) {
  const w = byId(s.wid), on = isOn(s, w.id), p = pl(s, w.id), mode = s.wstyle[w.id] || 'chip';
  const enabledOrder = s.order.map(byId).filter(x => isOn(s, x.id)), i = enabledOrder.findIndex(x => x.id === w.id);
  const until = s.hidden[w.id];
  return statusbar() + appbar(`${w.icon} ${esc(w.name)}`, { back: true }) + settingsBody(`
    <p class="caption" style="font-size:13px">${esc(w.desc)}</p>
    <div class="switch-row"><div class="label">Show ${esc(w.name)}</div>
      <button class="switch" type="button" role="switch" id="wsw" aria-checked="${on}" aria-label="Show ${esc(w.name)}" data-act="wtoggle" data-arg="${w.id}"><span></span></button></div>
    ${w.id === 'calendar' && on && s.cal === 'granted' ? '<button class="chip demo" type="button" id="revoke" data-act="demorevoke">Demo: revoke permission in Android settings</button>' : ''}
    ${w.id === 'calendar' && s.cal === 'denied' ? '<p class="caption err">Calendar permission was denied, so the widget can\'t show events. You can allow it in the app\'s settings.</p><button class="txt-btn" type="button" aria-disabled="true" tabindex="-1" title="Opens Android settings">Open app settings</button>' : ''}
    ${on ? `
      <h4>Preview</h4><div class="whost"><div class="wrow">${status(s, w) ? pill(status(s, w).action, 'noop') : pill(esc(chip(s, w)), 'noop')}</div></div>
      <h4>Display style</h4>
      <div class="chips" role="group" aria-label="Display style">${[['chip', 'Chip'], ['card', 'Card']].map(([m, t]) => `<button type="button" class="chip${mode === m ? ' on' : ''}" id="mode-${m}" data-act="wmode" data-arg="${w.id}:${m}" aria-pressed="${mode === m}">${t}</button>`).join('')}</div>
      <h4>Where it appears</h4>
      ${[['trad', 'Traditional inbox'], ['board', 'Threadwell view'], ['today', 'Today']].map(([k, t]) => `<div class="switch-row"><div>${t}</div><button class="switch" type="button" role="switch" id="pl-${k}" aria-checked="${p[k]}" aria-label="${t}" data-act="wplace" data-arg="${w.id}:${k}"><span></span></button></div>`).join('')}
      ${w.threads ? `<div class="switch-row"><div>Chip inside conversations</div><button class="switch" type="button" role="switch" id="wth" aria-checked="${!!s.th[w.id]}" aria-label="Chip inside conversations" data-act="wthread" data-arg="${w.id}"><span></span></button></div>` : ''}
      <div class="switch-row"><div>Order on your dashboard</div><span><button class="txt-btn" type="button" data-act="wmv" data-arg="${w.id}:-1" ${i === 0 ? 'disabled' : ''}>Move up</button><button class="txt-btn" type="button" data-act="wmv" data-arg="${w.id}:1" ${i === enabledOrder.length - 1 ? 'disabled' : ''}>Move down</button></span></div>
      ${until ? `<div class="switch-row"><p class="caption" style="margin:0">Hidden until ${until === 'tomorrow' ? 'tomorrow morning' : 'next week'}</p><button class="txt-btn" type="button" id="shownow" data-act="wshownow" data-arg="${w.id}">Show now</button></div>`
        : `<div class="wactions"><button class="txt-btn" type="button" data-act="whideuntil" data-arg="${w.id}:tomorrow">Hide until tomorrow</button><button class="txt-btn" type="button" data-act="whideuntil" data-arg="${w.id}:week">Hide for a week</button></div>`}
      ${w.id === 'countdown' ? countdownForm(s) : ''}
      <h4>Data</h4>
      <p class="caption" style="margin:0">Source: ${esc(w.source || 'Stored only on this phone')}</p>
      <p class="caption" style="margin:0">Needs: ${esc(reqSummary(w))}</p>
      ${w.refresh ? `<p class="caption" style="margin:0">Refresh: ${w.refresh}</p>` : ''}
      <div class="wactions"><button class="txt-btn" type="button" id="hideall" data-act="whide" data-arg="${w.id}">Hide everywhere</button></div>` : ''}`)
    + (s.dlg === 'perm' ? permDialog() : '') + (s.dlg === 'date' ? dateDialog() : '');
}

function countdownForm(s) {
  const d = s.cdraft;
  return `<h4>Your countdowns</h4>
    ${s.cd.length ? s.cd.map(c => `<div class="kwrow"><span>${c.emoji} ${esc(c.name)} · ${phrase(c.days)}</span><button class="txt-btn" type="button" data-act="cdremove" data-arg="${c.id}" aria-label="Remove ${esc(c.name)}">Remove</button></div>`).join('') : '<p class="caption">Add a trip, birthday, reservation or bill to count down to it.</p>'}
    <div class="label" style="margin-top:12px">Add a countdown</div>
    <div class="field-row"><input class="field" style="max-width:72px" id="cdemoji" type="text" value="${esc(d.emoji)}" maxlength="4" aria-label="Icon" data-act="cdfield" data-arg="emoji" autocomplete="off">
      <input class="field" id="cdname" type="text" value="${esc(d.name)}" maxlength="30" placeholder="Name" aria-label="Name" data-act="cdfield" data-arg="name" data-enter="#cdadd" autocomplete="off"></div>
    <div class="wactions"><button class="txt-btn" type="button" id="cdpick" data-act="cdpick">${d.day ? esc(d.dayLabel) : 'Pick date…'}</button>
      <button class="btn-s" type="button" id="cdadd" data-act="cdadd" ${d.name.trim() && d.day !== '' ? '' : 'disabled'}>Add</button></div>`;
}

/** Stand-in for Android's own permission prompt. Its wording varies by Android version. */
function permDialog() {
  return `<div class="scrim"><div class="dialog" role="dialog" aria-label="Allow Threadwell to access your calendar?" data-esc="permdeny"><span class="syslabel">Android permission prompt</span><h5>Allow Threadwell to access your calendar?</h5>
    <div class="dlg-actions col"><button class="txt-btn strong" type="button" id="permallow" data-act="permallow">Allow</button><button class="txt-btn" type="button" id="permdeny" data-act="permdeny">Don’t allow</button></div></div></div>`;
}
function dateDialog() {
  const opts = [['3', 'In 3 days'], ['10', 'In 10 days'], ['30', 'In a month']];
  return `<div class="scrim"><div class="dialog" role="dialog" aria-label="Pick date" data-esc="cddateno"><span class="syslabel">Android date picker</span><h5>Pick date</h5>
    <div class="dlg-scroll">${opts.map(([d, t]) => `<button class="trow" type="button" id="date-${d}" data-act="cddate" data-arg="${d}:${t}"><span><b>${t}</b></span></button>`).join('')}</div>
    <div class="dlg-actions"><button class="txt-btn" type="button" data-act="cddateno">Cancel</button></div></div></div>`;
}

/** Today: "Your Threadwell today" with the widget strip. */
export function todayView(s) {
  return `<div class="bhead"><div class="btitle"><b>${ico.clock.replace('<svg', '<svg class="inl"')} Your Threadwell today</b></div></div>
    ${widgetsHost(s, 'today') || '<p class="emptybox">No widgets are shown on Today. Turn one on in Settings → Widgets &amp; dashboard.</p>'}`;
}

/* ---------- actions ---------- */
export function widgetActs(on = {}) {
  const ev = (api, n, d) => on.event && on.event(api, n, d);
  const setOn = (api, id, v) => { api.s.en[id] = v; if (v) { delete api.s.hidden[id]; } };
  const rerender = api => api.render();
  return {
    noop: () => {},
    wpreset: (api, id) => { api.s.preset = id; rerender(api); ev(api, 'wpreset', id); },
    wpresetno: api => { api.s.preset = null; rerender(api); },
    wpresetyes: api => {
      const p = PRESETS.find(x => x.id === api.s.preset);
      WIDGETS.forEach(w => setOn(api, w.id, p.ids.includes(w.id) && (w.id !== 'calendar' || api.s.cal === 'granted')));
      api.s.preset = null; rerender(api); ev(api, 'wpresetapplied', p);
    },
    wadd: (api, id) => { if (id !== 'calendar') setOn(api, id, true); api.s.wid = id; api.go('wpage'); ev(api, 'wadd', id); },
    wopenpage: (api, id) => { api.s.wid = id; api.go('wpage'); ev(api, 'wpage', id); },
    wsettings: (api, id) => { api.s.wsheet = null; api.s.wid = id; api.go('wpage'); ev(api, 'wpage', id); },
    wtoggle: (api, id) => {
      if (api.s.en[id]) { setOn(api, id, false); rerender(api); return ev(api, 'woff', id); }
      if (id === 'calendar' && api.s.cal !== 'granted') { api.s.dlg = 'perm'; rerender(api); return ev(api, 'wperm'); }
      setOn(api, id, true); rerender(api); ev(api, 'won', id);
    },
    permallow: api => { api.s.cal = 'granted'; api.s.dlg = null; setOn(api, 'calendar', true); rerender(api); ev(api, 'permallowed'); },
    permdeny: api => { api.s.cal = 'denied'; api.s.dlg = null; rerender(api); ev(api, 'permdenied'); },
    whide: (api, id) => { setOn(api, id, false); api.s.wsheet = null; rerender(api); ev(api, 'woff', id); },
    wmode: (api, a) => { const [id, m] = a.split(':'); api.s.wstyle[id] = m; rerender(api); ev(api, 'wmode', m); },
    wplace: (api, a) => { const [id, k] = a.split(':'); pl(api.s, id)[k] = !pl(api.s, id)[k]; rerender(api); ev(api, 'wplace', k); },
    wthread: (api, id) => { api.s.th[id] = !api.s.th[id]; rerender(api); ev(api, 'wthread', id); },
    wmv: (api, a) => {
      const [id, d] = a.split(':'), en = api.s.order.filter(x => isOn(api.s, x)), i = api.s.order.indexOf(id);
      const step = Number(d) < 0 ? -1 : 1; let j = i + step;
      while (j >= 0 && j < api.s.order.length && !en.includes(api.s.order[j])) j += step;
      if (j < 0 || j >= api.s.order.length) return;
      [api.s.order[i], api.s.order[j]] = [api.s.order[j], api.s.order[i]]; rerender(api); ev(api, 'wmoved', id);
    },
    whideuntil: (api, a) => { const [id, k] = a.split(':'); api.s.hidden[id] = k; api.s.wsheet = null; rerender(api); ev(api, 'whidden', id); },
    wshownow: (api, id) => { delete api.s.hidden[id]; rerender(api); },
    wtmax: (api, n) => { api.s.todayMax = Number(n); rerender(api); },
    wcompact: api => { api.s.compact = !api.s.compact; rerender(api); },
    wopen: (api, id) => { api.s.wsheet = { id }; rerender(api); ev(api, 'wsheet', id); },
    wmore: api => { api.s.wsheet = { more: true }; rerender(api); ev(api, 'wmore'); },
    wclose: api => { api.s.wsheet = null; rerender(api); },
    wpin: (api, id) => { pl(api.s, id).today = !pl(api.s, id).today; api.s.wsheet = null; rerender(api); ev(api, 'wplace', 'today'); },
    // Countdowns
    cdfield: (api, k, el) => { api.s.cdraft[k] = el.value; const b = api.$('#cdadd'); if (b) b.disabled = !(api.s.cdraft.name.trim() && api.s.cdraft.day !== ''); },
    cdpick: api => { api.s.dlg = 'date'; rerender(api); },
    cddateno: api => { api.s.dlg = null; rerender(api); },
    cddate: (api, a) => { const [d, t] = a.split(':'); api.s.cdraft.day = Number(d); api.s.cdraft.dayLabel = t; api.s.dlg = null; rerender(api); },
    cdadd: api => {
      const d = api.s.cdraft; if (!d.name.trim() || d.day === '') return;
      api.s.cd.push({ id: 'c' + (api.s.cd.length + 1) + Date.now() % 1000, emoji: d.emoji || '⏳', name: d.name.trim(), days: d.day });
      api.s.cdraft = { emoji: '🎂', name: '', day: '' }; rerender(api); ev(api, 'cdadded');
    },
    cdremove: (api, id) => { api.s.cd = api.s.cd.filter(c => c.id !== id); rerender(api); },
  };
}

/** Overlays for the current screen (More sheet or a widget's detail sheet). */
export const widgetOverlays = (s, surface) => (s.wsheet ? (s.wsheet.more ? moreSheet(s, surface) : detailSheet(s)) : '');
export const THREAD_NAME = THREADS[0].n;
