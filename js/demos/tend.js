// Come back to something later. A saved message carries an inline "Come back to this" action (BoardChannels.kt
// TagActions); the time chips and button are in BoardCapture.kt; reminders gather in Threads to Tend, reached
// from My Spaces (MyChannelsLibrary). Complete on a saved item leaves it threadmarked in its Space.
import { boardState, boardView, boardActs, chatScreen } from '../board-app.js';

export default {
  id: 'threads-to-tend',
  devices: true,
  title: 'Come back to something later',
  answer: 'Add a reminder to any saved message. Threads to Tend gathers everything you wanted to revisit, across every Space, and nothing in it is ever sent as a text.',
  steps: [
    'Open <b>Browse Spaces</b>, then the Space that holds your saved message.',
    'On the saved message, tap <b>Come back to this</b>.',
    'Pick a time, such as <b>Tomorrow morning</b>, then tap <b>Come back to this</b>.',
    'Back in <b>My Spaces</b>, open <b>Threads to Tend</b>. Tap <b>Complete</b> when you are done. The message stays threadmarked in its Space.',
  ],
  note: '<strong>Reminders stay on your phone.</strong> Threadwell notifies you at the time you chose, with Complete and Snooze in the notification. Reminders are notifications, so notifications need to be allowed in Android.',
  next: [{ id: 'find-saved', label: 'Find my saved messages' }, { id: 'create-space', label: 'Create a Space' }],
  start: 'board',
  state: () => boardState({ withDinnerSave: true }, { mode: 'library', flash: 'dinner' }),
  views: {
    board: s => boardView(s, { live: ['spaces', 'tend', 'comeback'] }),
    chat: s => chatScreen(s),
  },
  acts: boardActs({
    event(api, name) {
      if (name === 'libspace') api.step(1);
      if (name === 'comeback') api.step(2);
      if (name === 'reminded') { api.step(3); api.callout('The saved message now shows its reminder time. It also appears in <b>Threads to Tend</b>, under <b>Upcoming</b>.'); }
      if (name === 'tend') api.step(4);
      if (name === 'completed') api.callout('Done. The message is still threadmarked in <b>🍕 Dinner ideas</b>. Completing a reminder only clears the reminder.');
    },
  }),
  async play(api, t) {
    await t.sleep(600);
    await t.tap('#lib-dinner'); await t.sleep(1000);
    await t.tap('#cb-noodle'); await t.sleep(700);
    await t.tap('[data-arg="Tomorrow morning"]'); await t.sleep(700);
    await t.tap('#confirm'); await t.sleep(1200);
    await t.tap('#libback'); await t.sleep(600);
    await t.tap('#tendrow'); await t.sleep(1100);
    await t.tap('#complete'); await t.sleep(1000);
  },
};
