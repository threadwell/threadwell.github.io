// Set up a representative widget: Countdowns. Verified against WidgetsSettingsScreen.kt (widget page: Preview,
// Display style, Where it appears, Chip inside conversations, Order, Hide) and WidgetsProviders.kt (Countdowns:
// "⏳ Add a countdown", the add form with Icon, Name, Pick date…, Add; chip "<emoji> <name> · <days>").
import { widgetState } from '../widgets-model.js';
import { widgetViews, widgetBase } from '../widgets-app.js';

export default {
  id: 'configure-widget',
  title: 'Set up a Countdown widget',
  answer: 'Countdowns keeps an important date in view. Add one, choose chip or card, and decide where it shows. The same page layout works for every widget.',
  steps: [
    'Under <b>Enabled widgets</b>, tap <b>⏳ Countdowns</b>.',
    'Under <b>Your countdowns</b>, type an icon and a name, tap <b>Pick date…</b>, then <b>Add</b>.',
    'Choose a <b>Display style</b>: <b>Chip</b> (a small pill) or <b>Card</b> (more detail).',
    'Under <b>Where it appears</b>, pick the <b>Traditional inbox</b>, <b>Threadwell view</b> and <b>Today</b>. Turn on <b>Chip inside conversations</b> to see it in chats too.',
    'Go back to Messages to see your countdown under the header.',
  ],
  note: '<strong>Chip or card.</strong> A chip is one line. A card shows up to three countdowns. Home screens show at most one card, so extra widgets stay chips. Threadwell widgets are not resizable or draggable; use Display style and ▲ ▼ order instead.',
  next: [{ id: 'widget-places', label: 'Next: Where widgets appear' }, { id: 'enable-widget', label: 'Turn a widget on or off' }],
  start: 'wset',
  history: ['home', 'settings'],
  state: () => widgetState({ en: { countdown: true } }),
  views: widgetViews({ settingsLive: [] }),
  acts: widgetBase({
    event(api, name, d) {
      if (name === 'wpage' && d === 'countdown') { api.step(1); api.callout('Countdowns is already on. The <b>Preview</b> shows exactly what appears on screen. With nothing added it says “⏳ Add a countdown”.'); }
      if (name === 'cdadded') { api.step(2); api.callout('Added. The preview chip now shows the nearest date, like the one on your screens.'); }
      if (name === 'wmode') { api.step(3); api.callout(d === 'card' ? '<b>Card</b> shows up to three countdowns and a Details button. It only appears as a card when the screen has room for one.' : '<b>Chip</b> is the compact one-line pill.'); }
      if (name === 'wplace' || name === 'wthread') { api.step(4); api.callout('Placement is per widget. Turn a surface off and it disappears there, but stays everywhere else.'); }
      if (name === 'whidden') api.callout('Hidden for now. Its settings are kept, and <b>Show now</b> brings it back.');
    },
  }),
  onView(api, name) {
    if (name === 'home' && api.s.cd.length) api.step(5);
  },
  async play(api, t) {
    await t.sleep(600);
    await t.tap('.wlmain'); await t.sleep(1100);
    const nm = api.$('#cdname');
    for (const ch of 'Sam’s birthday') { nm.value += ch; api.s.cdraft.name = nm.value; await t.sleep(55); }
    api.render(); await t.sleep(300);
    await t.tap('#cdpick'); await t.sleep(600);
    await t.tap('#date-3'); await t.sleep(600);
    await t.tap('#cdadd'); await t.sleep(1100);
    await t.tap('#mode-card'); await t.sleep(1000);
    await t.tap('#pl-today'); await t.sleep(700);
    await t.tap('#wth'); await t.sleep(700);
    api.back(); api.back(); api.back(); await t.sleep(1500);
  },
};
