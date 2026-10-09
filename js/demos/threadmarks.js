// Save a message to a Space, then find it again. Verified against MessageActions.kt / MessageBubble.kt
// ("Add to a Space"), CustomChannels.kt (dialog; a Space created from it is ticked), BoardChannels.kt
// (saved item actions), MessageBoardScreen.kt (Browse Spaces, My Spaces, channel bar, More sheet).
// After Save the app shows a brief "Saved to <Space>" message (SaveNotice.kt) with an Open Space button when exactly one
// Space was added; the callout below mirrors it and says where the item went.
import { boardState, boardView, boardActs, chatScreen } from '../board-app.js';

const where = sp => `${sp.emoji} ${sp.name}`;

export default {
  id: 'threadmarks',
  devices: true,
  title: 'Save a message to a Space',
  answer: 'Press and hold a message, choose Add to a Space, and Threadwell keeps a threadmark of it in a Space of your own. The text stays in its thread, and you can find it again from Browse Spaces.',
  steps: [
    'Press and hold a message. (Here, tap the noodle bar message.)',
    'In the action bar, tap <b>⋯ More message actions</b> and choose <b>Add to a Space</b>.',
    'Tick a Space, then tap <b>Save</b>. Need a new one? <b>＋ New Space</b> is in the same dialog.',
    'Later, tap <b>Browse Spaces</b> (the stacked cards in the tools column) and open the Space to find it.',
    'On the saved item, tap <b>Show in chat</b> to jump back to the original message.',
  ],
  note: '<strong>Add to a Space is part of Threadwell view.</strong> A threadmark is a link to the original text, so deleting a threadmark only removes it from the Space. After you tap Save, a short message at the bottom names where it went (for example “Saved to Trips”), with an <b>Open Space</b> button when you saved to a single Space. This tutorial shows the same information in its notes.',
  next: [{ id: 'find-saved', label: 'Next: Find my saved messages' }, { id: 'create-space', label: 'Create a Space' }],
  start: 'board',
  state: () => boardState(),
  views: {
    board: s => boardView(s, { live: ['spaces', 'spaces-in-chat'], hold: true }),
    chat: s => chatScreen(s),
  },
  acts: boardActs({
    event(api, name, d) {
      if (name === 'hold' && api.s.bar) api.step(1);
      if (name === 'moreactions' && api.s.menu) api.step(2);
      if (name === 'saved') {
        if (!d.length) return api.callout('Nothing was saved because no Space was ticked. Tick one and tap Save.');
        const sp = d[0], inline = api.s.spaces.slice(0, 3).some(x => x.id === sp.id);
        api.step(3);
        api.callout(`Saved to <b>${where(sp)}</b>. In the app, a brief message at the bottom says <b>Saved to ${sp.name}</b> with an <b>Open Space</b> button. ${inline ? 'Its chip is highlighted in the channel bar.' : 'It is behind <b>More</b> in the channel bar (highlighted), and in <b>Browse Spaces</b>.'} To find it later: <b>Browse Spaces → ${where(sp)}</b>.`);
      }
      if (name === 'library') api.callout('<b>My Spaces</b> lists every Space with what you saved from every chat. Open one to see it.');
      if (name === 'libspace') { api.step(4); api.callout('This view shows the Space across <b>all conversations</b>, so each item names the chat it came from. Tap <b>Show in chat</b> (swipe the action row sideways if it is hidden) to go back to the message.'); }
      if (name === 'showchat') { api.step(5); api.callout('You are back in the original conversation, at the saved message. Press Back to return to the Space.'); }
      if (name === 'pickspace' || name === 'channel') api.callout('Opened from this conversation, a Space shows only what you saved <b>from this chat</b>. Tap <b>All chats</b> to see the whole Space.');
    },
  }),
  async play(api, t) {
    await t.sleep(500);
    await t.tap('#msg1'); await t.sleep(300);
    await t.tap('#more'); await t.sleep(300);
    await t.tap('#addspace'); await t.sleep(500);
    api.$('#chk-dinner').scrollIntoView({ block: 'center' });
    api.$('#chk-dinner').checked = true; api.s.tick = ['dinner']; await t.sleep(600);
    await t.tap('#save'); await t.sleep(1800);
    api.s.pulse = 'spaces'; api.render(); await t.sleep(500);
    await t.tap('.rtool[aria-label="Browse Spaces"]'); await t.sleep(900);
    await t.tap('#lib-dinner'); await t.sleep(1500);
    await t.tap('#show-noodle-dinner'); await t.sleep(1300);
  },
};
