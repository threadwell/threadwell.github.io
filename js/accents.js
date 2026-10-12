// Space colours on checklist and note cards: keep the colour when it reads, otherwise black or white.
/**
 * A Space's colour is a fine border but can be unreadable as text on a light card. Same rule as the app
 * (ContrastResolver.resolveForeground): keep the colour if it has enough contrast, otherwise black or white.
 */
export function readableAccents(el) {
  const rgb = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 }; };
  const lum = ({ r, g, b }) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
  const hex = h => ({ r: parseInt(h.slice(1, 3), 16), g: parseInt(h.slice(3, 5), 16), b: parseInt(h.slice(5, 7), 16) });
  el.querySelectorAll('.ncard').forEach(card => {
    const b = card.querySelector('.nhead b'); const accent = card.style.getPropertyValue('--accent').trim();
    if (!b || !/^#[0-9a-f]{6}$/i.test(accent)) return;
    const panel = rgb(getComputedStyle(card).getPropertyValue('--panel')) || { r: 0, g: 0, b: 0 };
    const p2 = rgb(getComputedStyle(card).backgroundColor) || panel;
    const bg = { r: p2.r * p2.a + panel.r * (1 - p2.a), g: p2.g * p2.a + panel.g * (1 - p2.a), b: p2.b * p2.a + panel.b * (1 - p2.a) };
    const c = hex(accent);
    const pick = ratio(c, bg) >= 4.5 ? accent : (ratio({ r: 0, g: 0, b: 0 }, bg) >= ratio({ r: 255, g: 255, b: 255 }, bg) ? '#000' : '#fff');
    b.style.color = pick;
  });
}
