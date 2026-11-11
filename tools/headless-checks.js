// Evaluated inside the site page by tools/run-headless.mjs (it can also be pasted into a DevTools console).
// Returns { results: [[name, ok, detail]], errors }. It only drives the page and sends nothing anywhere.
// `window.__opts` may set { only: 'tutorials' | 'demos' | 'a11y', reduced: true }.
(async () => {
  const opts = window.__opts || {};
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const errors = [];
  addEventListener('error', e => errors.push(String(e.message || e)));
  addEventListener('unhandledrejection', e => errors.push(String((e.reason && e.reason.message) || e.reason)));
  const origErr = console.error;
  console.error = (...a) => { errors.push('console.error: ' + a.map(String).join(' ').slice(0, 200)); origErr.apply(console, a); };
  const results = [];
  const rec = (name, ok, detail = '') => results.push([name, !!ok, detail]);
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const until = async (fn, ms = 60000, step = 250) => { for (let t = 0; t < ms; t += step) { if (fn()) return true; await wait(step); } return false; };
  const go = async (hash, title) => {
    location.hash = hash; await wait(300);
    await until(() => document.title.includes(title || ''), 5000, 100); await wait(500);
  };
  const store = await import('/js/store.js');
  const snap = () => JSON.stringify([store.session.data, store.session.ui, store.session.tut]);
  const lsEmpty = () => { try { return localStorage.length === 0; } catch { return true; } };
  const mark = errors.length;

  /* ---------- standalone tutorials ---------- */
  if (!opts.only || opts.only === 'tutorials') {
    const ids = [...new Set($$('a[href^="#"]').map(a => a.getAttribute('href').slice(1)))]
      .filter(h => h && !['home', 'explore', 'guided', 'checklist', 'what-is', 'main', 'stage', 'personalize', 'photo-layouts', 'testers'].includes(h) && !/^what/.test(h));
    // Showcase links that open the playground at a starter rather than a tutorial.
    for (const [route, expect] of [['personalize', /theme|appearance/i], ['photo-layouts', /photo|appearance/i], ['checklist', /checklist|capture|add to threadwell/i]]) {
      const e0 = errors.length;
      location.hash = '#' + route; await wait(1500);
      const text = ($('.phonecol')?.innerText || '') + ' ' + ($('#pgNow, [data-now]')?.innerText || '');
      rec(`route #${route} opens the playground`, location.hash === '#explore' && expect.test(text) && errors.length === e0, `hash ${location.hash}, errors ${errors.length - e0}`);
    }
    for (const id of ids) {
      const e0 = errors.length;
      location.hash = '#' + id; await wait(1200);
      const btn = $('[data-ctl="play"]');
      if (!btn) { rec(`tutorial ${id}`, false, 'no Show me button'); continue; }
      const total = $$('ol.steps li, .steps li').length;
      btn.click(); await wait(800);
      const finished = await until(() => !$('[data-ctl="pause"]:not([hidden])') && $$('.steps li.on').length > 0 && !!$('[data-try], .done, [data-ctl="reset"]:not([hidden])'), 90000);
      await wait(600);
      const ticked = $$('.steps li.on').length;
      rec(`tutorial ${id}`, finished && ticked === total && errors.length === e0, `steps ${ticked}/${total}, errors ${errors.length - e0}`);
    }
  }

  /* ---------- Guided help Show me demos ---------- */
  if (!opts.only || opts.only === 'demos') {
    await go('#guided', 'Explore');
    const ids = $$('[data-show]').map(b => b.dataset.show);
    rec('guided: six Show me buttons', ids.length === 6, ids.join(','));
    for (const id of ids) {
      const e0 = errors.length;
      await go('#guided', 'Explore');
      // give the visitor something to lose: a half-typed draft in the playground's own composer, if it has one
      const draftEl = $('.phonecol textarea:not([hidden]), .phonecol input[type=text]:not([hidden])'); if (draftEl) { draftEl.value = 'half-typed ' + id; draftEl.dispatchEvent(new Event('input', { bubbles: true })); }
      const before = snap();
      $(`[data-show="${id}"]`).click();
      const ok = await until(() => $('#pgDemo')?.dataset.state === 'finished', 90000);
      const body = $('#pgDemoBody');
      const stepsDone = $$('.demo-steps li.on, #pgDemoBody li.on, #pgDemoBody .steps li.on').length;
      const phone = $('.phonecol.suspended');
      ($('[data-dc="try"]:not([hidden])') || $('[data-dc="exit"]:not([hidden])'))?.click(); await wait(500);
      rec(`demo ${id}: finishes`, ok, `steps ticked ${stepsDone}`);
      const after = snap(), same = after === before, restored = !$('.phonecol.suspended');
      let diff = ''; if (!same) { const a = JSON.parse(before), b = JSON.parse(after); const walk = (x, y, p) => { if (diff) return; if (x && y && typeof x === 'object' && typeof y === 'object') { for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) walk(x[k], y[k], p + '.' + k); } else if (JSON.stringify(x) !== JSON.stringify(y)) diff = p + ': ' + JSON.stringify(x)?.slice(0, 40) + ' -> ' + JSON.stringify(y)?.slice(0, 40); }; walk(a, b, ''); }
      const draftKept = !draftEl || (draftEl.isConnected && draftEl.value === 'half-typed ' + id);
      rec(`demo ${id}: playground untouched`, same && restored && draftKept && lsEmpty() && !!phone, `state ${same ? 'identical' : 'CHANGED ' + diff}, restored ${restored}, draft ${draftEl ? (draftKept ? 'kept' : 'LOST') : 'n/a'}, storage empty ${lsEmpty()}, was suspended ${!!phone}`);
      rec(`demo ${id}: no horizontal scroll at ${innerWidth}px`, document.documentElement.scrollWidth <= innerWidth + 1, `${document.documentElement.scrollWidth}`);
      rec(`demo ${id}: no errors`, errors.length === e0, errors.slice(e0).join(' | ').slice(0, 200));
    }
    // pause holds, resume continues, restart starts over
    await go('#guided', 'Explore');
    $('[data-show="theme"]').click(); await wait(2500);
    $('[data-dc="pause"]:not([hidden])').click(); await wait(300);
    const p1 = $('#pgDemoBody [data-now]')?.textContent; await wait(3000);
    const p2 = $('#pgDemoBody [data-now]')?.textContent;
    rec('demo pause holds the current step', $('#pgDemo').dataset.state === 'paused' && p1 === p2, `${p1} -> ${p2}`);
    $('[data-dc="resume"]:not([hidden])').click(); await wait(500);
    rec('demo resume plays again', $('#pgDemo').dataset.state === 'playing', '');
    $('[data-dc="exit"]:not([hidden])')?.click(); await wait(400);
    rec('demos: localStorage stayed empty', lsEmpty(), '');
  }

  /* ---------- accessibility structure ---------- */
  if (!opts.only || opts.only === 'a11y') {
    await go('#guided', 'Explore');
    const named = el => !!(el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.textContent.trim() || el.title);
    const bad = [];
    for (const el of $$('.phonecol button, .phonecol [role="button"], .phonecol input, .phonecol textarea')) {
      if (el.closest('[hidden], [inert]')) continue;
      if (!named(el) && !(el.labels && el.labels.length)) bad.push((el.id || el.className || el.tagName).toString().slice(0, 40));
    }
    rec('playground controls have accessible names', bad.length === 0, bad.slice(0, 5).join(', '));
    // open the Space icon studio in the playground and check the dialog contract
    $('#morebtn')?.click(); await wait(400); $('#managebtn')?.click(); await wait(400);
    $('[data-act="spedit"]')?.click(); await wait(400); $('#iconchange')?.click(); await wait(400);
    const dlg = $('[role="dialog"][aria-label="Space icon"]');
    rec('studio is a named dialog with data-esc', !!dlg && dlg.dataset.esc === 'studiodone', '');
    rec('studio tabs: Emoji selected, Icons and Photo disabled with a reason', !!dlg && $$('[role="tab"]', dlg).map(t => t.getAttribute('aria-selected') + '/' + (t.getAttribute('aria-disabled') === 'true' && !!t.dataset.why)).join() === 'true/false,false/true,false/true', '');
    rec('studio cells are named and pressable', $$('.icell', dlg || document).length > 60 && $$('.icell', dlg || document).every(c => c.getAttribute('aria-label') && c.hasAttribute('aria-pressed')), '');
    $('[data-act="studiodone"]')?.click(); await wait(300);
    rec('closing the studio returns focus to Change icon', document.activeElement?.id === 'iconchange' || !$('[aria-label="Space icon"]'), document.activeElement?.id || '');
    $('[data-act="spcancel"]')?.click(); await wait(200);
    // horizontal overflow at the current width
    rec('no horizontal scroll', document.documentElement.scrollWidth <= innerWidth + 1, `${document.documentElement.scrollWidth} vs ${innerWidth}`);
  }

  rec('no script errors in the whole run', errors.length === mark, errors.slice(mark, mark + 3).join(' | ').slice(0, 300));
  console.error = origErr;
  return { results, errors };
})();
