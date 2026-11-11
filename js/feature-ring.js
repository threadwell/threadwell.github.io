// Home page feature ring: a circle of real app screens that turns as you scroll past it, bringing one feature to the
// front at a time. Placement comes from ringPlace (ring-layout.js), the same rule as the app's photo Ring.
// The screens are the tutorials' own renderers, frozen (no ids, no actions, inert). Native scroll only: the section is
// tall, its stage is sticky, and scroll position sets the turn. Reduced motion: a plain grid, no turning.
import { ringPlace, RING } from './ring-layout.js';
import { esc } from './core.js';
import { widgetState } from './widgets-model.js';
import categories from './demos/categories.js';
import pinned from './demos/pinned.js';
import widgets from './demos/widgets.js';
import spam from './demos/spam.js';
import editPhoto from './demos/edit-photo.js';
import dateJump from './demos/date-jump.js';
import themes from './demos/themes.js';

const freeze = html => html.replace(/ id="[^"]*"/g, '').replace(/ data-(act|arg|sk|enter|esc|end)="[^"]*"/g, '')
  .replace(/ tapping-ring| pulse(?=["\s])/g, '');
const screen = (spec, view, over = {}) => freeze(spec.views[view]({ ...spec.state(), pulse: '', ...over }));

// Facts follow each tutorial (and the app's CLAUDE.md through them).
const FEATURES = [
  { id: 'threadmarks', name: 'Spaces and Threadmarks', line: 'Save the part of a conversation worth keeping into a Space, next to its checklist.', art: 'board' },
  { id: 'message-categories', soon: true, name: 'Message categories', line: 'Personal, Money, Codes, Updates and Promotions tabs, sorted on your phone.', art: () => screen(categories, 'home', { on: true, tab: 'Codes' }) },
  { id: 'pinned-chats', soon: true, name: 'Pinned chats, your way', line: 'Pins stay in the order you choose, as rows or a row of photos.', art: () => screen(pinned, 'home', { style: 'photos', sort: 'custom' }) },
  { id: 'widgets', name: 'Widgets', line: 'Weather, calendar, countdowns and more under your Messages header. All off until you add them.', art: () => screen(widgets, 'home', widgetState({ en: { weather: true, countdown: true } })) },
  { id: 'spam-rules', name: 'Spam protection', line: 'Checks run on your phone. Flagged texts wait in Spam, where you can bring them back.', art: () => screen(spam, 'spamfolder', { keywords: ['free cruise', 'claim'] }) },
  { id: 'edit-photo', soon: true, name: 'Edit before you send', line: 'Open a photo or video in your editor and send the edited copy.', art: () => screen(editPhoto, 'thread', { pulse: '' }), bottom: true },
  { id: 'go-to-date', soon: true, name: 'Go to a date', line: 'Jump to the first message, or to any day, in a long conversation.', art: () => screen(dateJump, 'thread', { target: 3, pulse: '' }) },
  { id: 'themes', name: 'Themes', line: 'Try a theme on in a full preview, then make it yours with your own colors.', art: () => screen(themes, 'gallery') },
];

export function featureRingHtml(boardPreview) {
  const cards = FEATURES.map((f, i) => {
    let art = '';
    try { art = f.art === 'board' ? boardPreview() : `<div class="fr-screen${f.bottom ? ' fr-bottom' : ''}"><div class="screen"><section class="view" inert>${f.art()}</section></div></div>`; }
    catch { art = ''; }
    return `<li class="fr-card" data-i="${i}">
      <div class="fr-art" aria-hidden="true">${art}</div>
      <div class="fr-copy">${f.soon ? '<span class="fr-soon">Next update</span>' : ''}<h3>${esc(f.name)}</h3><p>${esc(f.line)}</p><a href="#${f.id}">Try it<span class="sr-only">: ${esc(f.name)}</span></a></div></li>`;
  }).join('');
  return `<section class="fr" aria-labelledby="fr-title" style="--n:${FEATURES.length}">
    <div class="fr-stage">
      <div class="fr-head"><h2 id="fr-title">What Threadwell can do</h2>
        <p class="fr-hint">Scroll to turn the ring. Every card opens a tutorial you can try.</p>
        <div class="fr-now" aria-live="polite"></div>
        <div class="fr-dots" aria-hidden="true">${FEATURES.map(() => '<i></i>').join('')}</div></div>
      <ol class="fr-ring">${cards}</ol>
    </div></section>`;
}

export function mountFeatureRing(root) {
  const sec = root.querySelector('.fr'); if (!sec) return { destroy() {} };
  const cards = [...sec.querySelectorAll('.fr-card')], dots = [...sec.querySelectorAll('.fr-dots i')];
  const now = sec.querySelector('.fr-now'), n = cards.length;
  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  let active = -1, raf = 0;
  const fitTop = () => sec.style.setProperty('--fr-top', `${Math.round(document.querySelector('.top')?.getBoundingClientRect().height || 64)}px`);

  function place() {
    raf = 0; fitTop();
    if (still()) { sec.classList.add('fr-still'); cards.forEach(c => { c.style.transform = ''; c.style.opacity = ''; c.style.zIndex = ''; }); return; }
    sec.classList.remove('fr-still');
    const r = sec.getBoundingClientRect(), run = Math.max(1, r.height - innerHeight);
    const f = Math.min(1, Math.max(0, -r.top / run)) * (n - 1);
    const w = sec.querySelector('.fr-ring').clientWidth;
    cards.forEach((c, i) => {
      const p = ringPlace(i - f, n);
      c.style.transform = `translate(calc(-50% + ${(p.x * RING.RADIUS_FRAC * w).toFixed(1)}px), ${(-p.lift * RING.LIFT_FRAC * w).toFixed(1)}px) perspective(1200px) rotateY(${p.tiltDeg.toFixed(1)}deg) scale(${p.scale.toFixed(3)})`;
      c.style.opacity = p.alpha.toFixed(3);
      c.style.zIndex = String(Math.round(p.depth * 100) + 100);
    });
    const a = Math.round(f);
    if (a !== active) {
      active = a;
      cards.forEach((c, i) => { c.classList.toggle('on', i === a); c.toggleAttribute('aria-current', i === a); });
      dots.forEach((d, i) => d.classList.toggle('on', i === a));
      now.textContent = `${a + 1} of ${n}: ${FEATURES[a].name}`;
    }
  }
  const queue = () => { if (!raf) raf = requestAnimationFrame(place); };
  // A card's link reached by keyboard: scroll (natively) to where that card is in front.
  const onFocus = e => {
    const c = e.target.closest('.fr-card'); if (!c || still()) return;
    const r = sec.getBoundingClientRect(), run = r.height - innerHeight;
    const top = scrollY + r.top + run * (Number(c.dataset.i) / (n - 1));
    if (Math.abs(top - scrollY) > 4) scrollTo({ top, behavior: 'auto' });
  };
  addEventListener('scroll', queue, { passive: true, capture: true }); addEventListener('resize', queue);
  sec.addEventListener('focusin', onFocus);
  place();
  return { destroy() { removeEventListener('scroll', queue, { capture: true }); removeEventListener('resize', queue); sec.removeEventListener('focusin', onFocus); cancelAnimationFrame(raf); } };
}
