import test from 'node:test';
import assert from 'node:assert/strict';
import { centsToInput, currentMonth, monthLabel, shiftMonth, today, shortDate } from '../src/lib/format.js';

test('moves between months across year boundaries', () => {
  assert.equal(shiftMonth('2027-01', -1), '2026-12');
  assert.equal(shiftMonth('2027-12', 1), '2028-01');
  assert.equal(shiftMonth('2027-05', 0), '2027-05');
  assert.equal(shiftMonth('2027-05', -17), '2025-12');
});

test('uses the local date, not UTC', () => {
  const lateEvening = new Date(2027, 4, 31, 23, 30); // May 31, 11:30 pm local time
  assert.equal(today(lateEvening), '2027-05-31');
  assert.equal(currentMonth(lateEvening), '2027-05');
});

test('formats labels and inputs', () => {
  assert.equal(monthLabel('2027-05'), 'May 2027');
  assert.equal(centsToInput(4550), '45.50');
  assert.match(shortDate('2027-05-14'), /May 14/);
});
