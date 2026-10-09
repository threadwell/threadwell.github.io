// Find the dashboard and widgets. Verified against SettingsCategories.kt ("Widgets & dashboard" card),
// WidgetsSettingsScreen.kt (Presets, Enabled widgets, Add widgets, Dashboard layout), WidgetCoordinator.kt (presets)
// and Widgets.kt (WidgetHost: home screens show two widgets, the rest under "＋ N more").
// Threadwell has no Android home-screen widgets: these are inside the app only.
import { widgetState } from '../widgets-model.js';
import { widgetViews, widgetBase } from '../widgets-app.js';

export default {
  id: 'widgets',
  title: 'Find the dashboard and widgets',
  answer: 'Widgets are small cards and chips, such as weather, calendar or countdowns, that sit under your Messages header. They are all off until you turn them on in Settings → Widgets & dashboard.',
  steps: [
    'Tap the <b>Settings</b> gear at the top of Messages.',
    'Open <b>Widgets &amp; dashboard</b>.',
    'Look around: <b>Presets</b>, <b>Enabled widgets</b> and <b>Add widgets</b>.',
    'Try a preset, such as <b>Weekend</b>, and tap <b>Apply</b>.',
    'Go back to Messages. Your widgets sit under the header, and extras wait behind <b>＋ N more</b>.',
  ],
  note: '<strong>These are in-app widgets.</strong> In this version Threadwell does not have Android home-screen widgets, so you will not find it in your launcher’s widget picker. Everything here lives inside the app, and each widget is optional.',
  next: [{ id: 'enable-widget', label: 'Next: Turn a widget on or off' }, { id: 'widget-places', label: 'Where widgets appear' }],
  start: 'home',
  state: () => widgetState(),
  views: widgetViews(),
  acts: widgetBase({
    event(api, name, d) {
      if (name === 'gear') api.step(1);
      if (name === 'wsetopen') { api.step(2); api.callout('Everything is off until you add it. <b>Presets</b> turn a whole group on in one tap, and <b>Add widgets</b> lists each one with what it does.'); }
      if (name === 'wpreset') { api.step(3); api.callout(`Presets switch widgets on and the others off (nothing is deleted). Calendar only joins if you have already allowed it.`); }
      if (name === 'wpresetapplied') { api.step(4); api.callout(`<b>${d.title}</b> turned on ${d.ids.map(i => ({ weather: 'Weather', sports: 'Sports', countdown: 'Countdowns', memory: 'Memory Lane' }[i] || i)).join(', ')}. Some need a little setup, which is why they show a prompt such as “🏆 Choose your teams”, and Weather shows data once you give it a location.`); }
    },
  }),
  onView(api, name) {
    if (name === 'home' && Object.values(api.s.en).some(Boolean)) {
      api.step(5);
      api.callout('Home screens show <b>two widgets</b> (and at most one card). The rest are behind <b>＋ more</b>. Today shows them all.');
    }
  },
  async play(api, t) {
    api.s.pulse = 'gear'; api.render('home'); await t.sleep(500);
    await t.tap('#gear');
    api.s.pulse = 'widgets'; api.render('settings'); await t.sleep(500);
    await t.tap('#cat-widgets'); await t.sleep(900);
    await t.tap('#pre-weekend'); await t.sleep(900);
    await t.tap('#preapply'); await t.sleep(1200);
    api.back(); api.back(); await t.sleep(1500);
  },
};
