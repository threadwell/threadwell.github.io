// Verified against MessageThreadScreen.kt (⋮ menu: "Go to first message", "Go to a date"; the platform date picker
// allows today or earlier; older history pages in, the list scrolls to the target and flashes it; toast "No messages
// that day. Showing the next one.") and ThreadDateJump.kt (the target is the first message on or after the start of
// the picked day; a day after the last message lands on the newest one). The date list here stands in for Android's
// date picker.
import { ico, statusbar, appbar, iconBtn } from '../phone-ui.js';
import { esc } from '../core.js';
import { toast } from '../news-ui.js';

// One sample conversation, oldest first. `d` is the day index used for jumping.
const DAYS = [
  { d: 0, label: 'Mar 3', msgs: [['Hey! It\'s Sam, new number', false], ['Saving it now 👍', true]] },
  { d: 1, label: 'Apr 18', msgs: [['Are we still doing the lake trip in June?', false], ['Yes, I booked the cabin', true]] },
  { d: 3, label: 'Jun 7', msgs: [['Cabin code is 4417, see you Friday', false], ['Got it. Bringing the kayak', true]] },
  { d: 4, label: 'Aug 22', msgs: [['Happy birthday!! 🎂', false], ['Thank you!!', true]] },
  { d: 6, label: 'Today', msgs: [['Found the place I was telling you about', false], ['Perfect, see you there', true]] },
];
const PICKS = [[0, 'Mar 3'], [1, 'Apr 18'], [2, 'May 9'], [3, 'Jun 7'], [4, 'Aug 22'], [5, 'Oct 30']];

export default {
  id: 'go-to-date',
  title: 'Jump to the first message, or to a date, in a long conversation',
  answer: 'Coming in the next update. Open the ⋮ menu in a conversation and choose Go to first message or Go to a date. Threadwell loads the older messages for you and lands on the right spot.',
  steps: [
    'In a conversation, tap <b>⋮</b> (More options) at the top.',
    'Choose <b>Go to first message</b> to go right back to the start.',
    'Or choose <b>Go to a date</b> and pick a day. You can pick today or any earlier day.',
    'The conversation scrolls to the first message from that day and briefly highlights it.',
  ],
  note: '<strong>No scrolling for minutes.</strong> If nothing was sent on the day you picked, you land on the next day that has messages, and a short note says so. The date list in this tutorial stands in for your phone\'s date picker.',
  start: 'thread',
  state: () => ({ menu: false, picking: false, target: null, toast: '', pulse: 'more' }),
  onRender: (api, name) => {
    if (name !== 'thread' || api.s.target == null) return;
    const el = api.$('#day-' + api.s.target), box = api.$('.thread');
    if (el && box) box.scrollTop = el.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - 8;
  },
  views: {
    thread: s => statusbar() + appbar('Sam Rivera', { right: `<button class="icon-btn${s.pulse === 'more' ? ' pulse' : ''}" type="button" data-act="more" id="more" aria-label="More options" aria-expanded="${s.menu}">${ico.more}</button>` }) + `
      <div class="thread" tabindex="0">${DAYS.map(day => `
        <div class="dayhdr" id="day-${day.d}">${day.label}</div>
        ${day.msgs.map(([text, sent], k) => `<div class="b ${sent ? 'sent' : 'recv'}${s.target === day.d && k === 0 ? ' flash' : ''}">${esc(text)}</div>`).join('')}`).join('')}
      </div>
      <div class="composer">${iconBtn('noop', 'Add attachment', ico.plus)}<span class="field fake" aria-hidden="true">Text message</span></div>
      ${s.menu ? `<div class="menu menu-down" role="menu" aria-label="More options" data-esc="more">
        <button class="mi" type="button" role="menuitem" aria-disabled="true" tabindex="-1">Search</button>
        <button class="mi" type="button" role="menuitem" data-act="first" id="mi-first">Go to first message</button>
        <button class="mi" type="button" role="menuitem" data-act="pickdate" id="mi-date">Go to a date</button>
        <button class="mi" type="button" role="menuitem" aria-disabled="true" tabindex="-1">Change picture</button></div>` : ''}
      ${s.picking ? `<div class="scrim"><div class="dialog" role="dialog" aria-label="Pick a date" data-esc="cancelpick">
        <h5>Go to a date</h5><p class="caption">Stand-in for your phone's date picker.</p>
        <div class="menulist">${PICKS.map(([d, l]) => `<button class="txt-btn left" type="button" data-act="date" data-arg="${d}" id="date-${d}">${l}</button>`).join('')}</div>
        <div class="dlg-actions"><button class="txt-btn" type="button" data-act="cancelpick">Cancel</button></div></div></div>` : ''}
      ${toast(s.toast)}`,
  },
  acts: {
    noop: () => {},
    more: api => { api.s.menu = !api.s.menu; api.s.pulse = ''; api.render('thread'); if (api.s.menu) api.step(1); },
    first: api => { api.s.menu = false; api.s.target = 0; api.s.toast = ''; api.render('thread'); api.step(2); },
    pickdate: api => { api.s.menu = false; api.s.picking = true; api.render('thread'); },
    cancelpick: api => { api.s.picking = false; api.render('thread'); },
    date: (api, d) => {
      const want = Number(d), hit = DAYS.find(x => x.d >= want) || DAYS[DAYS.length - 1];
      api.s.picking = false; api.s.target = hit.d;
      api.s.toast = hit.d !== want ? 'No messages that day. Showing the next one.' : '';
      api.render('thread'); api.step(4);
    },
  },
  async play(api, t) {
    await t.sleep(400);
    await t.tap('#more'); await t.sleep(500);
    await t.tap('#mi-first'); await t.sleep(1400);
    await t.tap('#more'); await t.sleep(500);
    await t.tap('#mi-date'); await t.sleep(600);
    await t.tap('#date-2'); await t.sleep(1600);
  },
};
