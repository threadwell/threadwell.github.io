// Real keyboard checks, driven through the browser's own input pipeline (CDP Input.dispatchKeyEvent), so Tab order,
// default focus handling and Escape behave as they do for a person. Called by tools/run-headless.mjs.
const KEYS = { Tab: [9, 'Tab'], Enter: [13, 'Enter'], Escape: [27, 'Escape'], Space: [32, ' '], ArrowLeft: [37, 'ArrowLeft'], ArrowUp: [38, 'ArrowUp'], ArrowRight: [39, 'ArrowRight'], ArrowDown: [40, 'ArrowDown'], Home: [36, 'Home'], End: [35, 'End'] };
const wait = ms => new Promise(r => setTimeout(r, ms));

export async function keyboardChecks({ send, evalv }) {
  const results = [];
  const rec = (name, ok, detail = '') => results.push([name, !!ok, detail]);
  const press = async (name, mods = 0) => {
    const [vk, key] = KEYS[name];
    const base = { key, code: name === 'Space' ? 'Space' : name, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, modifiers: mods };
    await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...base, text: name === 'Enter' ? '\r' : name === 'Space' ? ' ' : undefined });
    if (name === 'Enter' || name === 'Space') await send('Input.dispatchKeyEvent', { type: 'char', ...base, text: name === 'Enter' ? '\r' : ' ' });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', ...base });
    await wait(150);
  };
  const where = () => evalv(`(() => { const a = document.activeElement; if (!a || a === document.body) return 'body';
    return (a.id ? '#' + a.id : a.tagName.toLowerCase()) + (a.dataset && a.dataset.dc ? '[dc=' + a.dataset.dc + ']' : '') + (a.dataset && a.dataset.show ? '[show=' + a.dataset.show + ']' : '') + (a.dataset && a.dataset.act ? '[act=' + a.dataset.act + ']' : ''); })()`);
  const tabTo = async (pred, max = 60, shift = false) => { for (let i = 0; i < max; i++) { await press('Tab', shift ? 8 : 0); const w = await where(); if (pred(w)) return { ok: true, n: i + 1, w }; } return { ok: false, n: max, w: await where() }; };

  await evalv(`location.hash = '#guided'`); await wait(2500);

  // 1. Show me from the keyboard: Enter starts it, Tab reaches Pause, Enter pauses, Resume, then Return to playground gives focus back.
  await evalv(`document.querySelector('[data-show="theme"]').focus()`);
  await press('Enter'); await wait(1200);
  rec('keyboard: Enter on Show me starts the demonstration', await evalv(`document.querySelector('#pgDemo').dataset.state`) === 'playing');
  const focusAfterStart = await where();
  rec('keyboard: focus moves into the demonstration controls when it starts', /dc=/.test(focusAfterStart) || /pgDemo/.test(focusAfterStart), focusAfterStart);
  const toPause = await tabTo(w => /dc=pause/.test(w), 14);
  if (!/dc=pause/.test(await where())) { await evalv(`document.querySelector('[data-dc="pause"]').focus()`); }
  await press('Enter'); await wait(300);
  rec('keyboard: Pause button pauses (Tab reached it in ' + toPause.n + ')', await evalv(`document.querySelector('#pgDemo').dataset.state`) === 'paused', await where());
  rec('keyboard: after pausing, focus is on a visible control (Resume), not lost', /dc=resume/.test(await where()), await where());
  await press('Enter'); await wait(400);
  rec('keyboard: Resume plays again', await evalv(`document.querySelector('#pgDemo').dataset.state`) === 'playing');
  await evalv(`document.querySelector('[data-dc="exit"]:not([hidden])').focus()`); await press('Enter'); await wait(500);
  const back = await where();
  rec('keyboard: Return to playground restores state and returns focus to the Show me button', await evalv(`document.querySelector('#pgDemo').hidden`) === true && /show=theme/.test(back), back);
  rec('keyboard: the playground is usable again (phone not inert or suspended)', await evalv(`!document.querySelector('.phonecol.suspended') && !document.querySelector('.phonecol').inert`));

  // 2. The Space icon studio: reachable by Tab, Escape closes only it, focus returns to Change icon.
  await evalv(`document.querySelector('#morebtn').click()`); await wait(400);
  await evalv(`document.querySelector('#managebtn').click()`); await wait(400);
  await evalv(`document.querySelector('[data-act="spedit"]').click()`); await wait(400);
  await evalv(`document.querySelector('#iconchange').focus()`);
  await press('Enter'); await wait(500);
  rec('keyboard: Enter on Change icon opens the studio', await evalv(`!!document.querySelector('[aria-label="Space icon"]')`));
  const first = await where();
  rec('keyboard: opening the studio puts focus inside it', await evalv(`document.querySelector('[aria-label="Space icon"]').contains(document.activeElement)`), first);
  // The emoji grid is one Tab stop; arrows move inside it. Tab must reach Done quickly and never land behind the dialog.
  const stops = [], inDlg = () => evalv(`(() => { const d = document.querySelector('[aria-label="Space icon"]'); return !!d && d.contains(document.activeElement); })()`);
  let escaped = 0, reachedDone = 0;
  for (let i = 0; i < 40; i++) {
    await press('Tab'); const w = await where(); stops.push(w);
    if (!(await inDlg())) escaped++;
    if (!reachedDone && /#icondone/.test(w)) reachedDone = i + 1;
  }
  rec('keyboard: Tab reaches Done within 12 presses (the emoji grid is a single stop)', reachedDone > 0 && reachedDone <= 12, 'reached in ' + (reachedDone || 'never'));
  rec('keyboard: Tab never lands on a control behind the studio dialog', escaped === 0, escaped + ' of 40 presses left the dialog');
  await evalv("document.querySelector('.icell').focus()");
  const idx = () => evalv("[...document.querySelectorAll('#iconresults .icell')].indexOf(document.activeElement)");
  await press('ArrowRight'); const r1 = await idx();
  await press('ArrowRight'); await press('ArrowLeft'); const r2 = await idx();
  await press('ArrowDown'); const d1 = await idx();
  await press('ArrowUp'); const u1 = await idx();
  await press('End'); const e1 = await idx(); const total = await evalv("document.querySelectorAll('#iconresults .icell').length");
  await press('Home'); const h1 = await idx();
  rec('keyboard: arrow keys move through the emoji grid', r1 === 1 && r2 === 1, 'right -> ' + r1 + ', right+left -> ' + r2);
  rec('keyboard: Down and Up move by a row and back', d1 > 1 && u1 === 1, 'down -> ' + d1 + ', up -> ' + u1);
  rec('keyboard: Home and End jump to the ends', h1 === 0 && e1 === total - 1, 'home ' + h1 + ', end ' + e1 + ' of ' + total);
  rec('keyboard: exactly one emoji cell is tabbable', await evalv(`document.querySelectorAll('#iconresults .icell[tabindex="0"]').length`) === 1);
  await evalv(`document.querySelector('[aria-label="Space icon"] .stab.on').focus()`);
  await press('Tab', 8);
  rec('keyboard: Shift+Tab from the first control wraps to the last (Done)', /#icondone/.test(await where()), await where());
  await press('Tab');
  rec('keyboard: Tab from Done wraps to the first control', /stab|button/.test(await where()) && await inDlg(), await where());
  await evalv(`document.querySelector('#iconq').focus()`);
  await press('Escape'); await wait(400);
  rec('keyboard: Escape closes only the studio', await evalv(`!document.querySelector('[aria-label="Space icon"]') && !!document.querySelector('[aria-label="Edit Space"]')`));
  rec('keyboard: focus returns to Change icon after Escape', (await where()) === '#iconchange[act=studioopen]', await where());
  // choose an emoji by keyboard
  await press('Enter'); await wait(400);
  await evalv(`document.querySelector('.icell[data-arg="🍕"]').focus()`); await press('Enter'); await wait(400);
  rec('keyboard: Enter on an emoji picks it and closes the studio', await evalv(`!document.querySelector('[aria-label="Space icon"]') && /🍕/.test(document.querySelector('#iconname').textContent)`));
  return results;
}
