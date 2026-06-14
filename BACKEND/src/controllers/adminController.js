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
  const usuario = await adminService.banUser(request.auth, request.params.id, request.body);
  response.json({
    usuario,
    message: 'Usuário banido permanentemente.',
  });
}

async function unbanUser(request, response) {
  const usuario = await adminService.unbanUser(request.auth, request.params.id);
  response.json({
    usuario,
    message: 'Usuário desbanido com sucesso.',
  });
}

async function deleteUserAccount(request, response) {
  await adminService.deleteUserAccount(request.auth, request.params.id, request.body);
  response.json({
    message: 'Conta excluida permanentemente e credenciais bloqueadas.',
  });
}

async function listOwners(_request, response) {
  const proprietarios = await adminService.listOwners();
  response.json({ proprietarios });
}

async function blockOwnerTemporarily(request, response) {
  const proprietario = await adminService.blockOwnerTemporarily(
    request.auth,
    request.params.id,
    request.body,
  );
  response.json({
    proprietario,
    message: 'Bloqueio temporário salvo com sucesso.',
  });
}

async function clearOwnerTemporaryBlock(request, response) {
  const proprietario = await adminService.clearOwnerTemporaryBlock(request.auth, request.params.id);
  response.json({
    proprietario,
    message: 'Bloqueio temporário removido. O proprietário está ativo novamente.',
  });
}

async function banOwner(request, response) {
  const proprietario = await adminService.banOwner(request.auth, request.params.id, request.body);
  response.json({
    proprietario,
    message: 'Proprietário banido permanentemente.',
  });
}

async function unbanOwner(request, response) {
  const proprietario = await adminService.unbanOwner(request.auth, request.params.id);
  response.json({
    proprietario,
    message: 'Proprietário desbanido com sucesso.',
  });
}

async function deleteOwnerAccount(request, response) {
  await adminService.deleteOwnerAccount(request.auth, request.params.id, request.body);
  response.json({
    message: 'Conta excluida permanentemente e credenciais bloqueadas.',
  });
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

async function listAdminAlerts(_request, response) {
  const avisos = await adminService.listAdminAlerts();
  response.json({ avisos });
}

async function getAdminAlert(request, response) {
  const aviso = await adminService.getAdminAlert(request.params.id);
  response.json({ aviso });
}

async function updateAdminAlertStatus(request, response) {
  const aviso = await adminService.updateAdminAlertStatus(request.params.id, request.body.status);
  response.json({ aviso });
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
    message: 'Espaço cadastrado com sucesso.',
  });
}

async function updateSpace(request, response) {
  const espaco = await adminService.updateSpace(request.auth, request.params.id, request.body);
  response.json({
    espaco,
    message: 'Espaço atualizado com sucesso.',
  });
}

async function deactivateSpace(request, response) {
  const espaco = await adminService.deactivateSpace(request.auth, request.params.id, request.body);
  response.json({
    espaco,
    message: 'Período de desativação salvo com sucesso.',
  });
}

async function clearSpaceDeactivation(request, response) {
  const espaco = await adminService.clearSpaceDeactivation(request.auth, request.params.id);
  response.json({
    espaco,
    message: 'Desativação removida. O espaço está ativo novamente.',
  });
}

async function deleteSpace(request, response) {
  await adminService.deleteSpace(request.auth, request.params.id);
  response.json({ message: 'Espaço excluído permanentemente.' });
}

module.exports = {
  banOwner,
  banUser,
  blockOwnerTemporarily,
  blockUserTemporarily,
  changeOwnPassword,
  clearOwnerTemporaryBlock,
  clearUserTemporaryBlock,
  clearSpaceDeactivation,
  createAdmin,
  createSpace,
  dashboard,
  deactivateSpace,
  deleteOwnerAccount,
  deleteUserAccount,
  deleteSpace,
  listAdmins,
  listAdminAlerts,
  listDocumentations,
  getAdminAlert,
  listOwners,
  listSpaces,
  listUsers,
  reviewDocumentation,
  updateAdminAlertStatus,
  unbanOwner,
  unbanUser,
  updateOwnerApproval,
  updateSpace,
};
