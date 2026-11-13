const moneyFormatter = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' });

export function formatMoney(cents) {
  return moneyFormatter.format(cents / 100);
}

export function centsToInput(cents) {
  return (cents / 100).toFixed(2);
}

function pad(n) {
  return String(n).padStart(2, '0');
}

/** Today's date in the user's own time zone, as YYYY-MM-DD. */
export function today(now = new Date()) {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function currentMonth(now = new Date()) {
  return today(now).slice(0, 7);
}

/** shiftMonth("2027-01", -1) -> "2026-12" */
export function shiftMonth(month, delta) {
  const [year, m] = month.split('-').map(Number);
  const index = year * 12 + (m - 1) + delta;
  return `${Math.floor(index / 12)}-${pad((index % 12) + 1)}`;
}

/** "2027-05" -> "May 2027" */
export function monthLabel(month) {
  const [year, m] = month.split('-').map(Number);
  return new Date(Date.UTC(year, m - 1, 1)).toLocaleDateString('en-CA', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** "2027-05-14" -> "May 14" */
export function shortDate(isoDate) {
  const [year, m, d] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(year, m - 1, d)).toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
