const crypto = require('crypto');
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
const advertenciaProprietarioService = require('./advertenciaProprietarioService');
const {
  isCourtEffectivelyActive,
  isCourtUnavailableForSlot,
} = require('./quadraService');
const { HttpError } = require('../utils/http');

const ACTIVE_RESERVATION_STATUSES = ['pendente', 'confirmada'];
const RESERVATION_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const RESERVATION_CODE_LENGTH = 6;
const MAX_CODE_GENERATION_ATTEMPTS = 8;
const LAST_MINUTE_THRESHOLD_MINUTES = 60;
const FULL_REFUND_PERCENTAGE = 100;
const PARTIAL_REFUND_PERCENTAGE = 40;
const PAST_RESERVATION_MESSAGE = 'Este horario ja passou e nao pode ser reservado.';
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
    {
      model: Proprietario,
      as: 'validado_por',
      attributes: ['id', 'nome_responsavel', 'nome_empresa'],
      required: false,
    },
  ];
}

function generateReservationCode() {
  let code = '';

  for (let index = 0; index < RESERVATION_CODE_LENGTH; index += 1) {
    code += RESERVATION_CODE_ALPHABET[crypto.randomInt(RESERVATION_CODE_ALPHABET.length)];
  }

  return code;
}

function normalizeReservationCode(value) {
  return String(value || '').trim().replace(/[\s-]/g, '').toUpperCase();
}

function isReservationCodeConstraintError(error) {
  if (error.name !== 'SequelizeUniqueConstraintError') {
    return false;
  }

  const fieldNames = Array.isArray(error.fields) ? error.fields : Object.keys(error.fields || {});
  const constraint = error.parent?.constraint || error.original?.constraint || '';

  return fieldNames.includes('codigo_reserva') || constraint.includes('codigo_reserva');
}

async function generateUniqueReservationCode(transaction) {
  for (let attempt = 0; attempt < MAX_CODE_GENERATION_ATTEMPTS; attempt += 1) {
    const code = generateReservationCode();
    const existingReservation = await Reserva.findOne({
      attributes: ['id'],
      where: { codigo_reserva: code },
      transaction,
    });

    if (!existingReservation) {
      return code;
    }
  }

  throw new HttpError(500, 'Não foi possível gerar um código único para a reserva.');
}

async function assignConfirmationCode(reserva, options = {}) {
  if (reserva.codigo_reserva) {
    return;
  }

  reserva.codigo_reserva = await generateUniqueReservationCode(options.transaction);
  reserva.status_validacao = reserva.status_validacao || 'pendente';
}

async function saveMissingConfirmationCode(reserva) {
  for (let attempt = 0; attempt < MAX_CODE_GENERATION_ATTEMPTS; attempt += 1) {
    await assignConfirmationCode(reserva);

    try {
      await reserva.save({
        fields: ['codigo_reserva', 'status_validacao'],
      });
      return;
    } catch (error) {
      if (!isReservationCodeConstraintError(error)) {
        throw error;
      }

      reserva.codigo_reserva = null;
    }
  }

  throw new HttpError(500, 'Não foi possível gerar um código único para a reserva.');
}

async function ensureConfirmedReservationsHaveCodes(reservas) {
  const missingCodeReservations = reservas.filter((reserva) => (
    reserva.status === 'confirmada' && !reserva.codigo_reserva
  ));

  for (const reserva of missingCodeReservations) {
    await saveMissingConfirmationCode(reserva);
  }

  return reservas;
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

function normalizeDate(value) {
  const text = String(value || '').trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return null;
  }

  const [year, month, day] = text.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) {
    return null;
  }

  return text;
}

function shortTime(value) {
  return String(value || '').slice(0, 5);
}

function buildReservationDateTime(date, time) {
  const normalizedDate = normalizeDate(date);
  const normalizedTime = normalizeTime(time);

  if (!normalizedDate || !normalizedTime) {
    return null;
  }

  const value = new Date(`${normalizedDate}T${normalizedTime}:00-03:00`);
  return Number.isNaN(value.getTime()) ? null : value;
}

function minutesBetween(start, end) {
  if (!start || !end) {
    return null;
  }

  return (end.getTime() - start.getTime()) / 1000 / 60;
}

function roundMoney(value) {
  return Number(Number(value || 0).toFixed(2));
}

function getReservationStart(reserva) {
  const storedStart = reserva.data_inicio ? new Date(reserva.data_inicio) : null;

  if (storedStart && !Number.isNaN(storedStart.getTime())) {
    return storedStart;
  }

  return buildReservationDateTime(reserva.data_reserva, reserva.hora_inicio);
}

function getReservationCreatedAt(reserva) {
  const value = reserva.createdAt || reserva.created_at;
  const createdAt = value ? new Date(value) : null;

  return createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt : new Date();
}

function isLastMinuteReservation(createdAt, reservationStart) {
  const minutesFromCreationToStart = minutesBetween(createdAt, reservationStart);

  return minutesFromCreationToStart !== null && minutesFromCreationToStart < LAST_MINUTE_THRESHOLD_MINUTES;
}

function getCancellationActor(auth) {
  if (auth.perfil === 'proprietario') {
    return 'PROPRIETARIO';
  }

  if (auth.perfil === 'admin') {
    return 'ADMIN';
  }

  return 'USUARIO';
}

function calcularReembolso(reserva, canceladaPor, now = new Date()) {
  const inicioReserva = getReservationStart(reserva);
  const criadaEm = getReservationCreatedAt(reserva);
  const valorTotal = roundMoney(reserva.valor_total);
  const minutosParaInicio = minutesBetween(now, inicioReserva);
  const reservaEmCimaDaHora = Boolean(reserva.reserva_em_cima_da_hora)
    || isLastMinuteReservation(criadaEm, inicioReserva);

  if (canceladaPor === 'PROPRIETARIO') {
    return {
      percentualReembolso: FULL_REFUND_PERCENTAGE,
      valorReembolso: valorTotal,
      motivo: 'Cancelamento feito pelo proprietario. Reembolso integral ao usuario.',
    };
  }

  if (canceladaPor === 'ADMIN') {
    return {
      percentualReembolso: FULL_REFUND_PERCENTAGE,
      valorReembolso: valorTotal,
      motivo: 'Cancelamento feito pelo administrador. Reembolso integral ao usuario.',
    };
  }

  if (canceladaPor === 'USUARIO') {
    if (!reservaEmCimaDaHora && minutosParaInicio !== null && minutosParaInicio >= LAST_MINUTE_THRESHOLD_MINUTES) {
      return {
        percentualReembolso: FULL_REFUND_PERCENTAGE,
        valorReembolso: valorTotal,
        motivo: 'Cancelamento feito com 1 hora ou mais de antecedencia.',
      };
    }

    return {
      percentualReembolso: PARTIAL_REFUND_PERCENTAGE,
      valorReembolso: roundMoney(valorTotal * (PARTIAL_REFUND_PERCENTAGE / 100)),
      motivo: reservaEmCimaDaHora
        ? 'Reserva feita com menos de 1 hora de antecedencia. Reembolso parcial aplicado.'
        : 'Cancelamento feito com menos de 1 hora de antecedencia. Reembolso parcial aplicado.',
    };
  }

  throw new HttpError(400, 'Tipo de cancelamento invalido.');
}

function buildReservationTimingPreview({ data_reserva, hora_inicio, hora_fim }, now = new Date()) {
  const requestedDate = normalizeDate(data_reserva);
  const requestedStart = normalizeTime(hora_inicio);
  const requestedEnd = normalizeTime(hora_fim);

  if (!requestedDate || !requestedStart || !requestedEnd) {
    throw new HttpError(400, 'Informe data e horario validos para a reserva.');
  }

  if (timeToMinutes(requestedEnd) <= timeToMinutes(requestedStart)) {
    throw new HttpError(400, 'Horario invalido para reserva.');
  }

  const dataInicio = buildReservationDateTime(requestedDate, requestedStart);
  const dataFim = buildReservationDateTime(requestedDate, requestedEnd);

  if (!dataInicio || !dataFim) {
    throw new HttpError(400, 'Horario invalido para reserva.');
  }

  if (dataInicio <= now) {
    throw new HttpError(400, PAST_RESERVATION_MESSAGE);
  }

  const minutosEntreCriacaoEInicio = minutesBetween(now, dataInicio);
  const reservaEmCimaDaHora = minutosEntreCriacaoEInicio < LAST_MINUTE_THRESHOLD_MINUTES;

  return {
    servidor_agora: now.toISOString(),
    data_inicio: dataInicio.toISOString(),
    data_fim: dataFim.toISOString(),
    minutos_para_inicio: minutosEntreCriacaoEInicio,
    reserva_em_cima_da_hora: reservaEmCimaDaHora,
    percentual_reembolso_parcial: PARTIAL_REFUND_PERCENTAGE,
    aviso: reservaEmCimaDaHora
      ? 'Atencao: esta reserva esta sendo feita com menos de 1 hora de antecedencia. Caso voce cancele, o reembolso sera parcial.'
      : null,
  };
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

  return reason || 'Cancelamento confirmado pelo usuário.';
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
    throw new HttpError(400, 'Informe quadra, data e horário da reserva.');
  }

  const requestedDate = normalizeDate(data_reserva);
  const requestedStart = normalizeTime(hora_inicio);
  const requestedEnd = normalizeTime(hora_fim);

  if (!requestedDate || !requestedStart || !requestedEnd || timeToMinutes(requestedEnd) <= timeToMinutes(requestedStart)) {
    throw new HttpError(400, 'Horário inválido para reserva.');
  }

  const criadaEm = new Date();
  const timing = buildReservationTimingPreview({
    data_reserva: requestedDate,
    hora_inicio: requestedStart,
    hora_fim: requestedEnd,
  }, criadaEm);

  const quadra = await Quadra.findOne({ where: { id: quadra_id, ativa: true } });

  if (!quadra) {
    throw new HttpError(404, 'Quadra indisponível ou inexistente.');
  }

  if (quadra.documentacao_local_id) {
    const documentacao = await DocumentacaoLocal.findByPk(quadra.documentacao_local_id);

    if (documentacao.status !== 'aprovado') {
      throw new HttpError(403, 'Esta quadra ainda não possui documentação aprovada.');
    }
  } else {
    throw new HttpError(403, 'Esta quadra ainda não possui documentação aprovada.');
  }

  if (!isCourtEffectivelyActive(quadra)) {
    throw new HttpError(409, 'Este espaço está inativo no momento.');
  }

  if (isCourtUnavailableForSlot(quadra, requestedDate, requestedStart, requestedEnd)) {
    throw new HttpError(409, 'Este espaço está inativo no período selecionado.');
  }

  const reservaExistente = await Reserva.findOne({
    where: {
      quadra_id,
      data_reserva: requestedDate,
      hora_inicio: requestedStart,
      hora_fim: requestedEnd,
      status: { [Op.in]: ACTIVE_RESERVATION_STATUSES },
    },
  });

  if (reservaExistente) {
    throw new HttpError(409, 'Este horário já foi reservado.');
  }

  const weekday = new Date(`${requestedDate}T12:00:00-03:00`).getDay();
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
          { data: requestedDate },
          {
            data: null,
            dia_semana: weekday,
          },
        ],
      },
      order: [['data', 'DESC']],
    });

  const matchesSelectedDate = horario && (
    horario.data === requestedDate || (horario.data === null && Number(horario.dia_semana) === weekday)
  );
  const matchesSelectedTime = horario
    && shortTime(horario.hora_inicio) === requestedStart
    && shortTime(horario.hora_fim) === requestedEnd;

  if (!horario || !matchesSelectedDate || !matchesSelectedTime) {
    throw new HttpError(400, 'Este horário não está cadastrado para a data selecionada.');
  }

  const valorHora = Number(horario?.valor_especial ? horario.valor : quadra.preco_hora || 0);
  const valorTotal = Number((valorHora * hoursBetween(requestedStart, requestedEnd)).toFixed(2));

  for (let attempt = 0; attempt < MAX_CODE_GENERATION_ATTEMPTS; attempt += 1) {
    try {
      const reserva = await Reserva.create({
        usuario_id: auth.id,
        quadra_id,
        horario_disponivel_id: horario?.id || null,
        data_reserva: requestedDate,
        hora_inicio: requestedStart,
        hora_fim: requestedEnd,
        data_inicio: timing.data_inicio,
        data_fim: timing.data_fim,
        reserva_em_cima_da_hora: timing.reserva_em_cima_da_hora,
        forma_pagamento: forma_pagamento || 'nao_informado',
        valor_total: valorTotal,
        observacoes: observacoes || null,
        status: 'confirmada',
        codigo_reserva: await generateUniqueReservationCode(),
        status_validacao: 'pendente',
        createdAt: criadaEm,
        updatedAt: criadaEm,
      });

      return Reserva.findByPk(reserva.id, {
        include: reservationIncludes(),
      });
    } catch (error) {
      if (isReservationCodeConstraintError(error)) {
        continue;
      }

      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new HttpError(409, 'Este horário já foi reservado.');
      }

      throw error;
    }
  }

  throw new HttpError(500, 'Não foi possível gerar um código único para a reserva.');
}

async function previewReservationTiming(_auth, payload = {}) {
  return buildReservationTimingPreview(payload, new Date());
}

async function listUserReservations(userId) {
  const reservas = await Reserva.findAll({
    where: { usuario_id: userId },
    include: reservationIncludes(),
    order: RESERVATION_ORDER,
  });

  return ensureConfirmedReservationsHaveCodes(reservas);
}

async function listOwnerReservations(ownerId) {
  const reservas = await Reserva.findAll({
    include: reservationIncludes({ ownerId }),
    order: RESERVATION_ORDER,
  });

  return ensureConfirmedReservationsHaveCodes(reservas);
}

async function listAllReservations() {
  const reservas = await Reserva.findAll({
    include: reservationIncludes(),
    order: [['data_reserva', 'DESC'], ['hora_inicio', 'DESC']],
  });

  return ensureConfirmedReservationsHaveCodes(reservas);
}

async function updateReservationStatus(auth, id, status, payload = {}) {
  const reserva = await findReservationOrThrow(id);

  if (!canChangeReservation(auth, reserva)) {
    throw new HttpError(403, 'Você não pode alterar esta reserva.');
  }

  const statusPermitidos = ['pendente', 'confirmada', 'cancelada', 'concluida'];

  if (!statusPermitidos.includes(status)) {
    throw new HttpError(400, 'Status inválido.');
  }

  if (status === 'cancelada') {
    return cancelReservation(auth, id, payload);
  }

  if (reserva.status === 'cancelada') {
    throw new HttpError(400, 'Reservas canceladas não podem ser reativadas.');
  }

  if (reserva.status === 'concluida' && status !== 'concluida') {
    throw new HttpError(400, 'Reservas concluídas não podem ter o status alterado.');
  }

  if (reserva.status_validacao === 'validada' && status !== 'concluida') {
    throw new HttpError(400, 'Reservas validadas não podem ter o status alterado.');
  }

  if (status === 'concluida' && reserva.status_validacao !== 'validada') {
    throw new HttpError(400, 'Use a validação por código para concluir a reserva.');
  }

  if (status === 'confirmada' && !reserva.codigo_reserva) {
    for (let attempt = 0; attempt < MAX_CODE_GENERATION_ATTEMPTS; attempt += 1) {
      await assignConfirmationCode(reserva);
      reserva.status = status;

      try {
        await reserva.save();
        return findReservationOrThrow(reserva.id);
      } catch (error) {
        if (!isReservationCodeConstraintError(error)) {
          throw error;
        }

        reserva.codigo_reserva = null;
      }
    }

    throw new HttpError(500, 'Não foi possível gerar um código único para a reserva.');
  }

  reserva.status = status;
  await reserva.save();
  return findReservationOrThrow(reserva.id);
}

async function cancelReservation(auth, id, { motivo_cancelamento } = {}) {
  const reserva = await findReservationOrThrow(id);

  if (!canChangeReservation(auth, reserva)) {
    throw new HttpError(403, 'Você não pode cancelar esta reserva.');
  }

  if (reserva.status === 'concluida') {
    throw new HttpError(400, 'Reservas concluídas não podem ser canceladas.');
  }

  if (reserva.status_validacao === 'validada') {
    throw new HttpError(400, 'Reservas validadas não podem ser canceladas.');
  }

  if (reserva.status === 'cancelada') {
    throw new HttpError(400, 'Esta reserva já foi cancelada.');
  }

  const motivo = normalizeCancellationReason(auth, motivo_cancelamento);
  const canceladaEm = new Date();
  const canceladaPor = getCancellationActor(auth);
  const reembolso = calcularReembolso(reserva, canceladaPor, canceladaEm);

  reserva.status = 'cancelada';
  reserva.motivo_cancelamento = motivo;
  reserva.cancelado_em = canceladaEm;
  reserva.cancelado_por_id = auth.id;
  reserva.cancelado_por_perfil = auth.perfil;
  reserva.cancelado_por_nome = getAuthDisplayName(auth);
  reserva.cancelada_por = canceladaPor;
  reserva.percentual_reembolso = reembolso.percentualReembolso;
  reserva.valor_reembolso = reembolso.valorReembolso;
  reserva.motivo_reembolso = reembolso.motivo;

  await sequelize.transaction(async (transaction) => {
    await reserva.save({ transaction });

    if (auth.perfil === 'proprietario') {
      await notificacaoService.createReservationCancelledNotification(reserva, { transaction });
      await advertenciaProprietarioService.processarAdvertenciaCancelamentoProprietario(reserva, { transaction });
    }
  });

  return findReservationOrThrow(reserva.id);
}

async function validateReservationCode(auth, id, payload = {}) {
  if (auth.perfil !== 'proprietario') {
    throw new HttpError(403, 'Somente proprietários podem validar códigos de reserva.');
  }

  const typedCode = normalizeReservationCode(payload.codigo_reserva || payload.codigo);

  if (!typedCode) {
    throw new HttpError(400, 'Informe o código da reserva.');
  }

  const reserva = await findReservationOrThrow(id);

  if (!canChangeReservation(auth, reserva)) {
    throw new HttpError(403, 'Você não pode validar esta reserva.');
  }

  if (reserva.status === 'cancelada') {
    throw new HttpError(400, 'Reservas canceladas não podem ter código validado.');
  }

  if (reserva.status === 'concluida' || reserva.status_validacao === 'validada') {
    throw new HttpError(400, 'Este código já foi validado e não pode ser reutilizado.');
  }

  if (reserva.status !== 'confirmada') {
    throw new HttpError(400, 'A reserva precisa estar confirmada para validar o código.');
  }

  if (!reserva.codigo_reserva) {
    await saveMissingConfirmationCode(reserva);
  }

  if (normalizeReservationCode(reserva.codigo_reserva) !== typedCode) {
    throw new HttpError(400, 'Código da reserva incorreto.');
  }

  reserva.status = 'concluida';
  reserva.status_validacao = 'validada';
  reserva.validado_em = new Date();
  reserva.validado_por_id = auth.id;

  await reserva.save();

  return findReservationOrThrow(reserva.id);
}

module.exports = {
  calcularReembolso,
  cancelReservation,
  createReservation,
  listAllReservations,
  listOwnerReservations,
  listUserReservations,
  previewReservationTiming,
  updateReservationStatus,
  validateReservationCode,
};
