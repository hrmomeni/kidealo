import test from 'node:test';
import assert from 'node:assert/strict';
import { parseEur, buildQuery, pickBest } from '../lib/plan.mjs';

test('parseEur', () => {
  assert.equal(parseEur('152,15 €'), 152.15);
  assert.equal(parseEur('1.152,00 €'), 1152);
  assert.equal(parseEur('49 €'), 49);
  assert.equal(parseEur(null), null);
});
test('buildQuery', () => {
  const q = t => buildQuery({ title: t, category: 'x' });
  assert.equal(q('First walking shoes, size 21'), 'Lauflernschuhe 21');
  assert.equal(q('Winter overall, size 86'), 'Schneeanzug 86');
  assert.equal(q('Car seat 100–150 cm'), 'Kindersitz i-Size 100-150');
  assert.equal(q('LEGO dinosaur set'), 'LEGO Dinosaurier');
  assert.equal(q('Stair safety gate'), 'Treppenschutzgitter');
  assert.equal(q('Kids headphones, 85 dB limit'), 'Kinderkopfhörer 85 dB');
  assert.equal(q('First bike, 16 inch'), 'Kinderfahrrad 16 Zoll');
  assert.equal(buildQuery({ title: 'Zzz', category: 'bags' }), 'Kinderrucksack');
  assert.equal(buildQuery({ title: 'a', query: 'custom' }), 'custom');
});
test('pickBest prefers reviews and price', () => {
  const r = pickBest([{ name: 'a', price: '10,00 €' }, { name: 'b', price: '20,00 €', userReviewsSummary: { totalReviewCount: 50, averageRating: 4.5 } }, { name: 'c' }]);
  assert.equal(r.name, 'b');
});
