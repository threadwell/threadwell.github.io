// Homepage controls are website controls; the excerpt uses the app simulator's real
// photo renderer, theme palettes and motion. No changes are made to the playground session.
import { photoGroup, bindCarousels, statusbar, bubble } from './phone-ui.js';
import { themeSpec } from './demos/themes.js';

const STYLES = [['ring', 'Ring'], ['carousel', 'Carousel'], ['stack', 'Stack'], ['cascade', 'Cascade'], ['list', 'List']];
const THEMES = [['creamforest', 'Cream & Forest'], ['lavendercharcoal', 'Lavender & Charcoal']];
export const showcaseHtml = () => `
<section class="look-studio" aria-labelledby="look-title">
  <div class="look-copy">
    <p class="kicker">Make yourself at home</p>
    <h2 id="look-title">Your photos.<br><em>Your point of view.</em></h2>
    <p>Turn through a ring of photos. Keep a simple stack. Find the colors you want to come back to.</p>
    <fieldset class="look-options"><legend>Choose a theme</legend>
      ${THEMES.map(([id, name], i) => `<button type="button" data-look="${id}" aria-pressed="${!i}"><span class="look-swatch ${id}" aria-hidden="true"></span>${name}</button>`).join('')}
    </fieldset>
    <fieldset class="look-options look-layouts"><legend>Arrange the photos</legend>
      ${STYLES.map(([id, name], i) => `<button type="button" data-photo-style="${id}" aria-pressed="${!i}">${name}</button>`).join('')}
    </fieldset>
    <p class="look-description" id="look-description">Swipe through the ring, or use the arrows below.</p>
    <a class="text-link" href="#personalize">Try themes in the playground <span aria-hidden="true">↗</span></a>
    <a class="text-link look-secondary" href="#photo-layouts">Find photo layouts in Appearance <span aria-hidden="true">↗</span></a>
  </div>
  <div class="look-example">
    <div class="phone look-phone" role="region" aria-label="Interactive photo-layout excerpt from Threadwell">
      <div class="screen" id="look-screen"><div class="view look-view">
        ${statusbar()}<div class="appbar"><span class="avatar" aria-hidden="true">C</span><div><h3>Climbing crew</h3><p class="muted">Sample conversation</p></div></div>
        <div class="look-conversation">${bubble('A few favorites from the weekend.')}<div id="look-photos"></div>${bubble('Same time next weekend?', true)}</div>
      </div></div>
    </div>
    <div class="look-navigation" role="group" aria-label="Website photo preview controls">
      <button type="button" data-photo-step="-1" aria-label="Previous preview photo">←</button>
      <p id="look-position" role="status" aria-live="polite">Photo 1 of 6</p>
      <button type="button" data-photo-step="1" aria-label="Next preview photo">→</button>
    </div>
    <p class="look-note">Interactive app excerpt. These selectors belong to the website; in the app, find these options in Appearance. Sample artwork.</p>
    <p id="look-feedback" class="look-note" role="status"></p>
  </div>
</section>`;

export function mountShowcase(root) {
  const screen = root.querySelector('#look-screen');
  const slot = root.querySelector('#look-photos');
  const state = themeSpec.state();
  state.appliedTheme = 'creamforest'; state.colorMode = 'dark';
  let style = 'ring', dispose = () => {};
  const observer = new MutationObserver(() => {
    const pos = slot.querySelector('.car-pos');
    if (pos) root.querySelector('#look-position').textContent = `Photo ${pos.textContent}`;
  });
  const render = () => {
    observer.disconnect(); dispose();
    slot.innerHTML = photoGroup(6, style, { sent: false, key: 'homepage-photo-excerpt', photos: [0, 1, 2, 3, 4, 5] });
    themeSpec.chrome(screen, state);
    dispose = bindCarousels(slot);
    // Photo opening isn't part of this excerpt; expose that limitation on demand.
    slot.querySelectorAll('.car-page:not([aria-hidden="true"])').forEach(el => el.removeAttribute('aria-disabled'));
    const carousel = style === 'ring' || style === 'carousel';
    root.querySelector('.look-navigation').hidden = !carousel;
    const pos = slot.querySelector('.car-pos');
    root.querySelector('#look-position').textContent = pos ? `Photo ${pos.textContent}` : '6 sample photos';
    if (pos) { pos.removeAttribute('role'); pos.setAttribute('aria-live', 'off'); }
    observer.observe(slot, { subtree: true, childList: true, characterData: true });
    root.querySelector('#look-description').textContent = carousel
      ? `Swipe through the ${style}, or use the arrows below.`
      : `Six photos arranged as a ${style === 'list' ? 'scrollable list' : style}. Try Ring or Carousel to swipe through them.`;
    root.querySelector('#look-feedback').textContent = '';
  };
  const click = e => {
    const theme = e.target.closest('[data-look]');
    if (theme) {
      state.appliedTheme = theme.dataset.look;
      root.querySelectorAll('[data-look]').forEach(b => b.setAttribute('aria-pressed', String(b === theme)));
      // Keep the DOM and reading position while the existing 450ms app color transition runs.
      themeSpec.chrome(screen, state); return;
    }
    const layout = e.target.closest('[data-photo-style]');
    if (layout) {
      style = layout.dataset.photoStyle;
      root.querySelectorAll('[data-photo-style]').forEach(b => b.setAttribute('aria-pressed', String(b === layout)));
      render(); return;
    }
    const step = e.target.closest('[data-photo-step]');
    if (step) { slot.querySelector('.car-track')?.dispatchEvent(new CustomEvent('carouselstep', { detail: Number(step.dataset.photoStep) })); return; }
    if (e.target.closest('#look-photos .car-page')) root.querySelector('#look-feedback').textContent = 'This excerpt shows photo layouts. In the Android app, tap a photo to open it full screen.';
  };
  root.addEventListener('click', click); render();
  return { destroy() { dispose(); observer.disconnect(); clearTimeout(screen._theming); root.removeEventListener('click', click); } };
}
