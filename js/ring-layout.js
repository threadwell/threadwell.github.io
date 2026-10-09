// Where each photo sits on the Ring, and how the endless carousel indexes its pages. Pure, and kept identical to
// `RingLayout` and `CarouselLoop` in PhotoCollage.kt (the app); both are tested against the same golden values
// (tools/test-ring-layout.mjs here, RingLayoutTest.kt there). Change both together.
//
// The ring is a circle of photos seen from inside, slightly from above: the photo in front faces you, the ones to the
// sides turn toward the centre, and the far half rises behind (smaller, higher, and turning back to face you at the very
// back), so the back row is visible above the front photo like a cylinder of pictures.

export const RING = {
  MIN_SLOTS: 6, MAX_SLOTS: 12,
  /** Side photos turn by (angle x TILT_GAIN) up to MAX_TILT_DEG; the far half turns back to face you (TILT_BACK_GAIN). */
  TILT_GAIN: 1.5, TILT_BACK_GAIN: 1.0, MAX_TILT_DEG: 64, TURN: 1,
  /** Sizes as fractions of the carousel's width, so the ring looks the same on a phone, a cover screen and unfolded. */
  PAGE_FRAC: 0.38, RADIUS_FRAC: 0.43, LIFT_FRAC: 0.20,
};

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** Pages either side of the front that are ever drawn. */
export const ringReach = n => Math.floor(Math.min(n, RING.MAX_SLOTS) / 2) + 1;

/**
 * Whether the photo `signed` pages from the front is drawn. Each photo is drawn once, on the half of the circle it belongs
 * to: the page n slots away would land on the same spot, so it is left empty (it re-appears, unseen, at the very back).
 * Past MAX_SLOTS photos only the nearest are drawn, which also bounds the work done.
 */
export function ringDrawn(signed, n) {
  const half = Math.min(n, RING.MAX_SLOTS) / 2;
  return signed >= -half && signed < half;
}

/** The turn (degrees) of a photo at `angle` degrees round the ring: strong at the sides, easing back to face you at the back. */
export function ringTilt(angle) {
  const a = Math.abs(angle);
  const t = a <= 90 ? a * RING.TILT_GAIN : (180 - a) * RING.TILT_BACK_GAIN;
  return RING.TURN * Math.sign(angle) * Math.min(t, RING.MAX_TILT_DEG);
}

/**
 * Placement of the photo `signed` pages from the front (live while swiping) on a ring of n photos.
 * `x` is a unit (-1..1) fraction of the ring radius and `lift` a unit (0..1) fraction of the maximum rise: the renderer
 * multiplies them by RADIUS_FRAC and LIFT_FRAC of the carousel width.
 */
export function ringPlace(signed, n) {
  const slots = clamp(n, RING.MIN_SLOTS, RING.MAX_SLOTS), step = 360 / slots;
  let w = signed;
  if (n >= 2 && n <= RING.MAX_SLOTS) { w = ((signed % n) + n) % n; if (w > n / 2) w -= n; }
  const angle = w * step, rad = angle * Math.PI / 180, front = (Math.cos(rad) + 1) / 2;
  return {
    x: Math.sin(rad),
    lift: 1 - front,
    scale: 0.55 + 0.45 * front,
    alpha: 0.55 + 0.45 * front,
    depth: Math.cos(rad),
    tiltDeg: ringTilt(angle),
  };
}

/** Which photo (0-based) the i-th page of an endless track shows. */
export const loopPhoto = (i, n) => ((i % n) + n) % n;
