const path = require('path');
const fs = require('fs');
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');

function createApp() {
  const app = express();

  app.disable('x-powered-by');
  // Hosts like Render sit behind one proxy; this lets the rate limiter see real client IPs.
  if (config.isProduction) app.set('trust proxy', 1);
  app.use(helmet());
  app.use(express.json({ limit: '10kb' }));
  app.use(cookieParser());

  // Slow down password guessing: at most 20 login/register attempts per 15 minutes per IP.
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: process.env.NODE_ENV === 'test' ? 1000 : 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many attempts. Please wait a few minutes and try again.' },
  });

  app.get('/api/health', (req, res) => res.json({ ok: true }));
  // Only rate-limit the password endpoints. /me runs on every page load and must not count.
  app.use(['/api/auth/login', '/api/auth/register'], authLimiter);
  app.use('/api/auth', authRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

  // In production the API also serves the built React app, so both share one origin.
  const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
  if (config.isProduction && fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
  }

  // Malformed JSON and unexpected errors end up here. Details are logged, never sent to the client.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Request body is not valid JSON.' });
    }
    if (err.type === 'entity.too.large') {
      return res.status(413).json({ error: 'Request body is too large.' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong on our side.' });
  });

  return app;
}

module.exports = { createApp };
