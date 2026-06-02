module.exports = (sequelize, DataTypes) => {
  const CadastroPendente = sequelize.define('CadastroPendente', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    perfil: {
      type: DataTypes.ENUM('usuario', 'proprietario'),
      allowNull: false,
    },
    payload: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    email_verificacao: {
      type: DataTypes.STRING(160),
      allowNull: false,
    },
    telefone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    telefone_e164: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    codigo_hash: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    sms_provider: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: 'local',
    },
    provider_reference: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    email_provider: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: 'local',
    },
    tentativas: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    reenvios: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    ultimo_envio_em: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    expira_em: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  }, {
    tableName: 'cadastros_pendentes',
    timestamps: true,
    underscored: true,
  });

  return CadastroPendente;
};
