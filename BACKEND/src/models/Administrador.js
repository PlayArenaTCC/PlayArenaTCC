module.exports = (sequelize, DataTypes) => {
  const Administrador = sequelize.define('Administrador', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    nome: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(160),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    senha_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    nivel_acesso: {
      type: DataTypes.ENUM('admin', 'super_admin'),
      allowNull: false,
      defaultValue: 'admin',
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  }, {
    tableName: 'administradores',
    timestamps: true,
    underscored: true,
  });

  return Administrador;
};
