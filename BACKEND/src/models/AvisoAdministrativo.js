module.exports = (sequelize, DataTypes) => {
  const AvisoAdministrativo = sequelize.define('AvisoAdministrativo', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    proprietario_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'proprietarios',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('PENDENTE', 'EM_ANALISE', 'RESOLVIDO'),
      allowNull: false,
      defaultValue: 'PENDENTE',
    },
    quantidade_advertencias: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
    },
    mensagem: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    gerado_em: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    resolvido_em: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'avisos_administrativos',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['proprietario_id', 'status'],
      },
      {
        fields: ['gerado_em'],
      },
    ],
  });

  AvisoAdministrativo.associate = (models) => {
    AvisoAdministrativo.belongsTo(models.Proprietario, {
      foreignKey: 'proprietario_id',
      as: 'proprietario',
    });
    AvisoAdministrativo.belongsToMany(models.AdvertenciaProprietario, {
      through: models.AvisoAdvertenciaItem,
      foreignKey: 'aviso_administrativo_id',
      otherKey: 'advertencia_id',
      as: 'advertencias',
    });
  };

  return AvisoAdministrativo;
};
