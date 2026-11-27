import test from 'node:test';
import assert from 'node:assert/strict';
import { rankAlternatives } from '../lib/plan.mjs';
const r = (name, price, rating, reviews) => ({ productRef: name + price, name, price: `${price},00 €`, userReviewsSummary: rating ? { averageRating: rating, totalReviewCount: reviews } : undefined });
test('ranks by rating x reviews, dedupes variants, drops price outliers', () => {
  const out = rankAlternatives([r('A', 70, 4.9, 30), r('A', 80, 4.9, 30), r('B', 28, 4.3, 3), r('C', 350, 0, 0), r('D', 40, 4.6, 200)]);
  assert.deepEqual(out.map(x => x.name), ['D', 'A', 'B']);
  assert.equal(out.find(x => x.name === 'A').price, 70);
  assert.deepEqual(out.map(x => x.rank), [1, 2, 3]);
});
