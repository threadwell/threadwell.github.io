// Shared pieces for the inbox tutorials that need their own rows: Message categories and Pinned chats.
// The header matches inbox.js. Rows are buttons that stand in for press-and-hold (the app's long-press menu).
import { esc } from './core.js';
import { ico, statusbar } from './phone-ui.js';

export const inboxHeader = pulse => statusbar() + `<div class="appbar"><h3 tabindex="-1">Messages</h3>
    <span class="hbtn" aria-hidden="true">${ico.search}</span>
    <button class="icon-btn${pulse === 'gear' ? ' pulse' : ''}" type="button" data-act="gear" id="gear" aria-label="Settings">${ico.gear}</button>
    <span class="txt-btn inert">Spam</span>
  </div>`;

export const pressRow = (t, { pinned = false, ring = false } = {}) =>
  `<button class="row${t.unread ? ' unread' : ''}${ring ? ' tapping-ring' : ''}" type="button" data-act="press" data-arg="${t.id}" id="row-${t.id}"
     aria-label="${esc(t.n)}${pinned ? ', pinned' : ''}. ${esc(t.s)}. ${t.t}. Press and hold for actions.">
    <div class="avatar" aria-hidden="true">${t.i}</div>
    <div style="min-width:0"><div class="name">${pinned ? '<span class="pin-mark" aria-hidden="true">📌</span>' : ''}${esc(t.n)}</div><div class="snip">${esc(t.s)}</div></div>
    <div class="time">${t.t}</div></button>`;

/** The long-press actions, as a bottom sheet. `items` are [act, label] pairs; the rest show disabled, as in the app. */
export const actionSheet = (name, items, { pulse = '' } = {}) => `<div class="sheet" role="dialog" aria-label="Actions for ${esc(name)}" data-esc="closesheet">
    <h5 class="sheet-title">${esc(name)}</h5>
    ${items.map(([act, label]) => act
      ? `<button class="sheet-btn${pulse === act ? ' tapping-ring' : ''}" type="button" data-act="${act}" id="mi-${act}">${label}</button>`
      : `<button class="sheet-btn" type="button" aria-disabled="true" tabindex="-1">${label}</button>`).join('')}
    <button class="sheet-btn" type="button" data-act="closesheet">Cancel</button></div>`;

/** A short Android-style toast at the bottom of the phone. */
export const toast = text => text ? `<div class="ntoast" role="status">${esc(text)}</div>` : '';
