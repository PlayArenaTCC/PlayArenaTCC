const { Sequelize } = require('sequelize');
require('dotenv').config();

function createSequelize() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL nao configurada. Crie um arquivo .env com a URL do Neon.');
  }

  return new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  });
}

module.exports = { createSequelize };
