const { Op } = require('sequelize');

const {
  HorarioDisponivel,
  Proprietario,
  Quadra,
  Reserva,
  Usuario,
} = require('../models');
const { HttpError } = require('../utils/http');

const ACTIVE_RESERVATION_STATUSES = ['pendente', 'confirmada'];

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

function timeToMinutes(value) {
  const [hours, minutes] = String(value || '').split(':').map(Number);
  return (hours * 60) + minutes;
}

function normalizeTime(value) {
  const match = String(value || '').match(/^(\d{1,2}):(\d{2})/);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function shortTime(value) {
  return String(value || '').slice(0, 5);
}

async function findReservationOrThrow(id) {
  const reserva = await Reserva.findByPk(id, {
    include: reservationIncludes(),
  });

  if (!reserva) {
    throw new HttpError(404, 'Reserva nao encontrada.');
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

function getAuthDisplayName(auth) {
  const account = auth.account || {};

  return account.nome
    || account.nome_responsavel
    || account.nome_empresa
    || account.email
    || auth.perfil;
}

function normalizeCancellationReason(auth, motivo) {
  const reason = String(motivo || '').trim();

  if ((auth.perfil === 'proprietario' || auth.perfil === 'admin') && !reason) {
    throw new HttpError(400, 'Informe a justificativa do cancelamento.');
  }

  return reason || 'Cancelamento confirmado pelo usuario.';
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

  const requestedStart = normalizeTime(hora_inicio);
  const requestedEnd = normalizeTime(hora_fim);

  if (!requestedStart || !requestedEnd || timeToMinutes(requestedEnd) <= timeToMinutes(requestedStart)) {
    throw new HttpError(400, 'Horario invalido para reserva.');
  }

  const quadra = await Quadra.findOne({ where: { id: quadra_id, ativa: true } });

  if (!quadra) {
    throw new HttpError(404, 'Quadra indisponivel ou inexistente.');
  }

  const reservaExistente = await Reserva.findOne({
    where: {
      quadra_id,
      data_reserva,
      hora_inicio: requestedStart,
      hora_fim: requestedEnd,
      status: { [Op.in]: ACTIVE_RESERVATION_STATUSES },
    },
  });

  if (reservaExistente) {
    throw new HttpError(409, 'Este horario ja foi reservado.');
  }

  const weekday = new Date(`${data_reserva}T12:00:00`).getDay();
  const horario = horario_disponivel_id
    ? await HorarioDisponivel.findOne({
      where: {
        id: horario_disponivel_id,
        quadra_id,
        disponivel: true,
      },
    })
    : await HorarioDisponivel.findOne({
      where: {
        quadra_id,
        disponivel: true,
        hora_inicio: requestedStart,
        hora_fim: requestedEnd,
        [Op.or]: [
          { data: data_reserva },
          {
            data: null,
            dia_semana: weekday,
          },
        ],
      },
      order: [['data', 'DESC']],
    });

  const matchesSelectedDate = horario && (
    horario.data === data_reserva || (horario.data === null && Number(horario.dia_semana) === weekday)
  );
  const matchesSelectedTime = horario
    && shortTime(horario.hora_inicio) === requestedStart
    && shortTime(horario.hora_fim) === requestedEnd;

  if (!horario || !matchesSelectedDate || !matchesSelectedTime) {
    throw new HttpError(400, 'Este horario nao esta cadastrado para a data selecionada.');
  }

  const valorHora = Number(horario?.valor_especial ? horario.valor : quadra.preco_hora || 0);
  const valorTotal = Number((valorHora * hoursBetween(requestedStart, requestedEnd)).toFixed(2));

  try {
    const reserva = await Reserva.create({
      usuario_id: auth.id,
      quadra_id,
      horario_disponivel_id: horario?.id || null,
      data_reserva,
      hora_inicio: requestedStart,
      hora_fim: requestedEnd,
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

async function updateReservationStatus(auth, id, status, payload = {}) {
  const reserva = await findReservationOrThrow(id);

  if (!canChangeReservation(auth, reserva)) {
    throw new HttpError(403, 'Voce nao pode alterar esta reserva.');
  }

  const statusPermitidos = ['pendente', 'confirmada', 'cancelada', 'concluida'];

  if (!statusPermitidos.includes(status)) {
    throw new HttpError(400, 'Status invalido.');
  }

  if (status === 'cancelada') {
    return cancelReservation(auth, id, payload);
  }

  reserva.status = status;
  await reserva.save();
  return reserva;
}

async function cancelReservation(auth, id, { motivo_cancelamento } = {}) {
  const reserva = await findReservationOrThrow(id);

  if (!canChangeReservation(auth, reserva)) {
    throw new HttpError(403, 'Voce nao pode cancelar esta reserva.');
  }

  if (reserva.status === 'concluida') {
    throw new HttpError(400, 'Reservas concluidas nao podem ser canceladas.');
  }

  const motivo = normalizeCancellationReason(auth, motivo_cancelamento);

  reserva.status = 'cancelada';
  reserva.motivo_cancelamento = motivo;
  reserva.cancelado_em = new Date();
  reserva.cancelado_por_id = auth.id;
  reserva.cancelado_por_perfil = auth.perfil;
  reserva.cancelado_por_nome = getAuthDisplayName(auth);
  await reserva.save();
  return findReservationOrThrow(reserva.id);
}

module.exports = {
  cancelReservation,
  createReservation,
  listAllReservations,
  listOwnerReservations,
  listUserReservations,
  updateReservationStatus,
};
