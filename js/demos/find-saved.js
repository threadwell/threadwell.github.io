// Find a message you already saved. Starts from an ordinary conversation.
// Routes verified against MessageBoardScreen.kt: Browse Spaces (rail tool) -> My Spaces -> a Space across all
// conversations; or a Space from the channel bar (More sheet) scoped to the open chat with "This chat / All chats".
import { boardState, boardView, boardActs, chatScreen } from '../board-app.js';

const where = sp => `${sp.emoji} ${sp.name}`;

export default {
  id: 'find-saved',
  devices: true,
  title: 'Find my saved messages',
  answer: 'Open Browse Spaces, pick the Space, and everything you saved from every chat is there. From inside a conversation you can open the same Space too, but it starts with only that chat.',
  steps: [
    'From any conversation, tap <b>Browse Spaces</b> (the stacked cards in the tools column). <b>My Spaces</b> opens.',
    'Tap a Space, such as <b>🍕 Dinner ideas</b>. It lists what you saved from every chat, with the chat name above each item.',
    'Tap <b>Show in chat</b> on an item to jump back to the original message. Back returns you to the Space.',
    'Prefer to stay in a conversation? Open <b>More</b> in the channel bar (or pick it from the Space list beside the conversation on a wide screen), then choose <b>This chat</b> or <b>All chats</b>.',
  ],
  note: '<strong>Two ways to look at the same Space.</strong> From <b>Browse Spaces</b> you always see all conversations. From a conversation’s channel bar you start with <b>This chat</b>, and <b>All chats</b> widens it.',
  next: [{ id: 'threadmarks', label: 'Save another message' }, { id: 'create-space', label: 'Next: Create a Space' }],
  start: 'board',
  state: () => boardState({ withDinnerSave: true }, { flash: 'dinner' }),
  views: {
    board: s => boardView(s, { live: ['spaces', 'spaces-in-chat', 'thread'] }),
    chat: s => chatScreen(s),
  },
  acts: boardActs({
    event(api, name, d) {
      if (name === 'library') {
        api.step(1);
        api.callout('<b>My Spaces</b>: everything you saved, from every chat. The Space that just got your message is highlighted. Tap it.');
      }
      if (name === 'libspace') { api.step(2); api.callout('Opened from <b>Browse Spaces</b>, this is the Space across <b>all conversations</b>. Each item shows which chat it came from. Swipe the action row sideways to see all its actions.'); }
      if (name === 'showchat') { api.step(3); api.callout('You are back in the original conversation at the saved message. Press Back to return to the Space.'); }
      if (name === 'more') api.callout('Your Spaces beyond the first three are under <b>More</b>. The one holding your saved message is highlighted.');
      if (name === 'pickspace') { api.callout('Opened from a conversation, a Space starts with only what you saved <b>from this chat</b>. Tap <b>All chats</b> to see the whole Space.'); }
      if (name === 'scope') { api.step(4); api.callout(d === 'all' ? '<b>All chats</b> shows the same Space across every conversation, like Browse Spaces does.' : '<b>This chat</b> shows only what you saved from the conversation you are in.'); }
      if (name === 'thread') api.callout('');
    },
  }),
  async play(api, t) {
    await t.sleep(500);
    api.s.pulse = 'spaces'; api.render(); await t.sleep(500);
    await t.tap('.rtool[aria-label="Browse Spaces"]'); await t.sleep(1300);
    await t.tap('#lib-dinner'); await t.sleep(1500);
    await t.tap('#show-noodle'); await t.sleep(1500);
    api.back(); await t.sleep(700);
    api.s.mode = 'chat'; api.s.channel = 'CHAT'; api.s.flash = 'dinner'; api.render(); await t.sleep(700);
    if (['phoneL', 'foldOpen'].includes(api.s.device)) { await t.tap('#crow-dinner'); await t.sleep(1300); }
    else { await t.tap('#morebtn'); await t.sleep(1000); await t.tap('#row-dinner'); await t.sleep(1300); }
    await t.tap('[data-act="scope"][data-arg="all"]'); await t.sleep(1000);
  },
};
