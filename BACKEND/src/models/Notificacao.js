module.exports = (sequelize, DataTypes) => {
  const Notificacao = sequelize.define('Notificacao', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'usuarios',
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING(160),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('RESERVATION_CANCELLED', 'PROMOTION_CREATED', 'PRICE_DROPPED'),
      allowNull: false,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    reservationId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'reservas',
        key: 'id',
      },
    },
    quadraId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'quadras',
        key: 'id',
      },
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
  }, {
    tableName: 'notificacoes',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['user_id', 'is_read', 'created_at'],
      },
      {
        fields: ['reservation_id'],
      },
      {
        fields: ['quadra_id'],
      },
      {
        unique: true,
        fields: ['user_id', 'reservation_id', 'type'],
        name: 'notificacoes_cancelamento_unicas',
        where: {
          type: 'RESERVATION_CANCELLED',
        },
      },
    ],
  });

  Notificacao.associate = (models) => {
    Notificacao.belongsTo(models.Usuario, {
      foreignKey: 'userId',
      as: 'usuario',
      onDelete: 'CASCADE',
    });
    Notificacao.belongsTo(models.Reserva, {
      foreignKey: 'reservationId',
      as: 'reserva',
      onDelete: 'SET NULL',
    });
    Notificacao.belongsTo(models.Quadra, {
      foreignKey: 'quadraId',
      as: 'quadra',
      onDelete: 'SET NULL',
    });
  };

  return Notificacao;
};
