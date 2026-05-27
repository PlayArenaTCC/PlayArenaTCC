require('dotenv').config();

const { createApp } = require('./app/createApp');
const { sequelize } = require('./models');

const port = process.env.PORT || 3333;

async function startServer() {
  if (process.env.DATABASE_URL) {
    await sequelize.authenticate();
    console.log('Banco Neon/PostgreSQL conectado.');
  } else {
    console.warn('DATABASE_URL nao configurada. API iniciando sem testar o banco.');
  }

  const app = createApp();

  app.listen(port, () => {
    console.log(`API PlayArena rodando em http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error('Erro ao iniciar API:', error.message);
  process.exit(1);
});
