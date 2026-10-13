// Give a Space its own icon. Verified against CustomChannels.kt (ChannelEditDialog: Name, the Icon row, Color, Save),
// SpaceIconsUi.kt (SpaceIconPreviewCard "Icon / Emoji 📌 / Change icon"; SpaceIconStudio "Space icon" with Emoji, Icons and
// Photo tabs, "Type or paste any emoji" + Use, "Search categories", category sections; choosing an emoji closes the studio)
// and SpaceIcons.kt (SpaceEmojiCatalog categories). The Icons and Photo tabs are shown but not simulated (js/icon-studio.js).
import { boardState, boardView, boardActs, chatScreen } from '../board-app.js';

export default {
  id: 'space-icons',
  devices: true,
  title: 'Give a Space its own icon',
  answer: 'Every Space has an icon that shows in the Space bar, the Spaces list and the saved-item headers. Pick an emoji from a category, search the categories, or type or paste any emoji you like.',
  steps: [
    'Open the Spaces list and tap <b>＋ New / manage Spaces</b>, then <b>＋ New Space</b> and <b>Blank Space</b>. (To change an existing Space, tap its <b>Edit</b>.)',
    'On the <b>Icon</b> row, tap <b>Change icon</b>. The <b>Space icon</b> window opens on the <b>Emoji</b> tab.',
    'Browse the categories, or type a word such as <b>food</b>, <b>travel</b> or <b>pets</b> into <b>Search categories</b>. You can also paste any emoji into <b>Type or paste any emoji</b>, then tap <b>Use</b>.',
    'Tap an emoji. The window closes and the <b>Icon</b> row shows your choice.',
    'Type a name and tap <b>Save</b>. The new icon appears wherever the Space does.',
  ],
  note: '<strong>The app has two more kinds of icon.</strong> The <b>Icons</b> tab offers 20 simple line drawings (Home, Food, Travel and so on), and the <b>Photo</b> tab turns a picture from your gallery into a round icon; Threadwell keeps its own small copy and never changes the original. Those two tabs are shown here but not simulated. If an icon photo is ever missing, the Space falls back to its emoji.',
  next: [{ id: 'create-space', label: 'Create a Space' }, { id: 'threadmarks', label: 'Next: Save a message to a Space' }],
  start: 'board',
  state: () => boardState(),
  views: {
    board: s => boardView(s, { live: ['spaces', 'spaces-in-chat'] }),
    chat: s => chatScreen(s),
  },
  acts: boardActs({
    event(api, name, d) {
      if (name === 'more' || name === 'manage') api.step(1);
      if (name === 'newspace') api.step(1);
      if (name === 'tpl') api.step(2);
      if (name === 'studioopen') api.step(2);
      if (name === 'studioquery') api.step(3);
      if (name === 'studiopicked') { api.step(4); api.callout(`The <b>Icon</b> row now shows <b>${d}</b>. Nothing is saved until you tap <b>Save</b>.`); }
      if (name === 'created') {
        const sp = api.s.spaces.find(x => x.id === d);
        api.step(5);
        api.callout(`Created <b>${sp.emoji} ${sp.name}</b>. Its icon shows in the Spaces list${api.s.spaces.length > 3 ? ' and under <b>More</b> in the Space bar' : ' and in the Space bar'}.`);
      }
    },
  }),
  async play(api, t) {
    await t.sleep(500);
    if (!api.s.device || !['phoneL', 'foldOpen'].includes(api.s.device)) { await t.tap('#morebtn'); await t.sleep(600); }
    await t.tap('#managebtn'); await t.sleep(800);
    await t.tap('#newspace'); await t.sleep(700);
    await t.tap('[data-act="tpl"][data-arg="blank"]'); await t.sleep(700);
    await t.tap('#iconchange'); await t.sleep(800);
    await t.tap('#iconq'); await t.type('#iconq', 'food'); await t.sleep(900);
    await t.tap('.icell[data-arg="🍰"]'); await t.sleep(900);
    await t.tap('#spname'); await t.type('#spname', 'Baking'); await t.sleep(500);
    await t.tap('#spsave'); await t.sleep(1500);
  },
};
