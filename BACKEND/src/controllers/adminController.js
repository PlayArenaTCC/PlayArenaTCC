const adminService = require('../services/adminService');

async function dashboard(_request, response) {
  const indicadores = await adminService.getDashboard();
  response.json({ indicadores });
}

async function listUsers(_request, response) {
  const usuarios = await adminService.listUsers();
  response.json({ usuarios });
}

async function blockUserTemporarily(request, response) {
  const usuario = await adminService.blockUserTemporarily(
    request.auth,
    request.params.id,
    request.body,
  );
  response.json({
    usuario,
    message: 'Bloqueio temporário salvo com sucesso.',
  });
}

async function clearUserTemporaryBlock(request, response) {
  const usuario = await adminService.clearUserTemporaryBlock(request.auth, request.params.id);
  response.json({
    usuario,
    message: 'Bloqueio temporário removido. O usuário está ativo novamente.',
  });
}

async function banUser(request, response) {
  await adminService.banUser(request.auth, request.params.id, request.body);
  response.json({
    message: 'Usuário banido e excluído permanentemente.',
  });
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

async function listDocumentations(request, response) {
  const documentacoes = await adminService.listDocumentations(request.query);
  response.json({ documentacoes });
}

async function reviewDocumentation(request, response) {
  const documentacao = await adminService.reviewDocumentation(
    request.auth,
    request.params.id,
    request.body,
  );
  response.json({ documentacao });
}

async function listAdmins(request, response) {
  const administradores = await adminService.listAdmins(request.auth);
  response.json({ administradores });
}

async function createAdmin(request, response) {
  const administrador = await adminService.createAdmin(request.auth, request.body);
  response.status(201).json({
    administrador,
    message: 'Administrador cadastrado com sucesso.',
  });
}

async function changeOwnPassword(request, response) {
  const payload = await adminService.changeOwnPassword(request.auth, request.body);
  response.json(payload);
}

async function listSpaces(_request, response) {
  const espacos = await adminService.listSpaces();
  response.json({ espacos });
}

async function createSpace(request, response) {
  const espaco = await adminService.createSpace(request.auth, request.body);
  response.status(201).json({
    espaco,
    message: 'Espaco cadastrado com sucesso.',
  });
}

async function updateSpace(request, response) {
  const espaco = await adminService.updateSpace(request.auth, request.params.id, request.body);
  response.json({
    espaco,
    message: 'Espaco atualizado com sucesso.',
  });
}

async function deactivateSpace(request, response) {
  const espaco = await adminService.deactivateSpace(request.auth, request.params.id, request.body);
  response.json({
    espaco,
    message: 'Periodo de desativacao salvo com sucesso.',
  });
}

async function clearSpaceDeactivation(request, response) {
  const espaco = await adminService.clearSpaceDeactivation(request.auth, request.params.id);
  response.json({
    espaco,
    message: 'Desativacao removida. O espaco esta ativo novamente.',
  });
}

async function deleteSpace(request, response) {
  await adminService.deleteSpace(request.auth, request.params.id);
  response.json({ message: 'Espaco excluido permanentemente.' });
}

module.exports = {
  banUser,
  blockUserTemporarily,
  changeOwnPassword,
  clearUserTemporaryBlock,
  clearSpaceDeactivation,
  createAdmin,
  createSpace,
  dashboard,
  deactivateSpace,
  deleteSpace,
  listAdmins,
  listDocumentations,
  listOwners,
  listSpaces,
  listUsers,
  reviewDocumentation,
  updateOwnerApproval,
  updateSpace,
};
