const { Op, literal } = require('sequelize');

const {
  DocumentacaoLocal,
  HorarioDisponivel,
  Proprietario,
  Quadra,
  Reserva,
  Usuario,
  sequelize,
} = require('../models');
const notificacaoService = require('./notificacaoService');
const {
  isCourtEffectivelyActive,
  isCourtUnavailableForSlot,
} = require('./quadraService');
const { HttpError } = require('../utils/http');

<<<<<<< Updated upstream
function reservationIncludes() {
=======
const ACTIVE_RESERVATION_STATUSES = ['pendente', 'confirmada'];
const RESERVATION_ORDER = [
  [literal(`
    CASE
      WHEN "Reserva"."status" IN ('pendente', 'confirmada') THEN 0
      WHEN "Reserva"."status" = 'concluida' THEN 1
      WHEN "Reserva"."status" = 'cancelada' THEN 2
      ELSE 3
    END
  `), 'ASC'],
  ['data_reserva', 'ASC'],
  ['hora_inicio', 'ASC'],
  ['createdAt', 'DESC'],
];

function reservationIncludes({ ownerId } = {}) {
  const quadraInclude = {
    model: Quadra,
    as: 'quadra',
    include: [
      {
        model: Proprietario,
        as: 'proprietario',
        attributes: ['id', 'nome_responsavel', 'nome_empresa', 'telefone'],
      },
    ],
  };

  if (ownerId) {
    quadraInclude.where = { proprietario_id: ownerId };
    quadraInclude.required = true;
  }

>>>>>>> Stashed changes
  return [
    {
      model: Usuario,
      as: 'usuario',
      attributes: ['id', 'nome', 'email', 'telefone'],
    },
    quadraInclude,
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

  if (quadra.documentacao_local_id) {
    const documentacao = await DocumentacaoLocal.findByPk(quadra.documentacao_local_id);

    if (documentacao.status !== 'aprovado') {
      throw new HttpError(403, 'Esta quadra ainda nao possui documentacao aprovada.');
    }
  } else {
    throw new HttpError(403, 'Esta quadra ainda nao possui documentacao aprovada.');
  }

  if (!isCourtEffectivelyActive(quadra)) {
    throw new HttpError(409, 'Este espaco esta inativo no momento.');
  }

  if (isCourtUnavailableForSlot(quadra, data_reserva, requestedStart, requestedEnd)) {
    throw new HttpError(409, 'Este espaco esta inativo no periodo selecionado.');
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
    order: RESERVATION_ORDER,
  });
}

async function listOwnerReservations(ownerId) {
  return Reserva.findAll({
    include: reservationIncludes({ ownerId }),
    order: RESERVATION_ORDER,
  });
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

  if (reserva.status === 'cancelada') {
    throw new HttpError(400, 'Esta reserva já foi cancelada.');
  }

  reserva.status = 'cancelada';
<<<<<<< Updated upstream
  await reserva.save();
  return reserva;
=======
  reserva.motivo_cancelamento = motivo;
  reserva.cancelado_em = new Date();
  reserva.cancelado_por_id = auth.id;
  reserva.cancelado_por_perfil = auth.perfil;
  reserva.cancelado_por_nome = getAuthDisplayName(auth);

  await sequelize.transaction(async (transaction) => {
    await reserva.save({ transaction });

    if (auth.perfil === 'proprietario') {
      await notificacaoService.createReservationCancelledNotification(reserva, { transaction });
    }
  });

  return findReservationOrThrow(reserva.id);
>>>>>>> Stashed changes
}

module.exports = {
  cancelReservation,
  createReservation,
  listAllReservations,
  listOwnerReservations,
  listUserReservations,
  updateReservationStatus,
};
