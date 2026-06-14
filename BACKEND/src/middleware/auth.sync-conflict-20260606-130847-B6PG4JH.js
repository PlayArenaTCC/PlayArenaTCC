const jwt = require('jsonwebtoken');
const { Administrador, Proprietario, Usuario } = require('../models');
const {
  clearExpiredTemporaryUserBlock,
  formatTemporaryBlockMessage,
  isUserTemporarilyBlocked,
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

async function authenticate(request, response, next) {
  try {
    const header = request.headers.authorization || '';
    const [, token] = header.split(' ');

    if (!token) {
      return response.status(401).json({ message: 'Token não informado.' });
    }

    const payload = jwt.verify(token, getJwtSecret());
    const Model = modelByRole[payload.perfil];

    if (!Model) {
      return response.status(401).json({ message: 'Perfil invalido.' });
    }

    const account = await Model.findByPk(payload.sub);

    if (payload.perfil === 'usuario' && account) {
      await clearExpiredTemporaryUserBlock(account);

      if (isUserTemporarilyBlocked(account)) {
        return response.status(403).json({ message: formatTemporaryBlockMessage(account) });
      }
    }

    if (!isAccountActive(account, payload.perfil)) {
      return response.status(401).json({ message: 'Conta inativa ou inexistente.' });
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
  requireRoles,
  sanitizeAccount,
  signToken,
};
