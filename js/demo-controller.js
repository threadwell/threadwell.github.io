// The "Show me" controller for the playground. It owns one demonstration at a time: idle -> playing <-> paused -> finished
// (or failed), and is the only thing that suspends the visitor's playground and gives it back. It knows nothing about the DOM:
// the host supplies mount / suspend / restore, so the rules below can be tested on their own.
//
//   mount()    -> { play(): Promise<'done'|'cancelled'>, pause(), resume(), destroy() }  (a separate sample session)
//   suspend()  -> hide and freeze the visitor's playground (timers stopped, out of the tab order)
//   restore()  -> bring it back exactly as it was
//   onChange(state, info) is called after every transition.

export const DEMO = { IDLE: 'idle', PLAYING: 'playing', PAUSED: 'paused', FINISHED: 'finished', FAILED: 'failed' };

export function createDemoController({ mount, suspend, restore, onChange = () => {} }) {
  let state = DEMO.IDLE, handle = null, run = 0, current = null;
  const set = (next, info) => { state = next; onChange(state, info ?? current); };

  function begin() {
    const my = ++run;
    set(DEMO.PLAYING);
    let p;
    try { p = Promise.resolve(handle.play()); } catch (e) { p = Promise.reject(e); }
    p.then(result => { if (my === run && result === 'done') set(DEMO.FINISHED); },
           err => { if (my === run) { console.error(err); set(DEMO.FAILED); } });
  }

  return {
    get state() { return state; },
    get current() { return current; },
    /** Start a demonstration. Starting another one replaces the running one; starting the same one again while it plays does nothing. */
    start(info) {
      if (state === DEMO.PLAYING && current && info && current.id === info.id) return false;
      const resuming = state !== DEMO.IDLE;
      if (resuming) { run++; handle?.destroy(); handle = null; }
      else suspend();
      current = info || null;
      try { handle = mount(info); } catch (e) {
        console.error(e); run++; handle = null; set(DEMO.FAILED); return true;
      }
      begin();
      return true;
    },
    pause() { if (state !== DEMO.PLAYING) return false; handle.pause(); set(DEMO.PAUSED); return true; },
    resume() { if (state !== DEMO.PAUSED) return false; handle.resume(); set(DEMO.PLAYING); return true; },
    /** From paused or finished (or failed, if a mount exists): play again from the start. */
    restart() {
      if (!handle || ![DEMO.PAUSED, DEMO.FINISHED].includes(state)) return false;
      handle.resume(); begin(); return true;
    },
    /** Leave the demonstration and give the playground back. Safe to call at any time, any number of times. */
    stop() {
      if (state === DEMO.IDLE) return false;
      run++;
      const h = handle; handle = null;
      try { h?.destroy(); } finally { current = null; state = DEMO.IDLE; restore(); onChange(DEMO.IDLE, null); }
      return true;
    },
  };
}
