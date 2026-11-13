const config = require('./config');
const { createApp } = require('./app');

const app = createApp();

if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`Pocket Ledger API listening on http://localhost:${config.port}`);
  });
}

module.exports = app;
