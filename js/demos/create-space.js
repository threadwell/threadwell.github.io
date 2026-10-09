// Create a Space. Verified against MessageBoardScreen.kt (More sheet, "New / manage Spaces"),
// CustomChannels.kt (ManageChannelsDialog, ChannelEditDialog: Name up to 24 characters, Icon, Color, Save; 20 Spaces max)
// and ChannelTemplates.kt (Blank Space plus ten templates).
import { boardState, boardView, boardActs, chatScreen } from '../board-app.js';

export default {
  id: 'create-space',
  devices: true,
  title: 'Create a Space',
  answer: 'A Space is your own folder for messages, links and photos from any chat. Make one from a template or start blank, give it a name and a color, and it is ready to save into.',
  steps: [
    'In a conversation, open the Space list: tap <b>More</b> in the channel bar, or on a wide screen look at the <b>Browse Spaces</b> list beside the conversation.',
    'Tap <b>＋ New / manage Spaces</b> (or <b>＋ New / manage</b> in the wide list), then <b>＋ New Space</b>.',
    'Choose <b>Blank Space</b> or one of the templates, such as <b>Travel</b> or <b>Gift ideas</b>.',
    'Type a name (up to 24 characters), pick a <b>Color</b>, and tap <b>Save</b>.',
  ],
  note: '<strong>You can keep up to 20 Spaces.</strong> In the same Spaces list you can reorder them with ▲ ▼ and star favorites, which move to the front. Templates only choose a starting name and icon, and you can change both.',
  next: [{ id: 'threadmarks', label: 'Next: Save a message to a Space' }, { id: 'find-saved', label: 'Find my saved messages' }],
  start: 'board',
  state: () => boardState(),
  views: {
    board: s => boardView(s, { live: ['spaces', 'spaces-in-chat'] }),
    chat: s => chatScreen(s),
  },
  acts: boardActs({
    event(api, name, d) {
      if (name === 'more') api.step(1);
      if (name === 'manage') { api.step(Math.max(1, 1)); api.callout('This is the <b>Spaces</b> list. Reorder with ▲ ▼, star favorites, or tap <b>＋ New Space</b>.'); }
      if (name === 'newspace') api.step(2);
      if (name === 'tpl') api.step(3);
      if (name === 'created') {
        const sp = api.s.spaces.find(x => x.id === d);
        api.step(4);
        api.callout(`Created <b>${sp.emoji} ${sp.name}</b>. Creating a Space shows no message of its own (only saving something into a Space does), so this note is part of the tutorial. It is now in the Spaces list${api.s.spaces.length > 3 ? ' and under <b>More</b> in the channel bar' : ' and in the channel bar'}, and in <b>Browse Spaces</b>.`);
      }
    },
  }),
  async play(api, t) {
    await t.sleep(500);
    if (!api.s.device || !['phoneL', 'foldOpen'].includes(api.s.device)) { await t.tap('#morebtn'); await t.sleep(600); }
    await t.tap('#managebtn'); await t.sleep(800);
    await t.tap('#newspace'); await t.sleep(700);
    await t.tap('#tpl-travel'); await t.sleep(700);
    const input = api.$('#spname');
    input.value = ''; api.s.draft.name = '';
    for (const ch of 'Trips 2027') { input.value += ch; api.s.draft.name = input.value; await t.sleep(70); }
    api.render(); await t.sleep(300);
    await t.tap('[data-act="draftcolor"][data-arg="#3ba55d"]'); await t.sleep(500);
    await t.tap('#spsave'); await t.sleep(1500);
  },
};
