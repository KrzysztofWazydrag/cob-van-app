import { expect, test } from 'vitest';
import { canOrderOnline, initialOrderCutoffAt } from '../src/onlineOrdering';

test('local demo cutoff is 09:45 on the current service day', () => {
  expect(initialOrderCutoffAt(new Date(2026, 8, 10, 12).getTime()))
    .toBe(new Date(2026, 8, 10, 9, 45).getTime());
});

test.each([
  [999, true], [1000, false], [1001, false], [NaN, false],
])('eligibility at time %s is %s for cutoff 1000', (now, expected) => {
  expect(canOrderOnline(1000, now)).toBe(expected);
});

test('missing/invalid cutoff fails closed', () => {
  expect(canOrderOnline(NaN, 0)).toBe(false);
});
