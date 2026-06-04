module.exports = (sequelize, DataTypes) => {
  const DocumentacaoLocal = sequelize.define('DocumentacaoLocal', {
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
    tipo_proprietario: {
      type: DataTypes.ENUM('dono_local', 'gerenciador'),
      allowNull: false,
    },
    endereco_key: {
      type: DataTypes.STRING(255),
      allowNull: false,
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
    documentos: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    status: {
      type: DataTypes.ENUM('pendente', 'em_analise', 'aprovado', 'reprovado'),
      allowNull: false,
      defaultValue: 'pendente',
    },
    enviado_em: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    responsavel_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    administrador_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'administradores',
        key: 'id',
      },
    },
    analisado_em: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    motivo_reprovacao: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'documentacoes_locais',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['proprietario_id'],
      },
      {
        unique: true,
        fields: ['proprietario_id', 'endereco_key'],
        name: 'documentacoes_locais_unicas_por_local',
      },
      {
        fields: ['status'],
      },
    ],
  });

  DocumentacaoLocal.associate = (models) => {
    DocumentacaoLocal.belongsTo(models.Proprietario, {
      foreignKey: 'proprietario_id',
      as: 'proprietario',
    });
    DocumentacaoLocal.belongsTo(models.Administrador, {
      foreignKey: 'administrador_id',
      as: 'administrador',
    });
    DocumentacaoLocal.hasMany(models.Quadra, {
      foreignKey: 'documentacao_local_id',
      as: 'quadras',
    });
  };

  return DocumentacaoLocal;
};
