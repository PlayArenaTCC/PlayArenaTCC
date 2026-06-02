module.exports = (sequelize, DataTypes) => {
  const Usuario = sequelize.define('Usuario', {
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
    status: {
      type: DataTypes.ENUM('ativo', 'inativo'),
      allowNull: false,
      defaultValue: 'ativo',
    },
  }, {
    tableName: 'usuarios',
    timestamps: true,
    underscored: true,
  });

  Usuario.associate = (models) => {
    Usuario.hasMany(models.Reserva, {
      foreignKey: 'usuario_id',
      as: 'reservas',
    });
  };

  return Usuario;
};
