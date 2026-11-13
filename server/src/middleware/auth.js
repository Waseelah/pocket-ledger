const jwt = require('jsonwebtoken');
const config = require('../config');

const COOKIE_NAME = 'token';

function cookieOptions() {
  return {
    httpOnly: true, // JavaScript in the browser can't read it, which blunts XSS token theft
    sameSite: 'strict', // not sent on cross-site requests, which blocks CSRF
    secure: config.isProduction, // HTTPS only in production
    maxAge: config.tokenTtlSeconds * 1000,
    path: '/',
  };
}

function setAuthCookie(res, userId) {
  const token = jwt.sign({ sub: String(userId) }, config.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: config.tokenTtlSeconds,
  });
  res.cookie(COOKIE_NAME, token, cookieOptions());
}

function clearAuthCookie(res) {
  const { maxAge, ...options } = cookieOptions();
  res.clearCookie(COOKIE_NAME, options);
}

function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'Please log in.' });

  try {
    const payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
    req.userId = Number(payload.sub);
    return next();
  } catch {
    clearAuthCookie(res);
    return res.status(401).json({ error: 'Your session has expired. Please log in again.' });
  }
}

module.exports = { requireAuth, setAuthCookie, clearAuthCookie };
