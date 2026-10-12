// Guided-help demonstration: "Save a message to a new Space". Route verified against the app (MessageActions.kt, CustomChannels.kt
// ChannelPickerDialog): press and hold a message -> ⋯ More message actions -> Add to a Space -> ＋ New Space (Blank Space or a
// template, name up to 24 characters, Save; a Space made from this dialog is ticked for you) -> Save -> Browse Spaces -> the Space.
// Saving into Spaces is part of Threadwell view.
import { playDemo } from './kit.js';

export const spaceDemo = playDemo({
  id: 'space', title: 'Save a message to a new Space',
  steps: [
    'Press and hold a message. (Here, tap the noodle bar message.)',
    'Tap <b>⋯ More message actions</b>, then <b>Add to a Space</b>.',
    'In the dialog, tap <b>＋ New Space</b> and choose <b>Blank Space</b>.',
    'Type a name and tap <b>Save</b>. A Space made here is ticked for you.',
    'Tap <b>Save</b> to put the message in your new Space.',
    'Open <b>Browse Spaces</b>, then your new Space, to find it.',
  ],
  async play(api, t) {
    api.callout('Saving a message to a Space is part of <b>Threadwell view</b>, which this demonstration uses.');
    await t.sleep(700);
    api.step(1); await t.tap('#m-a11');
    api.step(2); await t.tap('#more'); await t.tap('#addspace');
    api.step(3); await t.tap('#newspace'); await t.tap('[data-act="tpl"][data-arg="blank"]');
    api.step(4); await t.tap('#spname'); await t.type('#spname', 'Date nights'); await t.sleep(400); await t.tap('#spsave'); await t.sleep(500);
    api.step(5); await t.tap('#save'); await t.sleep(1200);
    api.step(6); await t.tap('#rt-spaces'); await t.sleep(300); await t.tap('[id^="lib-sp"]'); await t.sleep(1200);
  },
});
