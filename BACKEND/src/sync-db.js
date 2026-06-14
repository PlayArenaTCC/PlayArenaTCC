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
  console.log('Tabelas: usuários, proprietários, quadras, horarios_disponiveis, reservas, notificacoes, administradores, logs_administrativos, cadastros_pendentes, documentacoes_locais, recuperacoes_senha.');
}

syncDatabase()
  .catch((error) => {
    console.error('Falha ao sincronizar tabelas:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
