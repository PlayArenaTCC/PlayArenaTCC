const { sanitizeAccount } = require('../middleware/auth');
const authService = require('../services/authService');
const mediaService = require('../services/mediaService');

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
  let media = null;

  try {
    if (request.file) {
      media = await mediaService.createMediaAsset({
        file: request.file,
        ownerPerfil: request.auth.perfil,
        ownerId: request.auth.id,
        tipo: 'foto_perfil',
      });
    }

    const payload = await authService.updateProfile({
      account: request.auth.account,
      perfil: request.auth.perfil,
      telefone: request.body.telefone,
      fotoPerfilUrl: media ? mediaService.buildMediaUrl(request, media.id) : undefined,
    });

    response.json(payload);
  } catch (error) {
    if (media) {
      await media.destroy().catch(() => {});
    }

    throw error;
  }
}

async function deleteProfileAccount(request, response) {
  const payload = await authService.deleteAccount({
    account: request.auth.account,
    perfil: request.auth.perfil,
  });

  response.json(payload);
}

module.exports = {
  confirmRegistration,
  deleteProfileAccount,
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
