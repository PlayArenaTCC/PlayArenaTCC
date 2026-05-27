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

async function login(request, response) {
  const payload = await authService.loginAccount(request.body);
  response.json(payload);
}

function me(request, response) {
  response.json({
    usuario: sanitizeAccount(request.auth.account, request.auth.perfil),
  });
}

module.exports = {
  login,
  me,
  registerOwner,
  registerUser,
};
