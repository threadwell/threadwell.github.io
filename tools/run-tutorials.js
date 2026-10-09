// Regression runner: plays every tutorial ("Show me") and reports script errors.
// Usage: open the site in a browser (any page), paste this whole file into the DevTools console, and read the result.
// (In the Claude browser pane, pass the file's text to the javascript tool.) It only drives the page; it sends nothing anywhere.
(async () => {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const errors = [];
  const onErr = e => errors.push(String((e && (e.message || e.reason)) || e));
  addEventListener('error', onErr); addEventListener('unhandledrejection', onErr);
  const origErr = console.error; console.error = (...a) => { errors.push('console.error: ' + a.map(String).join(' ').slice(0, 200)); origErr.apply(console, a); };

  const ids = [...new Set([...document.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute('href').slice(1)))]
    .filter(h => h && !['home', 'explore', 'guided', 'checklist', 'what-is', 'main', 'stage'].includes(h) && !/^what/.test(h));
  const results = [];
  for (const id of ids) {
    const before = errors.length;
    location.hash = '#' + id;
    await wait(900);
    const btn = document.querySelector('[data-ctl="play"], [data-x="play"]');
    if (!btn) { results.push(`${id}: no Show me button (skipped)`); continue; }
    const label = btn.textContent.trim();
    btn.click();
    let ran = 0;
    while (ran < 120000) {                                  // up to 2 minutes per tutorial
      await wait(500); ran += 500;
      const b = document.querySelector('[data-ctl="play"], [data-x="play"]');
      if (b && b.textContent.trim() === label && ran > 1500) break;
    }
    const steps = document.querySelectorAll('.steps li.on, ol.steps li.on').length;
    results.push(`${id}: ${ran >= 120000 ? 'TIMED OUT' : 'finished'} in ${(ran / 1000).toFixed(1)}s, steps ticked ${steps}, new errors ${errors.length - before}`);
  }
  removeEventListener('error', onErr); removeEventListener('unhandledrejection', onErr); console.error = origErr;
  return { tutorials: ids.length, results, errors };
})();
