// Creates the database tables. Run with: npm run migrate
const fs = require('fs');
const path = require('path');
const db = require('../src/db');

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'src', 'schema.sql'), 'utf8');
  await db.query(sql);
  console.log('Database is up to date.');
}

migrate()
  .catch((err) => {
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => db.pool.end());
