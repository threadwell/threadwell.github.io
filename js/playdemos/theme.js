// Guided-help demonstration: "Try your favorite theme". Route verified against the app (AppearanceScreen.kt, ThemeGalleryScreen.kt,
// ThemePreviewScreen.kt): Settings -> Appearance -> Browse themes -> tap a theme to preview it (nothing changes yet) -> Apply theme.
// The phone shows the website's simplified stand-ins for the scenes.
import { playDemo } from './kit.js';

export const themeDemo = playDemo({
  id: 'theme', title: 'Try your favorite theme',
  steps: [
    'Tap the <b>Settings</b> gear in the tools column.',
    'Open <b>Appearance</b>.',
    'Tap <b>Browse themes</b>.',
    'Tap a theme to preview it. Nothing changes yet. You can step through others with the arrows.',
    'Tap <b>Apply theme</b> when you like one.',
    'Go back to your conversation to see it.',
  ],
  async play(api, t) {
    await t.sleep(700);
    api.step(1); await t.tap('#rt-settings');
    api.step(2); await t.tap('#cat-appearance');
    api.step(3); await t.tap('#browse'); await t.sleep(500);
    api.step(4); await t.tap('[data-act="tile"][data-arg="dusk"]'); await t.sleep(1000);
    await t.tap('[data-act="nexttheme"]'); await t.sleep(900);
    await t.tap('[data-act="prevtheme"]'); await t.sleep(900);
    api.callout('Previewing a theme changes nothing until <b>Apply theme</b>.');
    api.step(5); await t.tap('#apply'); await t.sleep(1000);
    api.callout('');
    api.step(6);
    for (let i = 0; i < 4; i++) { api.back(); await t.sleep(500); }
    await t.sleep(600);
  },
});
