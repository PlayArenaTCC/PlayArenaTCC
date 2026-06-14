const { Op } = require('sequelize');

const {
  AdvertenciaProprietario,
  AvisoAdministrativo,
  AvisoAdvertenciaItem,
  Proprietario,
  Quadra,
  Reserva,
  sequelize,
} = require('../models');
const notificacaoService = require('./notificacaoService');
const { HttpError } = require('../utils/http');

const WARNING_WINDOW_DAYS = 7;
const WARNING_THRESHOLD = 3;
const LAST_MINUTE_THRESHOLD_MINUTES = 60;
const OWNER_WARNING_REASON = 'Cancelamento feito pelo proprietario com menos de 1 hora de antecedencia.';
const ADMIN_ALERT_STATUSES = ['PENDENTE', 'EM_ANALISE', 'RESOLVIDO'];
const ACTIVE_ADMIN_ALERT_STATUSES = ['PENDENTE', 'EM_ANALISE'];

function buildReservationDateTime(date, time) {
  const normalizedDate = String(date || '').trim();
  const normalizedTime = String(time || '').slice(0, 5);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate) || !/^\d{2}:\d{2}$/.test(normalizedTime)) {
    return null;
  }

  const value = new Date(`${normalizedDate}T${normalizedTime}:00-03:00`);
  return Number.isNaN(value.getTime()) ? null : value;
}

function getReservationStart(reserva) {
  const storedStart = reserva.data_inicio ? new Date(reserva.data_inicio) : null;

  if (storedStart && !Number.isNaN(storedStart.getTime())) {
    return storedStart;
  }

  return buildReservationDateTime(reserva.data_reserva, reserva.hora_inicio);
}

function ownerDisplayName(proprietario) {
  return proprietario?.nome_responsavel || proprietario?.nome_empresa || 'Proprietario';
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

async function expirarAdvertenciasAntigas(proprietarioId, { transaction } = {}) {
  const where = {
    ativa: true,
    expira_em: {
      [Op.lte]: new Date(),
    },
  };

  if (proprietarioId) {
    where.proprietario_id = proprietarioId;
  }

  await AdvertenciaProprietario.update({
    ativa: false,
  }, {
    where,
    transaction,
  });
}

function activeWarningsWhere(proprietarioId) {
  return {
    proprietario_id: proprietarioId,
    ativa: true,
    expira_em: {
      [Op.gt]: new Date(),
    },
  };
}

async function buscarAdvertenciasAtivas(proprietarioId, { transaction } = {}) {
  return AdvertenciaProprietario.findAll({
    where: activeWarningsWhere(proprietarioId),
    include: [
      {
        model: Reserva,
        as: 'reserva',
        required: false,
      },
      {
        model: Quadra,
        as: 'quadra',
        required: false,
      },
    ],
    order: [['cancelamento_em', 'ASC']],
    transaction,
  });
}

async function buscarAvisoAtivo(proprietarioId, { transaction } = {}) {
  return AvisoAdministrativo.findOne({
    where: {
      proprietario_id: proprietarioId,
      status: {
        [Op.in]: ACTIVE_ADMIN_ALERT_STATUSES,
      },
    },
    include: [
      {
        model: AdvertenciaProprietario,
        as: 'advertencias',
        required: false,
        through: { attributes: [] },
      },
    ],
    transaction,
  });
}

async function gerarAvisoAdministrativo(proprietario, advertenciasAtivas, { transaction } = {}) {
  const avisoExistente = await buscarAvisoAtivo(proprietario.id, { transaction });

  if (avisoExistente) {
    const existingWarningIds = new Set((avisoExistente.advertencias || []).map((advertencia) => advertencia.id));
    const missingItems = advertenciasAtivas
      .filter((advertencia) => !existingWarningIds.has(advertencia.id))
      .map((advertencia) => ({
        aviso_administrativo_id: avisoExistente.id,
        advertencia_id: advertencia.id,
      }));

    if (missingItems.length) {
      await AvisoAdvertenciaItem.bulkCreate(missingItems, {
        transaction,
        ignoreDuplicates: true,
      });
    }

    if (Number(avisoExistente.quantidade_advertencias || 0) !== advertenciasAtivas.length) {
      await avisoExistente.update({
        quantidade_advertencias: advertenciasAtivas.length,
      }, { transaction });
    }

    return avisoExistente;
  }

  const aviso = await AvisoAdministrativo.create({
    proprietario_id: proprietario.id,
    status: 'PENDENTE',
    quantidade_advertencias: advertenciasAtivas.length,
    mensagem: `O proprietario ${ownerDisplayName(proprietario)} recebeu ${advertenciasAtivas.length} advertencias por cancelamentos em cima da hora.`,
    gerado_em: new Date(),
  }, { transaction });

  const alertItems = advertenciasAtivas.map((advertencia) => ({
    aviso_administrativo_id: aviso.id,
    advertencia_id: advertencia.id,
  }));

  await AvisoAdvertenciaItem.bulkCreate(alertItems, {
    transaction,
    ignoreDuplicates: true,
  });

  return aviso;
}

async function processarAdvertenciaCancelamentoProprietario(reserva, { transaction } = {}) {
  const proprietario = reserva.quadra?.proprietario
    || (reserva.quadra?.proprietario_id ? await Proprietario.findByPk(reserva.quadra.proprietario_id, { transaction }) : null);

  if (!proprietario) {
    return {
      gerarAdvertencia: false,
      motivo: 'Proprietario nao encontrado para esta reserva.',
    };
  }

  const agora = reserva.cancelado_em ? new Date(reserva.cancelado_em) : new Date();
  const inicioReserva = getReservationStart(reserva);

  if (!inicioReserva) {
    return {
      gerarAdvertencia: false,
      motivo: 'Inicio da reserva nao encontrado.',
    };
  }

  const minutosParaInicio = (inicioReserva.getTime() - agora.getTime()) / 1000 / 60;

  if (minutosParaInicio >= LAST_MINUTE_THRESHOLD_MINUTES) {
    return {
      gerarAdvertencia: false,
      motivo: 'Cancelamento feito com 1 hora ou mais de antecedencia.',
    };
  }

  await expirarAdvertenciasAntigas(proprietario.id, { transaction });

  const advertencia = await AdvertenciaProprietario.create({
    proprietario_id: proprietario.id,
    reserva_id: reserva.id,
    quadra_id: reserva.quadra_id,
    motivo: OWNER_WARNING_REASON,
    cancelamento_em: agora,
    expira_em: addDays(agora, WARNING_WINDOW_DAYS),
    ativa: true,
  }, { transaction });

  const advertenciasAtivas = await buscarAdvertenciasAtivas(proprietario.id, { transaction });

  await notificacaoService.createOwnerWarningNotification(proprietario.id, advertencia, {
    totalAdvertenciasAtivas: advertenciasAtivas.length,
    transaction,
  });

  let avisoAdministrativo = null;

  if (advertenciasAtivas.length >= WARNING_THRESHOLD) {
    avisoAdministrativo = await gerarAvisoAdministrativo(proprietario, advertenciasAtivas, { transaction });
  }

  return {
    gerarAdvertencia: true,
    advertencia,
    totalAdvertenciasAtivas: advertenciasAtivas.length,
    avisoAdministrativo,
  };
}

function adminAlertIncludes() {
  return [
    {
      model: Proprietario,
      as: 'proprietario',
      attributes: ['id', 'nome_responsavel', 'nome_empresa', 'email', 'telefone'],
    },
    {
      model: AdvertenciaProprietario,
      as: 'advertencias',
      through: { attributes: [] },
      include: [
        {
          model: Reserva,
          as: 'reserva',
          required: false,
        },
        {
          model: Quadra,
          as: 'quadra',
          attributes: ['id', 'nome'],
          required: false,
        },
      ],
    },
  ];
}

async function listAvisosAdministrativos() {
  await expirarAdvertenciasAntigas();

  return AvisoAdministrativo.findAll({
    include: adminAlertIncludes(),
    order: [['gerado_em', 'DESC']],
  });
}

async function getAvisoAdministrativo(id) {
  await expirarAdvertenciasAntigas();

  const aviso = await AvisoAdministrativo.findByPk(id, {
    include: adminAlertIncludes(),
  });

  if (!aviso) {
    throw new HttpError(404, 'Aviso administrativo nao encontrado.');
  }

  return aviso;
}

async function updateAvisoStatus(id, status) {
  if (!ADMIN_ALERT_STATUSES.includes(status)) {
    throw new HttpError(400, 'Status de aviso invalido.');
  }

  const aviso = await AvisoAdministrativo.findByPk(id);

  if (!aviso) {
    throw new HttpError(404, 'Aviso administrativo nao encontrado.');
  }

  aviso.status = status;
  aviso.resolvido_em = status === 'RESOLVIDO' ? new Date() : null;
  await aviso.save();

  return getAvisoAdministrativo(aviso.id);
}

module.exports = {
  expirarAdvertenciasAntigas,
  getAvisoAdministrativo,
  listAvisosAdministrativos,
  processarAdvertenciaCancelamentoProprietario,
  updateAvisoStatus,
};
