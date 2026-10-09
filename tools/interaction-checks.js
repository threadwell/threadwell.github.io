import { replacePanel } from '../js/panel-motion.js';
// Local-only browser regression suite. Serve the site locally and open tools/interaction-checks.html.
// Runs with synthetic artwork; never touches playground storage.
import { photoGroup, bindCarousels } from '../js/phone-ui.js';
import { showcaseHtml, mountShowcase } from '../js/showcase.js';
const fixture = document.querySelector('#fixture'), output = document.querySelector('#results');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const assert = (value, message) => { if (!value) throw new Error(message); };
let passes = 0, skipped = 0;
async function test(name, run) {
  await run(); passes++; output.textContent += `\nPASS ${name}`;
}
document.querySelector('#run').addEventListener('click', async e => {
  e.target.disabled = true; output.textContent = 'Running'; passes = 0; skipped = 0;
  let dispose = () => {};
  try {
    await test('Carousel responds to each rapid keypress and loops', async () => {
      fixture.innerHTML = `<div class="screen" style="width:330px;height:300px">${photoGroup(6, 'ring', { key: 'test-ring' })}</div>`;
      dispose = bindCarousels(fixture, { motionOff: () => true });
      const track = fixture.querySelector('.car-track');
      for (let i = 0; i < 17; i++) track.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      assert(fixture.querySelector('.car-pos').textContent === '6 of 6', '17 steps should end at photo 6');
      for (let i = 0; i < 19; i++) track.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      assert(fixture.querySelector('.car-pos').textContent === '5 of 6', 'Reverse wrapping lost steps');
    });
    await test('Duplicate copies stay out of keyboard navigation', () => {
      const copies = [...fixture.querySelectorAll('.car-page[aria-hidden="true"]')];
      assert(copies.length === 12 && copies.every(p => p.tabIndex === -1), 'Copies are focusable');
    });
    await test('Reduced motion clears photo transforms', () => {
      assert([...fixture.querySelectorAll('.car-in')].every(p => !p.style.transform), 'Transforms remain');
    });
    await test('Resizing retains the selected photo', async () => {
      fixture.querySelector('.screen').style.width = '240px'; await wait(150);
      assert(fixture.querySelector('.car-pos').textContent === '5 of 6', 'Resize changed selection');
      const t = fixture.querySelector('.car-track'), w = t.children[1].offsetLeft - t.children[0].offsetLeft;
      assert(Math.abs(t.scrollLeft / w - 10) < .1, 'Track is no longer centered on photo 5');
    });
    await test('Disposal removes handlers and observer', () => {
      const t = fixture.querySelector('.car-track'), before = t.scrollLeft;
      dispose(); t.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      assert(t.scrollLeft === before && !t._carouselCleanup, 'Disposed carousel still responds');
    });
    await test('Rebinding does not duplicate key handlers', () => {
      dispose = bindCarousels(fixture, { motionOff: () => true });
      dispose = bindCarousels(fixture, { motionOff: () => true });
      fixture.querySelector('.car-track').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      assert(fixture.querySelector('.car-pos').textContent === '6 of 6', 'Rebind duplicated a handler'); dispose();
    });
    await test('Homepage theme controls reuse the app palette', () => {
      fixture.innerHTML = showcaseHtml(); const home = mountShowcase(fixture); dispose = () => home.destroy();
      fixture.querySelector('[data-look="lavendercharcoal"]').click();
      assert(fixture.querySelector('#look-screen').style.getPropertyValue('--teal') === '#d0bcff', 'Lavender palette differs');
      fixture.querySelector('[data-look="creamforest"]').click();
      assert(fixture.querySelector('#look-screen').dataset.light === '1', 'Cream must stay light');
    });
    await test('Every homepage photo layout renders and controls stay truthful', () => {
      for (const b of fixture.querySelectorAll('[data-photo-style]')) {
        b.click(); const carousel = ['ring', 'carousel'].includes(b.dataset.photoStyle);
        assert(b.getAttribute('aria-pressed') === 'true', 'Selection missing');
        assert(fixture.querySelector('.look-navigation').hidden === !carousel, 'Wrong navigation shown');
        assert(fixture.querySelectorAll('#look-photos .ph').length > 0, 'No artwork rendered');
      }
    });
    dispose();
    await test('Panel exits retain only an inert, unlabelled visual copy', async () => {
      fixture.innerHTML = '<div class="strip-slot" style="display:block"><button id="old-panel-button" style="height:100px">Old</button></div>';
      replacePanel(fixture, '.strip-slot', () => { fixture.querySelector('.strip-slot').innerHTML = '<button style="height:40px">New</button>'; }, { widget: true });
      if (!fixture.animate) {
        assert(fixture.textContent === 'New', 'Instant fallback did not render');
        skipped++; output.textContent += '\nNOTE Animated exit skipped: this browser has no Web Animations API; instant fallback checked'; return;
      }
      const ghost = fixture.querySelector('[data-panel-ghost]');
      assert(ghost?.inert && ghost.getAttribute('aria-hidden') === 'true', 'Ghost is interactive');
      assert(!ghost.querySelector('[id]'), 'Ghost retained duplicate IDs');
      await wait(350);
      assert(!fixture.querySelector('[data-panel-ghost]') && !fixture.querySelector('[data-panel-animating]'), 'Animation did not clean up');
      assert(fixture.textContent === 'New', 'Wrong final content');
    });
    await test('Reduced motion changes panels immediately', () => {
      replacePanel(fixture, '.strip-slot', () => { fixture.querySelector('.strip-slot').textContent = 'Instant'; }, { reduced: true });
      assert(fixture.textContent === 'Instant' && !fixture.querySelector('[data-panel-animating]'), 'Reduced motion animated');
    });
    await test('Interrupting panel motion preserves the latest state', async () => {
      for (const label of ['First', 'Second', 'Final']) replacePanel(fixture, '.strip-slot', () => { fixture.querySelector('.strip-slot').innerHTML = `<button style="height:60px">${label}</button>`; });
      await wait(350);
      assert(fixture.textContent === 'Final' && !fixture.querySelector('[data-panel-ghost]'), 'Interrupted transition left stale content');
    });
    output.textContent += `\n\n${passes} passed, 0 failures; ${skipped} animation-only check skipped`;
  } catch (err) { output.textContent += `\nFAIL ${err.message}`; }
  finally { dispose(); fixture.innerHTML = ''; e.target.disabled = false; }
});

