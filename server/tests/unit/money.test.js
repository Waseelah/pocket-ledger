const test = require('node:test');
const assert = require('node:assert/strict');
const { parseAmountToCents, centsToDollars } = require('../../src/lib/money');

test('parses whole and decimal amounts into cents', () => {
  assert.equal(parseAmountToCents('12'), 1200);
  assert.equal(parseAmountToCents('12.5'), 1250);
  assert.equal(parseAmountToCents('12.05'), 1205);
  assert.equal(parseAmountToCents('1,234.56'), 123456);
  assert.equal(parseAmountToCents(19.99), 1999);
  assert.equal(parseAmountToCents(' 7.10 '), 710);
});

test('avoids floating-point rounding errors', () => {
  // 0.1 + 0.2 style bugs: 1.15 * 100 is 114.99999999999999 in JavaScript.
  assert.equal(parseAmountToCents('1.15'), 115);
  assert.equal(parseAmountToCents('4.35'), 435);
});

test('rejects zero, negatives, too many decimals and junk', () => {
  for (const bad of ['0', '0.00', '-5', '1.234', 'abc', '', '1e5', '12.', null, undefined, {}, NaN, Infinity]) {
    assert.equal(parseAmountToCents(bad), null, `expected ${String(bad)} to be rejected`);
  }
});

test('rejects amounts over the $1,000,000 cap', () => {
  assert.equal(parseAmountToCents('1000000'), 100_000_000);
  assert.equal(parseAmountToCents('1000000.01'), null);
});

test('formats cents as dollars', () => {
  assert.equal(centsToDollars(123456), '1234.56');
  assert.equal(centsToDollars(5), '0.05');
});
