// Rules of the Show me controller (js/demo-controller.js): states, cancellation, and when the playground is suspended
// and restored. Uses a fake demonstration, so it needs no browser. Run: node tools/test-demo-controller.mjs
import { createDemoController, DEMO } from '../js/demo-controller.js';

let failed = 0;
const eq = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok ? '' : `  got ${JSON.stringify(got)} want ${JSON.stringify(want)}`}`); };
const tick = () => new Promise(r => setTimeout(r, 0));

/** A fake demonstration whose finish the test controls. */
function fake() {
  const log = [], runs = [];
  const host = { suspended: 0, restored: 0 };
  const ctl = createDemoController({
    suspend: () => host.suspended++, restore: () => host.restored++,
    mount: info => {
      const h = { info, paused: false, destroyed: false, plays: 0, pending: null };
      h.play = () => { h.plays++; return new Promise(res => { h.pending = res; }); };
      h.pause = () => { h.paused = true; }; h.resume = () => { h.paused = false; };
      h.destroy = () => { h.destroyed = true; h.pending?.('cancelled'); };
      runs.push(h); return h;
    },
    onChange: (s) => log.push(s),
  });
  return { ctl, log, runs, host };
}
const A = { id: 'packing' }, B = { id: 'theme' };

{ // start -> pause -> resume -> finish
  const { ctl, log, runs, host } = fake();
  eq('starts idle', ctl.state, DEMO.IDLE);
  ctl.start(A); eq('playing', ctl.state, DEMO.PLAYING); eq('suspended once', host.suspended, 1);
  eq('pause only while playing', [ctl.pause(), ctl.pause()], [true, false]); eq('paused', ctl.state, DEMO.PAUSED); eq('handle paused', runs[0].paused, true);
  eq('resume only while paused', [ctl.resume(), ctl.resume()], [true, false]); eq('handle resumed', runs[0].paused, false);
  runs[0].pending('done'); await tick(); eq('finished', ctl.state, DEMO.FINISHED);
  eq('finishing keeps the playground suspended', host.restored, 0);
  eq('pause does nothing when finished', ctl.pause(), false);
  eq('replay', [ctl.restart(), ctl.state, runs[0].plays], [true, DEMO.PLAYING, 2]);
  ctl.stop(); eq('stop restores once', [ctl.state, host.restored, runs[0].destroyed], [DEMO.IDLE, 1, true]);
  eq('stop twice is safe', [ctl.stop(), host.restored], [false, 1]);
  eq('state log', log, ['playing', 'paused', 'playing', 'finished', 'playing', 'idle']);
}
{ // restart from paused; a stale finish from the cancelled run is ignored
  const { ctl, runs } = fake();
  ctl.start(A); ctl.pause(); const first = runs[0].pending;
  eq('restart from paused', [ctl.restart(), ctl.state], [true, DEMO.PLAYING]);
  first('done'); await tick(); eq('old run cannot finish the new one', ctl.state, DEMO.PLAYING);
  runs[0].pending('done'); await tick(); eq('new run finishes', ctl.state, DEMO.FINISHED);
}
{ // exit during play: the run is cancelled and cannot change state afterwards
  const { ctl, runs, host } = fake();
  ctl.start(A); const pending = runs[0].pending; ctl.stop();
  pending('done'); await tick();
  eq('late completion after exit is ignored', [ctl.state, host.restored], [DEMO.IDLE, 1]);
}
{ // rapid clicks and switching
  const { ctl, runs, host } = fake();
  eq('first start accepted', ctl.start(A), true);
  eq('same demo again while playing is ignored', [ctl.start(A), ctl.start(A), runs.length], [false, false, 1]);
  eq('switching replaces the demo', [ctl.start(B), runs.length, runs[0].destroyed, ctl.current.id], [true, 2, true, 'theme']);
  eq('switching never suspends twice', host.suspended, 1);
  runs[0].pending?.('done'); await tick(); eq('replaced demo cannot finish the new one', ctl.state, DEMO.PLAYING);
  ctl.stop(); eq('one restore for the whole visit', host.restored, 1);
}
{ // failure paths
  const bad = createDemoController({ suspend() {}, restore() {}, mount: () => { throw new Error('boom'); } });
  const quiet = console.error; console.error = () => {};
  bad.start(A); eq('mount failure -> failed', bad.state, DEMO.FAILED);
  eq('failed can still exit', [bad.stop(), bad.state], [true, DEMO.IDLE]);
  const { ctl, runs } = (() => { const f = fake(); return f; })();
  ctl.start(A); runs[0].pending = null; // play rejects
  const c2 = createDemoController({ suspend() {}, restore() {}, mount: () => ({ play: () => Promise.reject(new Error('x')), pause() {}, resume() {}, destroy() {} }) });
  c2.start(A); await tick(); eq('play error -> failed', c2.state, DEMO.FAILED);
  console.error = quiet;
}
console.log(failed ? `${failed} FAILED` : 'all passed');
process.exit(failed ? 1 : 0);
