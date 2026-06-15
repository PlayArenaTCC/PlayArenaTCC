module.exports = (sequelize, DataTypes) => {
  const RecuperacaoSenha = sequelize.define('RecuperacaoSenha', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    perfil: {
      type: DataTypes.ENUM('usuario', 'proprietario'),
      allowNull: false,
    },
    conta_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(160),
      allowNull: false,
    },
    codigo_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
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
    validado_em: {
      type: DataTypes.DATE,
      allowNull: true,
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
    tableName: 'recuperacoes_senha',
    timestamps: true,
    underscored: true,
  });

  return RecuperacaoSenha;
};
