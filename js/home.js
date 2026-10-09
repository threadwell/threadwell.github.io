// Marketing page. Product previews use the same renderer as the playground;
// the scene selector is a website control, not an invented app feature.
import { showcaseHtml, mountShowcase } from './showcase.js';
import { freshState } from './store.js';
import { tlist, playBoard } from './play-ui.js';

const arrow = '<span aria-hidden="true">↗</span>';
function preview(scene = 'plan') {
  const s = freshState();
  s.read = [0, 1]; s.device = 'foldOpen'; s.thread = 1;
  s.spaces.unshift({ id: 'weekend', name: 'Weekend away', emoji: '🏕️', color: '#3ba55d' });
  s.notes.push({ id: 'n1', space: 'weekend', thread: null, body: '[x] Book the cabin\n[x] Pack the headlamps\n[ ] Pick up trail snacks\n[ ] Download the route', at: 200, date: 'Today', pinned: false, remind: 'Tomorrow, 9:00 AM', remindH: 23, done: false, edited: false });
  s.tags.push({ id: 'tx', space: 'weekend', thread: 1, mid: 'b4', text: 'Cabin near Bishop, 3 nights, $240 total', date: 'Today', kind: 'Message', at: 150 });
  s.mode = scene === 'plan' ? 'space' : 'chat'; s.channel = scene === 'plan' ? 'c:weekend' : 'CHAT';
  s.scopeAll = true; s.stripExpanded = true; s.toolsCollapsed = false;
  s.tlist = tlist(s);
  const html = playBoard(s).replace(/ id="[^"]*"/g, '').replace(/ data-(act|arg|sk|enter|esc|end)="[^"]*"/g, '').replace(/ data-end/g, '');
  return `<div class="landing-device" role="img" aria-label="${scene === 'plan' ? 'Weekend away Space with a saved cabin message and a four-item checklist, two completed.' : 'A climbing group conversation alongside its Spaces and widgets.'}"><div class="screen"><section class="view" inert>${html}</section></div></div>`;
}

export const homeHtml = () => `
<div class="landing">
  <section class="landing-hero" aria-labelledby="landing-title">
    <div class="hero-editorial">
      <p class="kicker"><span class="live-dot"></span> A little more room for what matters.</p>
      <h1 id="landing-title" tabindex="-1">Less noise.<br>More <em>life.</em></h1>
      <p class="hero-deck">Your messages are full of plans.<br>Give them a place to go.</p>
      <p class="hero-detail">Meet Threadwell. Android texting with Spaces for the things worth keeping, checklists for the next step, and spam protection for a little peace.</p>
      <div class="landing-actions"><a class="editorial-btn" href="#explore">Make yourself at home ${arrow}</a><a class="text-link" href="#guided">Show me around <span aria-hidden="true">→</span></a></div>
      <p class="micro">Try the browser playground. No account. Nothing sent.</p>
    </div>
    <div class="hero-composition">
      <svg class="thread-art" viewBox="0 0 600 540" fill="none" aria-hidden="true"><path d="M30 20C490-40 640 220 375 220S80 410 300 460 610 370 580 525" stroke="currentColor" stroke-width="2"/><path d="M0 55C460-5 610 255 345 255S50 445 270 495 580 405 550 560" stroke="currentColor" stroke-width="1" stroke-dasharray="3 7"/></svg>
      <div class="composition-label"><span>FROM A TEXT</span><span>TO SOMETHING GOOD ↘</span></div>
      <div class="message-paper"><span class="paper-meta"><span class="paper-avatar">M</span> Maya · Climbing crew <span>now</span></span><p>Cabin near Bishop.<br>Three nights. Who’s in?</p><span class="paper-reply">Already packing. ☀</span></div>
      <div class="plan-paper"><div class="paper-heading"><span class="folder-symbol" aria-hidden="true">↳</span><div><small>YOUR SPACE</small><h2>Weekend away</h2></div><span class="paper-star" aria-hidden="true">✳</span></div><p class="paper-caption">A plan that doesn’t get lost in the chat.</p><div class="hero-checks" aria-label="Sample packing checklist"><label><input type="checkbox" checked><span>Book somewhere wonderful</span></label><label><input type="checkbox" checked><span>Pack the headlamps</span></label><label><input type="checkbox"><span>Leave room for adventure</span></label></div><div class="paper-bottom"><span id="hero-progress" role="status">2 of 3 ready</span><span>Try checking an item ↑</span></div></div>
      <span class="composition-foot">An interactive illustration. Your own Space is next.</span>
    </div>
  </section>
  <div class="value-strip" aria-label="Threadwell essentials"><span>Made for Android</span><i aria-hidden="true">✳</i><span>Your conversations, organized</span><i aria-hidden="true">✳</i><span>Spam detection on your phone</span><i aria-hidden="true">✳</i><span>A look that’s yours</span></div>
  <section class="product-story" aria-labelledby="story-title">
    <div class="section-topline"><span class="kicker">01 / A PLACE FOR YOUR PLANS</span><span class="section-aside">Less searching. More getting on with it.</span></div>
    <div class="story-intro"><h2 id="story-title">The good stuff.<br><em>All together.</em></h2><p>A booking in one chat. A packing list in another.<br>Bring the details into a Space, and turn “we should” into a plan.</p></div>
    <div class="product-stage"><div class="stage-toolbar"><span><span class="live-dot"></span> A closer look at Threadwell</span><div class="scene-switch" role="group" aria-label="Choose product preview"><button type="button" data-scene="chat" aria-pressed="false">The conversation</button><button type="button" data-scene="plan" aria-pressed="true">The plan</button></div></div><div id="landing-preview">${preview()}</div><div class="stage-caption"><p id="scene-caption" role="status">Saved messages and your next steps, together in one Space.</p><a href="#checklist">Make your own checklist ${arrow}</a></div></div>
  </section>
  ${showcaseHtml()}
  <section class="feature-duo" aria-label="More room, less noise">
    <article class="quiet-feature"><p class="kicker">02 / A LITTLE PEACE OF MIND</p><div class="shield-art" aria-hidden="true"><svg viewBox="0 0 80 90"><path d="M40 5 70 17v24c0 20-14 35-30 43C24 76 10 61 10 41V17Z"/><path d="m25 43 10 10 21-23"/></svg><span>On-device detection</span></div><h2>Keep the plans.<br><em>Quiet the noise.</em></h2><p>Spam protection runs on your phone. Review what was flagged and bring a real conversation back when you need to.</p><a class="text-link" href="#spam-rules">See how spam protection works ${arrow}</a></article>
    <article class="room-feature"><p class="kicker">03 / ROOM TO MAKE IT YOURS</p><div class="layout-art" aria-hidden="true"><div class="mini-phone"><i></i><b></b><b></b><b></b></div><span>→</span><div class="mini-fold"><aside><i></i><i></i><i></i></aside><div><b></b><b></b><b></b></div></div></div><h2>A familiar inbox.<br><em>A wider possibility.</em></h2><p>Switch to Threadwell view. Open up your Spaces on a wider screen, tuck the panels away, or find a theme that feels like you.</p><a class="text-link" href="#explore">Find your view ${arrow}</a></article>
  </section>
  <section class="closing-invite"><p class="kicker">LESS WATCHING. MORE TRYING.</p><h2>A small space.<br><em>Lots of possibilities.</em></h2><p>Make a list. Change the theme. Send a pretend text.<br>The best way to get Threadwell is to make it yours.</p><a class="editorial-btn" href="#explore">Step inside the playground ${arrow}</a><span class="micro">Sample conversations. Real things to click.</span></section>
  <footer class="landing-footer"><a class="footer-brand" href="#home">Threadwell<span>Keep a little more of what matters.</span></a><nav aria-label="Footer"><a href="#guided">Help & demos</a><a href="privacy.html">Website privacy</a><a href="app-privacy.html">App privacy</a></nav><span>Made for the conversations that make a life.</span></footer>
</div>`;

export function mountHome(root) {
  root.innerHTML = homeHtml(); root.className = 'is-home';
  const showcase = mountShowcase(root);
  const onChange = e => {
    if (!e.target.matches('.hero-checks input')) return;
    root.querySelector('#hero-progress').textContent = `${root.querySelectorAll('.hero-checks input:checked').length} of 3 ready`;
  };
  const onClick = e => {
    const button = e.target.closest('[data-scene]'); if (!button) return;
    root.querySelectorAll('[data-scene]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    root.querySelector('#landing-preview').innerHTML = preview(button.dataset.scene);
    root.querySelector('#scene-caption').textContent = button.dataset.scene === 'plan' ? 'Saved messages and your next steps, together in one Space.' : 'The conversation stays a conversation. Save the parts you want to keep.';
  };
  root.addEventListener('change', onChange); root.addEventListener('click', onClick);
  return { destroy() { showcase.destroy(); root.removeEventListener('change', onChange); root.removeEventListener('click', onClick); root.innerHTML = ''; root.className = ''; } };
}
