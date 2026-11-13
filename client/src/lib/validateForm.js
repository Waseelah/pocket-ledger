// Quick checks in the browser so people get instant feedback.
// The server validates everything again: never trust the client alone.

const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;

export function validateTransactionForm(values, categories = []) {
  const errors = {};
  const amount = String(values.amount ?? '').trim().replace(/,/g, '');

  if (!['income', 'expense'].includes(values.type)) errors.type = 'Pick income or expense.';
  if (!AMOUNT_PATTERN.test(amount) || Number(amount) <= 0) {
    errors.amount = 'Enter an amount like 12 or 12.50.';
  } else if (Number(amount) > 1_000_000) {
    errors.amount = 'That is over the $1,000,000 limit.';
  }
  if (!values.category || (categories.length && !categories.includes(values.category))) {
    errors.category = 'Choose a category.';
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.occurredOn || '')) errors.occurredOn = 'Choose a date.';
  if ((values.description || '').length > 200) errors.description = 'Keep it under 200 characters.';

  return errors;
}

export function validateAuthForm({ email, password }, mode) {
  const errors = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || '').trim())) errors.email = 'Enter a valid email.';
  if (mode === 'register') {
    if ((password || '').length < 8) errors.password = 'Use at least 8 characters.';
    else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      errors.password = 'Use at least one letter and one number.';
    }
  } else if (!password) {
    errors.password = 'Enter your password.';
  }
  return errors;
}
