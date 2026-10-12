// Guided-help demonstration: "Make a packing checklist". It plays the real Add to Threadwell flow on the playground's own
// renderers and actions, against a separate sample session. Route verified against the app: tools-column bolt -> kind menu
// -> Add to Threadwell dialog (Save to chips, one item per line) -> Save; the checklist is a personal note, so it is found
// under All chats in its Space (Browse Spaces -> Space); items tick in place. A checklist has no title of its own.
import { esc } from '../core.js';
import { saveCapture } from '../play-notes.js';
import { playDemo } from './kit.js';

const ITEMS = 'Passport\nPhone charger\nRain jacket\nTrail snacks';

export const packingDemo = playDemo({
  id: 'packing', title: 'Make a packing checklist',
  steps: [
    'Tap the <b>bolt</b> (Add to Threadwell) in the tools column.',
    'Choose <b>☑ Checklist</b>.',
    'Under <b>Save to</b>, pick a Space. This one uses <b>Trips</b>.',
    'Type one item per line. A checklist has no separate title; its Space names it.',
    'Tap <b>Save</b>.',
    'Open <b>Browse Spaces</b>, then the Space, to find your checklist.',
    'Tap an item to tick it off.',
  ],
  acts: {
    capsave(a) {
      const saved = saveCapture(a.s); if (!saved) return;
      a.render();
      const sp = a.s.spaces.find(x => x.id === saved.space);
      a.callout(`Saved to <b>${sp.emoji} ${esc(sp.name)}</b> as a personal checklist. It lives under <b>All chats</b> in that Space.`);
    },
  },
  async play(api, t) {
    api.callout('Add to Threadwell is part of <b>Threadwell view</b>, which this demonstration uses.');
    await t.sleep(700);
    api.step(1); await t.tap('#rt-capture');
    api.step(2); await t.tap('#ck-CHECKLIST');
    api.step(3); await t.tap('#cs-trips');
    api.step(4); await t.tap('#captext'); await t.type('#captext', ITEMS); await t.sleep(500);
    api.step(5); await t.tap('#capsave'); await t.sleep(900);
    api.step(6); await t.tap('#rt-spaces'); await t.sleep(300); await t.tap('#lib-trips'); await t.sleep(700);
    api.step(7); await t.tap('.nlist .nitem'); await t.sleep(900);
  },
});
