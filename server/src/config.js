require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const config = {
  port: Number(process.env.PORT) || 4000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  isProduction,
  tokenTtlSeconds: 60 * 60 * 24 * 7, // 7 days
};

if (!config.jwtSecret || (isProduction && config.jwtSecret.length < 32)) {
  throw new Error('JWT_SECRET is missing or too short. Set it in your .env file.');
}

module.exports = config;
