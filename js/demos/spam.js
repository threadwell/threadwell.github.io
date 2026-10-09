// Verified against SettingsScreen.kt (Spam protection > Spam keywords), SpamDetector.kt (scoring),
// SpamDecision.kt (thresholds), MessageThreadScreen.kt (banner) and DeleteSpamScreen.kt (Spam folder).
//
// What the app really does with a keyword: a match scores 50, "might be spam" starts at 38 and a thread is
// moved to Spam at 66. A link from someone who is not a saved contact adds 18. Saved contacts are capped at 44.
import { statusbar, appbar, settingsHome, settingsBody, label, caption, toggle, THREADS, bubble } from '../phone-ui.js';
import { inbox } from '../inbox.js';
import { esc } from '../core.js';

const WARN = 38, QUARANTINE = 66;
const TEXTS = {
  a: { n: '+1 (312) 555 0148', i: '#', body: 'Free cruise for two this weekend. Reply YES to claim', t: '9:12 AM', link: false },
  b: { n: '+1 (415) 555 0192', i: '#', body: 'Free cruise winner! Claim at cruise-deals.example/win', t: '9:30 AM', link: true },
};

/** Same arithmetic as SpamDetector.evaluate for a keyword hit plus a link from an unsaved number. */
function score(m, keywords) {
  const hits = keywords.filter(k => m.body.toLowerCase().includes(k)).length;
  return (hits ? 50 + (hits - 1) * 8 : 0) + (m.link ? 18 : 0);
}
function disposition(s, key) {
  if (s.allowed.includes(key)) return 'allow';
  const sc = score(TEXTS[key], s.keywords);
  return sc >= QUARANTINE ? 'quarantine' : sc >= WARN ? 'warn' : 'allow';
}
const inboxThreads = s => [
  ...Object.keys(TEXTS).filter(k => disposition(s, k) !== 'quarantine' || s.restored.includes(k))
    .map(k => ({ key: k, n: TEXTS[k].n, i: TEXTS[k].i, s: TEXTS[k].body, t: TEXTS[k].t })),
  ...THREADS.slice(0, 3),
];
const quarantined = s => Object.keys(TEXTS).filter(k => disposition(s, k) === 'quarantine' && !s.restored.includes(k));

export default {
  id: 'spam-rules',
  title: 'Add my own spam rule',
  answer: 'Add a word or phrase under Spam keywords. Texts that contain it get flagged. Add a link from someone who is not in your contacts and Threadwell moves the thread to Spam.',
  steps: [
    'Tap <b>Settings</b>, then open <b>Spam protection</b>.',
    'Under <b>Spam keywords</b>, type a word or phrase and tap <b>Add</b>.',
    'Open the flagged text. A banner says <b>This might be spam</b>, with <b>Always allow</b> and <b>Restore once</b>.',
    'A keyword plus a link from an unsaved number moves the thread to <b>Spam</b>. Open it and choose <b>Restore to inbox</b> if it was a mistake.',
  ],
  note: '<strong>Saved contacts are never moved.</strong> Your keyword is one signal among several, and Smart detection, link checks and your Allowlist still apply. Nothing is deleted.',
  start: 'home',
  state: () => ({ keywords: ['stop=end'], draft: '', allowed: [], restored: [], msg: null, menu: null }),
  views: {
    home: s => inbox(s, { pulse: s.pulse, threads: inboxThreads(s), spamCount: quarantined(s).length, openRows: true, spamLive: true }),
    settings: s => settingsHome(s, { pulse: s.pulse }),
    spamset: s => statusbar() + appbar('Spam protection', { back: true }) + settingsBody(`
      <h4>Spam &amp; blocking</h4>
      ${toggle('noop', 'Smart detection', true, 'On-device classifier — scores every message, nothing leaves your phone')}
      ${toggle('noop', 'Flag suspicious links', true, 'Shortened links, and links paired with “verify your account”-style wording')}
      <div id="kw" class="sec">
        ${label('Spam keywords')}
        ${caption('A message containing any of these gets a “might be spam” warning. Several matches, or other warning signs, move the conversation to your Spam folder. Saved contacts are never moved.')}
        <div class="field-row"><input id="kwin" class="field" type="text" placeholder="Add a keyword or phrase" aria-label="Add a keyword or phrase" value="${esc(s.draft)}" data-act="kwtype" data-enter="#kwadd" autocomplete="off"><button class="btn-s" type="button" id="kwadd" data-act="kwadd">Add</button></div>
        ${s.keywords.map(k => `<div class="kwrow"><span>${esc(k)}</span><button class="txt-btn" type="button" data-act="kwremove" data-arg="${esc(k)}" aria-label="Remove ${esc(k)}">Remove</button></div>`).join('')}
      </div>`),
    thread: s => {
      const m = TEXTS[s.msg], d = disposition(s, s.msg);
      return statusbar() + appbar(esc(m.n), { back: true }) +
        (d === 'warn' ? `<div class="banner warn"><b>⚠ This might be spam</b><span>${score(m, s.keywords) >= WARN ? 'Spam keyword' : ''}</span>
          <div class="banner-actions"><button class="txt-btn" type="button" data-act="allow">Always allow</button><button class="txt-btn" type="button" data-act="restoreonce">Restore once</button></div></div>` : '') +
        `<div class="thread" tabindex="0">${bubble(esc(m.body))}</div>`;
    },
    spamfolder: s => statusbar() + appbar('Spam', { back: true }) + (quarantined(s).length
      ? `<div class="list" tabindex="0">${quarantined(s).map(k => `<button class="row" type="button" data-act="spamrow" data-arg="${k}"><div class="avatar" aria-hidden="true">#</div>
          <div style="min-width:0"><div class="name">${esc(TEXTS[k].n)}</div><div class="snip">${esc(TEXTS[k].body)}</div></div><div class="time">${TEXTS[k].t}</div></button>`).join('')}</div>`
      : `<p class="empty">No spam right now</p>`) +
      (s.menu ? `<div class="sheet" role="dialog" aria-label="Spam conversation actions" data-esc="closemenu"><b>${esc(TEXTS[s.menu].n)}</b>
        <p class="caption">Restore removes current flags. Always allow also excludes future messages in this conversation from filtering.</p>
        <button class="sheet-btn" type="button" data-act="restore">Restore to inbox · keep checking new messages</button>
        <button class="sheet-btn" type="button" data-act="allowconv">✅  Always allow this conversation</button>
        <button class="sheet-btn" type="button" data-act="closemenu">Cancel</button></div>` : ''),
  },
  acts: {
    gear: api => { api.s.pulse = ''; api.go('settings'); api.step(1); },
    cat: (api, id) => { if (id === 'spam') { api.go('spamset'); api.step(2); } },
    noop: () => {},
    kwtype: (api, _a, el) => { api.s.draft = el.value; },
    kwadd: api => {
      const v = (api.$('#kwin')?.value ?? api.s.draft).toLowerCase().trim();
      if (!v) return;
      if (!api.s.keywords.includes(v)) api.s.keywords.push(v);
      api.s.draft = '';
      api.render('spamset'); api.step(3);
    },
    kwremove: (api, k) => { api.s.keywords = api.s.keywords.filter(x => x !== k); api.render('spamset'); },
    open: (api, key) => { if (!TEXTS[key]) return; api.s.msg = key; api.go('thread'); api.step(3); },
    allow: api => { api.s.allowed.push(api.s.msg); api.render('thread'); },
    restoreonce: api => { api.s.allowed.push(api.s.msg); api.render('thread'); },
    spamfolder: api => { api.s.pulse = ''; api.go('spamfolder'); api.step(4); },
    spamrow: (api, k) => { api.s.menu = k; api.render('spamfolder'); },
    closemenu: api => { api.s.menu = null; api.render('spamfolder'); },
    restore: api => { api.s.restored.push(api.s.menu); api.s.menu = null; api.render('spamfolder'); },
    allowconv: api => { api.s.allowed.push(api.s.menu); api.s.restored.push(api.s.menu); api.s.menu = null; api.render('spamfolder'); },
  },
  async play(api, t) {
    api.s.pulse = 'gear'; api.render('home'); await t.sleep(500);
    await t.tap('#gear');
    api.s.pulse = 'spam'; api.render('settings'); await t.sleep(500);
    await t.tap('#cat-spam');
    await t.sleep(400);
    api.$('#kw')?.scrollIntoView({ block: 'center', behavior: 'auto' });
    const input = api.$('#kwin');
    for (const ch of 'free cruise') {
      input.value += ch; api.s.draft = input.value; await t.sleep(70);
    }
    await t.sleep(300);
    await t.tap('#kwadd');
    await t.sleep(700);
    api.back(); api.back();           // settings, then Messages
    await t.sleep(800);
    api.s.pulse = 'spam'; api.render('home'); await t.sleep(700);
    await t.tap('[data-arg="a"]');
    await t.sleep(1400);
    api.back(); await t.sleep(500);
    await t.tap('#spambtn');
    await t.sleep(800);
  },
};
