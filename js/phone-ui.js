// Shared pieces of the phone simulation. Wording, labels and control names come from the Threadwell app code.
import { esc } from './core.js';
import { RING, ringDrawn, ringPlace, loopPhoto } from './ring-layout.js';

const svg = d => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
export const ico = {
  gear: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  back: svg('<path d="M15 6l-6 6 6 6"/>'),
  clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  bolt: svg('<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>'),
  stack: svg('<rect x="4" y="7" width="16" height="12" rx="3"/><path d="M7 4h10"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  more: svg('<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>'),
  close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  send: svg('<path d="M4 12l16-8-6 16-3-7z"/>'),
  search: svg('<circle cx="11" cy="11" r="6"/><path d="M20 20l-4-4"/>'),
  next: svg('<path d="M9 6l6 6-6 6"/>'),
  image: svg('<rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="M4 17l5-4 4 3 3-2 4 3"/>'),
};

export const statusbar = () => '<div class="statusbar"><span>9:41</span><span>5G</span></div>';

export const iconBtn = (act, label, icon, { arg = '', pulse = false, id = '' } = {}) =>
  `<button class="icon-btn${pulse ? ' pulse' : ''}" type="button" ${id ? `id="${id}"` : ''} data-act="${act}" ${arg ? `data-arg="${arg}"` : ''} aria-label="${esc(label)}">${icon}</button>`;

export const appbar = (title, { back = false, right = '' } = {}) =>
  `<div class="appbar">${back ? iconBtn('back', 'Back', ico.back) : ''}<h3 tabindex="-1">${title}</h3>${right}</div>`;

/* ----- controls ----- */
export const seg = (act, options, current, { hint = false, label = '' } = {}) =>
  `<div class="seg${hint ? ' hint' : ''}" style="grid-template-columns:repeat(${options.length},1fr)" role="group" aria-label="${esc(label)}">${options.map(([id, text]) =>
    `<button type="button" data-act="${act}" data-arg="${id}" aria-pressed="${id === current}">${text}</button>`).join('')}</div>`;

export const toggle = (act, label, on, caption = '', { hint = false } = {}) =>
  `<div class="switch-row${hint ? ' hint' : ''}"><div><div class="label">${label}</div>${caption ? `<div class="caption">${caption}</div>` : ''}</div>
   <button class="switch" type="button" role="switch" aria-checked="${on}" aria-label="${esc(label)}" data-act="${act}"><span></span></button></div>`;

export const slider = (act, id, label, value, min, max, step = 1, suffix = '%') =>
  `<label class="slider"><span class="slider-top"><span>${label}</span><output id="${id}-out">${value}${suffix}</output></span>
   <input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${value}" data-act="${act}"></label>`;

export const settingsBody = inner => `<div class="set-body" data-sk="sb" tabindex="0">${inner}</div>`;
export const label = t => `<div class="label">${t}</div>`;
export const caption = t => `<p class="caption">${t}</p>`;
export const sectionTitle = t => `<h4>${t}</h4>`;

/* ----- Settings home (the category cards) ----- */
export const THEME_LIST = [
  { id: 'default', name: 'Default', desc: 'Wallpaper colors', mood: 'Plain and clean — follows your wallpaper.', free: true },
  { id: 'dusk', name: 'Dusk', desc: 'Soft gradient', mood: 'Amber fading into indigo.', free: true },
  { id: 'creamforest', name: 'Cream & Forest', desc: 'Cream and forest green', mood: 'Warm paper and deep green, calm in light or dark.', free: true },
  { id: 'lavendercharcoal', name: 'Lavender & Charcoal', desc: 'Lavender on charcoal', mood: 'Soft purple on dark grey, the same whatever your wallpaper.', free: true },
  { id: 'matrix', name: 'Matrix', desc: 'Animated code rain', mood: 'Green glyphs falling in the dark.', free: true },
  { id: 'sunrise', name: 'Sunrise', desc: 'Warm gradient', mood: 'Peach morning light.' },
  { id: 'nightsky', name: 'Night Sky', desc: 'Starry night', mood: 'Moon, drifting stars, the odd shooting star.' },
  { id: 'photo', name: 'Photo', desc: 'Your photo', mood: 'Use your own pictures as the background.', free: true },
];
export const themeName = id => (THEME_LIST.find(t => t.id === id) || THEME_LIST[0]).name;

export function settingsHome(s, { pulse = '' } = {}) {
  const on = v => (v ? 'on' : 'off');
  const cards = [
    ['spam', 'Spam protection', `Smart detection ${on(s.smart ?? true)} · Automatic reporting ${on(s.autoReport)}`],
    ['widgets', 'Widgets &amp; dashboard', s.widgetsSummary || 'None enabled · Weather, calendar, sports and more'],
    ['appearance', 'Appearance', `${themeName(s.appliedTheme || 'default')} · Reduced motion ${on(s.reduceMotion)}`],
    ['messaging', 'Messaging &amp; notifications', 'Private alerts off · Undo send off'],
    ['backup', 'Backup &amp; data', 'Back up, restore or export your messages'],
    ['privacy', 'Privacy &amp; data', 'What stays on this phone, what is sent and when, and how to erase it'],
    ['help', 'Help &amp; advanced', 'Messaging health, diagnostics, insights and connections'],
  ];
  return statusbar() + appbar('Settings', { back: true }) + `<div class="set-body cats" tabindex="0">${cards.map(([id, t, d]) =>
    `<button class="cat${pulse === id ? ' tapping-ring' : ''}" type="button" data-act="cat" data-arg="${id}" id="cat-${id}"><b>${t}</b><span>${d}</span></button>`).join('')}</div>`;
}

/* ----- Messages: sample threads ----- */
export const THREADS = [
  { n: 'Sam Rivera', i: 'S', s: 'Perfect, see you there', t: '7:02 PM', unread: true },
  { n: 'Climbing crew', i: 'C', s: 'Maya: Saturday still on?', t: '6:40 PM' },
  { n: 'Mom', i: 'M', s: 'Photo', t: 'Tue' },
  { n: 'Dentist office', i: 'D', s: 'Your appointment is confirmed for Oct 14', t: 'Mon' },
];

export const threadRow = t => `<div class="row${t.unread ? ' unread' : ''}"><div class="avatar" aria-hidden="true">${t.i}</div>
  <div style="min-width:0"><div class="name">${esc(t.n)}</div><div class="snip">${esc(t.s)}</div></div><div class="time">${t.t}</div></div>`;

/* ----- Original photo art (CSS only, no third party imagery) ----- */
export const PHOTO_ALT = ['Sunset over water', 'Mountain ridge', 'Pine trees', 'City at dusk', 'Beach at noon', 'Lake at dawn'];
export const photo = (i, cls = '') => `<span class="ph p${(i % 6) + 1} ${cls}" role="img" aria-label="${PHOTO_ALT[i % 6]}"></span>`;

/* ----- Thread bubbles ----- */
export const bubble = (text, sent = false, extra = '') => `<div class="b ${sent ? 'sent' : 'recv'}${extra}">${text}</div>`;

/* ----- Appearance page (shared by text size, photos and themes) ----- */
export function appearancePage(s, { pulse = '' } = {}) {
  const spread = Math.round((s.stackSpread ?? 50));
  return statusbar() + appbar('Appearance', { back: true }) + settingsBody(`
    <div class="hero card-lite">
      <div class="label">${esc(themeName(s.appliedTheme || 'default'))}</div>
      <div class="caption">Applied theme</div>
      <div class="hero-actions">
        <button class="btn-s ghost" type="button" data-act="customize-current">Customize</button>
        <button class="btn-s${pulse === 'browse' ? ' tapping-ring' : ''}" type="button" id="browse" data-act="browse">Browse themes</button>
      </div>
    </div>
    <div class="card-lite">
      ${label('Color mode')}
      ${s.appliedTheme === 'creamforest'
        ? seg('colormode', [['system', 'System'], ['light', 'Light'], ['dark', 'Dark']], s.colorMode || 'system', { label: 'Color mode' }).replace(/<button /g, '<button disabled ') + '<p class="caption">Cream & Forest is always light, so Color mode does not apply to it.</p>'
        : seg('colormode', [['system', 'System'], ['light', 'Light'], ['dark', 'Dark']], s.colorMode || 'system', { label: 'Color mode' })}
      ${toggle('reducemotion', 'Reduce motion', s.reduceMotion || false, 'Applies across themes and previews, including motion effects.')}
      <div id="sec-textsize" class="sec">
        ${label('Message text size')}
        ${caption('Also adjustable by pinching inside a conversation.')}
        ${slider('textsize', 'ts', 'Message text size', s.textScale ?? 100, 85, 180)}
      </div>
      <div id="sec-photogroups" class="sec">
        ${label('Photo groups')}
        ${caption('How several photos sent together are drawn in a conversation.')}
        <div class="radios" role="radiogroup" aria-label="Photo groups">${[
          ['stack', 'Stack — layered deck, tap to fan out'], ['cascade', 'Cascade — staggered cards'], ['list', 'List — one after another'], ['carousel', 'Carousel — swipe through, staggered'], ['ring', 'Ring — photos in a circle you turn'],
        ].map(([id, t]) => `<button class="radio" type="button" role="radio" aria-checked="${(s.photoStyle || 'stack') === id}" data-act="photostyle" data-arg="${id}"><i></i><span>${t}</span></button>`).join('')}</div>
        ${(s.photoStyle || 'stack') === 'stack' ? slider('stackspread', 'ss', 'Stack spread', spread, 0, 100, 1, '%') : ''}
      </div>
    </div>`);
}

/* ----- Photo groups renderer (Stack / Cascade / List / Carousel) ----- */
const WHY_PHOTO = "Opening a photo full screen is not simulated here. The Photos tutorial shows the viewer.";
export function photoGroup(n, style, { sent = true, spread = 50, fanned = false, photos = null, key = 'g', pageAct = '', pageArg = null, rid = '', jump = false } = {}) {
  const ids = photos || [...Array(n).keys()];
  n = ids.length;
  // rid = DOM id of the group (so "open at my position" can find it); jump = outline it (the opened-at message).
  const root = cls => `class="pg ${cls}${jump ? ' jump' : ''}"${rid ? ` id="${rid}"` : ''}`;
  const argAttr = pageArg != null ? ` data-arg="${pageArg}"` : '';
  if (style === 'carousel' || style === 'ring') {
    // Endless: the photos are laid out three times and the track quietly re-centres, so swiping past the last photo
    // carries on to the first (CarouselPhotos loops the same way in PhotoCollage.kt). Only the middle copy is exposed
    // to keyboard and screen readers.
    const loop = n > 1, copies = loop ? 3 : 1;
    const pagesHtml = [...Array(copies).keys()].map(c => ids.map((p, i) => {
      const hide = (!loop || c === 1) ? '' : ' tabindex="-1" aria-hidden="true"';
      return pageAct ? `<button type="button" class="car-page" data-act="${pageAct}"${argAttr}${hide} aria-label="Photo ${i + 1} of ${n}. ${pageAct === 'hold' ? 'Press and hold for message actions.' : 'Open viewer.'}"><span class="car-in">${photo(p)}</span></button>`
        : `<button type="button" class="car-page" aria-disabled="true" data-why="${WHY_PHOTO}"${hide} aria-label="Photo ${i + 1} of ${n}"><span class="car-in">${photo(p)}</span></button>`;
    }).join('')).join('');
    const dots = n <= 8 ? `<div class="car-dots" aria-hidden="true">${ids.map((_, i) => `<i${i ? '' : ' class="on"'}></i>`).join('')}</div>` : '';
    return `<div ${root(`carousel${style === 'ring' ? ' ring' : ''}`)} role="group" aria-roledescription="carousel" aria-label="${n} photos"><div class="car-track" data-key="${key}" data-n="${n}" tabindex="0" aria-label="Photos. Use the left and right arrow keys to move.">${pagesHtml}</div>${dots}<p class="car-pos${n <= 8 ? ' sr' : ''}" role="status" aria-live="polite">1 of ${n}</p></div>`;
  }
  if (style === 'list') return `<div ${root(`list ${sent ? 'sent' : 'recv'}`)}>${ids.map(p => photo(p)).join('')}</div>`;
  const k = spread / 100;
  const items = ids.slice(0, 5).map((p, i) => {
    const m = Math.min(n, 5), rel = i - (m - 1) / 2;
    if (style === 'cascade') return `<span class="pc" style="transform:translate(${rel * (10 + 14 * k)}px,${i * 8}px) rotate(${rel * 2}deg)">${photo(p)}</span>`;
    const f = fanned ? 2.4 : 1;
    return `<span class="pc" style="transform:translateX(${rel * (6 + 20 * k) * f}px) rotate(${rel * (2 + 5 * k) * f}deg)">${photo(p)}</span>`;
  }).join('');
  return `<div ${root(`${style} ${sent ? 'sent' : 'recv'}`)}>${items}</div>`;
}

/** The photo each carousel was on, so a re-render does not send the reader back to photo 1. */
const carouselPage = new Map();
/** Ring layout maths lives in ring-layout.js (same numbers as RingLayout in PhotoCollage.kt); these two are website-only. */
const RING_PERSPECTIVE = 700;                       // website-only (the app uses cameraDistance)
const carouselMotionOff = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Wires every carousel under `root`: restores its photo, keeps "N of M" and the stagger / ring in step with the
 * swipe, supports the arrow keys, and loops endlessly (the track holds three copies and re-centres once a swipe
 * settles; the copies look identical, so the jump is invisible). Movement is always the reader's. Under reduced
 * motion the emphasis is off and arrow keys jump instead of gliding.
 */
export function bindCarousels(root, { motionOff = carouselMotionOff } = {}) {
  const cleanups = [];
  root.querySelectorAll('.car-track').forEach(track => {
    track._carouselCleanup?.();
    const controller = new AbortController();
    const pages = [...track.querySelectorAll('.car-page')], pos = track.parentElement.querySelector('.car-pos');
    if (!pages.length) return;                                  // nothing to wire (an empty group)
    const n = Number(track.dataset.n) || pages.length, loop = pages.length > n, ring = track.parentElement.classList.contains('ring');
    const step = () => (pages[1] ? pages[1].offsetLeft - pages[0].offsetLeft : pages[0].offsetWidth);
    const mod = i => loopPhoto(i, n);
    const show = idx => {
      carouselPage.set(track.dataset.key, idx);
      if (pos) pos.textContent = `${idx + 1} of ${n}`;
      track.parentElement.querySelectorAll('.car-dots i').forEach((d, i) => d.classList.toggle('on', i === idx));
    };
    const update = () => {
      const w = step() || 1, cur = track.scrollLeft / w;
      show(mod(Math.round(cur)));
      const off = motionOff();
      pages.forEach((page, i) => {
        const p = page.firstElementChild, wd = page.offsetWidth;
        if (off) { p.style.transform = ''; p.style.opacity = ''; p.style.zIndex = ''; p.style.visibility = ''; return; }
        const signed = i - cur;
        if (ring) {
          // A circle seen from inside (same maths as RingLayout.place in PhotoCollage.kt): the front photo faces you,
          // the rest turn toward the centre and the far half sits smaller, higher and dimmer behind. Each photo is
          // drawn once, on the half-circle it belongs to; its copy n slots away would land on the same spot.
          if (!ringDrawn(signed, n)) { p.style.visibility = 'hidden'; return; }
          p.style.visibility = '';
          const r = ringPlace(signed, n);
          const W = track.clientWidth || 300;                                   // sizes are shares of the carousel's width
          const tx = r.x * RING.RADIUS_FRAC * W - signed * wd;
          p.style.transform = `translate(${tx.toFixed(1)}px, ${(-r.lift * RING.LIFT_FRAC * W).toFixed(1)}px) perspective(${RING_PERSPECTIVE}px) rotateY(${r.tiltDeg.toFixed(1)}deg) scale(${r.scale.toFixed(3)})`;
          p.style.opacity = r.alpha.toFixed(3);
          p.style.zIndex = String(Math.round(1000 * r.depth) + 1000);
          return;
        }
        // Staggered: neighbours tuck in behind the centre photo, smaller and dimmer (CarouselPhotos in PhotoCollage.kt).
        const a = Math.abs(signed), cc = Math.min(a, 2);
        const visual = a <= 1 ? 0.70 * a : a <= 2 ? 0.70 + 0.42 * (a - 1) : 1.12 + (a - 2);
        const tx = ((signed < 0 ? -visual : visual) - signed) * wd;
        p.style.transform = `translateX(${tx.toFixed(1)}px) scale(${(1 - 0.17 * cc).toFixed(3)})`;
        p.style.opacity = (1 - 0.22 * cc).toFixed(3);
        p.style.zIndex = String(Math.round((10 - a) * 100));
      });
    };
    // Once a swipe settles outside the middle copy, jump a whole copy back: the picture is identical, so nothing moves.
    let settle = 0;
    // A jump of whole copies without animation or snapping (the picture is identical, so nothing visibly moves).
    const shiftCopies = (copies, w) => {
      const snap = track.style.scrollSnapType, beh = track.style.scrollBehavior;
      track.style.scrollSnapType = 'none'; track.style.scrollBehavior = 'auto';
      track.scrollLeft += copies * n * w;
      track.style.scrollSnapType = snap; track.style.scrollBehavior = beh;
    };
    // The photo (in track coordinates) a key press is gliding towards. Reading scrollLeft instead would lose presses made
    // while a smooth scroll is still in flight.
    let pending = null;
    const recentre = () => {
      pending = null;
      if (!loop) return;
      const w = step() || 1, idx = Math.round(track.scrollLeft / w);
      if (idx >= n && idx < 2 * n) return;
      shiftCopies(idx < n ? 1 : -1, w);
      update();
    };
    const saved = carouselPage.get(track.dataset.key) || 0;
    track.style.scrollBehavior = 'auto';
    track.scrollLeft = (saved + (loop ? n : 0)) * (step() || 0);
    update();
    track.addEventListener('scroll', () => { update(); clearTimeout(settle); settle = setTimeout(recentre, 140); }, { passive: true, signal: controller.signal });
    const move = dir => {
      const w = step() || 1;
      let here = pending ?? Math.round(track.scrollLeft / w);
      // Many quick presses could run off the end of the three copies: step a whole copy back first (identical picture).
      if (loop && (here + dir < 1 || here + dir > 3 * n - 2)) { const c = here + dir < 1 ? 1 : -1; shiftCopies(c, w); here += c * n; }
      const to = loop ? here + dir : Math.max(0, Math.min(n - 1, here + dir));
      pending = to;
      track.style.scrollBehavior = motionOff() ? 'auto' : 'smooth';
      track.scrollLeft = to * w;
      show(mod(to));                                           // the indicator follows the key press at once
      if (motionOff()) { update(); recentre(); } else { clearTimeout(settle); settle = setTimeout(recentre, 450); }
    };
    track.addEventListener('keydown', e => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault(); move(e.key === 'ArrowRight' ? 1 : -1);
    }, { signal: controller.signal });
    track.addEventListener('carouselstep', e => move(e.detail < 0 ? -1 : 1), { signal: controller.signal });
    let width = track.clientWidth;
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    media.addEventListener('change', update, { signal: controller.signal });
    const observer = new ResizeObserver(() => {
      if (track.clientWidth === width || !track.clientWidth) return;
      width = track.clientWidth;
      const idx = carouselPage.get(track.dataset.key) || 0;
      clearTimeout(settle); pending = null;
      track.style.scrollBehavior = 'auto';
      track.scrollLeft = (idx + (loop ? n : 0)) * (step() || 0);
      update();
    });
    observer.observe(track);
    const cleanup = () => { controller.abort(); observer.disconnect(); clearTimeout(settle); delete track._carouselCleanup; };
    track._carouselCleanup = cleanup;
    cleanups.push(cleanup);
  });
  return () => cleanups.forEach(cleanup => cleanup());
}
