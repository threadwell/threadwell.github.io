// Demo engine: one phone, a stack of named views, shared state, direct manipulation and a "Show me" run.
// A demo is a plain spec object (see js/demos/*.js). The engine owns routing between views, the step list,
// autoplay cancellation and Reset, so every demo behaves the same way.

export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const CANCEL = Symbol('cancel');

// The preview size is a website setting, not tutorial state: it survives Reset and switching tutorials.
export const DEVICES = [
  ['phone', 'Phone — portrait'], ['phoneL', 'Phone — landscape'],
  ['foldCover', 'Foldable — cover screen'], ['foldOpen', 'Foldable — unfolded'],
];
// What changes at each size. Threadwell reacts to window width and height only; it has no fold or hinge handling.
const DEVICE_HINT = {
  phone: 'Narrow window: your Spaces sit in a bar above the conversation, and the rest are under <b>More</b>.',
  phoneL: 'Landscape is a wide window (600dp and up): the <b>Space list</b> moves beside the conversation, and on a short screen the thread rail scrolls as one list.',
  foldCover: 'The cover screen is narrow, so Threadwell uses the same layout as a phone.',
  foldOpen: 'Unfolded, the window is wide, so the <b>Space list</b> sits beside the conversation. Threadwell responds to window size, not to the fold itself.',
};
let deviceChoice = 'phone';

/** The phone, its size controls and the tutorial callout. Shared by the tutorials and the playground. */
export function phoneColumn(spec, { demoButtons = true, sampleNote = 'Sample data. Changing tutorials starts this preview over.', label = 'Phone preview with sample data. Controls that belong to this tutorial work; the rest are dimmed.' } = {}) {
  return `<div class="phonecol">
      <div class="xbar"><strong>Preview</strong>
        ${demoButtons ? `<button class="btn sm" type="button" data-x="play">Show me</button>
        <button class="btn ghost sm" type="button" data-x="reset">Reset</button>` : ''}
        <button class="btn ghost sm" type="button" data-x="close">Close preview</button></div>
      ${spec.devices ? `<div class="devbar">
        <p class="devtitle" id="devtitle">Preview size <span>Website setting, not an app feature</span></p>
        <div class="devbtns" role="group" aria-labelledby="devtitle">${DEVICES.map(([id, label]) => `<button type="button" data-dev="${id}" aria-pressed="false">${label}</button>`).join('')}</div>
        <p class="devhint" id="devhint"></p>
        <button class="btn ghost sm expand" type="button" id="expand" aria-expanded="false">Expand preview</button></div>` : ''}
      <div class="fitbox"><div class="phone" role="group" aria-label="${label}">
        <div class="screen"></div>
      </div></div>
      <p class="samplenote">${sampleNote}</p>
      <div class="callout" id="callout" hidden role="status" aria-live="polite"></div>
    </div>`;
}

export function mountDemo(root, spec) {
  root.innerHTML = spec.shell ? spec.shell(spec) : `
    <div class="entry-copy">
      <h1 tabindex="-1">${spec.title}</h1>
      <p class="lede">${spec.answer}</p>
      <ol class="steps" aria-label="Steps">${spec.steps.map(s => `<li><span>${s}</span></li>`).join('')}</ol>
      <div class="controls">
        <button class="btn" type="button" data-ctl="play">Show me</button>
        <button class="btn ghost" type="button" data-ctl="reset">Reset</button>
      </div>
    </div>
    ${phoneColumn(spec)}
    <div class="entry-after">
      ${spec.note ? `<p class="note">${spec.note}</p>` : ''}
      <p class="note sess"><strong>This tutorial runs in its own sample session.</strong> Nothing here touches a playground you may have open. <a href="#explore">Explore Threadwell freely</a> to use the same screens with your own content.</p>
      ${spec.next ? `<div class="next" id="next" hidden><strong>Done. What next?</strong><div>${spec.next.map(n => `<a class="btn ghost" href="#${n.id}">${n.label}</a>`).join('')}</div></div>` : ''}
    </div>
    <p class="sr-only" role="status" aria-live="polite" id="demoStatus"></p>`;

  const screen = $('.screen', root);
  const stepEls = $$('.steps li', root);
  const status = $('#demoStatus', root);
  const callout = $('#callout', root);
  const nextCard = $('#next', root);
  const phone = $('.phone', root), phonecol = $('.phonecol', root), fitbox = $('.fitbox', root);
  const devHint = $('#devhint', root), expandBtn = $('#expand', root);
  const WIDE = ['phoneL', 'foldOpen'];

  // ----- preview size -----
  // Only tutorials that opt in (devices: true) can leave the portrait phone; the rest always show it.
  const device = () => (spec.devices ? deviceChoice : 'phone');
  function applyDevice() {
    phone.dataset.device = device();
    root.dataset.device = device();
    root.classList.toggle('wide', WIDE.includes(device()));
    $$('[data-dev]', root).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.dev === deviceChoice)));
    if (devHint) devHint.innerHTML = DEVICE_HINT[deviceChoice];
    fit();
  }
  // Scale the frame to the room it has. Inline it shrinks to fit; expanded it stays readable and scrolls.
  function fit() {
    phone.style.transform = 'none';
    const w = phone.offsetWidth, h = phone.offsetHeight;
    const expanded = phonecol.classList.contains('expanded');
    const avail = expanded ? Math.min(window.innerWidth, phonecol.clientWidth) - 24 : phonecol.clientWidth;
    let k = Math.min(1, avail / w);
    if (expanded) k = Math.max(k, 0.8);
    phone.style.transform = k < 1 ? `scale(${k})` : 'none';
    fitbox.style.width = Math.round(w * k) + 'px';
    fitbox.style.height = Math.round(h * k) + (expanded ? 16 : 0) + 'px';   // room for the sideways scrollbar
    const small = !expanded && k < 0.8 && spec.devices;
    if (devHint && small) devHint.innerHTML = DEVICE_HINT[deviceChoice] + ' <b>This size is small here. Use Expand preview for a readable view.</b>';
    else if (devHint) devHint.innerHTML = DEVICE_HINT[deviceChoice];
  }
  const ro = new ResizeObserver(() => fit());
  ro.observe(phonecol);

  // ----- expanded preview (for small browser windows) -----
  function setExpanded(on) {
    phonecol.classList.toggle('expanded', on);
    document.body.classList.toggle('noscroll', on);
    if (expandBtn) { expandBtn.setAttribute('aria-expanded', String(on)); expandBtn.textContent = on ? 'Close preview' : 'Expand preview'; }
    fit();
    (on ? $('[data-x="close"]', root) : expandBtn)?.focus({ preventScroll: true });
  }
  const onDocKey = e => { if (e.key === 'Escape' && !e.defaultPrevented && phonecol.classList.contains('expanded')) setExpanded(false); };
  document.addEventListener('keydown', onDocKey);
  addEventListener('resize', fit);
  const views = {};            // name -> element
  let runId = 0;
  let ctx;

  const api = {
    get s() { return ctx.s; },
    get view() { return ctx.view; },
    render(name = ctx.view) {
      const el = ensure(name);
      const keep = el.contains(document.activeElement) ? document.activeElement.id : '';
      const layerKey = l => `${l.getAttribute('role')}|${l.getAttribute('aria-label') || ''}`;
      const before = new Set([...el.querySelectorAll(LAYER)].map(layerKey));
      const opener = el.contains(document.activeElement) ? document.activeElement.id : '';
      // A re-render must not cost the visitor their place: keep the caret in a field, and the scroll position of any
      // list that is still showing the same content (marked with data-sk).
      const ae = document.activeElement;
      const caret = el.contains(ae) && ae.id && 'selectionStart' in ae ? [ae.selectionStart, ae.selectionEnd] : null;
      const scrolls = new Map([...el.querySelectorAll('[data-sk]')].map(n => [n.dataset.sk, n.scrollTop]));
      el.querySelectorAll('[data-panel-animating]').forEach(p => p._panelCleanup?.());
      el.querySelectorAll('.car-track').forEach(t => t._carouselCleanup?.());
      el.innerHTML = spec.views[name](ctx.s, api);
      el.querySelectorAll('[data-sk]').forEach(n => { if (scrolls.has(n.dataset.sk)) n.scrollTop = scrolls.get(n.dataset.sk); });
      const now = [...el.querySelectorAll(LAYER)];
      // A menu or dialog that just opened takes focus (the innermost new one wins), for real users only.
      const fresh = now.filter(l => !before.has(layerKey(l))).pop();
      const closed = [...before].filter(k => !now.some(l => layerKey(l) === k)).pop();
      ctx.openers ||= {};
      if (fresh) ctx.openers[layerKey(fresh)] = opener;
      if (ctx.user && fresh) fresh.querySelector('button:not([aria-disabled]), input')?.focus({ preventScroll: true });
      else if (ctx.user && closed) {
        // Closing hands focus back to whatever opened it (or the screen's main area if that is gone).
        const id = ctx.openers[closed];
        const target = (id && el.querySelector('#' + CSS.escape(id))) || el.querySelector('.bcontent, .set-body, .thread, .list');
        target?.focus({ preventScroll: true });
      } else if (keep) {
        const f = el.querySelector('#' + CSS.escape(keep));
        f?.focus({ preventScroll: true });
        if (f && caret && 'setSelectionRange' in f) try { f.setSelectionRange(caret[0], caret[1]); } catch { /* not a text field */ }
      }
      chrome();
      spec.onRender?.(api, name);
    },
    go(name, { fresh = true } = {}) {
      if (fresh || !views[name]) api.render(name);
      if (ctx.view !== name) ctx.history.push(ctx.view);
      ctx.view = name;
      show(name);
    },
    back() {
      const prev = ctx.history.pop();
      if (!prev) return;
      api.render(prev);
      ctx.view = prev;
      show(prev);
    },
    refresh: () => chrome(),
    el: n => views[n],
    say: msg => { status.textContent = msg; },
    reset: () => reset(),
    userActed: () => !!ctx.user,
    // A note that belongs to the tutorial, not to the app. Used where the real app shows nothing.
    callout(html) {
      callout.hidden = !html;
      callout.innerHTML = html ? `<b>${spec.calloutLabel || 'Tutorial note'}</b> ${html}` : '';
    },
    step(n) {
      stepEls.forEach((li, i) => {
        li.classList.toggle('on', i < n);
        li.toggleAttribute('aria-current', i === n - 1);
      });
      if (n > 0 && stepEls[n - 1]) status.textContent = `Step ${n}: ${stepEls[n - 1].textContent}`;
      if (nextCard) nextCard.hidden = n < stepEls.length;
    },
    $: sel => $(sel, views[ctx.view]),
    $$: sel => $$(sel, views[ctx.view]),
  };

  // Overlays (dialogs, menus, toolbars) take focus when a real user opens them.
  const LAYER = '[role="dialog"], [role="menu"], [role="toolbar"]';

  // Show one view. Outgoing views become inert at once (so focus can never sit in, or tab into, a screen
  // that is fading out), and a real user's focus moves to the heading of the screen they arrived at.
  function show(name) {
    Object.entries(views).forEach(([n, el]) => { el.classList.toggle('hidden', n !== name); el.inert = n !== name; });
    chrome();
    if (ctx.user) $('h3', views[name])?.focus({ preventScroll: true });
    spec.onView?.(api, name);              // lets a tutorial react to a screen coming into view
    spec.onNav?.(name, ctx.history);       // lets the playground remember where the visitor is
  }

  // Optional per-demo hook that restyles the whole phone (used by the themes demo).
  const chrome = () => { if (spec.chrome && ctx) spec.chrome(screen, ctx.s, ctx.view); };

  function ensure(name) {
    if (!views[name]) {
      const el = document.createElement('section');
      el.className = 'view hidden';
      el.setAttribute('aria-label', name);
      screen.appendChild(el);
      views[name] = el;
    }
    return views[name];
  }

  function reset() {
    runId++;
    // The playground's state is a shared session: "reset" only rebuilds the screens, never the visitor's content.
    const s = spec.session ? spec.state() : { ...spec.state(), device: device() };
    if (spec.session) s.device = device();
    ctx = { s, view: null, history: [] };
    Object.values(views).forEach(v => v.remove());
    for (const k of Object.keys(views)) delete views[k];
    screen.removeAttribute('style'); screen.removeAttribute('data-theme');
    screen.querySelectorAll('.fx').forEach(n => n.remove());
    const resume = spec.resume?.();                // { view, history } where the visitor left off
    api.go(resume && spec.views[resume.view] ? resume.view : spec.start, { fresh: true });
    ctx.history = resume ? [...resume.history] : [...(spec.history || [])];   // screens "behind" the start screen, so Back has somewhere to go
    if (resume) spec.onNav?.(ctx.view, ctx.history);
    api.step(0);
    api.callout('');
    status.textContent = '';
  }

  // Direct manipulation: every control in the phone carries data-act.
  function dispatch(e) {
    const dead = e.target.closest('[aria-disabled="true"]');
    if (dead && screen.contains(dead) && !dead.closest('[data-act]')) { ctx.user = e.isTrusted; spec.onInert?.(api, dead); return; }
    const el = e.target.closest('[data-act]');
    if (!el || !screen.contains(el)) return;
    const name = el.dataset.act;
    ctx.user = e.isTrusted;            // who acted last: a real person (focus follows them) or Show me (it does not)
    if (name === 'back') { api.back(); spec.afterAct?.(api, name, el); return; }
    const fn = spec.acts[name];
    if (fn) { fn(api, el.dataset.arg, el, e); spec.afterAct?.(api, name, el, e); }
  }
  screen.addEventListener('click', dispatch);
  screen.addEventListener('input', e => { if (e.target.matches('[data-act]')) dispatch(e); });
  screen.addEventListener('keydown', e => {
    if (e.isTrusted) runId++;
    if (e.key === 'Enter' && e.target.dataset?.enter) { e.preventDefault(); $(e.target.dataset.enter, screen)?.click(); }
    // Escape closes the innermost open menu, sheet or dialog. Each declares its close action in data-esc.
    if (e.key === 'Escape' && e.isTrusted) {
      const layer = $$('[data-esc]', views[ctx.view]).pop();
      const fn = layer && spec.acts[layer.dataset.esc];
      if (fn) { e.preventDefault(); e.stopPropagation(); ctx.user = true; fn(api, undefined, layer, e); }
    }
  });
  screen.addEventListener('pointerdown', e => { if (e.isTrusted) runId++; });

  // Auto-play ("Show me"). Cancelled by any real user input, Reset, or leaving the question.
  async function play() {
    reset();
    const id = ++runId;
    const t = {
      sleep: ms => new Promise((res, rej) => setTimeout(() => (runId === id ? res() : rej(CANCEL)), reduced() ? Math.min(ms, 450) : ms)),
      async tap(sel) {
        const el = $(sel, views[ctx.view]);
        if (!el) throw new Error('tap target missing: ' + sel);
        el.classList.add('tapping');
        await t.sleep(520);
        el.classList.remove('tapping');
        el.click();
        await t.sleep(300);
      },
      // Animate a range input between two values (for sliders).
      async slide(sel, to, ms = 1200) {
        const el = $(sel, views[ctx.view]);
        const from = Number(el.value), start = performance.now();
        if (reduced()) { el.value = to; el.dispatchEvent(new Event('input', { bubbles: true })); return; }
        // Timer based (not requestAnimationFrame) so it still completes in a background or hidden tab.
        await new Promise((res, rej) => {
          const tick = () => {
            if (runId !== id) return rej(CANCEL);
            const p = Math.min(1, (performance.now() - start) / ms);
            el.value = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3)));
            el.dispatchEvent(new Event('input', { bubbles: true }));
            p < 1 ? setTimeout(tick, 16) : res();
          };
          tick();
        });
      },
    };
    try { await spec.play(api, t); }
    catch (e) { if (e !== CANCEL) throw e; }
  }

  $('[data-ctl="play"]', root)?.addEventListener('click', play);
  $('[data-ctl="reset"]', root)?.addEventListener('click', reset);
  // The same two actions are available inside the expanded preview, next to the phone.
  $('[data-x="play"]', root)?.addEventListener('click', play);
  $('[data-x="reset"]', root)?.addEventListener('click', reset);
  $('[data-x="close"]', root).addEventListener('click', () => setExpanded(false));
  expandBtn?.addEventListener('click', () => setExpanded(!phonecol.classList.contains('expanded')));

  // Changing the preview size keeps the conversation, Space, saved item and tutorial progress: only the layout changes.
  $$('[data-dev]', root).forEach(b => b.addEventListener('click', () => {
    deviceChoice = b.dataset.dev;
    ctx.s.device = deviceChoice;
    applyDevice();
    api.render();
    status.textContent = `Preview size: ${DEVICES.find(d => d[0] === deviceChoice)[1]}. Your place is kept.`;
    spec.afterAct?.(api, 'device');
  }));

  reset();
  applyDevice();
  spec.mounted?.(api, root);

  return {
    api,
    destroy() {
      runId++; ro.disconnect();
      root.querySelectorAll('[data-panel-animating]').forEach(p => p._panelCleanup?.());
      root.querySelectorAll('.car-track').forEach(t => t._carouselCleanup?.());
      spec.destroy?.();
      document.removeEventListener('keydown', onDocKey); removeEventListener('resize', fit);
      document.body.classList.remove('noscroll');
      root.innerHTML = ''; root.className = ''; delete root.dataset.device;
    },
    reset,
  };
}
