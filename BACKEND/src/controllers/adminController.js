const adminService = require('../services/adminService');

async function dashboard(_request, response) {
  const indicadores = await adminService.getDashboard();
  response.json({ indicadores });
}

async function listUsers(_request, response) {
  const usuarios = await adminService.listUsers();
  response.json({ usuarios });
}

async function updateUserStatus(request, response) {
  const usuario = await adminService.updateUserStatus(request.params.id, request.body.status);
  response.json({ usuario });
}

async function listOwners(_request, response) {
  const proprietarios = await adminService.listOwners();
  response.json({ proprietarios });
}

async function updateOwnerApproval(request, response) {
  const proprietario = await adminService.updateOwnerApproval(
    request.params.id,
    request.body.status_aprovacao,
  );
  response.json({ proprietario });
}

async function listAdmins(_request, response) {
  const administradores = await adminService.listAdmins();
  response.json({ administradores });
}

module.exports = {
  dashboard,
  listAdmins,
  listOwners,
  listUsers,
  updateOwnerApproval,
  updateUserStatus,
};
