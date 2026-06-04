const {
  Notificacao,
  Usuario,
} = require('../models');
const { HttpError } = require('../utils/http');

const NOTIFICATION_TYPES = Object.freeze({
  RESERVATION_CANCELLED: 'RESERVATION_CANCELLED',
  PROMOTION_CREATED: 'PROMOTION_CREATED',
  PRICE_DROPPED: 'PRICE_DROPPED',
});

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

async function createReservationCancelledNotification(reserva, { transaction } = {}) {
  const courtName = reserva.quadra?.nome || 'Quadra';

  return Notificacao.create({
    userId: reserva.usuario_id,
    title: 'Reserva cancelada',
    message: `Sua reserva na quadra ${courtName} foi cancelada pelo proprietário.`,
    type: NOTIFICATION_TYPES.RESERVATION_CANCELLED,
    reservationId: reserva.id,
    quadraId: reserva.quadra_id,
    metadata: reservationMetadata(reserva),
  }, { transaction });
}

function promotionCopy(type, courtName) {
  if (type === NOTIFICATION_TYPES.PRICE_DROPPED) {
    return {
      title: 'Preço reduzido',
      message: `O preço da quadra ${courtName} foi reduzido novamente.`,
    };
  }

  return {
    title: 'Nova promoção disponível',
    message: `A quadra ${courtName} entrou em promoção.`,
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

async function listUserNotifications(userId) {
  const [notifications, unreadCount] = await Promise.all([
    Notificacao.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    }),
    Notificacao.count({
      where: {
        userId,
        isRead: false,
      },
    }),
  ]);

  return { notifications, unreadCount };
}

async function markNotificationAsRead(userId, id) {
  const notification = await Notificacao.findOne({
    where: {
      id,
      userId,
    },
  });

  if (!notification) {
    throw new HttpError(404, 'Notificação não encontrada.');
  }

  if (!notification.isRead) {
    notification.isRead = true;
    await notification.save();
  }

  return notification;
}

async function markAllNotificationsAsRead(userId) {
  await Notificacao.update({
    isRead: true,
  }, {
    where: {
      userId,
      isRead: false,
    },
  });

  return listUserNotifications(userId);
}

module.exports = {
  NOTIFICATION_TYPES,
  createPromotionNotifications,
  createReservationCancelledNotification,
  listUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
};
