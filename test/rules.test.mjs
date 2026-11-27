// The six test cases from the team's Deal Calendar spec (today = 2026-11-27).
import test from 'node:test';
import assert from 'node:assert/strict';
import { advise, allowedActions, guardDecision, dn } from '../lib/rules.mjs';
const T = '2026-11-27', add = (s, n) => new Date((dn(s) + n) * 864e5).toISOString().slice(0, 10);
const cases = [
  [{ category: 'shoes', need: add(T, 7), now: 80, low30d: 40, target: 30 }, 'BUY_NOW', 1],
  [{ category: 'shoes', need: add(T, 60), now: 49.9, low30d: 48.5, target: 45 }, 'BUY_NOW', 3],
  [{ category: 'lego', need: '2027-12-20', now: 99, low30d: 80, target: 60 }, 'WAIT', 4],
  [{ category: 'clothing', need: '2027-05-01', now: 30, low30d: 25, target: 20 }, 'WATCH', 6],
  [{ category: 'shoes', need: add(T, 60), now: 60, low30d: 48.5, target: 45 }, 'WATCH', 6],
  [{ category: 'clothing', need: '2027-05-01', now: 19, low30d: 18, target: 20 }, 'BUY_NOW', 2],
];
cases.forEach(([it, action, rule], i) => test(`spec case ${i + 1}: ${action} by rule ${rule}`, () => {
  const r = advise(it, T); assert.equal(r.action, action); assert.equal(r.rule, rule);
  assert.ok(allowedActions({ ...it, today: T }).includes(action), 'rule result must be an allowed action');
}));
test('no WAIT without measured proof', () => {
  const f = { category: 'clothing', need: '2027-05-01', now: 30, low30d: 25, target: 20, today: T };
  assert.ok(!allowedActions(f).includes('WAIT'));
  const g = guardDecision({ action: 'WAIT', confidence: 0.9, reason: 'Easter sale' }, allowedActions(f), f);
  assert.equal(g.action, 'WATCH'); assert.ok(g.overridden);
});
test('model choice inside allowed set is kept', () => {
  const f = { category: 'shoes', need: add(T, 60), now: 49.9, low30d: 48.5, target: 45, today: T };
  const g = guardDecision({ action: 'ask_parent', confidence: 0.6, reason: 'Shoe size unknown', missing_evidence: ['shoe size'] }, allowedActions(f), f);
  assert.equal(g.action, 'ASK_PARENT'); assert.equal(g.overridden, false);
});
