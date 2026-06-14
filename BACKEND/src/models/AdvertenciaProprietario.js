module.exports = (sequelize, DataTypes) => {
  const AdvertenciaProprietario = sequelize.define('AdvertenciaProprietario', {
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
    reserva_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'reservas',
        key: 'id',
      },
    },
    quadra_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'quadras',
        key: 'id',
      },
    },
    motivo: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    cancelamento_em: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    expira_em: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    ativa: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  }, {
    tableName: 'advertencias_proprietario',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['proprietario_id', 'ativa', 'expira_em'],
      },
      {
        unique: true,
        fields: ['reserva_id'],
        name: 'advertencias_proprietario_reserva_unica',
      },
    ],
  });

  AdvertenciaProprietario.associate = (models) => {
    AdvertenciaProprietario.belongsTo(models.Proprietario, {
      foreignKey: 'proprietario_id',
      as: 'proprietario',
    });
    AdvertenciaProprietario.belongsTo(models.Reserva, {
      foreignKey: 'reserva_id',
      as: 'reserva',
    });
    AdvertenciaProprietario.belongsTo(models.Quadra, {
      foreignKey: 'quadra_id',
      as: 'quadra',
    });
    AdvertenciaProprietario.belongsToMany(models.AvisoAdministrativo, {
      through: models.AvisoAdvertenciaItem,
      foreignKey: 'advertencia_id',
      otherKey: 'aviso_administrativo_id',
      as: 'avisos',
    });
  };

  return AdvertenciaProprietario;
};
