const quadraService = require('../services/quadraService');

async function listCourts(request, response) {
  const quadras = await quadraService.listCourts(request.query);
  response.json({ quadras });
}

async function listOwnerCourts(request, response) {
  const quadras = await quadraService.listOwnerCourts(request.auth.id);
  response.json({ quadras });
}

async function getCourt(request, response) {
  const quadra = await quadraService.getCourt(request.params.id);
  response.json({ quadra });
}

async function createCourt(request, response) {
  const quadra = await quadraService.createCourt(request.auth, request.body);
  response.status(201).json({ quadra });
}

async function updateCourt(request, response) {
  const quadra = await quadraService.updateCourt(request.auth, request.params.id, request.body);
  response.json({ quadra });
}

async function deleteCourt(request, response) {
  await quadraService.deactivateCourt(request.auth, request.params.id);
  response.json({ message: 'Quadra desativada com sucesso.' });
}

async function listSchedules(request, response) {
  const horarios = await quadraService.listSchedules(request.params.id, request.query.data);
  response.json({ horarios });
}

async function createSchedule(request, response) {
  const horario = await quadraService.createSchedule(request.auth, request.params.id, request.body);
  response.status(201).json({ horario });
}

async function deleteSchedule(request, response) {
  await quadraService.deleteSchedule(request.auth, request.params.quadraId, request.params.horarioId);
  response.json({ message: 'Horario removido da agenda.' });
}

module.exports = {
  createCourt,
  createSchedule,
  deleteCourt,
  deleteSchedule,
  getCourt,
  listCourts,
  listOwnerCourts,
  listSchedules,
  updateCourt,
};
