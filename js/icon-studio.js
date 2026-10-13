// The Space icon studio, as the app has it (SpaceIconsUi.kt `SpaceIconPreviewCard` + `SpaceIconStudio`, SpaceIcons.kt
// `SpaceEmojiCatalog` / `SpaceIconSet`). Emoji is live here: browse categories, search them, or type any single emoji; picking
// one closes the studio at once, as in the app. The Icons tab (20 line drawings) and the Photo tab (needs the phone's photo
// picker and a circular crop) are shown but not simulated, and say so. The draft's `emoji` is what the lists display.
import { esc } from './core.js';

export const EMOJI_CATEGORIES = [
  ['Favorites', ['📌', '⭐', '❤️', '🎉', '💡', '📅', '🏠', '🛒', '✈️', '🍕']],
  ['Home', ['🏠', '🏡', '🛋️', '🛏️', '🧹', '🧺', '🔑', '🪴', '🛠️', '💡', '🚿', '🧰']],
  ['Family', ['👨‍👩‍👧‍👦', '👪', '👶', '🧒', '👧', '👦', '👵', '👴', '💞', '🤗', '🎈', '🏫']],
  ['Food', ['🍕', '🍔', '🍜', '🍣', '🥗', '🍰', '☕', '🍎', '🥖', '🍳', '🛒', '🍽️']],
  ['Travel', ['✈️', '🚗', '🚆', '🏖️', '🏕️', '🗺️', '🧳', '🏨', '⛰️', '🚢', '🌍', '📸']],
  ['Work', ['💼', '🗂️', '📁', '📊', '📝', '🖥️', '📎', '📌', '🗓️', '✅', '📞', '🏢']],
  ['Money', ['💰', '💵', '💳', '🧾', '🏦', '📈', '🪙', '💸', '🛍️', '🏷️']],
  ['Health', ['🩺', '💊', '🏃', '🧘', '🦷', '❤️‍🩹', '🥦', '🏋️', '😴', '🧠']],
  ['Ideas', ['💡', '🧠', '✨', '📚', '🎨', '✏️', '🔭', '🧩', '🎯', '🚀']],
  ['Celebrations', ['🎉', '🎂', '🎁', '🎄', '🎃', '💐', '🥂', '🎊', '💍', '🪅']],
  ['Pets', ['🐶', '🐱', '🐾', '🐟', '🐦', '🐰', '🐢', '🦴', '🐴', '🦜']],
  ['Other', ['🌟', '🔥', '🌈', '⚽', '🎵', '🎮', '📷', '🌱', '☀️', '🌙', '🇺🇸', '#️⃣']],
];
const BUILT_IN = ['Home', 'Family', 'Food', 'Shopping', 'Receipts', 'Tools', 'Car', 'Travel', 'Calendar', 'Book', 'Folder', 'Ideas',
  'Health', 'Pets', 'Games', 'Music', 'Camera', 'Plants', 'Star', 'Heart'];

/** Categories whose name contains the query (case-insensitive); their emoji, de-duplicated. */
export function searchEmoji(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return [...new Set(EMOJI_CATEGORIES.filter(([n]) => n.toLowerCase().includes(q)).flatMap(([, l]) => l))];
}

/** The single emoji in `text`, or null (one grapheme that is pictographic or a flag; keycaps count). */
export function singleEmoji(text) {
  const t = text.trim();
  if (!t) return null;
  const seg = typeof Intl !== 'undefined' && Intl.Segmenter ? [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(t)] : [...t];
  if (seg.length !== 1) return null;
  return /\p{Extended_Pictographic}|\p{Regional_Indicator}|⃣/u.test(t) ? t : null;
}

/** The "Icon" row of the New / Edit Space dialog: current icon, its name, and a Change icon button. */
export function iconCard(emoji) {
  return `<div class="iconcard"><span class="iconprev" aria-hidden="true">${esc(emoji)}</span>
    <span class="iconlbl"><span class="caption" style="margin:0">Icon</span><span id="iconname">Emoji ${esc(emoji)}</span></span>
    <button class="txt-btn" type="button" id="iconchange" data-act="studioopen" aria-haspopup="dialog">Change icon</button></div>`;
}

const cell = (e, on, stop) => `<button class="icell${on ? ' on' : ''}" type="button" tabindex="${stop ? 0 : -1}" data-act="studiopick" data-arg="${esc(e)}" aria-label="Use ${esc(e)}" aria-pressed="${on}">${esc(e)}</button>`;

/** The emoji grid for a search query, as one fragment (repainted on typing without losing the field's focus). */
export function emojiResults(query, current) {
  const hits = searchEmoji(query);
  const sections = query.trim() ? [['Results', hits]] : EMOJI_CATEGORIES;
  // One Tab stop for the whole grid (the picked emoji, else the first); the arrow keys move within it. See the key handler below.
  const all = sections.flatMap(([, l]) => l), stop = all.includes(current) ? all.indexOf(current) : 0;
  let i = 0;
  return sections.map(([title, list]) => `<h6 class="sec-h">${esc(title)}</h6><div class="igrid" role="group" aria-label="${esc(title)}">${list.map(e => cell(e, e === current, i++ === stop)).join('')}</div>`).join('')
    + (query.trim() && !hits.length ? '<p class="caption">No category matches. You can still type any emoji above.</p>' : '');
}

/** The "Space icon" dialog. `d.studio` = { tab, q, typed } while open. */
export function studioDialog(d) {
  const st = d.studio; if (!st) return '';
  const why = m => `aria-disabled="true" data-why="${esc(m)}"`;
  const valid = singleEmoji(st.typed || '');
  const tab = (id, label, off) => `<button class="stab${st.tab === id ? ' on' : ''}" type="button" role="tab" aria-selected="${st.tab === id}" ${off ? why(off) : `data-act="studiotab" data-arg="${id}"`}>${label}</button>`;
  return `<div class="scrim"><div class="dialog tall" role="dialog" aria-label="Space icon" data-esc="studiodone"><h5>Space icon</h5>
    <div class="stabs" role="tablist">${tab('emoji', 'Emoji')}${tab('icons', 'Icons', 'The 20 built-in line icons (Home, Food, Travel and so on) are not drawn in the playground. Emoji work the same way.')}${tab('photo', 'Photo', 'A photo icon uses the phone’s photo picker and a circular crop, so it is not simulated here.')}</div>
    <div class="dlg-scroll" tabindex="0">
      <label class="flabel" for="icontyped">Type or paste any emoji</label>
      <div class="rowf"><input id="icontyped" class="field" type="text" maxlength="32" value="${esc(st.typed || '')}" data-act="studiotyped" autocomplete="off" aria-invalid="${!!(st.typed && !valid)}">
        <button class="txt-btn strong" type="button" id="iconuse" data-act="studiouse" ${valid ? '' : 'hidden'}>Use</button></div>
      <p class="caption" id="iconerr" ${st.typed && !valid ? '' : 'hidden'}>Use a single emoji</p>
      <label class="flabel" for="iconq">Search categories</label>
      <input id="iconq" class="field" type="search" maxlength="24" placeholder="food, travel, pets…" value="${esc(st.q || '')}" data-act="studioquery" autocomplete="off">
      <div id="iconresults">${emojiResults(st.q || '', d.emoji)}</div>
    </div>
    <div class="dlg-actions"><button class="txt-btn strong" type="button" id="icondone" data-act="studiodone">Done</button></div></div></div>`;
}

/** Acts for the icon studio, merged into boardActs. `ev(api, name, arg)` reports to a tutorial's step tracker. */
export function studioActs(ev = () => {}) {
  const d = api => api.s.draft;
  const pick = (api, e) => { const dr = d(api); dr.emoji = e; dr.studio = null; api.render(); ev(api, 'studiopicked', e); };
  return {
    studioopen: api => { d(api).studio = { tab: 'emoji', q: '', typed: '' }; api.render(); ev(api, 'studioopen'); api.$('#iconq')?.focus({ preventScroll: true }); },
    studiodone: api => { if (d(api)) d(api).studio = null; api.render(); api.$('#iconchange')?.focus({ preventScroll: true }); },
    studiotab: () => {},
    studioquery: (api, _a, el) => {
      const st = d(api).studio; st.q = el.value.slice(0, 24);
      const box = api.$('#iconresults'); if (box) box.innerHTML = emojiResults(st.q, d(api).emoji);
      if (st.q.trim()) ev(api, 'studioquery', st.q);
    },
    studiotyped: (api, _a, el) => {
      const st = d(api).studio; st.typed = el.value.slice(0, 32);
      const ok = singleEmoji(st.typed);
      const use = api.$('#iconuse'), err = api.$('#iconerr');
      if (use) use.hidden = !ok; if (err) err.hidden = !(st.typed && !ok); el.setAttribute('aria-invalid', String(!!(st.typed && !ok)));
    },
    studiouse: api => { const e = singleEmoji(d(api).studio.typed || ''); if (e) pick(api, e); },
    studiopick: pick,
  };
}

/* Arrow keys move through the emoji grid (Home / End jump to its ends); Tab leaves it. Installed once. */
if (typeof document !== 'undefined' && !window.__iconKeys) {
  window.__iconKeys = true;
  document.addEventListener('keydown', e => {
    const cur = e.target && e.target.closest && e.target.closest('.icell'); if (!cur || e.altKey || e.ctrlKey || e.metaKey) return;
    const cells = [...cur.closest('#iconresults').querySelectorAll('.icell')], i = cells.indexOf(cur);
    let j = i;
    if (e.key === 'ArrowRight') j = i + 1; else if (e.key === 'ArrowLeft') j = i - 1;
    else if (e.key === 'Home') j = 0; else if (e.key === 'End') j = cells.length - 1;
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const dir = e.key === 'ArrowDown' ? 1 : -1, r = cur.getBoundingClientRect();
      const rows = cells.filter(c => dir > 0 ? c.getBoundingClientRect().top > r.top + 4 : c.getBoundingClientRect().top < r.top - 4);
      const nearestRowTop = rows.length ? (dir > 0 ? Math.min : Math.max)(...rows.map(c => c.getBoundingClientRect().top)) : null;
      const row = rows.filter(c => Math.abs(c.getBoundingClientRect().top - nearestRowTop) < 4);
      if (row.length) j = cells.indexOf(row.reduce((a, b) => Math.abs(a.getBoundingClientRect().left - r.left) <= Math.abs(b.getBoundingClientRect().left - r.left) ? a : b));
    } else return;
    e.preventDefault();
    j = Math.max(0, Math.min(cells.length - 1, j));
    cells.forEach(c => c.tabIndex = -1); cells[j].tabIndex = 0; cells[j].focus();
  });
}
