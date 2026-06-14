const { DataTypes } = require('sequelize');
const { createSequelize } = require('../config/database');

const sequelize = createSequelize();

const Usuario = require('./Usuario')(sequelize, DataTypes);
const Proprietario = require('./Proprietario')(sequelize, DataTypes);
const Quadra = require('./Quadra')(sequelize, DataTypes);
const HorarioDisponivel = require('./HorarioDisponivel')(sequelize, DataTypes);
const Reserva = require('./Reserva')(sequelize, DataTypes);
const Administrador = require('./Administrador')(sequelize, DataTypes);
const CadastroPendente = require('./CadastroPendente')(sequelize, DataTypes);
const DocumentacaoLocal = require('./DocumentacaoLocal')(sequelize, DataTypes);
const RecuperacaoSenha = require('./RecuperacaoSenha')(sequelize, DataTypes);
const Notificacao = require('./Notificacao')(sequelize, DataTypes);
const LogAdministrativo = require('./LogAdministrativo')(sequelize, DataTypes);
const CredencialBanida = require('./CredencialBanida')(sequelize, DataTypes);
const AdvertenciaProprietario = require('./AdvertenciaProprietario')(sequelize, DataTypes);
const AvisoAdministrativo = require('./AvisoAdministrativo')(sequelize, DataTypes);
const AvisoAdvertenciaItem = require('./AvisoAdvertenciaItem')(sequelize, DataTypes);

const models = {
  Usuario,
  Proprietario,
  Quadra,
  HorarioDisponivel,
  Reserva,
  Administrador,
  CadastroPendente,
  DocumentacaoLocal,
  RecuperacaoSenha,
  Notificacao,
  LogAdministrativo,
  CredencialBanida,
  AdvertenciaProprietario,
  AvisoAdministrativo,
  AvisoAdvertenciaItem,
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
