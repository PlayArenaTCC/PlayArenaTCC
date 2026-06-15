module.exports = (sequelize, DataTypes) => {
  const CredencialBanida = sequelize.define('CredencialBanida', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    perfil: {
      type: DataTypes.ENUM('usuario', 'proprietario'),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(160),
      allowNull: false,
    },
    cpf: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    motivo: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    administrador_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'administradores',
        key: 'id',
      },
    },
  }, {
    tableName: 'credenciais_banidas',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['email'],
      },
      {
        unique: true,
        fields: ['cpf'],
      },
    ],
  });

  CredencialBanida.associate = (models) => {
    CredencialBanida.belongsTo(models.Administrador, {
      foreignKey: 'administrador_id',
      as: 'administrador',
    });
  };

  return CredencialBanida;
};
