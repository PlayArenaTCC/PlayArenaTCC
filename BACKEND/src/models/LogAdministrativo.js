module.exports = (sequelize, DataTypes) => {
  const LogAdministrativo = sequelize.define('LogAdministrativo', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    administrador_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'administradores',
        key: 'id',
      },
    },
    acao: {
      type: DataTypes.STRING(60),
      allowNull: false,
    },
    entidade: {
      type: DataTypes.STRING(60),
      allowNull: false,
    },
    entidade_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    detalhes: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
  }, {
    tableName: 'logs_administrativos',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['administrador_id', 'created_at'],
      },
      {
        fields: ['entidade', 'entidade_id'],
      },
      {
        fields: ['acao'],
      },
    ],
  });

  LogAdministrativo.associate = (models) => {
    LogAdministrativo.belongsTo(models.Administrador, {
      foreignKey: 'administrador_id',
      as: 'administrador',
    });
  };

  return LogAdministrativo;
};
