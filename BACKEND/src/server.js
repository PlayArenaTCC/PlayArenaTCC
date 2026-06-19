require('dotenv').config();

const { createApp } = require('./app/createApp');
const { sequelize } = require('./models');

const advertenciaProprietarioService = require('./services/advertenciaProprietarioService');

const {
  ensureAdminProfilePhotoSchemaCompatibility,
  ensureMediaAssetSchemaCompatibility,
} = require('./services/schemaCompatibilityService');

process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION');
  console.error(error);
});

process.on('unhandledRejection', (error) => {
  console.error('UNHANDLED REJECTION');
  console.error(error);
});

const PORT = process.env.PORT || 3333;

async function startServer() {
  if (process.env.DATABASE_URL) {
    await sequelize.authenticate();

    await ensureMediaAssetSchemaCompatibility();
    await ensureAdminProfilePhotoSchemaCompatibility();

    await advertenciaProprietarioService.expirarAdvertenciasAntigas();
  }

  const app = createApp();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor iniciado na porta ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Erro ao iniciar servidor:');
  console.error(error);
  process.exit(1);
});
