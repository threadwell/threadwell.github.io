// Verified against MessageCategories.kt (five categories and the sorting rules), CategoryTabs.kt (All + one chip per
// category with the unread count, "Move “name” to", "Sort automatically"), ConversationListScreen.kt (tabs above the
// list, "Move to category" in the long-press menu only while categories are on) and SettingsScreen.kt
// (Messaging → "Message categories" switch, off by default). Traditional inbox only in this version.
import { statusbar, appbar, settingsHome, settingsBody, toggle, caption } from '../phone-ui.js';
import { esc } from '../core.js';
import { inboxHeader, pressRow, actionSheet } from '../news-ui.js';

const CATS = ['Personal', 'Money', 'Codes', 'Updates', 'Promotions'];

// Sample senders. `auto` is what the app's rules give: saved contacts and groups are Personal; a short code or named
// sender goes to Codes, Money or Promotions by its latest message, else Updates.
const THREADS = [
  { id: 'sam', n: 'Sam Rivera', i: 'S', s: 'Perfect, see you there', t: '7:02 PM', unread: true, auto: 'Personal' },
  { id: 'code', n: '48210', i: '#', s: 'Your sign-in code is 583112. It expires in 10 minutes.', t: '6:51 PM', unread: true, auto: 'Codes' },
  { id: 'bank', n: '72345', i: '#', s: 'Harbor Credit: card ending 4417 was charged $42.10', t: '6:12 PM', auto: 'Money' },
  { id: 'crew', n: 'Climbing crew', i: 'C', s: 'Maya: Saturday still on?', t: '5:40 PM', auto: 'Personal' },
  { id: 'parcel', n: 'ParcelPath', i: 'P', s: 'Your package is out for delivery today', t: '2:15 PM', unread: true, auto: 'Updates' },
  { id: 'shop', n: '66778', i: '#', s: 'Fall sale: 30% off everything this weekend. Reply STOP to end', t: 'Tue', auto: 'Promotions' },
  { id: 'dentist', n: 'Bright Smile Dental', i: 'B', s: 'Reminder: your cleaning is Thu at 9:30 AM', t: 'Mon', auto: 'Updates' },
];

const catOf = (s, t) => s.moved[t.id] || t.auto;

function home(s) {
  const unread = Object.fromEntries(CATS.map(c => [c, THREADS.filter(t => t.unread && catOf(s, t) === c).length]));
  const shown = s.on && s.tab ? THREADS.filter(t => catOf(s, t) === s.tab) : THREADS;
  const tabs = s.on ? `<div class="chips nowrap catbar${s.pulse === 'tabs' ? ' hint' : ''}" role="group" aria-label="Message categories">
      <button class="chip${!s.tab ? ' on' : ''}" type="button" data-act="tab" data-arg="" aria-pressed="${!s.tab}">All</button>
      ${CATS.map(c => `<button class="chip${s.tab === c ? ' on' : ''}" type="button" data-act="tab" data-arg="${c}" id="tab-${c}" aria-pressed="${s.tab === c}">${c}${unread[c] ? ` (${unread[c]})` : ''}</button>`).join('')}
    </div>` : '';
  const menuFor = THREADS.find(t => t.id === s.sheet);
  return inboxHeader(s.pulse) + tabs + `<div class="list" tabindex="0">
      ${shown.length ? shown.map(t => pressRow(t, { ring: s.pulse === 'row-' + t.id })).join('')
        : `<p class="caption pad">No conversations in ${esc(s.tab)}. Long-press a conversation to move it here.</p>`}
    </div>
    ${menuFor ? actionSheet(menuFor.n, [['', 'Flag as spam'], ['', 'Pin to top'], s.on ? ['moveto', 'Move to category'] : null, ['', 'Mute'], ['', 'Archive']].filter(Boolean), { pulse: s.pulse }) : ''}
    ${s.moving ? moveDialog(s) : ''}`;
}

function moveDialog(s) {
  const t = THREADS.find(x => x.id === s.moving);
  const cur = catOf(s, t);
  return `<div class="scrim"><div class="dialog" role="dialog" aria-label="Move ${esc(t.n)} to" data-esc="cancelmove">
    <h5>Move “${esc(t.n)}” to</h5>
    <div class="menulist">${CATS.map(c => `<button class="txt-btn left${s.pulse === 'pick-' + c ? ' tapping-ring' : ''}" type="button" data-act="pick" data-arg="${c}" id="pick-${c}" aria-pressed="${c === cur}">${c === cur ? '● ' : '○ '}${c}</button>`).join('')}
      ${s.moved[t.id] ? '<button class="txt-btn left" type="button" data-act="pick" data-arg="" id="pick-auto">Sort automatically</button>' : ''}</div>
    <div class="dlg-actions"><button class="txt-btn" type="button" data-act="cancelmove">Cancel</button></div></div></div>`;
}

export default {
  id: 'message-categories',
  title: 'Sort messages into Personal, Money, Codes, Updates and Promotions',
  answer: 'Coming in the next update. Turn on Message categories and tabs appear above your conversations. Codes, bank alerts, deliveries and sales sort themselves, and people you know stay in Personal.',
  steps: [
    'Tap the <b>Settings</b> gear, then open <b>Messaging &amp; notifications</b>.',
    'Turn on <b>Message categories</b> and go back.',
    'Tap a tab such as <b>Codes</b> or <b>Money</b>. The number on a tab counts its unread conversations; <b>All</b> shows everything.',
    'Something in the wrong tab? Press and hold the conversation, choose <b>Move to category</b> and pick one. (Here, tap the row.)',
  ],
  note: '<strong>Sorting happens on your phone.</strong> It uses who sent the message and what the latest one says. Nothing is uploaded and no AI is involved. Saved contacts and group chats always stay in Personal. A conversation you moved stays put until you choose <b>Sort automatically</b>. In this version the tabs are in the Traditional inbox.',
  next: [{ id: 'pinned-chats', label: 'Next: Keep pinned chats in your own order' }],
  start: 'home',
  state: () => ({ on: false, tab: '', moved: {}, sheet: '', moving: '', pulse: '' }),
  onRender: (api, name) => {
    const bar = name === 'home' && api.$('.catbar'), on = bar && api.$('.catbar .chip.on');
    if (on) bar.scrollLeft = on.offsetLeft - bar.offsetLeft - 12;
  },
  views: {
    home,
    settings: s => settingsHome(s, { pulse: s.pulse }),
    messaging: s => statusbar() + appbar('Messaging &amp; notifications', { back: true }) + settingsBody(`
      <h4>Messaging</h4>
      <div class="set-item">Layout<span>Traditional</span></div>
      <div class="set-item">Swipe actions<span>Choose what swiping a thread does</span></div>
      ${toggle('cats', 'Message categories', s.on, 'Adds Personal, Money, Codes, Updates and Promotions tabs above your conversations. Sorting happens on this phone from who sent the message and what it says; nothing is uploaded. Long-press a conversation to move it to another category.', { hint: s.pulse === 'cats' })}
      ${caption('Off by default, so nothing changes until you turn it on.')}`),
  },
  acts: {
    gear: api => { api.s.pulse = ''; api.go('settings'); },
    cat: (api, id) => { if (id === 'messaging') { api.s.pulse = ''; api.go('messaging'); api.step(1); } },
    cats: api => { api.s.on = !api.s.on; api.s.tab = ''; api.render('messaging'); if (api.s.on) api.step(2); },
    tab: (api, c) => { api.s.tab = c; api.s.pulse = ''; api.render('home'); if (c && api.s.on) api.step(3); },
    press: (api, id) => { api.s.sheet = id; api.s.pulse = ''; api.render('home'); },
    closesheet: api => { api.s.sheet = ''; api.render('home'); },
    moveto: api => { api.s.moving = api.s.sheet; api.s.sheet = ''; api.render('home'); },
    cancelmove: api => { api.s.moving = ''; api.render('home'); },
    pick: (api, c) => {
      const t = THREADS.find(x => x.id === api.s.moving);
      if (c) api.s.moved[t.id] = c; else delete api.s.moved[t.id];
      api.s.moving = ''; api.s.pulse = ''; api.render('home'); api.step(4);
      api.callout(c ? `<b>${esc(t.n)}</b> now lives in <b>${c}</b>, and stays there until you pick <b>Sort automatically</b>.` : `<b>${esc(t.n)}</b> is sorted automatically again (<b>${t.auto}</b>).`);
    },
  },
  async play(api, t) {
    api.s.pulse = 'gear'; api.render('home'); await t.sleep(500);
    await t.tap('#gear');
    api.s.pulse = 'messaging'; api.render('settings'); await t.sleep(500);
    await t.tap('#cat-messaging');
    api.s.pulse = 'cats'; api.render('messaging'); await t.sleep(600);
    await t.tap('[data-act="cats"]');
    await t.sleep(700);
    api.back(); api.back(); await t.sleep(700);
    await t.tap('#tab-Codes'); await t.sleep(900);
    await t.tap('#tab-Money'); await t.sleep(900);
    await t.tap('#tab-Updates'); await t.sleep(700);
    await t.tap('#row-dentist'); await t.sleep(400);
    await t.tap('#mi-moveto'); await t.sleep(400);
    await t.tap('#pick-Personal'); await t.sleep(900);
  },
};
