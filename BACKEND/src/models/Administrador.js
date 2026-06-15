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
    cpf: {
      type: DataTypes.STRING(11),
      allowNull: true,
      unique: true,
      validate: {
        is: /^\d{11}$/,
      },
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
    telefone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    foto_perfil_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
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

  Administrador.associate = (models) => {
    Administrador.hasMany(models.LogAdministrativo, {
      foreignKey: 'administrador_id',
      as: 'logs_administrativos',
    });
  };

  return Administrador;
};
