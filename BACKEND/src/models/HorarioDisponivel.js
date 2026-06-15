module.exports = (sequelize, DataTypes) => {
  const HorarioDisponivel = sequelize.define('HorarioDisponivel', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    quadra_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'quadras',
        key: 'id',
      },
    },
    data: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    dia_semana: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 6,
      },
    },
    hora_inicio: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    hora_fim: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    disponivel: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    valor: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    valor_especial: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  }, {
    tableName: 'horarios_disponiveis',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['quadra_id'],
      },
      {
        unique: true,
        fields: ['quadra_id', 'data', 'dia_semana', 'hora_inicio', 'hora_fim'],
        name: 'horarios_disponiveis_unicos',
      },
    ],
  });

  HorarioDisponivel.associate = (models) => {
    HorarioDisponivel.belongsTo(models.Quadra, {
      foreignKey: 'quadra_id',
      as: 'quadra',
    });
    HorarioDisponivel.hasMany(models.Reserva, {
      foreignKey: 'horario_disponivel_id',
      as: 'reservas',
    });
  };

  return HorarioDisponivel;
};
