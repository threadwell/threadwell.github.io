// Behaviour of the shared Appearance page controls (Color mode, Reduce motion, Message text size, Photo groups).
// Demos spread these into their `acts` so the same control always behaves the same way.
export const appearanceActs = {
  noop: () => {},
  colormode: (api, id) => { api.s.colorMode = id; api.render('appearance'); },
  reducemotion: api => { api.s.reduceMotion = !api.s.reduceMotion; api.render('appearance'); },
  textsize: (api, _a, el) => {
    api.s.textScale = Number(el.value);
    const out = api.$('#ts-out'); if (out) out.textContent = api.s.textScale + '%';
  },
  stackspread: (api, _a, el) => {
    api.s.stackSpread = Number(el.value);
    const out = api.$('#ss-out'); if (out) out.textContent = api.s.stackSpread + '%';
  },
  photostyle: (api, id) => {
    api.s.photoStyle = id;
    api.render('appearance');
    api.$('#sec-photogroups')?.scrollIntoView({ block: 'center' });
  },
};

/** Scroll a section of the Appearance page into view inside the phone (not the whole page). */
export function scrollPhone(api, sel) {
  const el = api.$(sel), box = api.$('.set-body');
  if (el && box) box.scrollTop = el.offsetTop - 8;
}
