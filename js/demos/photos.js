// Verified against MessageThreadScreen.kt (Add attachment sheet, PickMultipleVisualMedia, pending previews),
// PhotoCollage.kt (Stack / Cascade / List, tap fans out then opens the viewer) and ImageViewer.kt
// (swipeable pager, pinch to zoom, menu: Save to gallery / Share / Open with…).
import { ico, statusbar, appbar, settingsHome, appearancePage, bubble, photo, photoGroup, iconBtn, THREADS, bindCarousels } from '../phone-ui.js';
import { inbox } from '../inbox.js';
import { pickerView } from '../board.js';
import { appearanceActs, scrollPhone } from '../appearance.js';

const threads = THREADS.map((t, k) => ({ ...t, key: k }));

export default {
  id: 'photos',
  title: 'Send several photos at once',
  answer: 'Tap + in a conversation, choose Gallery and pick as many photos as you like. They send together and show up as one group you can fan out, swipe through and zoom.',
  steps: [
    'Open a conversation, tap <b>+</b> (Add attachment), then choose <b>Gallery</b>.',
    'Tap each photo you want, then add them. The picker is multi select, and your albums are in it.',
    'Check the previews above the message bar (<b>✕</b> removes one) and tap <b>Send</b>.',
    'Tap the photo group to fan it out and open the viewer. Swipe between photos and pinch to zoom.',
  ],
  note: '<strong>Photos go as a picture message (MMS).</strong> To fit carrier size limits they are resized before sending. Change how groups look in <b>Settings → Appearance → Photo groups</b>: Stack, Cascade or List.',
  start: 'home',
  state: () => ({ sheet: false, picked: [], pending: [], sent: [], fanned: false, idx: 0, menu: false, photoStyle: 'stack', stackSpread: 50 }),
  onRender: (api, name) => { const el = api.el(name); if (el) bindCarousels(el); },
  views: {
    home: s => inbox(s, { pulse: s.pulse, threads, openRows: true }),
    settings: s => settingsHome(s, { pulse: s.pulse }),
    appearance: s => appearancePage(s),
    thread: s => statusbar() + appbar('Sam Rivera', { back: true }) + `
      <div class="thread" tabindex="0">
        ${bubble('Found the place I was telling you about')}
        ${!s.sent.length ? '' : (s.photoStyle === 'carousel' || s.photoStyle === 'ring')
          ? photoGroup(s.sent.length, s.photoStyle, { pageAct: 'stack', key: 'tutorial:photos' })
          : `<button class="pg-btn" type="button" id="stack" data-act="stack" aria-label="${s.sent.length} photos. Open viewer.">${photoGroup(s.sent.length, s.photoStyle, { spread: s.stackSpread, fanned: s.fanned })}</button>`}
        ${bubble('Perfect, see you there 🍜', true)}
      </div>
      ${s.pending.length ? `<div class="pending" aria-label="Attachments">${s.pending.map(i => `<span class="pthumb">${photo(i)}<button type="button" class="pend-x" data-act="rmpend" data-arg="${i}" aria-label="Remove photo">✕</button></span>`).join('')}</div>` : ''}
      <div class="composer">
        ${iconBtn('plus', 'Add attachment', ico.plus, { id: 'plus', pulse: s.pulse === 'plus' })}
        <span class="field fake" aria-hidden="true">Text message</span>
        <button class="send" type="button" id="send" data-act="send" ${s.pending.length ? '' : 'disabled'} aria-label="Send">${ico.send}</button>
      </div>
      ${s.sheet ? `<div class="sheet" role="dialog" aria-label="Add attachment" data-esc="closesheet">
        <button class="sheet-btn${s.pulse === 'gallery' ? ' tapping-ring' : ''}" type="button" id="gallery" data-act="gallery">🖼  Gallery</button>
        <button class="sheet-btn" type="button" aria-disabled="true" tabindex="-1">📎  Files</button>
        <button class="sheet-btn" type="button" aria-disabled="true" tabindex="-1">🪪  Contact card</button>
        <button class="sheet-btn" type="button" aria-disabled="true" tabindex="-1">⏰  Schedule send</button>
        <button class="sheet-btn" type="button" data-act="closesheet">Cancel</button></div>` : ''}`,
    picker: s => pickerView(s.picked),
    viewer: s => `<div class="viewer">
        <div class="vbar">${iconBtn('back', 'Close viewer', ico.back)}<span></span>
          <button class="icon-btn" type="button" data-act="vmenu" aria-label="More">${ico.more}</button></div>
        <div class="vstage">${photo(s.sent[s.idx], 'big')}</div>
        <div class="vnav"><button class="chip" type="button" data-act="vprev" ${s.idx === 0 ? 'disabled' : ''}>‹ Previous</button>
          <button class="chip" type="button" id="vnext" data-act="vnext" ${s.idx >= s.sent.length - 1 ? 'disabled' : ''}>Next ›</button></div>
        <p class="caption pad dim">Swipe to move between photos. Pinch to zoom. Tap, swipe down or press Back to close.</p>
        ${s.menu ? `<div class="sheet dark" role="menu" aria-label="Photo actions" data-esc="vclose">
          <button class="sheet-btn" type="button" role="menuitem" data-act="vclose">Save to gallery</button>
          <button class="sheet-btn" type="button" role="menuitem" data-act="vclose">Share</button>
          <button class="sheet-btn" type="button" role="menuitem" data-act="vclose">Open with…</button></div>` : ''}
      </div>`,
  },
  acts: {
    ...appearanceActs,
    gear: api => { api.go('settings'); },
    cat: (api, id) => { if (id === 'appearance') { api.go('appearance'); scrollPhone(api, '#sec-photogroups'); } },
    open: api => { api.go('thread'); },
    plus: api => { api.s.sheet = true; api.s.pulse = ''; api.render('thread'); api.step(1); },
    closesheet: api => { api.s.sheet = false; api.render('thread'); },
    gallery: api => { api.s.sheet = false; api.s.picked = []; api.go('picker'); },
    pick: (api, i) => {
      i = Number(i);
      const p = api.s.picked; const at = p.indexOf(i);
      at >= 0 ? p.splice(at, 1) : p.push(i);
      api.render('picker'); api.step(2);
    },
    pickcancel: api => api.back(),
    pickdone: api => {
      api.s.pending = [...api.s.picked];
      api.back();                       // returns to the thread (re-rendered with previews)
    },
    rmpend: (api, i) => { api.s.pending = api.s.pending.filter(x => x !== Number(i)); api.render('thread'); },
    send: api => { api.s.sent = [...api.s.pending]; api.s.pending = []; api.render('thread'); api.step(3); },
    stack: api => {
      api.s.fanned = true; api.render('thread');
      setTimeout(() => { api.s.fanned = false; api.s.idx = 0; api.s.menu = false; api.go('viewer'); api.step(4); }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 420);
    },
    vprev: api => { api.s.idx = Math.max(0, api.s.idx - 1); api.render('viewer'); },
    vnext: api => { api.s.idx = Math.min(api.s.sent.length - 1, api.s.idx + 1); api.render('viewer'); },
    vmenu: api => { api.s.menu = !api.s.menu; api.render('viewer'); },
    vclose: api => { api.s.menu = false; api.render('viewer'); },
  },
  async play(api, t) {
    await t.tap('[data-arg="0"]');
    api.s.pulse = 'plus'; api.render('thread'); await t.sleep(500);
    await t.tap('#plus');
    api.s.pulse = 'gallery'; api.render('thread'); await t.sleep(500);
    await t.tap('#gallery');
    await t.sleep(500);
    for (const i of [0, 1, 3, 4]) { await t.tap(`[data-arg="${i}"]`); }
    await t.sleep(400);
    await t.tap('[data-act="pickdone"]');
    await t.sleep(900);
    await t.tap('#send');
    await t.sleep(900);
    await t.tap('#stack');
    await t.sleep(900);
    await t.tap('#vnext'); await t.sleep(500);
    await t.tap('#vnext'); await t.sleep(700);
  },
};
