require('dotenv').config();

const { createApp } = require('./app/createApp');
const { sequelize } = require('./models');
const advertenciaProprietarioService = require('./services/advertenciaProprietarioService');
const {
  ensureAdminProfilePhotoSchemaCompatibility,
} = require('./services/schemaCompatibilityService');

const port = process.env.PORT || 3333;

async function startServer() {
  if (process.env.DATABASE_URL) {
    await sequelize.authenticate();
    await ensureAdminProfilePhotoSchemaCompatibility();
    await advertenciaProprietarioService.expirarAdvertenciasAntigas();
  }

  const app = createApp();

  app.listen(port);
}

startServer().catch(() => {
  process.exit(1);
});
