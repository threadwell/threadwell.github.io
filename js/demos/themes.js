// Verified against AppearanceScreen.kt (Browse themes, Reduce motion), ThemeGalleryScreen.kt (search, filter chips),
// ThemePreviewScreen.kt (Customize / Apply theme), ThemeDetailScreen.kt (Bubble colors, Scene sliders, Reset)
// and PhotoBackdropEditor.kt (Your photos). Theme names, descriptors and colors come from AppTheme.kt and
// ThemeCatalog.kt. The phone shows simplified stand-ins for the scenes; the real ones are richer.
import { ico, statusbar, appbar, settingsHome, appearancePage, settingsBody, label, caption, seg, slider, photo, THEME_LIST, THREADS, bubble } from '../phone-ui.js';
import { inbox } from '../inbox.js';
import { pickerView } from '../board.js';
import { appearanceActs, scrollPhone } from '../appearance.js';
import { esc, reduced } from '../core.js';

/* Colors are taken from the app's color schemes. */
const LOOK = {
  default: { bg: '#1c1b1f', panel: '28,27,31', p2: '43,41,48', text: '#e6e1e5', muted: '#cac4d0', accent: '#d0bcff', on: '#381e72', sent: '#d0bcff', recv: '#49454f', radius: 16 },
  dusk: { bg: 'linear-gradient(55deg,#ff9e5e,#6a4c93 50%,#231536)', panel: '30,19,48', p2: '49,36,68', text: '#f3ecff', muted: '#d8cdea', accent: '#ffb77c', on: '#3a1e00', sent: '#ffb77c', recv: '#433159', radius: 16 },
  matrix: { bg: '#000', panel: '3,16,6', p2: '6,33,15', text: '#cfffd9', muted: '#8be39c', accent: '#00ff41', on: '#001b06', sent: '#0c3b1b', recv: '#041a0b', radius: 6, sentC: '#9dffb0', recvC: '#6fe38a', fx: 'matrix' },
  sunrise: { bg: 'linear-gradient(60deg,#ff9e7d,#ffd194 50%,#9ec5ff)', panel: '255,255,255', p2: '255,230,214', text: '#3a2418', muted: '#563829', accent: '#b04b2e', on: '#ffffff', sent: '#b04b2e', recv: '#ffe0c8', radius: 16, light: true },
  nightsky: { bg: 'linear-gradient(180deg,#0a1330,#0b0f24 50%,#140a26)', panel: '12,18,38', p2: '21,29,58', text: '#e9edfb', muted: '#bfc7e4', accent: '#9db4ff', on: '#0b1533', sent: '#3a4e9e', recv: '#1c2749', radius: 16, fx: 'stars' },
  lavendercharcoal: { bg: '#1c1b1f', panel: '28,27,31', p2: '73,69,79', text: '#e6e1e5', muted: '#cac4d0', accent: '#d0bcff', on: '#381e72', sent: '#d0bcff', recv: '#49454f', recvC: '#cac4d0', radius: 18, opaque: true },
  photo: { bg: '#1c1b1f', panel: '28,27,31', p2: '43,41,48', text: '#e6e1e5', muted: '#cac4d0', accent: '#d0bcff', on: '#381e72', sent: '#d0bcff', recv: '#49454f', radius: 16 },
};
// Color mode only has a light look for Default here; the other sample themes keep their own palette.
const LIGHT_DEFAULT = { bg: '#fffbfe', panel: '255,251,254', p2: '243,237,247', text: '#1c1b1f', muted: '#49454f', accent: '#6750a4', on: '#ffffff', sent: '#6750a4', recv: '#e7e0ec', radius: 16, light: true };
// Light looks for the themes that have both modes (Default here, plus the two fixed-palette themes).
const LIGHTS = {
  default: LIGHT_DEFAULT,
  creamforest: { bg: '#f4f2eb', panel: '250,249,244', p2: '230,236,223', text: '#153c35', muted: '#3f574e', accent: '#215e4c', on: '#fffef7', sent: '#215e4c', recv: '#e6ecdf', recvC: '#3f574e', radius: 18, light: true, opaque: true },
  lavendercharcoal: { bg: '#fffbfe', panel: '255,251,254', p2: '231,224,236', text: '#1c1b1f', muted: '#49454f', accent: '#6650a4', on: '#ffffff', sent: '#6650a4', recv: '#e7e0ec', recvC: '#49454f', radius: 18, light: true, opaque: true },
};
LOOK.creamforest = LIGHTS.creamforest;   // light only: the tiles and the customise page use the same look
function lookFor(id, s) {
  if (id === 'creamforest') return LIGHTS.creamforest;       // light only, by design: it stays cream whatever the mode or the system says
  const light = s.colorMode === 'light' || (s.colorMode === 'system' && s.followSystem && matchMedia('(prefers-color-scheme: light)').matches);
  return light && LIGHTS[id] ? LIGHTS[id] : LOOK[id];
}
const SWATCHES = ['#e85ac8', '#5ac8e8', '#a96ae8', '#ff7a5c', '#4cd97a', '#ffc24a', '#6c6fb0', '#ededed'];
const SWATCH_NAMES = ['Pink', 'Sky blue', 'Violet', 'Coral', 'Green', 'Amber', 'Indigo', 'Silver'];
const FILTERS = ['All', 'Favorites', 'Free', 'Premium', 'Seasonal', 'Calm', 'Animated', 'Photo', 'High graphics'];
const CALM = ['default', 'dusk', 'creamforest', 'lavendercharcoal', 'sunrise', 'nightsky', 'photo'];
const ANIMATED = ['matrix', 'nightsky'];
const KNOB = { speed: [25, 250, 'Speed'], density: [30, 180, 'Density'], intensity: [50, 200, 'Intensity'], scale: [85, 125, 'Scale'] };

const lum = hex => { const n = parseInt(hex.slice(1), 16); return (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255; };
const contrastOn = hex => (lum(hex) > 0.6 ? '#101418' : '#ffffff');
const themeOf = s => THEME_LIST.find(t => t.id === (s.previewing ?? s.appliedTheme));
const knobsOf = (s, id) => (s.knobs[id] ||= { speed: 100, density: 100, intensity: 100, scale: 100 });
const matches = (t, s) => {
  const q = s.query.trim().toLowerCase();
  if (q && !(`${t.name} ${t.desc} ${t.mood}`.toLowerCase().includes(q))) return false;
  switch (s.filter) {
    case 'Free': return !!t.free;
    case 'Premium': return !t.free;
    case 'Calm': return CALM.includes(t.id);
    case 'Animated': return ANIMATED.includes(t.id);
    case 'Photo': return t.id === 'photo';
    case 'All': return true;
    default: return false;           // Favorites, Seasonal, High graphics: none of the sample themes
  }
};

function tile(t, s) {
  const L = LOOK[t.id];
  const bg = t.id === 'photo' && s.photos.length ? '' : `background:${L.bg}`;
  return `<button class="tile" type="button" data-act="tile" data-arg="${t.id}" aria-label="${esc(t.name)}, ${esc(t.desc.toLowerCase())} theme${t.free ? '' : ', premium'}">
    <span class="tile-art" style="${bg}">${t.id === 'photo' ? (s.photos.length ? photo(s.photos[0]) : '<i class="tile-ph">＋ your photos</i>') : `<i class="tile-b" style="background:${L.recv};color:${L.recvC || L.text}"></i><i class="tile-b me" style="background:${L.sent};color:${L.sentC || L.on}"></i>`}</span>
    <b>${esc(t.name)}</b><small>${esc(t.desc)}${t.free ? '' : ' · Premium'}</small></button>`;
}

const sampleBubbles = s => `${bubble('Found the place I was telling you about')}${bubble('Perfect, see you there 🍜', true)}`;

const photosCard = s => `<div class="card-lite">
  ${label('Your photos')}
  ${caption('Choose the pictures to rotate through behind the app.')}
  <button class="btn-s" type="button" id="choose" data-act="choose">${s.photos.length ? 'Add more photos' : 'Choose photos'}</button>
  <p class="caption">${s.photos.length ? `${s.photos.length} photo${s.photos.length === 1 ? '' : 's'} in rotation` : 'Pick several at once — albums from Google Photos show up in the picker.'}</p>
  ${s.photos.length ? `<div class="thumbs">${s.photos.map(i => `<span class="pthumb">${photo(i)}<button type="button" class="pend-x" data-act="rmphoto" data-arg="${i}" aria-label="Remove photo">✕</button></span>`).join('')}</div>
    <div class="caption" style="margin-top:12px">Dim for readability</div>
    ${seg('dim', [['0', 'Off'], ['1', 'Light'], ['2', 'Strong']], String(s.dim), { label: 'Dim for readability' })}` : ''}
  ${s.photos.length > 1 ? `<div class="caption" style="margin-top:12px">Rotate to next photo</div>
    ${seg('rot', [['restart', 'Every open'], ['restart3', 'Every 3 opens'], ['minute1', 'Every 1 min'], ['minute3', 'Every 3 min']], s.rot, { label: 'Rotate to next photo' })}
    <button class="chip demo" type="button" data-act="nextphoto">Demo: show next photo</button>` : ''}
</div>`;

const themeSpec = {
  id: 'themes',
  title: 'Change the theme and make it yours',
  answer: 'Browse themes, try one on in a full preview, then Apply it. Customize adds your own bubble colors, scene sliders and, for the Photo theme, your own pictures.',
  steps: [
    'Open <b>Settings → Appearance</b> and tap <b>Browse themes</b>.',
    'Tap a theme to preview it on a sample conversation. Nothing changes until you tap <b>Apply theme</b>.',
    'Tap <b>Customize</b> to set <b>Bubble colors</b> and, for animated themes, <b>Speed</b>, <b>Density</b>, <b>Intensity</b> and <b>Scale</b>.',
    'Choose the <b>Photo</b> theme to add your own photos, set dimming and pick how often they rotate.',
  ],
  note: '<strong>Changes save automatically for each theme.</strong> The phone here uses simplified stand-ins for a few of the app’s themes. Browse themes in the app to see them all, with search and filters.',
  start: 'home',
  state: () => ({ appliedTheme: 'default', previewing: null, query: '', filter: 'All', knobs: {}, bubbleSent: {}, bubbleRecv: {},
    photos: [], picked: [], dim: 1, rot: 'restart3', photoIdx: 0, reduceMotion: false, colorMode: 'system', textScale: 100, photoStyle: 'stack' }),
  chrome(screen, s) {
    const t = themeOf(s), L = lookFor(t.id, s);
    const sent = s.bubbleSent[t.id] || L.sent, recv = s.bubbleRecv[t.id] || L.recv;
    screen.classList.add('scaled');                       // message text size applies to every conversation
    screen.style.setProperty('--ts', String((s.textScale ?? 100) / 100));
    const photoBg = t.id === 'photo' && s.photos.length;
    const themeKey = t.id + '|' + (L.light ? 'l' : 'd');
    if (screen.dataset.themeKey && screen.dataset.themeKey !== themeKey && !s.reduceMotion && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      screen.dataset.theming = '1'; clearTimeout(screen._theming); screen._theming = setTimeout(() => { delete screen.dataset.theming; }, 500);   // THEME_MS
    }
    screen.dataset.themeKey = themeKey;
    screen.dataset.theme = t.id;
    screen.dataset.motion = s.reduceMotion ? 'off' : 'on';
    const st = screen.style;
    st.setProperty('--screen-bg', photoBg ? '#1c1b1f' : L.bg);
    st.setProperty('--panel', `rgb(${L.panel})`);
    st.setProperty('--bg', `rgb(${L.panel})`);              // fields and segmented controls take the theme, not the website's midnight
    screen.dataset.light = L.light ? '1' : '';
    st.setProperty('--panel-2', `rgba(${L.p2},.9)`);
    st.setProperty('--view-scrim', `rgba(${L.panel},${t.id === 'default' || L.opaque ? 1 : t.id === 'sunrise' ? 0.78 : t.id === 'dusk' ? 0.66 : 0.42})`);
    st.setProperty('--text', L.text); st.setProperty('--muted', L.muted);
    // The snackbar uses the scheme's inverse colours: light on dark themes, dark on light themes (Material defaults).
    st.setProperty('--notice-bg', L.light ? '#313033' : '#e6e1e5'); st.setProperty('--notice-text', L.light ? '#f4eff4' : '#313033'); st.setProperty('--notice-action', L.light ? '#d0bcff' : '#6650a4');
    st.setProperty('--teal', L.accent); st.setProperty('--on-teal', L.on);
    st.setProperty('--line', 'rgba(128,128,128,.3)');
    st.setProperty('--sent', sent); st.setProperty('--sent-c', s.bubbleSent[t.id] ? contrastOn(sent) : (L.sentC || contrastOn(sent)));
    st.setProperty('--recv', recv); st.setProperty('--recv-c', s.bubbleRecv[t.id] ? contrastOn(recv) : (L.recvC || L.text));
    st.setProperty('--bubble-r', L.radius + 'px');
    // Background effect layer
    let fx = screen.querySelector('.fx');
    const k = knobsOf(s, t.id);
    const sig = [t.id, k.speed, k.density, k.intensity, k.scale, photoBg ? s.photos[s.photoIdx % s.photos.length] : '', s.dim].join('|');
    if (!fx) { fx = document.createElement('div'); fx.className = 'fx'; fx.setAttribute('aria-hidden', 'true'); screen.prepend(fx); }
    if (fx.dataset.sig !== sig) {
      fx.dataset.sig = sig; fx.innerHTML = ''; fx.className = 'fx';
      fx.style.setProperty('--fxs', (k.speed / 100)); fx.style.setProperty('--fxo', Math.min(0.5, 0.2 * k.intensity / 100));
      fx.style.transform = `scale(${k.scale / 100})`;
      if (photoBg) {
        const i = s.photos[s.photoIdx % s.photos.length];
        fx.className = 'fx photobg'; fx.innerHTML = photo(i, 'cover') + `<i class="dimmer d${s.dim}"></i>`;
      } else if (L.fx === 'matrix') {
        fx.classList.add('matrix');
        const n = Math.round(12 * k.density / 100);
        fx.innerHTML = Array.from({ length: n }, (_, c) => `<span style="left:${(c + 0.5) * (100 / n)}%;animation-delay:${-(c * 1.37 % 6).toFixed(2)}s">${'ｱｲｳｴｵ0123456789ｶｷｸｹｺ'.split('').sort(() => Math.sin(c * 7 + 3) - 0.5).slice(0, 14).join('<br>')}</span>`).join('');
      } else if (L.fx === 'stars') {
        fx.classList.add('stars');
        const n = Math.round(34 * k.density / 100);
        fx.innerHTML = Array.from({ length: n }, (_, c) => `<i style="left:${(c * 37.7) % 100}%;top:${(c * 23.3) % 96}%;animation-delay:${-(c % 7) * 0.6}s"></i>`).join('');
      }
    }
  },
  views: {
    home: s => inbox(s, { pulse: s.pulse, threads: THREADS }),
    settings: s => settingsHome(s, { pulse: s.pulse }),
    appearance: s => appearancePage(s, { pulse: s.pulse }),
    gallery: s => {
      const list = THEME_LIST.filter(t => matches(t, s));
      return statusbar() + appbar('Browse themes', { back: true }) + `
        <div class="gal-top"><input id="q" class="field" type="search" placeholder="Search themes — rain, city, cozy…" aria-label="Search themes" value="${esc(s.query)}" data-act="query" autocomplete="off">
          <div class="chips" role="group" aria-label="Filter themes">${FILTERS.map(f => `<button type="button" class="chip${f === s.filter ? ' on' : ''}" data-act="filter" data-arg="${f}" aria-pressed="${f === s.filter}">${f}</button>`).join('')}</div>
          <span class="sortlbl">Sort: Recommended ▾</span></div>
        <div class="tiles" tabindex="0">${list.length ? list.map(t => tile(t, s)).join('') : '<p class="empty">No themes match. Try a different word or filter.</p>'}</div>`;
    },
    preview: s => {
      const t = THEME_LIST.find(x => x.id === s.previewing), i = THEME_LIST.indexOf(t);
      const applied = s.appliedTheme === t.id;
      return statusbar() + `<div class="appbar"><button class="icon-btn" type="button" data-act="closeprev" aria-label="Back">${ico.back}</button>
          <div class="ptitle"><h3 tabindex="-1">${esc(t.name)}</h3><span>${esc(t.desc)}${t.free ? '' : ' · Premium'} · ${i + 1} of ${THEME_LIST.length}</span></div></div>
        <div class="prev-body" tabindex="0">
          <span class="pill">${esc(t.mood)}</span>
          <div class="card-lite rows">${THREADS.slice(0, 3).map(x => `<div class="row"><div class="avatar" aria-hidden="true">${x.i}</div><div style="min-width:0"><div class="name">${esc(x.n)}</div><div class="snip">${esc(x.s)}</div></div><div class="time">${x.t}</div></div>`).join('')}</div>
          ${sampleBubbles(s)}
        </div>
        <div class="prev-foot">
          <div class="prev-nav"><button class="txt-btn" type="button" data-act="prevtheme" ${i === 0 ? 'disabled' : ''}>‹ Previous</button><button class="txt-btn" type="button" data-act="nexttheme" ${i === THEME_LIST.length - 1 ? 'disabled' : ''}>Next ›</button></div>
          <div class="prev-actions"><button class="btn-s ghost" type="button" id="custom" data-act="customize">Customize</button>
          <button class="btn-s${s.pulse === 'apply' ? ' tapping-ring' : ''}" type="button" id="apply" data-act="apply" ${applied ? 'disabled' : ''}>${applied ? '✓ Applied' : 'Apply theme'}</button></div>
        </div>`;
    },
    customize: s => {
      const t = themeOf(s), id = t.id, k = knobsOf(s, id), L = LOOK[id];
      const row = (name, key, store) => `<div class="swrow"><span class="caption">${name}</span><div class="sws" role="group" aria-label="${name} bubble color">
        <button type="button" class="sw def${store[id] ? '' : ' on'}" data-act="bubble" data-arg="${key}:" aria-label="Theme default" aria-pressed="${!store[id]}"></button>
        ${SWATCHES.map((c, n) => `<button type="button" class="sw${store[id] === c ? ' on' : ''}" style="background:${c}" data-act="bubble" data-arg="${key}:${c}" aria-label="${SWATCH_NAMES[n]}" aria-pressed="${store[id] === c}"></button>`).join('')}</div></div>`;
      return statusbar() + appbar(esc(t.name), { back: true }) + settingsBody(`
        <p class="caption" style="margin:0 0 8px">Changes save automatically for this theme.</p>
        <div class="stage-prev" aria-label="Live preview">${sampleBubbles(s)}${id === 'photo' && s.photos.length ? `<span class="stage-lbl">Photo ${(s.photoIdx % s.photos.length) + 1} of ${s.photos.length}</span>` : ''}</div>
        ${id === 'photo' ? photosCard(s) : ''}
        ${label('Bubble colors')}
        ${row('Sent', 'sent', s.bubbleSent)}${row('Received', 'recv', s.bubbleRecv)}
        ${L.fx || id === 'photo' ? `<div id="scene" class="sec">${label('Scene')}
          ${Object.entries(KNOB).filter(([key]) => !(key === 'density' && id === 'photo')).map(([key, [lo, hi, name]]) => slider('knob', 'k-' + key, name, k[key], lo, hi, 1, '%').replace('data-act="knob"', `data-act="knob" data-arg="${key}"`)).join('')}</div>` : ''}
        <button class="txt-btn reset" type="button" data-act="resetcust">↺  Reset sliders and colors</button>`);
    },
    picker: s => pickerView(s.picked),
  },
  acts: {
    ...appearanceActs,
    reducemotion: api => { api.s.reduceMotion = !api.s.reduceMotion; api.render('appearance'); },
    gear: api => { api.s.pulse = ''; api.go('settings'); api.step(1); },
    cat: (api, id) => { if (id === 'appearance') { api.s.pulse = ''; api.go('appearance'); } },
    browse: api => { api.s.pulse = ''; api.s.previewing = null; api.go('gallery'); api.step(1); },
    query: (api, _a, el) => { api.s.query = el.value; const keep = el.selectionStart; api.render('gallery'); const q = api.$('#q'); q.focus(); q.setSelectionRange(keep, keep); },
    filter: (api, f) => { api.s.filter = f; api.render('gallery'); },
    tile: (api, id) => { api.s.previewing = id; api.go('preview'); api.step(2); },
    closeprev: api => { api.s.previewing = null; api.back(); },
    prevtheme: api => { const i = THEME_LIST.findIndex(t => t.id === api.s.previewing); api.s.previewing = THEME_LIST[Math.max(0, i - 1)].id; api.render('preview'); },
    nexttheme: api => { const i = THEME_LIST.findIndex(t => t.id === api.s.previewing); api.s.previewing = THEME_LIST[Math.min(THEME_LIST.length - 1, i + 1)].id; api.render('preview'); },
    apply: api => { api.s.appliedTheme = api.s.previewing; api.s.pulse = ''; api.render('preview'); api.step(2); },
    customize: api => { api.go('customize'); api.step(3); },
    bubble: (api, arg) => {
      const [which, color] = arg.split(':'); const id = themeOf(api.s).id;
      const store = which === 'sent' ? api.s.bubbleSent : api.s.bubbleRecv;
      color ? (store[id] = color) : delete store[id];
      api.render('customize');
    },
    knob: (api, key, el) => {
      knobsOf(api.s, themeOf(api.s).id)[key] = Number(el.value);
      const out = api.$(`#k-${key}-out`); if (out) out.textContent = el.value + '%';
      api.refresh();                     // restyle the phone without rebuilding the slider being dragged
    },
    resetcust: api => { const id = themeOf(api.s).id; delete api.s.knobs[id]; delete api.s.bubbleSent[id]; delete api.s.bubbleRecv[id]; api.render('customize'); },
    choose: api => { api.s.picked = []; api.go('picker'); },
    pick: (api, i) => { i = Number(i); const p = api.s.picked, at = p.indexOf(i); at >= 0 ? p.splice(at, 1) : p.push(i); api.render('picker'); api.step(4); },
    pickcancel: api => api.back(),
    pickdone: api => { api.s.photos = [...new Set([...api.s.photos, ...api.s.picked])]; api.s.photoIdx = 0; api.back(); api.step(4); },
    rmphoto: (api, i) => { api.s.photos = api.s.photos.filter(x => x !== Number(i)); api.render('customize'); },
    dim: (api, v) => { api.s.dim = Number(v); api.render('customize'); },
    rot: (api, v) => { api.s.rot = v; api.render('customize'); },
    nextphoto: api => { api.s.photoIdx++; api.render('customize'); },
  },
  async play(api, t) {
    api.s.pulse = 'gear'; api.render('home'); await t.sleep(400);
    await t.tap('#gear');
    api.s.pulse = 'appearance'; api.render('settings'); await t.sleep(400);
    await t.tap('#cat-appearance');
    api.s.pulse = 'browse'; api.render('appearance'); await t.sleep(500);
    await t.tap('#browse');
    await t.sleep(500);
    await t.tap('[data-arg="dusk"]'); await t.sleep(1100);
    await t.tap('[data-act="nexttheme"]'); await t.sleep(900);   // Matrix
    await t.tap('[data-act="nexttheme"]'); await t.sleep(900);   // Sunrise
    await t.tap('[data-act="nexttheme"]'); await t.sleep(900);   // Night Sky
    api.s.pulse = 'apply'; api.render('preview'); await t.sleep(500);
    await t.tap('#apply'); await t.sleep(900);
    await t.tap('#custom'); await t.sleep(600);
    await t.slide('#k-speed', 190, 1000);
    await t.tap(`[data-arg="sent:#ff7a5c"]`); await t.sleep(900);
    api.back(); await t.sleep(300);        // preview
    api.s.previewing = 'photo'; api.render('preview'); await t.sleep(600);
    await t.tap('#custom'); await t.sleep(500);
    await t.tap('#choose'); await t.sleep(500);
    for (const i of [0, 3, 4]) await t.tap(`[data-arg="${i}"]`);
    await t.tap('[data-act="pickdone"]'); await t.sleep(900);
    await t.tap('[data-act="nextphoto"]'); await t.sleep(900);
  },
};

export default themeSpec;
export { themeSpec, LOOK };
