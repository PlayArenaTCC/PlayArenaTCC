const notificacaoService = require('../services/notificacaoService');

async function listNotifications(request, response) {
  const result = await notificacaoService.listUserNotifications(request.auth.id);
  response.json(result);
}

async function markAsRead(request, response) {
  const notification = await notificacaoService.markNotificationAsRead(
    request.auth.id,
    request.params.id,
  );

  response.json({ notification });
}

async function markAllAsRead(request, response) {
  const result = await notificacaoService.markAllNotificationsAsRead(request.auth.id);
  response.json(result);
}

module.exports = {
  listNotifications,
  markAllAsRead,
  markAsRead,
};
