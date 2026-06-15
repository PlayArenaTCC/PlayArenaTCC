const quadraService = require('../services/quadraService');
const documentacaoService = require('../services/documentacaoService');

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
  await quadraService.deleteCourtPermanently(request.auth, request.params.id);
  response.json({ message: 'Quadra excluida permanentemente.' });
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
  response.json({ message: 'Horário removido da agenda.' });
}

async function updateScheduleAvailability(request, response) {
  const horario = await quadraService.updateScheduleAvailability(
    request.auth,
    request.params.quadraId,
    request.params.horarioId,
    request.body?.disponivel,
  );

  response.json({ horario });
}

function buildCourtPhotoUrl(request, filename) {
  const forwardedProto = request.headers['x-forwarded-proto'];
  const protocol = String(Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto || request.protocol)
    .split(',')[0]
    .trim();

  return `${protocol}://${request.get('host')}/uploads/court-photos/${filename}`;
}

async function uploadPhotos(request, response) {
  const fotos = (request.files || []).map((file) => buildCourtPhotoUrl(request, file.filename));
  response.status(201).json({ fotos });
}

function buildDocumentUrl(request, filename) {
  const forwardedProto = request.headers['x-forwarded-proto'];
  const protocol = String(Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto || request.protocol)
    .split(',')[0]
    .trim();

  return `${protocol}://${request.get('host')}/uploads/documentos/${filename}`;
}

async function uploadDocuments(request, response) {
  const documentos = (request.files || []).reduce((acc, file) => {
    acc[file.fieldname] = buildDocumentUrl(request, file.filename);
    return acc;
  }, {});

  response.status(201).json({ documentos });
}

async function listOwnerDocumentations(request, response) {
  const documentacoes = await documentacaoService.listOwnerDocumentations(request.auth.id);
  response.json({ documentacoes });
}

module.exports = {
  createCourt,
  createSchedule,
  deleteCourt,
  deleteSchedule,
  getCourt,
  listOwnerDocumentations,
  listCourts,
  listOwnerCourts,
  listSchedules,
  uploadDocuments,
  uploadPhotos,
  updateCourt,
  updateScheduleAvailability,
};
