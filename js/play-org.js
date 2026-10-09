// Organization and spam screens for the playground, all drawn from the shared session.
// Verified against BoardSearch.kt (kinds, 2-character minimum, result order, where each result opens), CustomChannels.kt
// (Edit Space: name, color, Archive/Merge/Export, Delete with its confirm), BoardChannels.kt (Links, Attachments and
// Important empty states), DeleteSpamScreen.kt and MessageThreadScreen.kt (Not spam, Always allow, Restore once, the
// "flagged as spam" banner and its category line) and SpamDetector.kt (category names).
import { esc } from './core.js';
import { ico, THREADS, photo, PHOTO_ALT, statusbar, appbar, settingsBody, label, caption } from './phone-ui.js';
import { COLORS, NAME_MAX } from './space-model.js';
import { activeNotes } from './notes.js';

export const SPAM_THREAD = { n: '(555) 019-2284', i: '#', s: '', t: '8:02 AM', unread: true };
export const TH = [...THREADS, SPAM_THREAD];
export const SPAM_KEY = 4;
export const SPAM_CATEGORY = 'Prize / reward';
const URL_RE = /https?:\/\/[^\s]+|www\.[^\s]+/gi;
const WHY = 'This control uses the phone itself (its block list, share sheet or forms), so it is not simulated in the playground.';

/** Quarantined only while smart detection is on and the visitor has not restored or allowed the conversation. */
export const spamQuarantined = s => !!s.smart && s.spam === 'quarantined';
export const urlsIn = text => String(text).match(URL_RE) || [];
export const senderOf = (s, k, m) => (m.sent ? 'You' : m.from || TH[k].n);
const chatOf = (s, k) => TH[k].n;

/* ---------- search ---------- */
export const KINDS = [['CONVERSATION', 'Chats', '💬'], ['MESSAGE', 'Messages', '#'], ['LINK', 'Links', '🔗'], ['NOTE', 'Notes', '📝'], ['CHANNEL', 'Spaces', '🏷']];

/** Chats, then Spaces, then notes, then message text (newest first, at most 40), like runBoardSearch. */
export function runSearch(s, query) {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const out = [];
  s.tlist.filter(t => t.n.toLowerCase().includes(q)).slice(0, 8).forEach(t => out.push({ kind: 'CONVERSATION', title: t.n, snippet: t.s, meta: 'Chat', thread: t.key }));
  s.spaces.filter(sp => sp.name.toLowerCase().includes(q)).forEach(sp => out.push({ kind: 'CHANNEL', title: `${sp.emoji} ${sp.name}`, snippet: '', meta: `Space · ${activeNotes(s).filter(n => n.space === sp.id).length} notes`, space: sp.id }));
  activeNotes(s).filter(n => n.body.toLowerCase().includes(q)).forEach(n => {
    const sp = s.spaces.find(x => x.id === n.space); if (!sp) return;
    out.push({ kind: 'NOTE', title: 'You · Private note', snippet: n.body.slice(0, 160), meta: `${sp.emoji} ${sp.name} · ${n.thread != null ? chatOf(s, n.thread) : 'Personal note'}`, space: sp.id, thread: n.thread, note: n.id });
  });
  const msgs = [];
  Object.keys(s.msgs).map(Number).forEach(k => { if (k === SPAM_KEY && spamQuarantined(s)) return; [...s.msgs[k]].reverse().forEach(m => msgs.push([k, m])); });
  msgs.filter(([, m]) => m.text.toLowerCase().includes(q)).slice(0, 40).forEach(([k, m]) => {
    const link = urlsIn(m.text).some(u => u.toLowerCase().includes(q));
    out.push({ kind: link ? 'LINK' : 'MESSAGE', title: chatOf(s, k), snippet: m.text.trim().slice(0, 160), meta: `${senderOf(s, k, m)} · ${link ? 'Link' : 'Message'}`, thread: k, mid: m.id });
  });
  return out;
}
export const filteredHits = s => { const all = runSearch(s, s.sq); return s.sfilter ? all.filter(h => h.kind === s.sfilter) : all; };

export function searchView(s) {
  const all = runSearch(s, s.sq), shown = s.sfilter ? all.filter(h => h.kind === s.sfilter) : all, q = s.sq.trim();
  const icon = k => KINDS.find(x => x[0] === k)[2];
  return `<div class="bhead"><div class="btitle"><b>${ico.search.replace('<svg', '<svg class="inl"')} Search</b></div></div>
    <div class="sbox"><input id="bsq" class="field" type="search" placeholder="Search threads, messages, links, notes, Spaces" aria-label="Search threads, messages, links, notes and Spaces" value="${esc(s.sq)}" data-act="sq" autocomplete="off"></div>
    <div class="chips" role="group" aria-label="Result type"><button type="button" class="chip${!s.sfilter ? ' on' : ''}" data-act="sfilter" data-arg="" aria-pressed="${!s.sfilter}">All</button>${KINDS.map(([k, t]) => { const n = all.filter(h => h.kind === k).length; return `<button type="button" class="chip${s.sfilter === k ? ' on' : ''}" data-act="sfilter" data-arg="${k}" aria-pressed="${s.sfilter === k}">${t}${n ? ' ' + n : ''}</button>`; }).join('')}</div>
    <div class="hits" role="status" aria-live="polite">${q.length < 2 ? '<p class="caption pad">Type at least 2 characters.</p>' : !shown.length ? '<p class="caption pad">No matches.</p>' : `<span class="sr-only">${shown.length} result${shown.length === 1 ? '' : 's'}</span>`}</div>
    ${shown.map((h, i) => `<button class="hit" type="button" id="hit-${i}" data-act="hit" data-arg="${i}"><span class="hit-top"><b>${icon(h.kind)} ${esc(h.title)}</b></span><small class="hit-meta">${esc(h.meta)}</small>${h.snippet ? `<span class="hit-snip">${esc(h.snippet)}</span>` : ''}</button>`).join('')}`;
}

/* ---------- Links, Attachments, Important ---------- */
export const BUILTIN = { LINKS: 'Links', ATTACHMENTS: 'Attachments', IMPORTANT: 'Important' };

export function builtinView(s, key) {
  const k = s.thread, ms = [...s.msgs[k]].reverse();
  if (key === 'LINKS') {
    const rows = ms.filter(m => urlsIn(m.text).length);
    return rows.length ? rows.map(m => { const u = urlsIn(m.text)[0]; let host = u; try { host = new URL(/^https?:/i.test(u) ? u : 'https://' + u).hostname; } catch { /* keep raw */ }
      return `<article class="tcard"><div class="thead"><b>${esc(host)}</b><small>${esc(senderOf(s, k, m))}</small></div><p class="ttext">${esc(m.text)}</p>
        <div class="tactions" role="group" aria-label="Link actions"><button class="tact" type="button" data-act="showmsg" data-arg="${m.id}">Show in chat</button></div></article>`; }).join('')
      : '<div class="emptybox">Links shared in this chat will collect here automatically.</div>';
  }
  if (key === 'ATTACHMENTS') {
    const rows = ms.filter(m => m.photo != null);
    return rows.length ? `<div class="pgrid" role="group" aria-label="Photos in this conversation">${rows.map(m => `<button class="pcell" type="button" data-act="showmsg" data-arg="${m.id}" aria-label="${PHOTO_ALT[m.photo % 6]}. Show in chat">${photo(m.photo)}</button>`).join('')}</div>`
      : '<div class="emptybox">No attachments in this conversation yet.</div>';
  }
  const rows = ms.filter(m => m.star);
  return rows.length ? rows.map(m => `<article class="tcard"><div class="thead"><b>★ ${esc(senderOf(s, k, m))}</b><small>${esc(m.t || '')}</small></div><p class="ttext">${esc(m.text || '[photo]')}</p>
      <div class="tactions" role="group" aria-label="Important message actions"><button class="tact" type="button" data-act="showmsg" data-arg="${m.id}">Show in chat</button><button class="tact" type="button" data-act="unstar" data-arg="${m.id}">Remove star</button></div></article>`).join('')
    : '<div class="emptybox">Long-press a message in the full chat and tap ☆ to save it here.</div>';
}

/* ---------- spam ---------- */
export function spamFolderView(s) {
  const head = '<div class="bhead"><div class="btitle"><b>Spam</b><span>Conversations the filter caught</span></div></div>';
  if (!spamQuarantined(s)) return head + '<div class="emptybox">Nothing quarantined. Messages the spam filter catches will collect here instead of in your recipient list.</div>';
  const last = s.msgs[SPAM_KEY][0];
  return head + `<div class="spamrow"><button class="spam-open" type="button" id="spamopen" data-act="spamopen"><span class="avatar" aria-hidden="true">#</span>
      <span class="spam-t"><b>${esc(SPAM_THREAD.n)}</b><small>${esc(last.text)}</small><em>1 detected · 0 of 1 forwarded to 7726</em></span></button>
    <button class="txt-btn" type="button" id="notspam" data-act="notspam">Not spam</button></div>`;
}

export function spamBanner(s) {
  if (s.thread !== SPAM_KEY || !spamQuarantined(s)) return '';
  const dead = t => `<button class="txt-btn" type="button" aria-disabled="true" data-why="${WHY}">${t}</button>`;
  return `<div class="spambanner" role="group" aria-label="Spam warning"><b>⚠ This conversation is flagged as spam</b><span>${SPAM_CATEGORY}</span>
    <div class="sbact"><button class="txt-btn" type="button" id="spamallow" data-act="spamallow">Always allow</button><button class="txt-btn" type="button" id="spamrestore" data-act="spamrestore">Restore once</button>${dead('Block')}${dead('Report to FTC')}</div></div>`;
}

export function spamPage(s) {
  const sw = (act, text, on, cap) => `<div class="switch-row"><div><div class="label" style="font-size:13px">${text}</div><div class="caption">${cap}</div></div><button class="switch" type="button" role="switch" aria-checked="${on}" aria-label="${esc(text)}" data-act="${act}"><span></span></button></div>`;
  return statusbar() + appbar('Spam protection', { back: true }) + settingsBody(`
    ${sw('setsmart', 'Smart detection', s.smart, 'Checks each incoming message on this phone. Likely spam is kept out of your recipient list and collected in the Spam folder.')}
    ${sw('setautoreport', 'Automatic reporting', s.autoReport, 'Off until you turn it on. When on, strongly flagged messages are forwarded to 7726, the carrier’s spam-reporting number. Nothing is forwarded in the playground.')}
    <h4>Your spam folder</h4>
    <p class="caption">${spamQuarantined(s) ? 'One sample conversation is waiting in the Spam folder.' : 'The sample conversation is not in the Spam folder right now.'}</p>
    <div class="set-item" aria-disabled="true" data-why="Keyword filters are not in the playground. The Add my own spam rule tutorial covers them.">Keyword filters<span>Words that always count against a message</span></div>
    <div class="set-item" aria-disabled="true" data-why="Blocked numbers use the phone’s own block list, so they are not simulated here.">Blocked numbers<span>Uses the phone’s block list</span></div>`);
}

/* ---------- Space editing ---------- */
export function editSpaceDlg(s) {
  const d = s.draft, why = a => `aria-disabled="true" data-why="${a}"`;
  return `<div class="scrim"><div class="dialog tall" role="dialog" aria-label="Edit Space" data-esc="spcancel"><h5>Edit Space</h5>
    <div class="dlg-scroll" tabindex="0" data-sk="spedit">
      <label class="flabel" for="spname">Name</label>
      <input id="spname" class="field" type="text" maxlength="${NAME_MAX}" value="${esc(d.name)}" data-act="draftname" data-enter="#spsave" autocomplete="off">
      <div class="iconcard"><span class="caption" style="margin:0">Icon</span><span class="iconprev" aria-hidden="true">${esc(d.emoji)}</span></div>
      <span class="caption" style="margin:4px 0 0">Color</span>
      <div class="sws" role="group" aria-label="Color">${COLORS.map(([c, n]) => `<button type="button" class="sw${d.color === c ? ' on' : ''}" style="background:${c}" data-act="draftcolor" data-arg="${c}" aria-label="${n}" aria-pressed="${d.color === c}"></button>`).join('')}</div>
      <div class="menulist">
        <button class="txt-btn left" type="button" ${why('Archiving hides a Space and keeps everything in it. It is not in the playground yet; Delete Space is.')}>Archive Space</button>
        <button class="txt-btn left" type="button" ${why('Merging Spaces is not in the playground yet.')}>Merge into another Space…</button>
        <button class="txt-btn left" type="button" ${why('Export opens the phone’s share sheet, so it is not simulated here.')}>Export as a list…</button>
        <button class="txt-btn left danger" type="button" id="spdelete" data-act="spdelete">Delete Space</button></div></div>
    <div class="dlg-actions"><button class="txt-btn" type="button" data-act="spcancel">Cancel</button><button class="txt-btn strong" type="button" id="spsave" data-act="speditsave" ${d.name.trim() ? '' : 'disabled'}>Save</button></div></div></div>`;
}
export function deleteSpaceDlg(s) {
  const sp = s.spaces.find(x => x.id === s.spDelete);
  return `<div class="scrim"><div class="dialog" role="dialog" aria-label="Delete ${esc(sp.name)}?" data-esc="spdeleteno"><h5>Delete “${esc(sp.name)}”?</h5>
    <p class="caption" style="margin:0">Your messages, links and photos stay where they are; only their threadmarks and any private notes in this Space are removed.</p>
    <div class="dlg-actions"><button class="txt-btn" type="button" data-act="spdeleteno">Cancel</button><button class="txt-btn danger" type="button" id="spdeleteyes" data-act="spdeleteyes">Delete</button></div></div></div>`;
}
