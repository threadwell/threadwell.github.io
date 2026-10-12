// Shared parts of the guided-help demonstrations. A demonstration is the playground's own app (the same screens from
// play-views.js and the same actions from play-notes.js, the board and the Appearance screens) running on a separate sample
// session built by freshState(). Nothing here reaches the visitor's session, so a demonstration cannot create, change or
// complete anything of theirs.
import { phoneColumn, esc } from '../core.js';
import { freshState } from '../store.js';
import { views } from '../play-views.js';
import { stripState } from '../play-ui.js';
import { captureActs, navActs, messageActs, panelActs, applySave, motionOff } from '../play-notes.js';
import { boardActs } from '../board-app.js';
import { themeSpec } from '../demos/themes.js';
import { readableAccents } from '../accents.js';
import { replacePanel } from '../panel-motion.js';

/** Run actions that were written for a tutorial without letting them move this demonstration's step markers. */
const quiet = acts => Object.fromEntries(Object.entries(acts).map(([k, f]) => [k, (a, ...rest) => f(Object.create(a, { step: { value() {} } }), ...rest)]));

const stripBack = (a, expanded) => {
  a.s.stripExpanded = expanded; a.s.stripManual = expanded; a.s.dockOpen = false;
  replacePanel(a.el('home'), '.strip-slot', () => a.render(), { reduced: motionOff(a), widget: true });
};

/** The actions every demonstration can use. */
export const demoActs = () => ({
  ...quiet(boardActs()), ...quiet(themeSpec.acts),
  ...captureActs(), ...navActs(), ...messageActs(), ...panelActs(),
  savemsg(a) {
    const r = applySave(a.s); a.render(); if (!r || !r.added.length) return;
    const sp = a.s.spaces.find(x => x.id === r.added[0]);
    a.callout(`Saved to <b>${sp.emoji} ${esc(sp.name)}</b>. In the app a brief message at the bottom says <b>Saved to ${esc(sp.name)}</b>, with an <b>Open Space</b> button.`);
  },
  stripcollapse: a => stripBack(a, false),
  wshowtop: a => stripBack(a, true),
  wdock: a => { a.s.dockOpen = true; a.render(); },
  wdockclose: a => { a.s.dockOpen = false; a.render(); a.$('#wdock')?.focus({ preventScroll: true }); },
});

/** Scroll a list a little, the way a finger would (all at once under reduced motion). Pauses like every other wait. */
export async function scrollList(api, t, sel, px) {
  const el = api.$(sel); if (!el) return;
  const from = el.scrollTop;
  if (motionOff(api)) { el.scrollTop = from + px; await t.sleep(300); return; }
  for (let i = 1; i <= 12; i++) { el.scrollTop = from + (px * i) / 12; await t.sleep(45); }
}

/**
 * Build a demonstration. `make({ reduceMotion, setWide })` returns the spec that mountDemo runs.
 * def: { id, title, steps, note?, prepare?(s), acts?, play(api, t) }
 */
export function playDemo(def) {
  return ({ reduceMotion = false, setWide = () => {} } = {}) => {
    const ENDS = new Map();
    const acts = { ...demoActs(), ...(def.acts || {}) };
    return {
      id: def.id, title: def.title, steps: def.steps, devices: false, calloutLabel: 'Demonstration note',
      reducedMotion: () => reduceMotion,
      onDevice: id => setWide(['phoneL', 'foldOpen'].includes(id)),
      shell(spec) {
        return `<p class="demo-now" data-now></p>
          ${phoneColumn(spec, { demoButtons: false, sampleNote: 'Sample content only. This preview is not interactive while it plays.', label: 'Demonstration preview with fictional sample content. It is not interactive.' })}
          <ol class="steps demo-steps" aria-label="Steps in this demonstration">${def.steps.map(s => `<li><span>${s}</span></li>`).join('')}</ol>
          <p class="sr-only" role="status" aria-live="polite" id="demoStatus"></p>`;
      },
      start: 'home', history: [],
      state() { const s = { ...freshState(), reduceMotion, device: 'phone' }; def.prepare?.(s); return s; },
      views,
      chrome(screen, s) { themeSpec.chrome(screen, s); },
      onRender(a, name) {
        const el = a.el(name); if (!el) return;
        $$end(el, name, ENDS);
        if (name === 'home') a.s.dockInfo = stripState(a.s).dock;
        readableAccents(el);
      },
      acts,
      mounted(a, root) { root.querySelector('.screen').inert = true; },       // the script drives the phone; the visitor cannot compete with it
      // `act(name, arg)` runs one of this demonstration's own actions directly, for effects a finger would cause (a scroll).
      play: (api, t) => def.play(api, t, (name, arg) => acts[name](api, arg)),
    };
  };
}

// A conversation opens at its newest message, and stays where it is scrolled afterwards.
function $$end(el, name, ENDS) {
  const ends = [...el.querySelectorAll('[data-end]')];
  if (!ends.length) ENDS.delete(name);
  ends.forEach(n => { if (ENDS.get(name) !== n.dataset.sk) { n.scrollTop = n.scrollHeight; ENDS.set(name, n.dataset.sk); } });
}
