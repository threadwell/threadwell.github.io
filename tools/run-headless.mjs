// Run with: node tools/run-headless.mjs [--only tutorials|demos|a11y] [--reduced] [--width 390] [--height 844]
// Serves this folder from a throwaway local server, opens it in headless Chrome (or Edge), and evaluates
// tools/headless-checks.js in the page. Nothing leaves this machine. Exit code 1 if any check fails.
import http from 'node:http';
import { readFileSync, existsSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : (process.argv[i + 1]?.startsWith('--') || process.argv[i + 1] === undefined ? true : process.argv[i + 1]); };
const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.txt': 'text/plain', '.ico': 'image/x-icon' };

const server = http.createServer((req, res) => {
  const path = decodeURIComponent(req.url.split('?')[0]);
  let file = normalize(join(root, path === '/' ? 'index.html' : path));
  if (!file.startsWith(normalize(root)) || /[\\/]\.(git|claude)/.test(file)) { res.writeHead(403).end(); return; }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file)) { res.writeHead(404).end('not found'); return; }
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  res.end(readFileSync(file));
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;

const chromePath = arg('chrome', [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
].find(existsSync));
if (!chromePath) { console.error('No Chrome or Edge found; pass --chrome <path>.'); process.exit(2); }
const profile = mkdtempSync(join(tmpdir(), 'tw-headless-'));
const port = 9300 + Math.floor(Math.random() * 500);
const width = Number(arg('width', 390)), height = Number(arg('height', 844));
const chrome = spawn(chromePath, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run',
  '--disable-extensions', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
  `--window-size=${width},${height}`, 'about:blank'], { stdio: 'ignore' });

const cleanup = () => { try { chrome.kill(); } catch {} server.close(); setTimeout(() => { try { rmSync(profile, { recursive: true, force: true }); } catch {} }, 800); };
let code = 0;
try {
  let targets;
  for (let i = 0; i < 60 && !targets; i++) {
    try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch { await new Promise(r => setTimeout(r, 250)); }
  }
  if (!targets) throw new Error('Chrome did not start');
  const page = targets.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pending = new Map();
  ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });

  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 2, mobile: width < 700 });
  if (arg('reduced', false)) await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await send('Page.navigate', { url: base });
  await new Promise(r => setTimeout(r, 2500));
  const only = arg('only', '');
  const checks = readFileSync(join(root, 'tools/headless-checks.js'), 'utf8');
  await send('Runtime.evaluate', { expression: `window.__opts = ${JSON.stringify({ only: typeof only === 'string' ? only : '' })}` });
  console.log(`Chrome: ${chromePath.split('/').slice(-3).join('/')}  viewport ${width}x${height}${arg('reduced', false) ? '  reduced motion' : ''}`);
  let results = [], errors = [];
  if (only !== 'keyboard') {
    const r = await send('Runtime.evaluate', { expression: checks, awaitPromise: true, returnByValue: true, timeout: 900000 });
    if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails.exception?.description || r.result.exceptionDetails).slice(0, 600));
    ({ results, errors } = r.result.result.value);
  }
  if (!only || only === 'keyboard') {
    const { keyboardChecks } = await import('./keyboard-checks.mjs');
    const evalv = async expression => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result.result?.value;
    await send('Page.bringToFront');
    results = results.concat(await keyboardChecks({ send, evalv }));
  }
  let failed = 0;
  for (const [name, ok, detail] of results) { if (!ok) failed++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? '  (' + detail + ')' : ''}`); }
  console.log(`\n${results.length - failed} passed, ${failed} failed${errors.length ? `, ${errors.length} page errors` : ''}`);
  if (failed) code = 1;
  ws.close();
} catch (e) { console.error(String(e.message || e)); code = 2; }
cleanup();
setTimeout(() => process.exit(code), 1000);
