const fs = require('fs/promises');

const { sanitizeAccount } = require('../middleware/auth');
const authService = require('../services/authService');

async function registerUser(request, response) {
  const payload = await authService.registerUser(request.body);
  response.status(201).json(payload);
}

async function registerOwner(request, response) {
  const payload = await authService.registerOwner(request.body);
  response.status(201).json(payload);
}

async function confirmRegistration(request, response) {
  const payload = await authService.confirmRegistrationCode(request.body);
  response.status(201).json(payload);
}

async function resendRegistrationCode(request, response) {
  const payload = await authService.resendRegistrationCode(request.body);
  response.json(payload);
}

async function login(request, response) {
  const payload = await authService.loginAccount(request.body);
  response.json(payload);
}

async function requestPasswordReset(request, response) {
  const payload = await authService.requestPasswordReset(request.body);
  response.json(payload);
}

async function verifyPasswordResetCode(request, response) {
  const payload = await authService.verifyPasswordResetCode(request.body);
  response.json(payload);
}

async function resetPassword(request, response) {
  const payload = await authService.resetPassword(request.body);
  response.json(payload);
}

function me(request, response) {
  response.json({
    usuario: sanitizeAccount(request.auth.account, request.auth.perfil),
  });
}

async function updateProfile(request, response) {
  try {
    const payload = await authService.updateProfile({
      account: request.auth.account,
      perfil: request.auth.perfil,
      telefone: request.body.telefone,
      fotoPerfilUrl: request.file ? buildProfilePhotoUrl(request, request.file.filename) : undefined,
    });

    response.json(payload);
  } catch (error) {
    if (request.file) {
      await fs.unlink(request.file.path).catch(() => {});
    }

    throw error;
  }
}

function buildProfilePhotoUrl(request, filename) {
  const forwardedProto = request.headers['x-forwarded-proto'];
  const protocol = String(Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto || request.protocol)
    .split(',')[0]
    .trim();

  return `${protocol}://${request.get('host')}/uploads/profile-photos/${filename}`;
}

module.exports = {
  confirmRegistration,
  login,
  me,
  registerOwner,
  registerUser,
  requestPasswordReset,
  resetPassword,
  resendRegistrationCode,
  verifyPasswordResetCode,
  updateProfile,
};
