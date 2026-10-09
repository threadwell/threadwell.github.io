// Turn a widget on or off, including one that needs a permission. Verified against WidgetsSettingsScreen.kt
// (Add widgets, "Show <name>" switch, Hide everywhere), WidgetsCalendar.kt (CalendarEnableSwitch: Android asks for
// Calendar (read only); the denied message) and Widgets.kt (a widget that needs permission shows a prompt pill).
import { widgetState } from '../widgets-model.js';
import { widgetViews, widgetBase } from '../widgets-app.js';

export default {
  id: 'enable-widget',
  title: 'Turn a widget on or off',
  answer: 'Tap a widget under Add widgets and it turns on. Switch it off on its own page, or use Hide everywhere. A widget that reads your calendar asks Android for permission first.',
  steps: [
    'Under <b>Add widgets</b>, tap a widget, such as <b>⏳ Countdowns</b>. It turns on and opens its page.',
    'On the page, <b>Show Countdowns</b> is on. Switch it off, or tap <b>Hide everywhere</b>, to turn it off.',
    'Try <b>📅 Calendar</b>. Switching it on makes Android ask for Calendar (read only) permission.',
    'Tap <b>Allow</b> to turn it on, or <b>Don’t allow</b> to see what happens when permission is refused.',
    'If permission is later taken away, the widget shows <b>📅 Connect Calendar</b> until you reconnect it.',
  ],
  note: '<strong>Calendar access is read only.</strong> Threadwell reads your events on the phone to show them and never uploads them. The Android prompt in the preview is a stand-in, and its wording varies by Android version.',
  next: [{ id: 'configure-widget', label: 'Next: Set up a Countdown' }, { id: 'widget-places', label: 'Where widgets appear' }],
  start: 'wset',
  history: ['home', 'settings'],
  state: () => widgetState(),
  views: widgetViews({ settingsLive: ['countdown', 'calendar'] }),
  acts: widgetBase({
    event(api, name, d) {
      if (name === 'wadd' && d === 'countdown') { api.step(1); api.callout('<b>Countdowns</b> is on. Nothing needed to be allowed, since it only uses data stored on this phone.'); }
      if (name === 'woff') { api.step(2); api.callout('Turned off. Its settings are kept, so turning it back on restores them.'); }
      if (name === 'wpage' || (name === 'wadd' && d === 'calendar')) { if (name === 'wadd') api.callout('<b>Calendar</b> needs permission, so it stays off until you switch it on.'); }
      if (name === 'wperm') { api.step(3); api.callout('Android asks before the widget can read your calendar. Nothing is read until you allow it.'); }
      if (name === 'permallowed') { api.step(4); api.callout('Allowed. The Calendar widget is on, and it only reads your calendars; it never changes them.'); }
      if (name === 'permdenied') { api.step(4); api.callout('Refused. The widget stays off and explains why. You can allow it later in the app’s Android settings.'); }
      if (name === 'revoked') api.callout('Permission was removed in Android settings. Go back to Messages: the widget now shows <b>📅 Connect Calendar</b> instead of events.');
    },
  }),
  onView(api, name) {
    if (name === 'home' && api.s.en.calendar && api.s.cal !== 'granted') api.step(5);
  },
  async play(api, t) {
    await t.sleep(600);
    await t.tap('#add-countdown'); await t.sleep(1200);
    await t.tap('#wsw'); await t.sleep(1000);
    api.back(); await t.sleep(600);
    await t.tap('#add-calendar'); await t.sleep(900);
    await t.tap('#wsw'); await t.sleep(1200);
    await t.tap('#permallow'); await t.sleep(1200);
    await t.tap('#revoke'); await t.sleep(900);
    api.back(); api.back(); api.back(); await t.sleep(1200);
  },
};
