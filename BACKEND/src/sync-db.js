const { sequelize } = require('./models');

async function syncDatabase() {
  const force = process.argv.includes('--force');
  const alter = process.argv.includes('--alter');

  if (force) {
    console.warn('ATENCAO: --force apaga e recria as tabelas.');
  }

  await sequelize.authenticate();
  await sequelize.sync({ force, alter });

  console.log('Tabelas sincronizadas com sucesso.');
  console.log('Tabelas: usuarios, proprietarios, quadras, horarios_disponiveis, reservas, administradores.');
}

syncDatabase()
  .catch((error) => {
    console.error('Falha ao sincronizar tabelas:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
