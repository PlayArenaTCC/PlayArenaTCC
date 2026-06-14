const notificacaoService = require('../services/notificacaoService');

async function listNotifications(request, response) {
  const result = await notificacaoService.listAccountNotifications(request.auth.id, request.auth.perfil);
  response.json(result);
}

async function markAsRead(request, response) {
  const notification = await notificacaoService.markNotificationAsRead(
    request.auth.id,
    request.auth.perfil,
    request.params.id,
  );

  response.json({ notification });
}

async function markAllAsRead(request, response) {
  const result = await notificacaoService.markAllNotificationsAsRead(request.auth.id, request.auth.perfil);
  response.json(result);
}

module.exports = {
  listNotifications,
  markAllAsRead,
  markAsRead,
};
