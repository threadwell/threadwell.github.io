// Verified against AttachmentEditing.kt (Edit on a staged photo or video hands a copy to the phone's own editor app
// through ACTION_EDIT; the result replaces the attachment; the original is never touched; toasts "Couldn't open that
// for editing" and "Editing isn't available. Install a photo editor such as Google Photos.") and AttachmentSend.kt /
// MessageThreadScreen.kt / BoardChannels.kt (the "Edit" chip at the bottom left of each staged thumbnail, in both
// layouts and in New message). Threadwell has no editing tools of its own; the editor screen here is a stand-in.
import { ico, statusbar, appbar, bubble, photo, iconBtn } from '../phone-ui.js';

const FILTERS = [['none', 'Original'], ['warm', 'Warm'], ['mono', 'Mono'], ['vivid', 'Vivid']];

export default {
  id: 'edit-photo',
  title: 'Edit a photo or video before I send it',
  answer: 'After you add a photo or video, tap Edit on its preview. It opens in your phone\'s own editor, and the edited version is what gets sent.',
  steps: [
    'In a conversation, add a photo with <b>+</b> as usual. (Here, one is already added.)',
    'Tap <b>Edit</b> at the bottom left of the preview above the message bar.',
    'Your phone\'s editor opens (Google Photos, Samsung Gallery or another editor you have). Crop, mark up or add a filter, then save.',
    'Back in Threadwell, the preview shows your edit. Tap <b>Send</b>.',
  ],
  note: '<strong>Your original photo is not changed.</strong> Threadwell edits a copy, so the picture in your gallery stays as it was. Editing uses an editor app already on your phone and nothing leaves the phone. If none is installed, Threadwell says so and suggests one such as Google Photos. Works in both layouts and in New message.',
  start: 'thread',
  state: () => ({ filter: 'none', crop: false, draft: { filter: 'none', crop: false }, sent: false, pulse: 'edit' }),
  views: {
    thread: s => statusbar() + appbar('Sam Rivera', { back: false }) + `
      <div class="thread" tabindex="0">
        ${bubble('Did you get a good one of the lake?')}
        ${s.sent ? `<div class="b sent">${photo(5, `fx-${s.filter}${s.crop ? ' fx-crop' : ''}`)}Here it is</div>` : ''}
      </div>
      ${s.sent ? '' : `<div class="pending" aria-label="Attachments"><span class="pthumb">${photo(5, `fx-${s.filter}${s.crop ? ' fx-crop' : ''}`)}
        <button type="button" class="pend-x" aria-disabled="true" tabindex="-1" aria-label="Remove photo">✕</button>
        <button type="button" class="pend-edit${s.pulse === 'edit' ? ' tapping-ring' : ''}" data-act="edit" id="edit" aria-label="Edit photo">Edit</button></span></div>`}
      <div class="composer">
        ${iconBtn('noop', 'Add attachment', ico.plus)}
        <span class="field fake" aria-hidden="true">${s.sent ? 'Text message' : 'Here it is'}</span>
        <button class="send" type="button" id="send" data-act="send" ${s.sent ? 'disabled' : ''} aria-label="Send">${ico.send}</button>
      </div>`,
    editor: s => statusbar() + `<div class="appbar"><button class="icon-btn" type="button" data-act="back" aria-label="Cancel">✕</button>
        <h3 tabindex="-1">Your phone's editor</h3><button class="btn-s" type="button" data-act="save" id="save">Save</button></div>
      <div class="editor-stage">${photo(5, `big fx-${s.draft.filter}${s.draft.crop ? ' fx-crop' : ''}`)}</div>
      <div class="demo-bar"><span class="demo-tag">Stand-in</span>
        <button class="chip${s.draft.crop ? ' on' : ''}" type="button" data-act="crop" id="crop" aria-pressed="${s.draft.crop}">Crop</button>
        ${FILTERS.map(([id, name]) => `<button class="chip${s.draft.filter === id ? ' on' : ''}" type="button" data-act="filter" data-arg="${id}" id="f-${id}" aria-pressed="${s.draft.filter === id}">${name}</button>`).join('')}</div>
      <p class="caption pad dim">This screen belongs to your editor app, not Threadwell. Its tools depend on which editor you use.</p>`,
  },
  acts: {
    noop: () => {},
    edit: api => { api.s.draft = { filter: api.s.filter, crop: api.s.crop }; api.s.pulse = ''; api.go('editor'); api.step(2); },
    crop: api => { api.s.draft.crop = !api.s.draft.crop; api.render('editor'); },
    filter: (api, id) => { api.s.draft.filter = id; api.render('editor'); },
    save: api => {
      api.s.filter = api.s.draft.filter; api.s.crop = api.s.draft.crop;
      api.back(); api.step(3);
      api.callout('The edited copy replaced the preview. Your original photo in the gallery is unchanged.');
    },
    send: api => { api.s.sent = true; api.render('thread'); api.step(4); api.callout('Sent with your edit.'); },
  },
  afterAct: (api, name) => { if (name === 'back' && api.s.pulse === '' && !api.s.sent) api.callout('Backed out without saving, so the photo stays as it was.'); },
  async play(api, t) {
    await t.sleep(500);
    await t.tap('#edit'); await t.sleep(600);
    await t.tap('#crop'); await t.sleep(600);
    await t.tap('#f-warm'); await t.sleep(800);
    await t.tap('#save'); await t.sleep(1000);
    await t.tap('#send'); await t.sleep(800);
  },
};
