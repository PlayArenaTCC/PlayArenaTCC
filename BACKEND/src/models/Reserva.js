module.exports = (sequelize, DataTypes) => {
  const Reserva = sequelize.define('Reserva', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    usuario_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'usuarios',
        key: 'id',
      },
    },
    quadra_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'quadras',
        key: 'id',
      },
    },
    horario_disponivel_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'horarios_disponiveis',
        key: 'id',
      },
    },
    data_reserva: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    hora_inicio: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    hora_fim: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pendente', 'confirmada', 'cancelada', 'concluida'),
      allowNull: false,
      defaultValue: 'pendente',
    },
    forma_pagamento: {
      type: DataTypes.ENUM('pix', 'cartao', 'dinheiro', 'nao_informado'),
      allowNull: false,
      defaultValue: 'nao_informado',
    },
    valor_total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    data_inicio: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    data_fim: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reserva_em_cima_da_hora: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    percentual_reembolso: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    valor_reembolso: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    motivo_reembolso: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    observacoes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    motivo_cancelamento: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    codigo_reserva: {
      type: DataTypes.STRING(12),
      allowNull: true,
    },
    status_validacao: {
      type: DataTypes.ENUM('pendente', 'validada'),
      allowNull: false,
      defaultValue: 'pendente',
    },
    validado_em: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    validado_por_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'proprietarios',
        key: 'id',
      },
    },
    cancelado_em: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    cancelado_por_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    cancelado_por_perfil: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    cancelado_por_nome: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cancelada_por: {
      type: DataTypes.ENUM('USUARIO', 'PROPRIETARIO', 'ADMIN'),
      allowNull: true,
    },
  }, {
    tableName: 'reservas',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['usuario_id'],
      },
      {
        fields: ['quadra_id'],
      },
      {
        unique: true,
        fields: ['codigo_reserva'],
        name: 'reservas_codigo_reserva_unico',
      },
      {
        unique: true,
        fields: ['quadra_id', 'data_reserva', 'hora_inicio', 'hora_fim'],
        name: 'reservas_unicas_por_horario_ativas',
        where: {
          status: ['pendente', 'confirmada'],
        },
      },
    ],
  });

  Reserva.associate = (models) => {
    Reserva.belongsTo(models.Usuario, {
      foreignKey: 'usuario_id',
      as: 'usuario',
    });
    Reserva.belongsTo(models.Quadra, {
      foreignKey: 'quadra_id',
      as: 'quadra',
    });
    Reserva.belongsTo(models.HorarioDisponivel, {
      foreignKey: 'horario_disponivel_id',
      as: 'horario_disponivel',
    });
    Reserva.belongsTo(models.Proprietario, {
      foreignKey: 'validado_por_id',
      as: 'validado_por',
    });
    Reserva.hasMany(models.Notificacao, {
      foreignKey: 'reservationId',
      as: 'notificacoes',
    });
    Reserva.hasMany(models.AdvertenciaProprietario, {
      foreignKey: 'reserva_id',
      as: 'advertencias_proprietario',
    });
  };

  return Reserva;
};
