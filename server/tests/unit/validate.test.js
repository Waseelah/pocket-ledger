const test = require('node:test');
const assert = require('node:assert/strict');
const {
  validateCredentials,
  validateTransaction,
  parseMonth,
  parseId,
  isRealDate,
} = require('../../src/lib/validate');

const goodTransaction = {
  type: 'expense',
  amount: '42.10',
  category: 'Groceries',
  description: 'Weekly shop',
  occurredOn: '2027-05-14',
};

test('accepts a valid registration and normalizes the email', () => {
  const { value, errors } = validateCredentials(
    { email: '  Wasilat@Example.COM ', password: 'secure123' },
    { isRegistration: true },
  );
  assert.deepEqual(errors, {});
  assert.equal(value.email, 'wasilat@example.com');
});

test('rejects weak passwords and bad emails on registration', () => {
  assert.ok(validateCredentials({ email: 'a@b.co', password: 'short1' }, { isRegistration: true }).errors.password);
  assert.ok(validateCredentials({ email: 'a@b.co', password: 'onlyletters' }, { isRegistration: true }).errors.password);
  assert.ok(validateCredentials({ email: 'a@b.co', password: 'x1'.repeat(40) }, { isRegistration: true }).errors.password);
  assert.ok(validateCredentials({ email: 'not-an-email', password: 'secure123' }, { isRegistration: true }).errors.email);
});

test('login only needs a password to be present', () => {
  assert.deepEqual(validateCredentials({ email: 'a@b.co', password: 'x' }).errors, {});
  assert.ok(validateCredentials({ email: 'a@b.co' }).errors.password);
});

test('handles missing or non-object bodies without crashing', () => {
  assert.ok(Object.keys(validateCredentials(undefined).errors).length > 0);
  assert.ok(Object.keys(validateTransaction(null).errors).length > 0);
});

test('accepts a valid transaction and converts the amount to cents', () => {
  const { value, errors } = validateTransaction(goodTransaction);
  assert.deepEqual(errors, {});
  assert.equal(value.amountCents, 4210);
});

test('flags each bad transaction field', () => {
  const { errors } = validateTransaction({
    type: 'gift',
    amount: '-3',
    category: 'Crypto',
    description: 'x'.repeat(201),
    occurredOn: '2027-02-30',
  });
  assert.deepEqual(Object.keys(errors).sort(), ['amount', 'category', 'description', 'occurredOn', 'type']);
});

test('only real calendar dates pass', () => {
  assert.ok(isRealDate('2028-02-29')); // leap year
  assert.ok(!isRealDate('2027-02-29'));
  assert.ok(!isRealDate('2027-13-01'));
  assert.ok(!isRealDate('14/05/2027'));
});

test('turns a month into a date range, including December', () => {
  assert.deepEqual(parseMonth('2027-05'), { start: '2027-05-01', end: '2027-06-01' });
  assert.deepEqual(parseMonth('2027-12'), { start: '2027-12-01', end: '2028-01-01' });
  assert.equal(parseMonth('2027-13'), null);
  assert.equal(parseMonth('May 2027'), null);
});

test('parses only positive integer ids', () => {
  assert.equal(parseId('7'), 7);
  for (const bad of ['0', '-1', '1.5', 'abc', '1; DROP TABLE users']) {
    assert.equal(parseId(bad), null);
  }
});
