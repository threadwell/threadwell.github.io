// Mirrors Motion.kt and CollapsibleWidgetHost.kt. Size is intentionally animated:
// these panels move adjacent content in Android too. No state change waits for motion.
export const PANEL_MOTION = Object.freeze({ size: 200, exit: 150, widgetExit: 120, widgetDelay: 60, ease: 'cubic-bezier(0.4, 0, 0.2, 1)' });

export function replacePanel(root, selector, render, { reduced = false, widget = false } = {}) {
  const old = root?.querySelector(selector);
  const height = old?.getBoundingClientRect().height || 0;
  old?._panelCleanup?.();
  const ghost = old?.cloneNode(true);
  render();
  const panel = root?.querySelector(selector);
  if (!panel || reduced || matchMedia('(prefers-reduced-motion: reduce)').matches || !panel.animate) return;
  panel.classList.remove('rail-anim');
  const target = panel.getBoundingClientRect().height;
  if (!height && !target) return;
  panel.dataset.panelAnimating = 'true';
  const animations = [], media = matchMedia('(prefers-reduced-motion: reduce)');
  let done = false;
  const cleanup = () => {
    if (done) return; done = true;
    ghost?.remove(); delete panel.dataset.panelAnimating; delete panel._panelCleanup;
    media.removeEventListener('change', changed);
    animations.forEach(a => a.cancel());
  };
  const changed = () => { if (media.matches) cleanup(); };
  panel._panelCleanup = cleanup;
  media.addEventListener('change', changed);
  const animate = (el, frames, options) => {
    const a = el.animate(frames, { easing: PANEL_MOTION.ease, fill: 'both', ...options });
    animations.push(a); return a;
  };
  animate(panel, [{ height: `${height}px` }, { height: `${target}px` }], { duration: PANEL_MOTION.size });
  [...panel.children].forEach(child => animate(child, [{ opacity: 0 }, { opacity: 1 }], { duration: PANEL_MOTION.size, delay: widget ? PANEL_MOTION.widgetDelay : 0 }));
  if (ghost && height) {
    ghost.removeAttribute('id'); ghost.removeAttribute('data-panel-animating'); ghost.classList.remove('rail-anim');
    ghost.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
    ghost.querySelectorAll('[data-panel-ghost]').forEach(el => el.remove());
    ghost.inert = true; ghost.setAttribute('aria-hidden', 'true'); ghost.dataset.panelGhost = 'true';
    Object.assign(ghost.style, { position: 'absolute', top: '0', left: '0', width: '100%', height: `${height}px`, pointerEvents: 'none', margin: '0' });
    panel.append(ghost);
    animate(ghost, [{ opacity: 1 }, { opacity: 0 }], { duration: widget ? PANEL_MOTION.widgetExit : PANEL_MOTION.exit });
  }
  Promise.all(animations.map(a => a.finished.catch(() => {}))).then(cleanup);
}
