const { Op } = require('sequelize');

const {
  HorarioDisponivel,
  Proprietario,
  Quadra,
  Reserva,
  Usuario,
} = require('../models');
const { HttpError } = require('../utils/http');

function reservationIncludes() {
  return [
    {
      model: Usuario,
      as: 'usuario',
      attributes: ['id', 'nome', 'email', 'telefone'],
    },
    {
      model: Quadra,
      as: 'quadra',
      include: [
        {
          model: Proprietario,
          as: 'proprietario',
          attributes: ['id', 'nome_responsavel', 'nome_empresa', 'telefone'],
        },
      ],
    },
    {
      model: HorarioDisponivel,
      as: 'horario_disponivel',
      required: false,
    },
  ];
}

function hoursBetween(start, end) {
  const [startHour, startMinute] = String(start).split(':').map(Number);
  const [endHour, endMinute] = String(end).split(':').map(Number);
  const diff = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
  return Math.max(diff / 60, 1);
}

async function findReservationOrThrow(id) {
  const reserva = await Reserva.findByPk(id, {
    include: reservationIncludes(),
  });

  if (!reserva) {
    throw new HttpError(404, 'Reserva não encontrada.');
  }

  return reserva;
}

function canChangeReservation(auth, reserva) {
  if (auth.perfil === 'admin') {
    return true;
  }

  if (auth.perfil === 'usuario') {
    return reserva.usuario_id === auth.id;
  }

  if (auth.perfil === 'proprietario') {
    return reserva.quadra && reserva.quadra.proprietario_id === auth.id;
  }

  return false;
}

async function createReservation(auth, {
  quadra_id,
  horario_disponivel_id,
  data_reserva,
  hora_inicio,
  hora_fim,
  forma_pagamento,
  observacoes,
}) {
  if (!quadra_id || !data_reserva || !hora_inicio || !hora_fim) {
    throw new HttpError(400, 'Informe quadra, data e horario da reserva.');
  }

  const quadra = await Quadra.findOne({ where: { id: quadra_id, ativa: true } });

  if (!quadra) {
    throw new HttpError(404, 'Quadra indisponivel ou inexistente.');
  }

  const reservaExistente = await Reserva.findOne({
    where: {
      quadra_id,
      data_reserva,
      hora_inicio,
      hora_fim,
      status: { [Op.notIn]: ['cancelada'] },
    },
  });

  if (reservaExistente) {
    throw new HttpError(409, 'Este horario ja foi reservado.');
  }

  const horario = horario_disponivel_id
    ? await HorarioDisponivel.findOne({
      where: {
        id: horario_disponivel_id,
        quadra_id,
        disponivel: true,
      },
    })
    : null;

  const valorHora = Number(horario?.valor || quadra.preco_hora || 0);
  const valorTotal = Number((valorHora * hoursBetween(hora_inicio, hora_fim)).toFixed(2));

  try {
    const reserva = await Reserva.create({
      usuario_id: auth.id,
      quadra_id,
      horario_disponivel_id: horario?.id || null,
      data_reserva,
      hora_inicio,
      hora_fim,
      forma_pagamento: forma_pagamento || 'nao_informado',
      valor_total: valorTotal,
      observacoes: observacoes || null,
      status: 'confirmada',
    });

    return Reserva.findByPk(reserva.id, {
      include: reservationIncludes(),
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new HttpError(409, 'Este horario ja foi reservado.');
    }

    throw error;
  }
}

async function listUserReservations(userId) {
  return Reserva.findAll({
    where: { usuario_id: userId },
    include: reservationIncludes(),
    order: [['data_reserva', 'DESC'], ['hora_inicio', 'DESC']],
  });
}

async function listOwnerReservations(ownerId) {
  const reservas = await Reserva.findAll({
    include: reservationIncludes(),
    order: [['data_reserva', 'DESC'], ['hora_inicio', 'DESC']],
  });

  return reservas.filter((reserva) => reserva.quadra?.proprietario_id === ownerId);
}

async function listAllReservations() {
  return Reserva.findAll({
    include: reservationIncludes(),
    order: [['data_reserva', 'DESC'], ['hora_inicio', 'DESC']],
  });
}

async function updateReservationStatus(auth, id, status) {
  const reserva = await findReservationOrThrow(id);

  if (!canChangeReservation(auth, reserva)) {
    throw new HttpError(403, 'Você não pode alterar esta reserva.');
  }

  const statusPermitidos = ['pendente', 'confirmada', 'cancelada', 'concluida'];

  if (!statusPermitidos.includes(status)) {
    throw new HttpError(400, 'Status invalido.');
  }

  reserva.status = status;
  await reserva.save();
  return reserva;
}

async function cancelReservation(auth, id) {
  const reserva = await findReservationOrThrow(id);

  if (!canChangeReservation(auth, reserva)) {
    throw new HttpError(403, 'Você não pode cancelar esta reserva.');
  }

  if (reserva.status === 'concluida') {
    throw new HttpError(400, 'Reservas concluídas não podem ser canceladas.');
  }

  reserva.status = 'cancelada';
  await reserva.save();
  return reserva;
}

module.exports = {
  cancelReservation,
  createReservation,
  listAllReservations,
  listOwnerReservations,
  listUserReservations,
  updateReservationStatus,
};
