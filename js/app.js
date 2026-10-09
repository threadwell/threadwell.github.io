// FAQ navigation and routing. Each question is a demo spec in js/demos/. The URL fragment is the question id.
import { mountDemo, phoneColumn, $, $$ } from './core.js';
import playground, { setPhoneColumn, setSavedStatus } from './playground.js';
import { loadSaved } from './store.js';
import { mountHome } from './home.js';
import layout from './demos/layout.js';
import photos from './demos/photos.js';
import textsize from './demos/textsize.js';
import themes from './demos/themes.js';
import spam from './demos/spam.js';
import threadmarks from './demos/threadmarks.js';
import findSaved from './demos/find-saved.js';
import createSpace from './demos/create-space.js';
import tend from './demos/tend.js';
import widgets from './demos/widgets.js';
import enableWidget from './demos/enable-widget.js';
import configureWidget from './demos/configure-widget.js';
import widgetPlaces from './demos/widget-places.js';

const GROUPS = [
  { name: 'Messaging', items: [layout, textsize, photos] },
  { name: 'Look and feel', items: [themes] },
  { name: 'Spam protection', items: [spam] },
  { name: 'Spaces and Threadmarks', items: [threadmarks, findSaved, createSpace, tend] },
  { name: 'Widgets and dashboard', items: [widgets, enableWidget, configureWidget, widgetPlaces] },
];
const ALL = GROUPS.flatMap(g => g.items);
setPhoneColumn(phoneColumn);
setSavedStatus(loadSaved());                         // only does anything if the visitor ticked "Remember this playground" before

// Hashes used while the site was being built keep working.
const ALIASES = {
  'multiple-photos': 'photos', 'photo-theme': 'themes', 'try-themes': 'themes', 'spam-rule': 'spam-rules',
  'spam-folder': 'spam-rules', 'threadmark': 'threadmarks', 'tend': 'threads-to-tend',
};

const entry = $('#entry');
let current = null;
let firstLoad = true;

const lead = `<section class="group" aria-label="Start here">
  <a class="q primary" href="#explore" data-id="explore"><span>Explore Threadwell</span></a>
  <a class="q" href="#home" data-id="home"><span>What is Threadwell?</span></a></section>
  <h2 class="faq-sub">Or ask a specific question</h2>`;
$('#faqList').innerHTML = lead + GROUPS.map(g => `
  <section class="group" aria-labelledby="g-${g.name.replace(/\W+/g, '')}">
    <h2 id="g-${g.name.replace(/\W+/g, '')}">${g.name}</h2>
    ${g.items.map(i => `<a class="q" href="#${i.id}" data-id="${i.id}"><span>${i.title}</span></a>`).join('')}
  </section>`).join('');

const PLAY = ['explore', 'guided', 'checklist', 'personalize', 'photo-layouts'];

function route() {
  const raw = location.hash.slice(1);
  const id = ALIASES[raw] || raw;
  const isPlay = PLAY.includes(id);
  const spec = isPlay ? playground : ALL.find(i => i.id === id);
  const isHome = !spec;                                   // empty or unknown hash: the front page
  document.body.classList.toggle('landing-page', isHome);
  const key = isPlay ? 'explore' : isHome ? 'home' : spec.id;
  if (!isPlay && !isHome && raw !== spec.id) history.replaceState(null, '', '#' + spec.id);
  $$('.q').forEach(a => (a.dataset.id === key ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
  document.title = isHome ? 'Threadwell: keep the messages that matter within reach' : `${spec.title} · Threadwell help`;
  const same = isPlay && current && current.isPlay;
  if (!same) {
    current?.destroy();
    if (isHome) { current = mountHome(entry); }
    else { entry.className = ''; current = mountDemo(entry, spec); current.isPlay = isPlay; }
  }
  if (isPlay) playground.setMode?.(id === 'guided' ? 'guided' : null);
  if (['checklist', 'personalize', 'photo-layouts'].includes(id)) { history.replaceState(null, '', '#explore'); playground.startNow(id === 'personalize' ? 'theme' : id === 'photo-layouts' ? 'photos' : 'checklist'); }   // the homepage's "Try making a checklist"
  $('#faq').classList.remove('open');
  $('#menuBtn').setAttribute('aria-expanded', 'false');
  if (!firstLoad) { $('#stage').scrollTo?.({ top: 0 }); window.scrollTo(0, 0); $('h1, h2', entry)?.focus({ preventScroll: true }); }
  firstLoad = false;
}

$('#menuBtn').addEventListener('click', () => {
  const open = $('#faq').classList.toggle('open');
  $('#menuBtn').setAttribute('aria-expanded', String(open));
});
// Fluid page-to-page transitions: the content area cross-fades and rises while the page chrome (the sidebar that
// the home page hides) fades. Falls back to an instant change without the API, and honours reduced motion.
const prefersReduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
let lastKey = null;
function targetKey() {
  const raw = location.hash.slice(1), id = ALIASES[raw] || raw;
  if (PLAY.includes(id)) return 'explore';
  return ALL.find(i => i.id === id)?.id || 'home';
}
function go() {
  const key = targetKey();
  const animate = !firstLoad && key !== lastKey && document.startViewTransition && !prefersReduced();
  lastKey = key;
  if (animate) {
    const t = document.startViewTransition(() => route());
    // An aborted transition (hidden tab, very fast navigation) is harmless: the route still ran.
    [t.ready, t.finished, t.updateCallbackDone].forEach(p => p.catch(() => {}));
  } else route();
}
addEventListener('hashchange', go);
go();



// The skip link must move focus, not change the route (an unknown hash would load the home page).
$('.skip')?.addEventListener('click', e => {
  e.preventDefault();
  const main = $('#stage');
  main?.focus({ preventScroll: true });
  main?.scrollIntoView({ block: 'start' });
});
