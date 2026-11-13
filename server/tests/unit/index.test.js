const test = require('node:test');
const assert = require('node:assert/strict');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-that-is-long-enough-for-hs256-signing';

delete require.cache[require.resolve('../../src/index.js')];

const app = require('../../src/index.js');

test('exports the Express app without auto-starting the server on import', () => {
  assert.ok(app);
  assert.equal(typeof app.listen, 'function');
});
