const { createSequelize } = require('./config/database');

async function checkDatabase() {
  const sequelize = createSequelize();

  try {
    await sequelize.authenticate();
  } finally {
    await sequelize.close();
  }
}

checkDatabase().catch(() => {
  process.exit(1);
});
