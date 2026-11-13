// Input validation. Every request body is checked here before it reaches the database.
// Each validator returns { value, errors }: `value` is the cleaned data, `errors`
// maps field names to messages and is empty when the input is valid.

const { parseAmountToCents } = require('./money');

const CATEGORIES = [
  'Salary',
  'Freelance',
  'Rent',
  'Groceries',
  'Transport',
  'Utilities',
  'Eating out',
  'Entertainment',
  'Health',
  'Education',
  'Shopping',
  'Savings',
  'Other',
];

const TYPES = ['income', 'expense'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isRealDate(text) {
  if (typeof text !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const date = new Date(`${text}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === text;
}

function validateCredentials(body, { isRegistration = false } = {}) {
  const errors = {};
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    errors.email = 'Enter a valid email address.';
  }

  if (isRegistration) {
    if (password.length < 8 || password.length > 72) {
      errors.password = 'Password must be 8 to 72 characters.';
    } else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      errors.password = 'Password needs at least one letter and one number.';
    }
  } else if (!password) {
    errors.password = 'Enter your password.';
  }

  return { value: { email, password }, errors };
}

function validateTransaction(body) {
  const errors = {};
  const type = body?.type;
  const amountCents = parseAmountToCents(body?.amount);
  const category = typeof body?.category === 'string' ? body.category.trim() : '';
  const description = typeof body?.description === 'string' ? body.description.trim() : '';
  const occurredOn = body?.occurredOn;

  if (!TYPES.includes(type)) errors.type = 'Type must be income or expense.';
  if (amountCents === null) {
    errors.amount = 'Amount must be a positive number with up to 2 decimals (max $1,000,000).';
  }
  if (!CATEGORIES.includes(category)) errors.category = 'Choose a category from the list.';
  if (description.length > 200) errors.description = 'Keep the description under 200 characters.';
  if (!isRealDate(occurredOn)) errors.occurredOn = 'Date must be a real date in YYYY-MM-DD format.';

  return {
    value: { type, amountCents, category, description, occurredOn },
    errors,
  };
}

/** "2027-05" -> { start: "2027-05-01", end: "2027-06-01" } (end is exclusive), or null. */
function parseMonth(text) {
  if (typeof text !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(text)) return null;
  const [year, month] = text.split('-').map(Number);
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  return {
    start: `${text}-01`,
    end: `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`,
  };
}

function parseId(text) {
  const id = Number(text);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

module.exports = {
  CATEGORIES,
  TYPES,
  isRealDate,
  validateCredentials,
  validateTransaction,
  parseMonth,
  parseId,
};
