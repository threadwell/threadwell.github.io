// Verified against AppearanceScreen.kt ("Message text size", also pinch in a conversation) and
// AppSettings.setMessageTextScale (kept between 85% and 180%).
import { statusbar, appbar, settingsHome, appearancePage, bubble, THREADS } from '../phone-ui.js';
import { inbox } from '../inbox.js';
import { appearanceActs, scrollPhone } from '../appearance.js';
import { esc } from '../core.js';

const threads = THREADS.map((t, k) => ({ ...t, key: k }));
const clamp = v => Math.max(85, Math.min(180, v));

export default {
  id: 'text-size',
  title: 'Make message text bigger or smaller',
  answer: 'Set Message text size once and every conversation follows. You can also pinch with two fingers inside any conversation.',
  steps: [
    'Tap <b>Settings</b>, then open <b>Appearance</b>.',
    'Drag the <b>Message text size</b> slider. It goes from 85% to 180%.',
    'Go back and open a conversation. Message text now uses your size, and the layout still fits.',
    'Prefer gestures? Pinch in or out inside a conversation to change it on the spot.',
  ],
  note: '<strong>Only message text changes.</strong> Names, times and buttons keep their size, and one setting applies to every conversation.',
  start: 'home',
  state: () => ({ textScale: 100, compare: false }),
  views: {
    home: s => inbox(s, { pulse: s.pulse, threads, openRows: true }),
    settings: s => settingsHome(s, { pulse: s.pulse }),
    appearance: s => appearancePage(s),
    thread: s => {
      const scale = s.compare ? 100 : s.textScale;
      return statusbar() + appbar('Sam Rivera', { back: true }) +
        `<div class="demo-bar"><span class="demo-tag">Demo</span>
           <button class="chip${s.compare ? ' on' : ''}" type="button" data-act="compare" aria-pressed="${s.compare}" id="cmp">Compare with 100%</button>
           <button class="chip" type="button" data-act="pinch" data-arg="-10" aria-label="Pinch in, smaller text">Pinch in</button>
           <button class="chip" type="button" data-act="pinch" data-arg="10" aria-label="Pinch out, larger text">Pinch out</button></div>
         <div class="thread scaled" tabindex="0" style="--ts:${scale / 100}">
           <div class="size-badge" aria-live="polite">${scale}%</div>
           ${bubble('Found the place I was telling you about')}
           ${bubble('Late Night Noodle Bar. Table for two at 7? They are closing the kitchen at 9 so we should not be late.')}
           ${bubble('Perfect, see you there 🍜', true)}
           ${bubble('Bring cash, the card reader has been down all week.')}
         </div>`;
    },
  },
  acts: {
    ...appearanceActs,
    gear: api => { api.s.pulse = ''; api.go('settings'); api.step(1); },
    cat: (api, id) => { if (id === 'appearance') { api.go('appearance'); api.step(1); scrollPhone(api, '#sec-textsize'); } },
    open: api => { api.go('thread'); if (api.s.textScale !== 100) api.step(3); },
    compare: api => { api.s.compare = !api.s.compare; api.render('thread'); },
    pinch: (api, d) => { api.s.textScale = clamp(api.s.textScale + Number(d)); api.s.compare = false; api.render('thread'); api.step(4); },
    textsize: (api, a, el) => { appearanceActs.textsize(api, a, el); api.step(2); },
  },
  async play(api, t) {
    api.s.pulse = 'gear'; api.render('home'); await t.sleep(500);
    await t.tap('#gear');
    api.s.pulse = 'appearance'; api.render('settings'); await t.sleep(500);
    await t.tap('#cat-appearance');
    await t.sleep(400);
    scrollPhone(api, '#sec-textsize');
    await t.sleep(500);
    await t.slide('#ts', 150, 1400);
    await t.sleep(600);
    api.back(); api.back(); await t.sleep(600);
    await t.tap('[data-arg="0"]');
    await t.sleep(1200);
    await t.tap('#cmp'); await t.sleep(1100);
    await t.tap('#cmp'); await t.sleep(600);
    await t.tap('[data-act="pinch"][data-arg="-10"]'); await t.sleep(700);
  },
};
