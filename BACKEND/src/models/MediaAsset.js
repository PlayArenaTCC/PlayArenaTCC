module.exports = (sequelize, DataTypes) => {
  const MediaAsset = sequelize.define('MediaAsset', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tipo: {
      type: DataTypes.STRING(40),
      allowNull: false,
    },
    owner_perfil: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    owner_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    nome_original: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    mime_type: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    tamanho: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    dados: {
      type: DataTypes.BLOB('long'),
      allowNull: false,
    },
  }, {
    tableName: 'midias_arquivos',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['tipo'],
      },
      {
        fields: ['owner_perfil', 'owner_id'],
      },
    ],
  });

  return MediaAsset;
};
