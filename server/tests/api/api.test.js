// End-to-end API tests against a real PostgreSQL database.
// They run in CI (see .github/workflows/ci.yml) and locally when DATABASE_URL is set.
// They wipe the users and transactions tables, so never point them at real data.

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-that-is-long-enough-for-hs256-signing';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const skip = !process.env.DATABASE_URL && 'DATABASE_URL is not set, so API tests are skipped';

test('API', { skip }, async (t) => {
  const request = require('supertest');
  const db = require('../../src/db');
  const { createApp } = require('../../src/app');
  const app = createApp();

  await db.query(fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'schema.sql'), 'utf8'));
  await db.query('TRUNCATE transactions, users RESTART IDENTITY CASCADE');
  t.after(() => db.pool.end());

  const alice = request.agent(app); // an agent keeps cookies between requests, like a browser
  const bob = request.agent(app);
  const expense = {
    type: 'expense',
    amount: '45.50',
    category: 'Groceries',
    description: 'Weekly shop',
    occurredOn: '2027-05-14',
  };
  let aliceTransactionId;

  await t.test('registers a user and sets an httpOnly cookie', async () => {
    const res = await alice.post('/api/auth/register').send({ email: 'alice@example.com', password: 'secure123' });
    assert.equal(res.status, 201);
    assert.equal(res.body.user.email, 'alice@example.com');
    assert.equal(res.body.user.password_hash, undefined);
    const cookie = res.headers['set-cookie'].join(';');
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /SameSite=Strict/i);
  });

  await t.test('refuses a duplicate email', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'ALICE@example.com', password: 'secure123' });
    assert.equal(res.status, 409);
  });

  await t.test('rejects a wrong password with a generic message', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'alice@example.com', password: 'wrong1234' });
    assert.equal(res.status, 401);
    assert.equal(res.body.error, 'Email or password is incorrect.');
  });

  await t.test('blocks transaction routes without a login', async () => {
    const res = await request(app).get('/api/transactions?month=2027-05');
    assert.equal(res.status, 401);
  });

  await t.test('creates a transaction and lists it for its month', async () => {
    const created = await alice.post('/api/transactions').send(expense);
    assert.equal(created.status, 201);
    assert.equal(created.body.transaction.amountCents, 4550);
    assert.equal(created.body.transaction.occurredOn, '2027-05-14');
    aliceTransactionId = created.body.transaction.id;

    const list = await alice.get('/api/transactions?month=2027-05');
    assert.equal(list.status, 200);
    assert.equal(list.body.transactions.length, 1);

    const otherMonth = await alice.get('/api/transactions?month=2027-06');
    assert.equal(otherMonth.body.transactions.length, 0);
  });

  await t.test('rejects invalid input with field-level errors', async () => {
    const res = await alice.post('/api/transactions').send({ ...expense, amount: '-10', category: 'Crypto' });
    assert.equal(res.status, 400);
    assert.ok(res.body.errors.amount);
    assert.ok(res.body.errors.category);
  });

  await t.test('stores SQL-looking text as plain text', async () => {
    const res = await alice
      .post('/api/transactions')
      .send({ ...expense, description: "'); DROP TABLE users; --" });
    assert.equal(res.status, 201);
    assert.equal(res.body.transaction.description, "'); DROP TABLE users; --");
    const stillThere = await alice.get('/api/auth/me');
    assert.equal(stillThere.status, 200);
  });

  await t.test("never lets one user see or change another user's data", async () => {
    await bob.post('/api/auth/register').send({ email: 'bob@example.com', password: 'secure456' });

    const list = await bob.get('/api/transactions?month=2027-05');
    assert.equal(list.body.transactions.length, 0);

    const edit = await bob.put(`/api/transactions/${aliceTransactionId}`).send({ ...expense, amount: '1' });
    assert.equal(edit.status, 404);

    const remove = await bob.delete(`/api/transactions/${aliceTransactionId}`);
    assert.equal(remove.status, 404);
  });

  await t.test('summarizes the month', async () => {
    await alice.post('/api/transactions').send({
      type: 'income',
      amount: '2000',
      category: 'Salary',
      description: 'May pay',
      occurredOn: '2027-05-01',
    });
    const res = await alice.get('/api/transactions/summary?month=2027-05');
    assert.equal(res.status, 200);
    assert.equal(res.body.incomeCents, 200000);
    assert.equal(res.body.expenseCents, 9100);
    assert.equal(res.body.netCents, 190900);
    assert.equal(res.body.byCategory[0].category, 'Groceries');
  });

  await t.test('updates and deletes its own transaction', async () => {
    const edit = await alice.put(`/api/transactions/${aliceTransactionId}`).send({ ...expense, amount: '50' });
    assert.equal(edit.status, 200);
    assert.equal(edit.body.transaction.amountCents, 5000);

    const remove = await alice.delete(`/api/transactions/${aliceTransactionId}`);
    assert.equal(remove.status, 204);
  });

  await t.test('logs out and loses access', async () => {
    const out = await alice.post('/api/auth/logout');
    assert.equal(out.status, 204);
    const me = await alice.get('/api/auth/me');
    assert.equal(me.status, 401);
  });
});
