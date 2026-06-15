const { sequelize } = require('./models');

async function syncDatabase() {
  const force = process.argv.includes('--force');
  const alter = process.argv.includes('--alter');

  await sequelize.authenticate();
  await sequelize.sync({ force, alter });
}

syncDatabase()
  .catch(() => {
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
