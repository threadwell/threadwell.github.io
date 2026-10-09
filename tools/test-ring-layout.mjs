// Run with: node tools/test-ring-layout.mjs
// The same golden values and properties as RingLayoutTest.kt / CarouselLoopTest.kt in the app, so the two cannot drift apart.
import assert from 'node:assert/strict';
import { RING, ringPlace, ringDrawn, ringReach, ringTilt, loopPhoto } from '../js/ring-layout.js';

let n = 0;
const test = (name, fn) => { fn(); n++; console.log('ok  ' + name); };
const near = (a, b, eps, msg) => assert.ok(Math.abs(a - b) <= eps, `${msg}: expected ${b}, got ${a}`);

test('placement matches the app golden table', () => {
  // signed, count, x, lift, scale, alpha, tilt
  const table = [
    [0, 4, 0.0000, 0.0000, 1.0000, 1.0000, 0.000],
    [1, 4, 0.8660, 0.2500, 0.8875, 0.8875, 64.000],
    [-1, 4, -0.8660, 0.2500, 0.8875, 0.8875, -64.000],
    [-2, 4, 0.8660, 0.7500, 0.6625, 0.6625, 60.000],
    [0.5, 4, 0.5000, 0.0670, 0.9699, 0.9699, 45.000],
    [3, 7, 0.4339, 0.9505, 0.5723, 0.5723, 25.714],
    [-3, 7, -0.4339, 0.9505, 0.5723, 0.5723, -25.714],
    [5, 6, -0.8660, 0.2500, 0.8875, 0.8875, -64.000],
    [-1, 2, 0.8660, 0.2500, 0.8875, 0.8875, 64.000],
    [4, 30, 0.8660, 0.7500, 0.6625, 0.6625, 60.000],
    [-5.5, 30, -0.2588, 0.9830, 0.5577, 0.5577, -15.000],
    [3, 13, 1.0000, 0.5000, 0.7750, 0.7750, 64.000],
    [2, 12, 0.8660, 0.2500, 0.8875, 0.8875, 64.000],
    [-4, 12, -0.8660, 0.7500, 0.6625, 0.6625, -60.000],
  ];
  for (const [s, c, x, lift, scale, alpha, tilt] of table) {
    const p = ringPlace(s, c), tag = `signed=${s} count=${c}`;
    near(p.x, x, 0.001, 'x ' + tag); near(p.lift, lift, 0.001, 'lift ' + tag); near(p.scale, scale, 0.001, 'scale ' + tag);
    near(p.alpha, alpha, 0.001, 'alpha ' + tag); near(p.tiltDeg, tilt, 0.01, 'tilt ' + tag);
  }
});

test('sides turn hard and the very back faces you', () => {
  near(ringTilt(30), 45, 0.001, 'near neighbour'); near(ringTilt(60), RING.MAX_TILT_DEG, 0.001, '60'); near(ringTilt(90), RING.MAX_TILT_DEG, 0.001, '90');
  near(ringTilt(120), 60, 0.001, '120'); near(ringTilt(150), 30, 0.001, '150'); near(ringTilt(180), 0, 0.001, '180 faces you'); near(ringTilt(-100), -ringTilt(100), 0.001, 'mirror');
});

test('the back row rises clearly above the front photo', () => {
  const photoH = RING.PAGE_FRAC * 0.75, back = ringPlace(6, 12);
  const peek = RING.LIFT_FRAC * back.lift + photoH * back.scale / 2 - photoH / 2;
  assert.ok(peek > 0.07, `back row peeks ${peek.toFixed(3)} of the width`);
});

test('drawn matches the app golden table', () => {
  assert.equal(ringDrawn(2, 4), false); assert.equal(ringDrawn(-2, 4), true); assert.equal(ringDrawn(1, 4), true);
  assert.equal(ringDrawn(2, 2), false); assert.equal(ringDrawn(-1, 2), true);
  assert.equal(ringDrawn(5, 6), false); assert.equal(ringDrawn(-3, 6), true);
  assert.equal(ringDrawn(6, 12), false); assert.equal(ringDrawn(-6, 12), true);
  assert.equal(ringDrawn(3, 13), true); assert.equal(ringDrawn(7, 30), false);
});

test('each photo is drawn exactly once for every count and front photo (0, 1, 2, 3, 8, 9, 12, 13, 30, 40 and all between)', () => {
  for (let c = 2; c <= 40; c++) for (let front = 0; front < c; front++) {
    const shown = [];
    for (let s = -30; s <= 30; s++) if (ringDrawn(s, c)) shown.push(loopPhoto(front + s, c));
    assert.equal(new Set(shown).size, shown.length, `duplicates for n=${c} front=${front}`);
    assert.equal(shown.length, Math.min(c, RING.MAX_SLOTS), `count for n=${c} front=${front}`);
    assert.ok(shown.includes(front), `front photo missing for n=${c} front=${front}`);
  }
});

test('a big group is bounded', () => {
  assert.equal(ringReach(30), 7); assert.equal(ringReach(4), 3); assert.equal(ringReach(2), 2);
  let drawn = 0; for (let s = -100; s <= 100; s++) if (ringDrawn(s, 1000)) drawn++;
  assert.equal(drawn, RING.MAX_SLOTS);
});

test('counts of one (and zero) do not break the maths', () => {
  ringPlace(0, 1); ringPlace(0.5, 1); assert.equal(ringDrawn(0, 1), true);
  assert.equal(ringReach(0), 1);
});

test('loop indexing wraps both ways and survives rapid direction changes', () => {
  assert.equal(loopPhoto(-1, 7), 6); assert.equal(loopPhoto(-7, 7), 0); assert.equal(loopPhoto(7, 7), 0);
  let page = 70000, net = 0, seed = 42;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  for (let i = 0; i < 5000; i++) { const step = rnd() < 0.5 ? 1 : -1; page += step; net += step; assert.equal(loopPhoto(page - 70000 + 0, 7), ((net % 7) + 7) % 7); }
});

console.log(`\n${n} passed`);
