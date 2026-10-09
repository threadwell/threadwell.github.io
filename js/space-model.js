// Sample data and templates for the Spaces tutorials. Templates, colors and limits come from the app
// (ChannelTemplates.kt, CustomChannels.kt). The Spaces and saved items themselves are sample data.

export const MAX_SPACES = 20;
export const NAME_MAX = 24;

/** The app's ten starting templates, in its order. */
export const TEMPLATES = [
  { id: 'photos', name: 'Favorite photos', emoji: '📷', desc: 'Photos worth finding again' },
  { id: 'family', name: 'Family moments', emoji: '👶', desc: 'Family photos and milestones' },
  { id: 'dinner', name: 'Dinner ideas', emoji: '🍕', desc: 'Restaurants, recipes and photos' },
  { id: 'shopping', name: 'Shopping', emoji: '🛒', desc: 'Lists and product links' },
  { id: 'travel', name: 'Travel', emoji: '✈️', desc: 'Bookings, maps and packing' },
  { id: 'home', name: 'Home projects', emoji: '🏠', desc: 'Tasks, quotes and inspiration' },
  { id: 'gifts', name: 'Gift ideas', emoji: '🎁', desc: 'Who wants what' },
  { id: 'ideas', name: 'Ideas', emoji: '💡', desc: 'Anything worth keeping' },
  { id: 'later', name: 'Read / watch later', emoji: '📚', desc: 'Links for later' },
  { id: 'planning', name: 'Shared planning', emoji: '✅', desc: 'Plans made with others' },
];

/** The eight Space colors. */
export const COLORS = [
  ['#5865f2', 'Blue'], ['#3ba55d', 'Green'], ['#faa61a', 'Amber'], ['#ed4245', 'Red'],
  ['#eb459e', 'Pink'], ['#00b0f4', 'Sky'], ['#9b59b6', 'Purple'], ['#747f8d', 'Gray'],
];

export const SAVED_TEXT = 'Late Night Noodle Bar. Table for two at 7?';

/**
 * Five Spaces so one of them (Dinner ideas) sits behind "More", exactly as it does in the app
 * once you have more than three. `withDinnerSave` pre-saves the noodle bar message there.
 */
export function seedSpaces({ withDinnerSave = false } = {}) {
  const spaces = [
    { id: 'trips', name: 'Trips', emoji: '✈️', color: '#00b0f4' },
    { id: 'home', name: 'Home projects', emoji: '🏠', color: '#faa61a', template: 'home' },
    { id: 'gifts', name: 'Gift ideas', emoji: '🎁', color: '#eb459e', template: 'gifts' },
    { id: 'shop', name: 'Shopping', emoji: '🛒', color: '#3ba55d', template: 'shopping' },
    { id: 'dinner', name: 'Dinner ideas', emoji: '🍕', color: '#ed4245', template: 'dinner' },
  ];
  let n = 0;
  const tag = (space, thread, text, extra = {}) => ({ id: 't' + ++n, space, thread, text, date: 'Oct 2', kind: 'Message', ...extra });
  const tags = [
    tag('trips', 1, 'Cabin near Bishop, 3 nights, $240 total'),
    tag('trips', 2, 'Flight lands Thursday at 6:15 PM'),
    tag('home', 2, 'Paint color: Soft Linen, two coats'),
    tag('gifts', 1, 'Maya wants the trail headlamp'),
    tag('gifts', 2, 'Dad: wool socks, size 11'),
    tag('gifts', 0, 'Sam loves the ramen cookbook'),
    tag('shop', 2, 'Garden hose, 50 ft'),
  ];
  if (withDinnerSave) tags.push(tag('dinner', 0, SAVED_TEXT, { id: 'noodle', date: 'Today' }));
  return { spaces, tags };
}

// Saved items plus active private notes and checklists (the playground has notes; the tutorials do not).
export const countFor = (s, spaceId, thread = null) =>
  s.tags.filter(t => t.space === spaceId && (thread === null || t.thread === thread)).length
  + (s.notes || []).filter(n => n.space === spaceId && !n.done && (thread === null || n.thread === thread)).length;

/** Favorites first, then the rest in saved order (the app's BoardNav.ordered). */
export const orderedSpaces = s => [...s.spaces.filter(x => s.favs.includes(x.id)), ...s.spaces.filter(x => !s.favs.includes(x.id))];
