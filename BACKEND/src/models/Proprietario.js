const { isValidCpfOrCnpj, onlyDigits } = require('../utils/brDocuments');

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
      set(value) {
        const digits = onlyDigits(value);
        this.setDataValue('cpf_cnpj', digits || null);
      },
      validate: {
        isCpfOrCnpj(value) {
          if (value && !isValidCpfOrCnpj(value)) {
            throw new Error('Informe um CPF ou CNPJ v\u00e1lido.');
          }
        },
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
    bloqueada_inicio_em: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    bloqueada_fim_em: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    motivo_bloqueio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'proprietarios',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['bloqueada_inicio_em', 'bloqueada_fim_em'],
      },
    ],
  });

  Proprietario.associate = (models) => {
    Proprietario.hasMany(models.Quadra, {
      foreignKey: 'proprietario_id',
      as: 'quadras',
    });
    Proprietario.hasMany(models.DocumentacaoLocal, {
      foreignKey: 'proprietario_id',
      as: 'documentacoes_locais',
    });
    Proprietario.hasMany(models.AdvertenciaProprietario, {
      foreignKey: 'proprietario_id',
      as: 'advertencias',
    });
    Proprietario.hasMany(models.AvisoAdministrativo, {
      foreignKey: 'proprietario_id',
      as: 'avisos_administrativos',
    });
  };

  return Proprietario;
};
