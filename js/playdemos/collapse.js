// Guided-help demonstration: "Collapse the panels and bring them back". Verified against MessageBoardScreen.kt / BoardSettings.kt:
// the tools column collapses behind one ⋯ button (a saved setting; ⋯ only peeks, and Collapse or a tool tap closes the peek).
// The Space list has its own collapse arrow, but only in a window 600dp or wider, so that part temporarily shows the preview at the
// unfolded size. The visitor's own preview size is never changed.
import { playDemo } from './kit.js';

export const collapseDemo = playDemo({
  id: 'collapse', title: 'Collapse the panels and bring them back',
  steps: [
    'Tap the <b>collapse arrow</b> under the tools column. The tools tuck behind one <b>⋯</b> button.',
    'Tap <b>⋯</b> to peek at the tools again.',
    'Tap the collapse arrow again to put them away.',
    'On a wide window the <b>Space list</b> sits beside the conversation. Tap its <b>collapse</b> arrow.',
    'Tap the arrow again to bring the Space list back.',
  ],
  async play(api, t) {
    api.callout('Collapsing panels is part of <b>Threadwell view</b>, which this demonstration uses.');
    await t.sleep(900);
    api.step(1); await t.tap('#collapsetools'); await t.sleep(700);
    api.step(2); await t.tap('#showtools'); await t.sleep(900);
    api.step(3); await t.tap('#collapsetools'); await t.sleep(700);
    api.callout('The Space list only exists in a wide window (600dp and up). For the next steps this preview is shown <b>unfolded</b>. Your own preview size is not changed.');
    await t.sleep(1800);
    api.setDevice('foldOpen'); await t.sleep(900);
    api.step(4); await t.tap('#togglepanel'); await t.sleep(900);
    api.step(5); await t.tap('#togglepanel'); await t.sleep(900);
  },
});
