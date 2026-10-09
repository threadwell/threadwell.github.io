// Private notes and checklists. The rules mirror NoteReminders.kt (parseChecklist, checklistBody, toChecklistBody)
// and CustomChannels.kt (toggleChecklistItem, editNote). A checklist is a note whose every non-blank line starts
// with "[ ] " or "[x] ". The app has no checklist title: the widget names a list by its Space.

export const MAX_NOTE_LENGTH = 4000;

export function parseChecklist(body) {
  const lines = String(body).split('\n').filter(l => l.trim() !== '');
  if (!lines.length || !lines.every(l => l.startsWith('[ ] ') || l.startsWith('[x] '))) return null;
  return lines.map(l => ({ done: l.startsWith('[x] '), text: l.slice(4) }));
}
export const checklistBody = items => items.map(i => (i.done ? '[x] ' : '[ ] ') + i.text).join('\n');
export const toChecklistBody = text => checklistBody(
  String(text).split('\n').map(l => l.trim()).filter(Boolean).map(l => ({ done: false, text: l.replace(/^\[ \] /, '').replace(/^\[x\] /, '') })));

/** Hours from "now" (9:41 AM in the playground) for each follow-up time. Used only to count today / tomorrow. */
export const TIMES = { 'In 1 hour': 'Today, 10:41 AM', 'Later today': 'Today, 5:00 PM', 'Tomorrow morning': 'Tomorrow, 9:00 AM', 'This weekend': 'Sat, 9:00 AM' };
export const HOURS = { 'In 1 hour': 1, 'Later today': 7, 'Tomorrow morning': 23, 'This weekend': 96 };

export const activeNotes = s => (s.notes || []).filter(n => !n.done);

/** Checklist progress, in the order the Checklist progress widget uses: unfinished first, pinned, then newest. */
export function checklists(s) {
  const spaces = new Map(s.spaces.map(x => [x.id, x]));
  return activeNotes(s).filter(n => spaces.has(n.space)).map(n => {
    const items = parseChecklist(n.body);
    return items && { note: n, space: spaces.get(n.space), items, done: items.filter(i => i.done).length, total: items.length };
  }).filter(Boolean).sort((a, b) =>
    (Number(b.done < b.total) - Number(a.done < a.total)) || (Number(!!b.note.pinned) - Number(!!a.note.pinned)) || (b.note.at - a.note.at));
}

export function toggleItem(note, index) {
  const items = parseChecklist(note.body);
  if (!items || !items[index]) return;
  items[index].done = !items[index].done;
  note.body = checklistBody(items);            // ticking is not an edit, so the note is not marked Edited
}

export function addItem(note, text) {
  const t = text.trim();
  if (!t || !parseChecklist(note.body)) return false;
  note.body = (note.body.replace(/\s+$/, '') + '\n[ ] ' + t).slice(0, MAX_NOTE_LENGTH);
  note.edited = true;
  return true;
}

/** Every reminder, notes and saved messages together, soonest first (buildFollowUpRows). */
export function followUps(s) {
  const spaces = new Map(s.spaces.map(x => [x.id, x]));
  const rows = [];
  (s.notes || []).filter(n => n.remind && !n.done && spaces.has(n.space)).forEach(n => {
    const cl = parseChecklist(n.body);
    rows.push({ id: n.id, isNote: true, kind: cl ? 'Checklist' : 'Note', remind: n.remind, h: n.remindH, space: spaces.get(n.space), thread: n.thread,
      preview: cl ? `${cl.filter(i => i.done).length} of ${cl.length} done${cl.find(i => !i.done) ? ' · ' + cl.find(i => !i.done).text : ''}` : n.body });
  });
  s.tags.filter(t => t.remind && !t.done && spaces.has(t.space)).forEach(t =>
    rows.push({ id: t.id, isNote: false, kind: t.kind || 'Message', remind: t.remind, h: t.remindH ?? 7, space: spaces.get(t.space), thread: t.thread, preview: t.text }));
  return rows.sort((a, b) => a.h - b.h);
}

/** "Due now / today / tomorrow" for the Threads to Tend summary widget. Nothing is ever overdue: the playground has no clock. */
export function followCounts(s) {
  const rows = followUps(s);
  return { due: 0, today: rows.filter(r => r.h <= 14).length, tomorrow: rows.filter(r => r.h > 14 && r.h <= 38).length, all: rows.length };
}
