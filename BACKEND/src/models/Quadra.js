module.exports = (sequelize, DataTypes) => {
  const Quadra = sequelize.define('Quadra', {
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
    nome: {
      type: DataTypes.STRING(140),
      allowNull: false,
    },
    descricao: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    modalidade: {
      type: DataTypes.STRING(80),
      allowNull: false,
      defaultValue: 'poliesportiva',
    },
    endereco: {
      type: DataTypes.STRING(220),
      allowNull: false,
    },
    bairro: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    cidade: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'Campo Mourao',
    },
    estado: {
      type: DataTypes.STRING(2),
      allowNull: false,
      defaultValue: 'PR',
    },
    cep: {
      type: DataTypes.STRING(12),
      allowNull: true,
    },
    preco_hora: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    imagem_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    ativa: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  }, {
    tableName: 'quadras',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['proprietario_id'],
      },
      {
        fields: ['cidade', 'modalidade'],
      },
    ],
  });

  Quadra.associate = (models) => {
    Quadra.belongsTo(models.Proprietario, {
      foreignKey: 'proprietario_id',
      as: 'proprietario',
    });
    Quadra.hasMany(models.HorarioDisponivel, {
      foreignKey: 'quadra_id',
      as: 'horarios_disponiveis',
    });
    Quadra.hasMany(models.Reserva, {
      foreignKey: 'quadra_id',
      as: 'reservas',
    });
  };

  return Quadra;
};
