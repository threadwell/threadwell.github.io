// Run with: node tools/test-photo-runs.mjs
// Mirrors BoardPhotoGroupTest.kt (Android) so the playground groups photos exactly as the app does.
import assert from 'node:assert/strict';
import { groupRuns, photoOnly, PHOTO_GROUP_GAP_MS } from '../js/photo-runs.js';

const T0 = 1_700_000_000_000;
const ph = (id, extra = {}) => ({ id, text: '', photo: Number(String(id).replace(/\D/g, '')) || 0, sent: false, t: '', from: '', ...extra });
const tx = (id, extra = {}) => ({ id, text: 'hello', sent: false, t: '', from: '', ...extra });
const shape = list => groupRuns(list).map(u => (u.kind === 'photos' ? `P${u.msgs.length}` : 'M'));
let n = 0;
const test = (name, fn) => { fn(); n++; console.log('ok  ' + name); };

test('consecutive photos become one group', () => assert.deepEqual(shape([ph('p1'), ph('p2'), ph('p3')]), ['P3']));
test('grouping off keeps each photo separate', () => assert.deepEqual(groupRuns([ph('p1'), ph('p2')], { group: false }).map(u => u.kind), ['single', 'single']));
test('a single photo stays single', () => assert.deepEqual(shape([ph('p1')]), ['M']));
test('text ends the group', () => assert.deepEqual(shape([ph('p1'), ph('p2'), tx('t1'), ph('p3')]), ['P2', 'M', 'M']));
test('a caption keeps a photo out of the group', () => assert.deepEqual(shape([ph('p1'), ph('p2', { text: 'look!' }), ph('p3')]), ['M', 'M', 'M']));
test('the other direction ends the group', () => assert.deepEqual(shape([ph('p1'), ph('p2'), ph('p3', { sent: true })]), ['P2', 'M']));
test('a different person in a group chat ends the group', () => assert.deepEqual(shape([ph('p1', { from: 'Maya' }), ph('p2', { from: 'Jon' })]), ['M', 'M']));
test('the same person in a group chat joins', () => assert.deepEqual(shape([ph('p1', { from: 'Maya' }), ph('p2', { from: 'Maya' })]), ['P2']));
test('a time header ends the group', () => assert.deepEqual(shape([ph('p1'), ph('p2', { t: 'Today 4:48 PM' })]), ['M', 'M']));
test('more than five minutes ends the group', () => {
  assert.deepEqual(shape([ph('p1', { at: T0 }), ph('p2', { at: T0 + PHOTO_GROUP_GAP_MS + 1 })]), ['M', 'M']);
  assert.deepEqual(shape([ph('p1', { at: T0 }), ph('p2', { at: T0 + PHOTO_GROUP_GAP_MS })]), ['P2']);
});
test('the gap is measured from the previous photo, not the first', () => {
  const step = PHOTO_GROUP_GAP_MS - 1000;
  assert.deepEqual(shape([ph('p1', { at: T0 }), ph('p2', { at: T0 + step }), ph('p3', { at: T0 + 2 * step })]), ['P3']);
});
test('another attachment, a reaction, or a pending/failed/sending state is never grouped', () => {
  for (const bad of [{ media: [{}] }, { reactions: [{}] }, { pending: true }, { failed: true }, { sending: true }]) {
    assert.equal(photoOnly(ph('p1', bad)), false);
    assert.deepEqual(shape([ph('p1'), ph('p2', bad)]), ['M', 'M']);
  }
});
test('one message carrying several photos is a group on its own', () => {
  const u = groupRuns([{ id: 'x', text: '', photos: [1, 2, 3], sent: true, t: '', from: '' }]);
  assert.equal(u[0].kind, 'photos'); assert.deepEqual(u[0].uris, [1, 2, 3]);
});
test('the group keeps every message so actions can use the first', () => {
  const u = groupRuns([ph('p1'), ph('p2'), ph('p3')])[0];
  assert.equal(u.msgs[0].id, 'p1'); assert.equal(u.msgs.length, 3); assert.equal(u.uris.length, 3);
});
test('the sample thread matches the app: three photos group, the link after them does not', () => {
  const list = [tx('a9', { t: 'Today 4:48 PM' }), ph('a9p'), ph('a9q'), ph('a9r'), tx('a9l', { text: 'Menu is up: https://example.com' })];
  assert.deepEqual(shape(list), ['M', 'P3', 'M']);
});

console.log(`\n${n} passed`);
