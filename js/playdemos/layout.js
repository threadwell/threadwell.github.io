// Guided-help demonstration: "Switch layouts and find your checklist". Route verified against the app (SettingsScreen.kt,
// MessageBoardScreen.kt): Settings -> Messaging & notifications -> Layout (Traditional | Threadwell view). Spaces and checklists
// belong to Threadwell view, so the demonstration goes to Traditional and back, then opens the checklist under Browse Spaces.
// It starts with a sample checklist already saved in Trips, because the challenge asks the visitor to find one.
import { createNote } from '../play-notes.js';
import { toChecklistBody } from '../notes.js';
import { playDemo } from './kit.js';

export const layoutDemo = playDemo({
  id: 'layout', title: 'Switch layouts and find your checklist',
  steps: [
    'Open <b>Settings</b>, then <b>Messaging &amp; notifications</b>.',
    'Under <b>Layout</b>, choose <b>Traditional</b>. Your messages are all still here.',
    'Open Settings and <b>Messaging &amp; notifications</b> again.',
    'Choose <b>Threadwell view</b>, then go back.',
    'Open <b>Browse Spaces</b>, then the Space that holds your checklist.',
  ],
  prepare(s) { createNote(s, 'trips', toChecklistBody('Passport\nPhone charger\nRain jacket\nTrail snacks')); },
  async play(api, t) {
    api.callout('This starts in <b>Threadwell view</b>, with a sample checklist already saved in Trips.');
    await t.sleep(900);
    api.step(1); await t.tap('#rt-settings'); await t.tap('#cat-messaging'); await t.sleep(400);
    api.step(2); await t.tap('[data-act="layout"][data-arg="traditional"]'); await t.sleep(900);
    api.back(); api.back(); await t.sleep(1200);
    api.callout('Traditional layout. Spaces and the widget strip are part of Threadwell view, and your checklist is safe.');
    api.step(3); await t.tap('#gear'); await t.tap('#cat-messaging'); await t.sleep(400);
    api.step(4); await t.tap('[data-act="layout"][data-arg="board"]'); await t.sleep(800);
    api.back(); api.back(); await t.sleep(900);
    api.callout('');
    api.step(5); await t.tap('#rt-spaces'); await t.sleep(300); await t.tap('#lib-trips'); await t.sleep(1300);
  },
});
