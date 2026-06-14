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
    documentacao_local_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'documentacoes_locais',
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
    modalidades: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    tipo_espaco: {
      type: DataTypes.STRING(80),
      allowNull: false,
      defaultValue: 'Quadra',
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
      defaultValue: 'Campo Mourão',
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
    numero: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },
    longitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },
    localizacao_confirmada: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    preco_hora: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    preco_original: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    imagem_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    fotos: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    horarios_funcionamento: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    amenities: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    ativa: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    desativada_inicio_em: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    desativada_fim_em: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    motivo_desativacao: {
      type: DataTypes.TEXT,
      allowNull: true,
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
        fields: ['documentacao_local_id'],
      },
      {
        fields: ['cidade', 'modalidade'],
      },
      {
        fields: ['desativada_inicio_em', 'desativada_fim_em'],
      },
    ],
  });

  Quadra.associate = (models) => {
    Quadra.belongsTo(models.Proprietario, {
      foreignKey: 'proprietario_id',
      as: 'proprietario',
    });
    Quadra.belongsTo(models.DocumentacaoLocal, {
      foreignKey: 'documentacao_local_id',
      as: 'documentacao_local',
    });
    Quadra.hasMany(models.HorarioDisponivel, {
      foreignKey: 'quadra_id',
      as: 'horarios_disponiveis',
    });
    Quadra.hasMany(models.Reserva, {
      foreignKey: 'quadra_id',
      as: 'reservas',
    });
    Quadra.hasMany(models.Notificacao, {
      foreignKey: 'quadraId',
      as: 'notificacoes',
    });
    Quadra.hasMany(models.AdvertenciaProprietario, {
      foreignKey: 'quadra_id',
      as: 'advertencias_proprietario',
    });
  };

  return Quadra;
};
