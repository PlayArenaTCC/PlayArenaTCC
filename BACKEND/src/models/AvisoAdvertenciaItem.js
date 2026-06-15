module.exports = (sequelize, DataTypes) => {
  const AvisoAdvertenciaItem = sequelize.define('AvisoAdvertenciaItem', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    aviso_administrativo_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'avisos_administrativos',
        key: 'id',
      },
    },
    advertencia_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'advertencias_proprietario',
        key: 'id',
      },
    },
  }, {
    tableName: 'aviso_advertencia_items',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['aviso_administrativo_id', 'advertencia_id'],
        name: 'aviso_advertencia_items_unico',
      },
    ],
  });

  return AvisoAdvertenciaItem;
};
