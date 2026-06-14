const { DataTypes } = require('sequelize');
const { createSequelize } = require('../config/database');

const sequelize = createSequelize();

const Usuario = require('./Usuario')(sequelize, DataTypes);
const Proprietario = require('./Proprietario')(sequelize, DataTypes);
const Quadra = require('./Quadra')(sequelize, DataTypes);
const HorarioDisponivel = require('./HorarioDisponivel')(sequelize, DataTypes);
const Reserva = require('./Reserva')(sequelize, DataTypes);
const Administrador = require('./Administrador')(sequelize, DataTypes);

const models = {
  Usuario,
  Proprietario,
  Quadra,
  HorarioDisponivel,
  Reserva,
  Administrador,
};

Object.values(models).forEach((model) => {
  if (typeof model.associate === 'function') {
    model.associate(models);
  }
});

module.exports = {
  sequelize,
  ...models,
};
