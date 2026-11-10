// Verified against SettingsScreen.kt (Messaging → "Pinned conversations": Rows with previews / Photos, and
// Newest message first / My order), PinnedChats.kt (PinnedPhotoRow: one scrolling row with unread dot, name and time;
// ArrangePinnedDialog: up/down per chat, saved on every tap, Done), PinnedOrder.kt (new pins go to the end) and
// ConversationListScreen.kt ("Arrange pinned chats" in the long-press menu when 2+ chats are pinned; arranging
// switches the order to My order). The order also applies to the Threadwell view rail (MessageBoardScreen.kt).
import { statusbar, appbar, settingsHome, settingsBody, seg, label, caption } from '../phone-ui.js';
import { esc } from '../core.js';
import { inboxHeader, pressRow, actionSheet } from '../news-ui.js';

const BASE = {
  sam: { id: 'sam', n: 'Sam Rivera', i: 'S', s: 'Perfect, see you there', t: '7:02 PM', at: 1902 },
  mom: { id: 'mom', n: 'Mom', i: 'M', s: 'Call me when you land', t: '4:15 PM', at: 1615 },
  crew: { id: 'crew', n: 'Climbing crew', i: 'C', s: 'Maya: Saturday still on?', t: '1:40 PM', at: 1340 },
  jo: { id: 'jo', n: 'Jordan Lee', i: 'J', s: 'Sent the slides', t: '12:05 PM', at: 1205 },
  dentist: { id: 'dentist', n: 'Bright Smile Dental', i: 'B', s: 'Reminder: your cleaning is Thu at 9:30 AM', t: 'Mon', at: 100 },
};
const PINNED = ['mom', 'crew', 'sam'];

const byNewest = (s, ids) => [...ids].sort((a, b) => s.threads[b].at - s.threads[a].at);
const pinnedList = s => (s.sort === 'custom' ? s.order : byNewest(s, s.order)).map(id => s.threads[id]);
const others = s => byNewest(s, Object.keys(s.threads).filter(id => !s.order.includes(id))).map(id => s.threads[id]);

function photoRow(s) {
  return `<div class="pinrow" role="list" aria-label="Pinned conversations">${pinnedList(s).map(t =>
    `<button class="pinbtn${t.unread ? ' unread' : ''}" type="button" role="listitem" data-act="press" data-arg="${t.id}" id="row-${t.id}"
       aria-label="Pinned: ${esc(t.n)}${t.unread ? ', unread' : ''}. Press and hold for actions.">
       <span class="pinava"><span class="avatar" aria-hidden="true">${t.i}</span>${t.unread ? '<span class="pindot" aria-hidden="true"></span>' : ''}</span>
       <span class="pinname">${esc(t.n)}</span><span class="pintime">${t.t}</span></button>`).join('')}</div>`;
}

function home(s) {
  const pins = s.style === 'photos' ? photoRow(s) : pinnedList(s).map(t => pressRow(t, { pinned: true })).join('');
  const menuFor = s.sheet && s.threads[s.sheet];
  return inboxHeader(s.pulse) + `<div class="demo-bar"><span class="demo-tag">Demo</span>
      <button class="chip" type="button" data-act="incoming" id="incoming">A new text from ${esc(s.threads[s.nextFrom].n)}</button></div>
    <div class="list" tabindex="0">${pins}${others(s).map(t => pressRow(t)).join('')}</div>
    ${menuFor ? actionSheet(menuFor.n, [['', 'Flag as spam'], ['', s.order.includes(menuFor.id) ? 'Unpin' : 'Pin to top'],
      s.order.includes(menuFor.id) ? ['arrange', 'Arrange pinned chats'] : null, ['', 'Mute'], ['', 'Archive']].filter(Boolean), { pulse: s.pulse }) : ''}
    ${s.arranging ? arrangeDialog(s) : ''}`;
}

function arrangeDialog(s) {
  const list = s.order;
  return `<div class="scrim"><div class="dialog" role="dialog" aria-label="Arrange pinned chats" data-esc="done">
    <h5>Arrange pinned chats</h5>
    <div class="arrange">${list.map((id, i) => { const t = s.threads[id]; return `<div class="arow">
      <span class="avatar sm" aria-hidden="true">${t.i}</span><span class="aname">${esc(t.n)}</span>
      <button class="icon-btn" type="button" data-act="up" data-arg="${id}" id="up-${id}" aria-label="Move ${esc(t.n)} up" ${i === 0 ? 'disabled' : ''}>▲</button>
      <button class="icon-btn" type="button" data-act="down" data-arg="${id}" id="down-${id}" aria-label="Move ${esc(t.n)} down" ${i === list.length - 1 ? 'disabled' : ''}>▼</button></div>`; }).join('')}</div>
    <div class="dlg-actions"><button class="txt-btn strong" type="button" data-act="done" id="done">Done</button></div></div></div>`;
}

const move = (api, id, d) => {
  const o = api.s.sort === 'custom' ? [...api.s.order] : byNewest(api.s, api.s.order);   // the dialog starts from the order on screen
  const from = o.indexOf(id), to = Math.max(0, Math.min(o.length - 1, from + d));
  o.splice(from, 1); o.splice(to, 0, id);
  api.s.order = o;
  if (api.s.sort !== 'custom') { api.s.sort = 'custom'; api.callout('Arranging switched <b>Order</b> to <b>My order</b>, so your change shows straight away.'); }
  api.render('home');
};

export default {
  id: 'pinned-chats',
  title: 'Keep pinned chats in my own order, or show them as photos',
  answer: 'Pinned chats can stay exactly where you put them instead of jumping around when a new text arrives, and they can show as a row of contact photos at the top of your inbox.',
  steps: [
    'Tap the <b>Settings</b> gear, then open <b>Messaging &amp; notifications</b>.',
    'Under <b>Pinned conversations</b>, pick <b>Photos</b> or <b>Rows with previews</b>, and pick <b>My order</b> so pins stay put. Then go back.',
    'Press and hold a pinned chat and choose <b>Arrange pinned chats</b>. (Here, tap it.)',
    'Use ▲ and ▼ to move chats, then tap <b>Done</b>. Every tap is saved straight away.',
    'Try the <b>Demo</b> button: with My order, a new text no longer moves your pins.',
  ],
  note: '<strong>Your choice, nothing forced.</strong> Both settings start on the old behavior (Rows with previews, Newest message first), so nothing changes until you pick. A new pin goes to the end of your order. The same order is used in the Threadwell view rail, and you can arrange pins from there too.',
  next: [{ id: 'message-categories', label: 'Sort messages into categories' }, { id: 'layout', label: 'Switch between Traditional and Threadwell view' }],
  start: 'home',
  state: () => ({ threads: structuredClone(BASE), order: [...PINNED], style: 'rows', sort: 'recent', sheet: '', arranging: false, nextFrom: 'crew', pulse: '' }),
  views: {
    home,
    settings: s => settingsHome(s, { pulse: s.pulse }),
    messaging: s => statusbar() + appbar('Messaging &amp; notifications', { back: true }) + settingsBody(`
      <h4>Messaging</h4>
      <div class="set-item">Layout<span>Traditional</span></div>
      <div class="set-item">Swipe actions<span>Choose what swiping a thread does</span></div>
      ${label('Pinned conversations')}
      ${caption('Look in the conversation list. Rows keep each pinned chat\'s last message and time. Photos shows them as one scrolling row of contact pictures, like the Threadwell view\'s rail.')}
      ${seg('pstyle', [['rows', 'Rows with previews'], ['photos', 'Photos']], s.style, { hint: s.pulse === 'pstyle', label: 'Pinned conversations look' })}
      ${caption('Order, in both views. My order keeps pins where you put them; arrange them from a pinned chat\'s long-press menu.')}
      ${seg('psort', [['recent', 'Newest message first'], ['custom', 'My order']], s.sort, { hint: s.pulse === 'psort', label: 'Pinned conversations order' })}`),
  },
  acts: {
    gear: api => { api.s.pulse = ''; api.go('settings'); },
    cat: (api, id) => { if (id === 'messaging') { api.s.pulse = ''; api.go('messaging'); api.step(1); } },
    pstyle: (api, v) => { api.s.style = v; api.s.pulse = ''; api.render('messaging'); },
    psort: (api, v) => { api.s.sort = v; api.s.pulse = ''; api.render('messaging'); if (v === 'custom') api.step(2); },
    press: (api, id) => { api.s.sheet = id; api.s.pulse = ''; api.render('home'); },
    closesheet: api => { api.s.sheet = ''; api.render('home'); },
    arrange: api => {
      if (api.s.sort !== 'custom') api.s.order = byNewest(api.s, api.s.order);
      api.s.sheet = ''; api.s.arranging = true; api.render('home'); api.step(3);
    },
    up: (api, id) => move(api, id, -1),
    down: (api, id) => move(api, id, 1),
    done: api => { api.s.arranging = false; api.render('home'); api.step(4); },
    incoming: api => {
      const s = api.s, t = s.threads[s.nextFrom];
      t.at = Math.max(...Object.values(s.threads).map(x => x.at)) + 1;
      t.t = 'Now'; t.unread = true; t.s = s.nextFrom === 'crew' ? 'Maya: Bringing the rope, see you at 9' : s.nextFrom === 'mom' ? 'Landed yet?' : 'Running 5 minutes late';
      s.nextFrom = s.nextFrom === 'crew' ? 'mom' : s.nextFrom === 'mom' ? 'sam' : 'crew';
      api.render('home');
      if (s.sort === 'custom') api.step(5);
      api.callout(s.sort === 'custom'
        ? `<b>${esc(t.n)}</b> got a new text and stayed where you put it.`
        : `<b>${esc(t.n)}</b> jumped to the top of your pins, because Order is <b>Newest message first</b>. Pick <b>My order</b> to stop that.`);
    },
  },
  async play(api, t) {
    await t.tap('#incoming'); await t.sleep(1200);
    api.s.pulse = 'gear'; api.render('home'); await t.sleep(400);
    await t.tap('#gear');
    api.s.pulse = 'messaging'; api.render('settings'); await t.sleep(500);
    await t.tap('#cat-messaging');
    api.s.pulse = 'pstyle'; api.render('messaging'); await t.sleep(600);
    await t.tap('[data-act="pstyle"][data-arg="photos"]'); await t.sleep(400);
    await t.tap('[data-act="psort"][data-arg="custom"]'); await t.sleep(600);
    api.back(); api.back(); await t.sleep(800);
    await t.tap('#row-sam'); await t.sleep(400);
    await t.tap('#mi-arrange'); await t.sleep(500);
    await t.tap('#up-sam'); await t.sleep(500);
    await t.tap('#up-sam'); await t.sleep(500);
    await t.tap('#done'); await t.sleep(800);
    await t.tap('#incoming'); await t.sleep(1200);
  },
};
