// Verified against SettingsScreen.kt ("messaging" category, Layout) and MessageBoardScreen.kt (rail, tools, header,
// channel bar). The Threadwell view here is the shared board from js/board-app.js, so its Spaces are real-looking.
import { statusbar, appbar, seg, settingsHome, settingsBody, label, caption } from '../phone-ui.js';
import { inbox } from '../inbox.js';
import { boardState, boardView, boardActs, chatScreen } from '../board-app.js';

export default {
  id: 'layout',
  title: 'Switch between Traditional and Threadwell view',
  devices: true,
  answer: 'Traditional is the familiar inbox. Threadwell view adds a rail of your threads, plus Spaces for links, attachments and important messages.',
  steps: [
    'Tap the <b>Settings</b> gear at the top of Messages.',
    'Open <b>Messaging &amp; notifications</b>, then find <b>Layout</b>.',
    'Choose <b>Threadwell view</b> and go back. To return, tap the gear at the bottom of the thread rail and pick <b>Traditional</b>.',
  ],
  note: '<strong>Your messages do not move.</strong> This only changes how they are laid out. Texts, photos and threads are the same in both views.',
  next: [{ id: 'threadmarks', label: 'Next: Save a message to a Space' }, { id: 'find-saved', label: 'Find my saved messages' }],
  start: 'home',
  state: () => ({ ...boardState(), layoutMode: 'traditional' }),
  views: {
    home: s => s.layoutMode === 'board' ? boardView(s, { live: ['settings', 'spaces-in-chat'] }) : inbox(s, { pulse: s.pulse }),
    settings: s => settingsHome(s, { pulse: s.pulse }),
    messaging: s => statusbar() + appbar('Messaging &amp; notifications', { back: true }) + settingsBody(`
      <h4>Messaging</h4>
      ${label('Layout')}
      ${caption('Traditional keeps the familiar inbox. Threadwell view adds a rail of your threads, plus Spaces for links, attachments, and important messages.')}
      ${seg('mode', [['traditional', 'Traditional'], ['board', 'Threadwell view']], s.layoutMode, { hint: s.pulse === 'mode', label: 'Layout' })}
      <div class="set-item" style="margin-top:16px">Signature<span>Added to messages you type</span></div>
      <div class="set-item">Swipe actions<span>Choose what swiping a thread does</span></div>
      <div class="set-item">Undo send delay<span>Off</span></div>`),
    chat: s => chatScreen(s),
  },
  acts: {
    ...boardActs(),
    gear: api => { api.s.pulse = ''; api.go('settings'); api.step(1); },
    settings: api => { api.s.pulse = ''; api.go('settings'); },
    cat: (api, id) => { if (id === 'messaging') { api.go('messaging'); api.step(2); } },
    mode: (api, mode) => {
      api.s.layoutMode = mode; api.s.pulse = '';
      api.render('messaging');
      if (mode === 'board') api.step(3);
    },
  },
  async play(api, t) {
    api.s.pulse = 'gear'; api.render('home'); await t.sleep(500);
    await t.tap('#gear');
    api.s.pulse = 'messaging'; api.render('settings'); await t.sleep(600);
    await t.tap('#cat-messaging');
    api.s.pulse = 'mode'; api.render('messaging'); await t.sleep(700);
    await t.tap('[data-arg="board"]');
    await t.sleep(900);
    api.back(); api.back(); await t.sleep(900);
  },
};
