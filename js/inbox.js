// Traditional layout home: the inbox with the real header controls (Search, Settings, Spam).
import { esc } from './core.js';
import { ico, statusbar, THREADS } from './phone-ui.js';

export function inbox(s, { pulse = '', threads = THREADS, spamCount = 0, openRows = false, spamLive = false, widgets = '' } = {}) {
  const spamLabel = spamCount > 99 ? 'Spam 99+' : spamCount > 0 ? `Spam (${spamCount})` : 'Spam';
  return statusbar() + `<div class="appbar"><h3 tabindex="-1">Messages</h3>
      <span class="hbtn" aria-hidden="true">${ico.search}</span>
      <button class="icon-btn${pulse === 'gear' ? ' pulse' : ''}" type="button" data-act="gear" id="gear" aria-label="Settings">${ico.gear}</button>
      ${spamLive
        ? `<button class="txt-btn${pulse === 'spam' ? ' tapping-ring' : ''}" type="button" id="spambtn" data-act="spamfolder">${spamLabel}</button>`
        : `<span class="txt-btn inert">${spamLabel}</span>`}
    </div>
    ${widgets}
    <div class="list" tabindex="0">${threads.map((t, k) => {
      const inner = `<div class="avatar" aria-hidden="true">${t.i}</div>
        <div style="min-width:0"><div class="name">${esc(t.n)}</div><div class="snip">${esc(t.s)}</div></div><div class="time">${t.t}</div>`;
      return openRows
        ? `<button class="row${t.unread ? ' unread' : ''}" type="button" data-act="open" data-arg="${t.key ?? k}">${inner}</button>`
        : `<div class="row${t.unread ? ' unread' : ''}">${inner}</div>`;
    }).join('')}</div>
    <div class="fab-wrap"><span class="fab" aria-hidden="true">Start chat</span></div>`;
}
