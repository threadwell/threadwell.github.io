// Guided-help demonstration: "Let the widgets tuck away while you read". Verified against CollapsibleWidgetHost.kt / WidgetStripLogic:
// in Threadwell view, with at least one widget on, scrolling the messages (about 24dp of finger travel) or waiting 5 seconds moves the
// widget strip into the Widgets button in the thread rail (default mode). Tapping that button opens the widgets again.
// The scroll here is scripted; in the app a finger or key does it.
import { playDemo, scrollList } from './kit.js';

export const dockDemo = playDemo({
  id: 'dock', title: 'Let the widgets tuck away while you read',
  steps: [
    'Three widgets are on, and sit at the top of the conversation.',
    'Scroll the messages (or wait five seconds).',
    'The widgets tuck into the <b>Widgets</b> button in the thread rail.',
    'Tap <b>Widgets</b> to open them again.',
    'Tap <b>Show at top</b> to put them back above the messages.',
  ],
  async play(api, t, act) {
    api.callout('The widget strip is part of <b>Threadwell view</b>. Three widgets are on here; in the app they all start off.');
    await t.sleep(1500);
    api.step(1); await t.sleep(600);
    api.step(2); await scrollList(api, t, '[data-end]', -120);
    act('stripcollapse');                                     // what the playground does once the scroll passes about 24dp
    api.step(3); await t.sleep(1600);
    api.step(4); await t.tap('#wdock'); await t.sleep(1500);
    api.step(5); await t.tap('#showtop'); await t.sleep(1200);
  },
});
