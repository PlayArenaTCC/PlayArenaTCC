const jwt = require('jsonwebtoken');
const { Administrador, Proprietario, Usuario } = require('../models');
const {
  clearExpiredTemporaryAccountBlock,
  formatTemporaryBlockMessage,
  isAccountTemporarilyBlocked,
} = require('../services/userAccessService');

const modelByRole = {
  usuario: Usuario,
  proprietario: Proprietario,
  admin: Administrador,
};

function getJwtSecret() {
  return process.env.JWT_SECRET || 'playarena-dev-secret';
}

function sanitizeAccount(account, role) {
  if (!account) {
    return null;
  }

  const data = account.toJSON ? account.toJSON() : { ...account };
  delete data.senha_hash;
  return {
    ...data,
    perfil: role,
  };
}

function signToken(account, role) {
  return jwt.sign(
    {
      sub: account.id,
      perfil: role,
    },
    getJwtSecret(),
    { expiresIn: '7d' },
  );
}

function isAccountActive(account, role) {
  if (!account) {
    return false;
  }

  if (role === 'usuario') {
    return account.status === 'ativo';
  }

  return account.ativo !== false;
}

function blockedResponse(response, account, role) {
  return response.status(403).json({
    code: 'ACCOUNT_TEMPORARILY_BLOCKED',
    accountId: account.id,
    perfil: role,
    message: formatTemporaryBlockMessage(account),
  });
}

function inactiveResponse(response, account, role) {
  return response.status(403).json({
    code: 'ACCOUNT_BANNED',
    accountId: account.id,
    perfil: role,
    message: 'Sua conta foi banida. Entre em contato com o suporte para mais informações.',
  });
}

function authenticateWithOptions({ allowInactive = false } = {}) {
  return async (request, response, next) => {
    try {
      const header = request.headers.authorization || '';
      const [, token] = header.split(' ');

      if (!token) {
        return response.status(401).json({ message: 'Token não informado.' });
      }

      const payload = jwt.verify(token, getJwtSecret());
      const Model = modelByRole[payload.perfil];

      if (!Model) {
        return response.status(401).json({ message: 'Perfil inválido.' });
      }

      const account = await Model.findByPk(payload.sub);

      if (!account) {
        return response.status(401).json({ message: 'Conta inativa ou inexistente.' });
      }

      if (!allowInactive) {
        if (payload.perfil !== 'admin') {
          await clearExpiredTemporaryAccountBlock(account);

          if (isAccountTemporarilyBlocked(account)) {
            return blockedResponse(response, account, payload.perfil);
          }
        }

        if (!isAccountActive(account, payload.perfil)) {
          return inactiveResponse(response, account, payload.perfil);
        }
      }

      request.auth = {
        id: account.id,
        perfil: payload.perfil,
        account,
      };

      return next();
    } catch (error) {
      return response.status(401).json({ message: 'Sessao invalida ou expirada.' });
    }
  };
}

function authenticate(request, response, next) {
  return authenticateWithOptions()(request, response, next);
}

function requireRoles(...roles) {
  return (request, response, next) => {
    if (!request.auth || !roles.includes(request.auth.perfil)) {
      return response.status(403).json({ message: 'Acesso não permitido para este perfil.' });
    }

    return next();
  };
}

module.exports = {
  authenticate,
  authenticateWithOptions,
  requireRoles,
  sanitizeAccount,
  signToken,
};
