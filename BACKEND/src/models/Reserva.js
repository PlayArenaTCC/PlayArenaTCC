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
    observacoes: {
      type: DataTypes.TEXT,
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
        fields: ['quadra_id', 'data_reserva', 'hora_inicio', 'hora_fim'],
        name: 'reservas_unicas_por_horario',
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
  };

  return Reserva;
};
