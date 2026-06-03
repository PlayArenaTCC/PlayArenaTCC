const reservaService = require('../services/reservaService');

async function createReservation(request, response) {
  const reserva = await reservaService.createReservation(request.auth, request.body);
  response.status(201).json({ reserva });
}

async function listMyReservations(request, response) {
  const reservas = await reservaService.listUserReservations(request.auth.id);
  response.json({ reservas });
}

async function listOwnerReservations(request, response) {
  const reservas = await reservaService.listOwnerReservations(request.auth.id);
  response.json({ reservas });
}

async function listAllReservations(_request, response) {
  const reservas = await reservaService.listAllReservations();
  response.json({ reservas });
}

async function updateStatus(request, response) {
  const reserva = await reservaService.updateReservationStatus(
    request.auth,
    request.params.id,
    request.body.status,
    request.body,
  );
  response.json({ reserva });
}

async function cancelReservation(request, response) {
  const reserva = await reservaService.cancelReservation(request.auth, request.params.id, request.body);
  response.json({ reserva });
}

module.exports = {
  cancelReservation,
  createReservation,
  listAllReservations,
  listMyReservations,
  listOwnerReservations,
  updateStatus,
};
