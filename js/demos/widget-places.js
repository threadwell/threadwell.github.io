// Where enabled widgets appear. Verified against Widgets.kt (WidgetHost: Inbox and Threadwell view show two
// widgets and at most one card, the rest under "＋ N more"; Today shows them all; conversations show opted-in chips),
// CollapsibleWidgetHost.kt (default: widgets dock into a Widgets button in the thread rail; panel has Show at top and
// Close), BoardToday.kt ("Your Threadwell today") and WidgetsSettingsScreen.kt (one shared order, ▲ ▼).
import { boardState, boardView, boardActs, chatScreen } from '../board-app.js';
import { widgetState, widgetsHost, widgetOverlays } from '../widgets-model.js';
import { inbox } from '../inbox.js';
import { widgetViews, widgetBase } from '../widgets-app.js';

const SURF = [['inbox', 'Inbox'], ['board', 'Threadwell view'], ['today', 'Today'], ['thread', 'In a conversation']];
const surfBar = s => `<div class="surfbar" role="group" aria-label="Show widgets on"><span class="demo-tag">Demo: show</span>${SURF.map(([k, t]) => `<button type="button" class="chip${s.surf === k ? ' on' : ''}" data-act="surf" data-arg="${k}" aria-pressed="${s.surf === k}">${t}</button>`).join('')}${s.surf === 'board' && !s.docked ? '<button type="button" class="chip demo" id="wscroll" data-act="wscroll">Demo: scroll down</button>' : ''}</div>`;

export default {
  id: 'widget-places',
  title: 'Where widgets appear',
  devices: true,
  answer: 'Enabled widgets show in your Inbox, in Threadwell view and on Today, and optionally as a chip inside a conversation. You choose per widget, and one order applies everywhere.',
  steps: [
    'In the <b>Inbox</b> and <b>Threadwell view</b>, two widgets show under the top. The rest wait behind <b>＋ N more</b>. Tap it.',
    'In Threadwell view, widgets tuck into the <b>Widgets</b> button in the thread rail once you start reading. Tap it to open them.',
    '<b>Today</b> (in the tools column) shows all your widgets, as cards up to the number you chose.',
    'Inside a conversation, a widget with something to say can show as a chip, if you turned on <b>Chip inside conversations</b>.',
    'To change the order, open <b>Settings → Widgets &amp; dashboard</b> and use <b>▲ ▼</b>. The same order applies on every screen.',
  ],
  note: '<strong>The “Demo: show” buttons are for this tutorial</strong>, to switch between screens quickly. In the app you reach each one the normal way. Threadwell widgets live inside the app, and in this version there are no Android home-screen widgets.',
  next: [{ id: 'widgets', label: 'Find the dashboard and widgets' }, { id: 'configure-widget', label: 'Set up a Countdown' }],
  start: 'home',
  history: [],
  state: () => ({
    ...boardState(), ...widgetState({
      en: { weather: true, calendar: true, countdown: true, memory: true }, cal: 'granted', th: { countdown: true }, wxReady: true,
      cd: [{ id: 'c1', emoji: '🎂', name: 'Sam’s birthday', days: 3 }], wstyle: { countdown: 'card' },
    }), surf: 'inbox', docked: false, dockOpen: false,
  }),
  views: {
    ...widgetViews(),
    home: s => {
      const bar = surfBar(s);
      if (s.surf === 'inbox') return bar + inbox(s, { pulse: s.pulse, widgets: widgetsHost(s, 'trad') }) + widgetOverlays(s, 'trad');
      return bar + boardView(s, { live: ['today', 'settings', 'thread', 'dockless'] });
    },
    chat: s => chatScreen(s),
  },
  acts: {
    ...boardActs(),
    ...widgetBase({
      event(api, name, d) {
        if (name === 'wmore') { api.step(1); api.callout('<b>＋ 2 more</b> opens a “Widgets” sheet listing everything that did not fit, each with its current line.'); }
        if (name === 'wmoved') { api.step(5); api.callout('Order changed. The new order applies to the Inbox, Threadwell view and Today alike.'); }
      },
    }),
    surf: (api, k) => {
      api.s.surf = k; api.s.docked = false; api.s.dockOpen = false; api.s.wsheet = null;
      api.s.mode = k === 'today' ? 'today' : 'chat'; api.s.channel = 'CHAT'; api.render();
      if (k === 'board') api.callout('In <b>Threadwell view</b> widgets sit above the conversation. By default they tuck away once you scroll or after a few seconds. Tap <b>Demo: scroll down</b> to see that.');
      if (k === 'today') { api.step(3); api.callout('<b>Your Threadwell today</b> shows every enabled widget (Weather has its own spot). Cards are limited to the number set under <b>Cards shown on Today</b>.'); }
      if (k === 'thread') { api.step(4); api.callout('A widget only appears inside a conversation when you turn on <b>Chip inside conversations</b> for it, and only when it has something to show.'); }
      if (k === 'inbox') api.callout('');
    },
    wscroll: api => { api.s.docked = true; api.s.dockOpen = false; api.render(); api.callout('Widgets docked. In the real app this happens when you scroll, or after about five seconds. Look for the <b>Widgets</b> button in the thread rail.'); },
    wdock: api => { api.s.dockOpen = true; api.render(); api.step(2); },
    wdockclose: api => { api.s.dockOpen = false; api.render(); },
    wshowtop: api => { api.s.dockOpen = false; api.s.docked = false; api.render(); },
    today: api => { api.s.surf = 'today'; api.s.mode = 'today'; api.render(); api.step(3); },
  },
  async play(api, t) {
    await t.sleep(600);
    await t.tap('#wmorebtn'); await t.sleep(1300);
    await t.tap('[data-act="wclose"]'); await t.sleep(400);
    await t.tap('[data-act="surf"][data-arg="board"]'); await t.sleep(1000);
    await t.tap('#wscroll'); await t.sleep(900);
    await t.tap('#wdock'); await t.sleep(1300);
    await t.tap('[data-act="wdockclose"]'); await t.sleep(400);
    await t.tap('[data-act="surf"][data-arg="today"]'); await t.sleep(1400);
    await t.tap('[data-act="surf"][data-arg="thread"]'); await t.sleep(1400);
    await t.tap('.rtool[aria-label="Settings"]'); await t.sleep(700);
    await t.tap('#cat-widgets'); await t.sleep(900);
    await t.tap('[data-act="wmv"][data-arg="countdown:-1"]'); await t.sleep(1000);
  },
};
