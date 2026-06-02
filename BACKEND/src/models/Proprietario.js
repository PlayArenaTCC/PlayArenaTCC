module.exports = (sequelize, DataTypes) => {
  const Proprietario = sequelize.define('Proprietario', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    nome_responsavel: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    nome_empresa: {
      type: DataTypes.STRING(160),
      allowNull: true,
    },
    cpf_cnpj: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
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
    status_aprovacao: {
      type: DataTypes.ENUM('pendente', 'aprovado', 'reprovado'),
      allowNull: false,
      defaultValue: 'pendente',
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  }, {
    tableName: 'proprietarios',
    timestamps: true,
    underscored: true,
  });

  Proprietario.associate = (models) => {
    Proprietario.hasMany(models.Quadra, {
      foreignKey: 'proprietario_id',
      as: 'quadras',
    });
  };

  return Proprietario;
};
