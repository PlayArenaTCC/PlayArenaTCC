const { Op } = require('sequelize');

const {
  Notificacao,
  Usuario,
} = require('../models');
const { HttpError } = require('../utils/http');

const NOTIFICATION_TYPES = Object.freeze({
  ACCOUNT_BLOCKED: 'ACCOUNT_BLOCKED',
  RESERVATION_CANCELLED: 'RESERVATION_CANCELLED',
  PROMOTION_CREATED: 'PROMOTION_CREATED',
  PRICE_DROPPED: 'PRICE_DROPPED',
  OWNER_WARNING: 'OWNER_WARNING',
});

const ACCOUNT_BLOCKED_MESSAGE = 'Conta inativa ou temporariamente bloqueada. Entre em contato com o suporte para mais informacoes.';
const OWNER_WARNING_MESSAGE = 'Voce recebeu uma advertencia por cancelar uma reserva com menos de 1 hora de antecedencia. Caso receba mais 2 advertencias dentro de 7 dias, os administradores serao acionados.';

function reservationMetadata(reserva) {
  return {
    justification: reserva.motivo_cancelamento,
    courtName: reserva.quadra?.nome || 'Quadra',
    reservationDate: reserva.data_reserva,
    startTime: reserva.hora_inicio,
    endTime: reserva.hora_fim,
    cancelledAt: reserva.cancelado_em,
  };
}

function notificationRecipientWhere(accountId, perfil = 'usuario') {
  if (perfil === 'proprietario') {
    return {
      recipientId: accountId,
      recipientPerfil: 'proprietario',
    };
  }

  return {
    [Op.or]: [
      {
        recipientId: accountId,
        recipientPerfil: 'usuario',
      },
      {
        userId: accountId,
      },
    ],
  };
}

async function createAccountBlockedNotification(userId, {
  title = 'Conta bloqueada',
  message = ACCOUNT_BLOCKED_MESSAGE,
  type = NOTIFICATION_TYPES.ACCOUNT_BLOCKED,
  metadata = {},
  transaction,
} = {}) {
  return Notificacao.create({
    userId,
    recipientId: userId,
    recipientPerfil: 'usuario',
    title,
    message,
    type,
    metadata: {
      ...metadata,
      blockedAt: new Date(),
    },
  }, { transaction });
}

async function createReservationCancelledNotification(reserva, { transaction } = {}) {
  const courtName = reserva.quadra?.nome || 'Quadra';

  return Notificacao.create({
    userId: reserva.usuario_id,
    recipientId: reserva.usuario_id,
    recipientPerfil: 'usuario',
    title: 'Reserva cancelada',
    message: `Sua reserva na quadra ${courtName} foi cancelada pelo proprietario.`,
    type: NOTIFICATION_TYPES.RESERVATION_CANCELLED,
    reservationId: reserva.id,
    quadraId: reserva.quadra_id,
    metadata: reservationMetadata(reserva),
  }, { transaction });
}

async function createOwnerWarningNotification(proprietarioId, advertencia, {
  totalAdvertenciasAtivas,
  transaction,
} = {}) {
  return Notificacao.create({
    userId: null,
    recipientId: proprietarioId,
    recipientPerfil: 'proprietario',
    title: 'Advertencia recebida',
    message: OWNER_WARNING_MESSAGE,
    type: NOTIFICATION_TYPES.OWNER_WARNING,
    reservationId: advertencia.reserva_id,
    quadraId: advertencia.quadra_id,
    metadata: {
      warningId: advertencia.id,
      cancellationAt: advertencia.cancelamento_em,
      expiresAt: advertencia.expira_em,
      activeWarningsCount: totalAdvertenciasAtivas || 1,
    },
  }, { transaction });
}

function promotionCopy(type, courtName) {
  if (type === NOTIFICATION_TYPES.PRICE_DROPPED) {
    return {
      title: 'Preco reduzido',
      message: `O preco da quadra ${courtName} foi reduzido novamente.`,
    };
  }

  return {
    title: 'Nova promocao disponivel',
    message: `A quadra ${courtName} entrou em promocao.`,
  };
}

async function createPromotionNotifications(quadra, {
  previousPrice,
  newPrice,
  type = NOTIFICATION_TYPES.PROMOTION_CREATED,
  transaction,
} = {}) {
  const users = await Usuario.findAll({
    attributes: ['id'],
    where: { status: 'ativo' },
    transaction,
  });

  if (!users.length) {
    return [];
  }

  const copy = promotionCopy(type, quadra.nome);
  const notifications = users.map((user) => ({
    userId: user.id,
    recipientId: user.id,
    recipientPerfil: 'usuario',
    title: copy.title,
    message: copy.message,
    type,
    quadraId: quadra.id,
    metadata: {
      courtName: quadra.nome,
      previousPrice: Number(previousPrice || 0),
      newPrice: Number(newPrice || 0),
    },
  }));

  return Notificacao.bulkCreate(notifications, { transaction });
}

async function listAccountNotifications(accountId, perfil = 'usuario') {
  const where = notificationRecipientWhere(accountId, perfil);
  const [notifications, unreadCount] = await Promise.all([
    Notificacao.findAll({
      where,
      order: [['createdAt', 'DESC']],
    }),
    Notificacao.count({
      where: {
        ...where,
        isRead: false,
      },
    }),
  ]);

  return { notifications, unreadCount };
}

async function markNotificationAsRead(accountId, perfil, id) {
  const notification = await Notificacao.findOne({
    where: {
      id,
      ...notificationRecipientWhere(accountId, perfil),
    },
  });

  if (!notification) {
    throw new HttpError(404, 'Notificacao nao encontrada.');
  }

  if (!notification.isRead) {
    notification.isRead = true;
    await notification.save();
  }

  return notification;
}

async function markAllNotificationsAsRead(accountId, perfil) {
  await Notificacao.update({
    isRead: true,
  }, {
    where: {
      ...notificationRecipientWhere(accountId, perfil),
      isRead: false,
    },
  });

  return listAccountNotifications(accountId, perfil);
}

module.exports = {
  NOTIFICATION_TYPES,
  createAccountBlockedNotification,
  createOwnerWarningNotification,
  createPromotionNotifications,
  createReservationCancelledNotification,
  listAccountNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
};
