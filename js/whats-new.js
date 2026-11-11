// Front-page "what's new" mention of the November update. Three drafts for the owner to choose from; pick one with
// ?wn=strip | row | card (default: row). Each links to its tutorial in the "Coming in the next update" group.
// Copy rules from CRITIQUE (threadwell-variants): no eyebrows, no numbers, no glyph icons; headings name the feature.
const ITEMS = [
  { id: 'message-categories', name: 'Message categories', line: 'Personal, Money, Codes, Updates and Promotions tabs, sorted on your phone.' },
  { id: 'pinned-chats', name: 'Pinned chats, your way', line: 'Keep pins in your own order, or show them as a row of photos.' },
  { id: 'edit-photo', name: 'Edit before you send', line: 'Crop or mark up a photo or video in your editor, then send the edit.' },
  { id: 'go-to-date', name: 'Go to a date', line: 'Jump to the first message, or to any day, in a long conversation.' },
];

// Small drawings of each feature, built from the same shapes as the phone previews (no icons, no glyphs).
const ART = {
  'message-categories': `<div class="wn-art wn-tabs"><span class="on">All</span><span>Personal</span><span>Money</span><span>Codes</span></div>`,
  'pinned-chats': `<div class="wn-art wn-pins"><span><i>S</i>Sam</span><span><i>M</i>Mom</span><span><i>C</i>Crew</span></div>`,
  'edit-photo': `<div class="wn-art wn-edit"><span class="wn-photo"><b>Edit</b></span></div>`,
  'go-to-date': `<div class="wn-art wn-date"><small>Jun 7</small><span class="wn-hit">Cabin code is 4417</span><span class="wn-sent">Got it</span></div>`,
};

const link = it => `<a href="#${it.id}">${it.name}</a>`;

const STRIP = () => `<section class="wn wn-strip" aria-labelledby="wn-title">
    <h2 id="wn-title">Coming in the next update</h2>
    <p>${ITEMS.map(link).join(', ').replace(/, ([^,]*)$/, ' and $1')}. Each one has a short tutorial you can try here now.</p>
  </section>`;

const ROW = () => `<section class="wn wn-row" aria-labelledby="wn-title">
    <div class="wn-head"><h2 id="wn-title">Coming in the next update</h2><p>Four additions on the way. Each has a short tutorial you can try here now.</p></div>
    <div class="wn-grid">${ITEMS.map(it => `<a class="wn-item" href="#${it.id}">${ART[it.id]}<h3>${it.name}</h3><p>${it.line}</p><span class="wn-go">Try it</span></a>`).join('')}</div>
  </section>`;

const CARD = () => {
  const [lead, ...rest] = ITEMS;
  return `<section class="wn wn-card" aria-labelledby="wn-title">
    <div class="wn-card-copy"><h2 id="wn-title">Coming next: your inbox, sorted into tabs</h2>
      <p>Turn on Message categories and codes, bank alerts, deliveries and sales sort themselves. People you know stay in Personal. It all happens on your phone.</p>
      <a class="editorial-btn" href="#${lead.id}">See how it works</a>
      <p class="wn-more">Also coming: ${rest.map(link).join(', ').replace(/, ([^,]*)$/, ' and $1')}.</p></div>
    <div class="wn-card-art" aria-hidden="true"><div class="wn-tabs big"><span>All</span><span class="on">Codes (1)</span><span>Money</span><span>Updates</span></div>
      <div class="wn-rows"><span><i>#</i><b>48210</b>Your sign-in code is 583112</span><span><i>#</i><b>Harbor Credit</b>Card ending 4417 was charged $42.10</span><span><i>P</i><b>ParcelPath</b>Out for delivery today</span></div></div>
  </section>`;
};

export function whatsNewHtml() {
  let pick = 'row';
  try { pick = new URLSearchParams(location.search).get('wn') || 'row'; } catch {}
  return pick === 'strip' ? STRIP() : pick === 'card' ? CARD() : ROW();
}
