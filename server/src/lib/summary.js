// Builds the monthly summary shown on the dashboard from a list of transactions.

function summarize(transactions) {
  let incomeCents = 0;
  let expenseCents = 0;
  const spendingByCategory = new Map();

  for (const t of transactions) {
    if (t.type === 'income') {
      incomeCents += t.amountCents;
    } else if (t.type === 'expense') {
      expenseCents += t.amountCents;
      spendingByCategory.set(t.category, (spendingByCategory.get(t.category) || 0) + t.amountCents);
    }
  }

  const byCategory = [...spendingByCategory.entries()]
    .map(([category, cents]) => ({
      category,
      cents,
      share: expenseCents === 0 ? 0 : Math.round((cents / expenseCents) * 1000) / 10,
    }))
    .sort((a, b) => b.cents - a.cents || a.category.localeCompare(b.category));

  return {
    incomeCents,
    expenseCents,
    netCents: incomeCents - expenseCents,
    byCategory,
  };
}

module.exports = { summarize };
