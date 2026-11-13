const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { validateCredentials } = require('../lib/validate');
const { requireAuth, setAuthCookie, clearAuthCookie } = require('../middleware/auth');

const router = express.Router();
const BCRYPT_ROUNDS = 12;
// Compared against when an email isn't found, so a wrong email takes as long as a
// wrong password and attackers can't tell which accounts exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS);

router.post('/register', async (req, res, next) => {
  const { value, errors } = validateCredentials(req.body, { isRegistration: true });
  if (Object.keys(errors).length) return res.status(400).json({ errors });

  try {
    const passwordHash = await bcrypt.hash(value.password, BCRYPT_ROUNDS);
    const { rows } = await db.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [value.email, passwordHash],
    );
    setAuthCookie(res, rows[0].id);
    return res.status(201).json({ user: rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ errors: { email: 'An account with this email already exists.' } });
    }
    return next(err);
  }
});

router.post('/login', async (req, res, next) => {
  const { value, errors } = validateCredentials(req.body);
  if (Object.keys(errors).length) return res.status(400).json({ errors });

  try {
    const { rows } = await db.query(
      'SELECT id, email, password_hash FROM users WHERE email = $1',
      [value.email],
    );
    const user = rows[0];
    const passwordMatches = await bcrypt.compare(value.password, user ? user.password_hash : DUMMY_HASH);

    if (!user || !passwordMatches) {
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }

    setAuthCookie(res, user.id);
    return res.json({ user: { id: user.id, email: user.email } });
  } catch (err) {
    return next(err);
  }
});

router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.status(204).end();
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT id, email FROM users WHERE id = $1', [req.userId]);
    if (!rows[0]) {
      clearAuthCookie(res);
      return res.status(401).json({ error: 'Please log in.' });
    }
    return res.json({ user: rows[0] });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
