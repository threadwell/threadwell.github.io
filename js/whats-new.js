// Front-page "New in Threadwell" section for version 0.2.5. Three layouts: ?wn=strip | row | card (default: row).
// Facts come from the app repo's CLAUDE.md feature map and the 0.2.5 release notes. Cards with a tutorial link to it;
// the rest link to the matching section of features.html.
// Copy rules from CRITIQUE (threadwell-variants): no eyebrows, no numbers, no glyph icons; headings name the feature.
const ITEMS = [
  { href: '#message-categories', name: 'Category pages', line: 'Each category opens as its own page, with search and Select to mark read, move, archive or trash.', go: 'Try it' },
  { href: '#pinned-chats', name: 'Drag pinned chats', line: 'Press and hold a pinned chat and drag it where you want it. Favorites now live in Pinned.', go: 'Try it' },
  { href: 'features.html#privacy', name: 'Locks and private notifications', line: 'A PIN or fingerprint for the app, one locked conversation, and notifications that show only what you choose.', go: 'Read more' },
  { href: 'features.html#writing', name: 'Underline and text effects', line: 'Underline joins bold and italic, and Big, Shake or Bloom play on your phone. Delete several messages at once.', go: 'Read more' },
];
const ALSO = [
  ['features.html#views', 'Spaces in the traditional inbox'],
  ['features.html#organize', 'Links, Attachments and Important tabs'],
  ['features.html#writing', 'Choose the sending SIM in either view'],
  ['features.html#writing', 'Link previews that say why they’re missing'],
  ['features.html#about', 'Check for updates'],
];

// Small drawings of each feature, built from the same shapes as the phone previews (no icons, no glyphs).
const ART = {
  'Category pages': `<div class="wn-art wn-tabs"><span class="on">Codes</span><span>Select</span><span>Mark read</span><span>Archive</span></div>`,
  'Drag pinned chats': `<div class="wn-art wn-pins"><span><i>S</i>Sam</span><span class="wn-lift"><i>M</i>Mom</span><span><i>C</i>Crew</span></div>`,
  'Locks and private notifications': `<div class="wn-art wn-note"><span class="wn-notif"><b>Threadwell</b>New message</span><span class="wn-pin">PIN • • • •</span></div>`,
  'Underline and text effects': `<div class="wn-art wn-date"><span class="wn-hit"><u>Tonight</u> at <b>8</b></span><span class="wn-sent wn-big">See you!</span></div>`,
};

const list = arr => arr.join(', ').replace(/, ([^,]*)$/, ' and $1');
const alsoLinks = () => list(ALSO.map(([h, n]) => `<a href="${h}">${n}</a>`));

const STRIP = () => `<section class="wn wn-strip" aria-labelledby="wn-title">
    <h2 id="wn-title">New in Threadwell</h2>
    <p>${list(ITEMS.map(it => `<a href="${it.href}">${it.name}</a>`))}. Also new: ${alsoLinks()}.</p>
  </section>`;

const ROW = () => `<section class="wn wn-row" aria-labelledby="wn-title">
    <div class="wn-head"><h2 id="wn-title">New in Threadwell</h2><p>In the latest version for testers on Google Play. <a href="features.html">See every feature</a></p></div>
    <div class="wn-grid">${ITEMS.map(it => `<a class="wn-item" href="${it.href}">${ART[it.name]}<h3>${it.name}</h3><p>${it.line}</p><span class="wn-go">${it.go}</span></a>`).join('')}</div>
    <p class="wn-also">Also new: ${alsoLinks()}.</p>
  </section>`;

const CARD = () => {
  const [lead, ...rest] = ITEMS;
  return `<section class="wn wn-card" aria-labelledby="wn-title">
    <div class="wn-card-copy"><h2 id="wn-title">New: every category gets its own page</h2>
      <p>Open Codes, Money or one of your own categories, search it, and tidy many conversations at once. Sorting still happens on your phone.</p>
      <a class="editorial-btn" href="${lead.href}">See how it works</a>
      <p class="wn-more">Also new: ${list(rest.map(it => `<a href="${it.href}">${it.name}</a>`))}. <a href="features.html">See every feature</a>.</p></div>
    <div class="wn-card-art" aria-hidden="true"><div class="wn-tabs big"><span>All</span><span class="on">Codes (1)</span><span>Money</span><span>Updates</span></div>
      <div class="wn-rows"><span><i>#</i><b>48210</b>Your sign-in code is 583112</span><span><i>#</i><b>Harbor Credit</b>Card ending 4417 was charged $42.10</span><span><i>P</i><b>ParcelPath</b>Out for delivery today</span></div></div>
  </section>`;
};

export function whatsNewHtml() {
  let pick = 'row';
  try { pick = new URLSearchParams(location.search).get('wn') || 'row'; } catch {}
  return pick === 'strip' ? STRIP() : pick === 'card' ? CARD() : ROW();
}
