const test = require('node:test');
const assert = require('node:assert/strict');
const { summarize } = require('../../src/lib/summary');

test('totals income, expenses and net, and ranks spending by category', () => {
  const result = summarize([
    { type: 'income', amountCents: 300000, category: 'Salary' },
    { type: 'expense', amountCents: 120000, category: 'Rent' },
    { type: 'expense', amountCents: 20000, category: 'Groceries' },
    { type: 'expense', amountCents: 10000, category: 'Groceries' },
  ]);

  assert.equal(result.incomeCents, 300000);
  assert.equal(result.expenseCents, 150000);
  assert.equal(result.netCents, 150000);
  assert.deepEqual(result.byCategory, [
    { category: 'Rent', cents: 120000, share: 80 },
    { category: 'Groceries', cents: 30000, share: 20 },
  ]);
});

test('an empty month is all zeros', () => {
  assert.deepEqual(summarize([]), { incomeCents: 0, expenseCents: 0, netCents: 0, byCategory: [] });
});

test('net goes negative when you overspend', () => {
  const result = summarize([
    { type: 'income', amountCents: 1000, category: 'Freelance' },
    { type: 'expense', amountCents: 2500, category: 'Shopping' },
  ]);
  assert.equal(result.netCents, -1500);
});
