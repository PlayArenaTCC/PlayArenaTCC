const { createSequelize } = require('./config/database');

async function checkDatabase() {
  const sequelize = createSequelize();

  try {
    await sequelize.authenticate();
    console.log('Conexao com Neon/PostgreSQL realizada com sucesso.');
  } finally {
    await sequelize.close();
  }
}

checkDatabase().catch((error) => {
  console.error('Falha ao conectar no banco:', error.message);
  process.exit(1);
});
