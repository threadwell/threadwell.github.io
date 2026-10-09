// Optional challenges. Each one is judged from what the visitor actually did (their data and the actions they took),
// never from a script, so any route counts and a step can be skipped. Hints live outside the simulated app.
import { parseChecklist } from './notes.js';

const SEED_SPACES = ['trips', 'home', 'gifts', 'shop', 'dinner'];
const lastIndex = (ev, name) => ev.lastIndexOf(name);

export const CHALLENGES = [
  {
    id: 'packing', title: 'Make a packing checklist.',
    hint: ['Tap the <b>bolt</b> (Add to Threadwell) in the tools column, or open a Space and tick <b>☑ Checklist</b>.', 'Choose <b>☑ Checklist</b>, pick a Space, and type one item per line.', 'Tap <b>Save</b>. Open the Space (under <b>All chats</b>) to tick items off.'],
    test: d => d.notes.some(n => (parseChecklist(n.body) || []).length >= 2),
  },
  {
    id: 'space', title: 'Save a message to a new Space.',
    hint: ['Switch to <b>Threadwell view</b> (Settings → Messaging &amp; notifications), then open a conversation.', 'Tap a message, then <b>⋯ More → Add to a Space</b>.', 'Choose <b>＋ New Space</b>, name it, and Save. Then find it under <b>Browse Spaces</b>.'],
    test: d => d.tags.some(t => t.mid && !SEED_SPACES.includes(t.space)),
  },
  {
    id: 'theme', title: 'Try your favorite theme.',
    hint: ['Open <b>Settings → Appearance → Browse themes</b>.', 'Tap a theme to preview it. Nothing changes until you tap <b>Apply theme</b>.', 'Go back to a conversation or a Space to see it everywhere.'],
    test: (d, t) => t.events.includes('apply'),
  },
  {
    id: 'layout', title: 'Switch layouts and find your checklist.',
    hint: ['Make a checklist first if you have not.', 'Open <b>Settings → Messaging &amp; notifications</b> and choose the other <b>Layout</b>.', 'In Threadwell view, open <b>Browse Spaces</b> and the Space that holds your checklist.'],
    test: (d, t, h) => t.layoutAt >= 0 && t.events.length > t.layoutAt && d.notes.some(n => parseChecklist(n.body)) && h.sawChecklist(),   // sawChecklist looks at the screen being viewed, not hidden ones
  },
  {
    id: 'collapse', title: 'Collapse the panels and bring them back.',
    hint: ['In Threadwell view, tap the <b>collapse arrow</b> under the tools column. They tuck behind one <b>⋯</b> button.', 'Tap <b>⋯</b> to peek at them again. To keep them open, turn off <b>Start with utility tools collapsed</b> in Settings.', 'On a wide preview (unfolded or landscape), the Space list has its own <b>collapse</b> arrow.'],
    test: (d, t) => { const a = t.events.indexOf('collapsetools'); return a >= 0 && lastIndex(t.events, 'showtools') > a; },
  },
  {
    id: 'dock', title: 'Let the widgets tuck away while you read.',
    hint: ['Use Threadwell view with at least one widget on (three are on to start).', 'Open a conversation and scroll the messages, or wait five seconds.', 'The widgets move into the <b>Widgets</b> button in the thread rail. Change this under Settings → Messaging &amp; notifications → <b>Widget strip behavior</b>.'],
    test: (d, t) => t.events.includes('stripdock') || t.events.includes('stripcollapse') || t.events.includes('wdock'),
  },
];

/** Marks challenges that are now true and returns the ids that just became done. */
export function evaluate(session, hooks) {
  const fresh = [];
  for (const c of CHALLENGES) {
    if (session.tut.done[c.id]) continue;
    let ok = false;
    try { ok = !!c.test(session.data, session.tut, hooks); } catch { ok = false; }
    if (ok) { session.tut.done[c.id] = true; fresh.push(c.id); }
  }
  return fresh;
}
