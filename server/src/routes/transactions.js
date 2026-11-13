const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { validateTransaction, parseMonth, parseId, CATEGORIES } = require('../lib/validate');
const { summarize } = require('../lib/summary');

const router = express.Router();
router.use(requireAuth);

// occurred_on is cast to text so dates come back as "YYYY-MM-DD" with no time-zone shifts.
const COLUMNS = 'id, type, amount_cents, category, description, occurred_on::text AS occurred_on';

function toTransaction(row) {
  return {
    id: row.id,
    type: row.type,
    amountCents: row.amount_cents,
    category: row.category,
    description: row.description,
    occurredOn: row.occurred_on,
  };
}

async function listForMonth(userId, range) {
  // Every query is filtered by user_id, so one user can never read or change another's data.
  const { rows } = await db.query(
    `SELECT ${COLUMNS} FROM transactions
     WHERE user_id = $1 AND occurred_on >= $2 AND occurred_on < $3
     ORDER BY occurred_on DESC, id DESC`,
    [userId, range.start, range.end],
  );
  return rows.map(toTransaction);
}

router.get('/categories', (req, res) => {
  res.json({ categories: CATEGORIES });
});

router.get('/summary', async (req, res, next) => {
  const range = parseMonth(req.query.month);
  if (!range) return res.status(400).json({ error: 'month must look like 2027-05.' });
  try {
    const transactions = await listForMonth(req.userId, range);
    return res.json({ month: req.query.month, ...summarize(transactions) });
  } catch (err) {
    return next(err);
  }
});

router.get('/', async (req, res, next) => {
  const range = parseMonth(req.query.month);
  if (!range) return res.status(400).json({ error: 'month must look like 2027-05.' });
  try {
    return res.json({ transactions: await listForMonth(req.userId, range) });
  } catch (err) {
    return next(err);
  }
});

router.post('/', async (req, res, next) => {
  const { value, errors } = validateTransaction(req.body);
  if (Object.keys(errors).length) return res.status(400).json({ errors });
  try {
    const { rows } = await db.query(
      `INSERT INTO transactions (user_id, type, amount_cents, category, description, occurred_on)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING ${COLUMNS}`,
      [req.userId, value.type, value.amountCents, value.category, value.description, value.occurredOn],
    );
    return res.status(201).json({ transaction: toTransaction(rows[0]) });
  } catch (err) {
    return next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(404).json({ error: 'Transaction not found.' });
  const { value, errors } = validateTransaction(req.body);
  if (Object.keys(errors).length) return res.status(400).json({ errors });
  try {
    const { rows } = await db.query(
      `UPDATE transactions
       SET type = $1, amount_cents = $2, category = $3, description = $4, occurred_on = $5
       WHERE id = $6 AND user_id = $7 RETURNING ${COLUMNS}`,
      [value.type, value.amountCents, value.category, value.description, value.occurredOn, id, req.userId],
    );
    if (!rows[0]) return res.status(404).json({ error: 'Transaction not found.' });
    return res.json({ transaction: toTransaction(rows[0]) });
  } catch (err) {
    return next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(404).json({ error: 'Transaction not found.' });
  try {
    const { rowCount } = await db.query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2',
      [id, req.userId],
    );
    if (!rowCount) return res.status(404).json({ error: 'Transaction not found.' });
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
