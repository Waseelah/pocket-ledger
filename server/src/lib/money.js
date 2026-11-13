// Money helpers. All amounts are handled in whole cents (integers).

const MAX_CENTS = 100_000_000; // $1,000,000.00 per transaction

/**
 * Turn user input such as "12", "12.5", "1,234.56" or 12.5 into cents.
 * Returns null when the input is not a positive amount with at most 2 decimals.
 */
function parseAmountToCents(input) {
  if (typeof input === 'number') {
    if (!Number.isFinite(input)) return null;
    input = String(input);
  }
  if (typeof input !== 'string') return null;

  const cleaned = input.trim().replace(/,/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;

  const [dollars, fraction = ''] = cleaned.split('.');
  const cents = Number(dollars) * 100 + Number(fraction.padEnd(2, '0'));

  if (!Number.isSafeInteger(cents) || cents <= 0 || cents > MAX_CENTS) return null;
  return cents;
}

function centsToDollars(cents) {
  return (cents / 100).toFixed(2);
}

module.exports = { parseAmountToCents, centsToDollars, MAX_CENTS };
