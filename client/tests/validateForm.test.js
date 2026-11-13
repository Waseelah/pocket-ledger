import test from 'node:test';
import assert from 'node:assert/strict';
import { validateTransactionForm, validateAuthForm } from '../src/lib/validateForm.js';

const categories = ['Groceries', 'Salary'];
const good = { type: 'expense', amount: '12.50', category: 'Groceries', occurredOn: '2027-05-14', description: '' };

test('a complete transaction passes', () => {
  assert.deepEqual(validateTransactionForm(good, categories), {});
});

test('catches bad amounts before they reach the server', () => {
  for (const amount of ['', '0', '-4', '1.999', 'ten', '2000000']) {
    assert.ok(validateTransactionForm({ ...good, amount }, categories).amount, `amount "${amount}"`);
  }
});

test('requires a known category and a date', () => {
  const errors = validateTransactionForm({ ...good, category: 'Crypto', occurredOn: '' }, categories);
  assert.ok(errors.category);
  assert.ok(errors.occurredOn);
});

test('sign-up needs a stronger password than log-in', () => {
  assert.ok(validateAuthForm({ email: 'a@b.co', password: 'abc' }, 'register').password);
  assert.ok(validateAuthForm({ email: 'a@b.co', password: 'abcdefgh' }, 'register').password);
  assert.deepEqual(validateAuthForm({ email: 'a@b.co', password: 'abcdefg1' }, 'register'), {});
  assert.deepEqual(validateAuthForm({ email: 'a@b.co', password: 'abc' }, 'login'), {});
});
