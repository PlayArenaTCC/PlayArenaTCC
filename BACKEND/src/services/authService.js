const bcrypt = require('bcrypt');

const { Administrador, Proprietario, Usuario } = require('../models');
const { sanitizeAccount, signToken } = require('../middleware/auth');
const { HttpError } = require('../utils/http');

const SALT_ROUNDS = 10;

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function validatePassword(senha) {
  return typeof senha === 'string' && senha.length >= 6;
}

function pickLoginModels(perfil) {
  if (perfil === 'usuario') {
    return [{ role: 'usuario', Model: Usuario }];
  }

  if (perfil === 'proprietario') {
    return [{ role: 'proprietario', Model: Proprietario }];
  }

  if (perfil === 'admin') {
    return [{ role: 'admin', Model: Administrador }];
  }

  return [
    { role: 'usuario', Model: Usuario },
    { role: 'proprietario', Model: Proprietario },
    { role: 'admin', Model: Administrador },
  ];
}

async function registerUser({ nome, email, senha, telefone }) {
  if (!nome || !email || !validatePassword(senha)) {
    throw new HttpError(400, 'Informe nome, e-mail e uma senha com pelo menos 6 caracteres.');
  }

  try {
    const usuario = await Usuario.create({
      nome: String(nome).trim(),
      email: normalizeEmail(email),
      senha_hash: await bcrypt.hash(senha, SALT_ROUNDS),
      telefone: telefone || null,
    });

    return {
      token: signToken(usuario, 'usuario'),
      usuario: sanitizeAccount(usuario, 'usuario'),
    };
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new HttpError(409, 'Este e-mail ja esta cadastrado.');
    }

    throw error;
  }
}

async function registerOwner({
  nome_responsavel,
  nome_empresa,
  cpf_cnpj,
  email,
  senha,
  telefone,
}) {
  if (!nome_responsavel || !email || !validatePassword(senha)) {
    throw new HttpError(400, 'Informe responsavel, e-mail e uma senha com pelo menos 6 caracteres.');
  }

  try {
    const proprietario = await Proprietario.create({
      nome_responsavel: String(nome_responsavel).trim(),
      nome_empresa: nome_empresa || null,
      cpf_cnpj: cpf_cnpj || null,
      email: normalizeEmail(email),
      senha_hash: await bcrypt.hash(senha, SALT_ROUNDS),
      telefone: telefone || null,
    });

    return {
      token: signToken(proprietario, 'proprietario'),
      usuario: sanitizeAccount(proprietario, 'proprietario'),
    };
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new HttpError(409, 'E-mail ou CPF/CNPJ ja cadastrado.');
    }

    throw error;
  }
}

async function loginAccount({ email, senha, perfil }) {
  const login = normalizeEmail(email);

  if (!login || !senha) {
    throw new HttpError(400, 'Informe e-mail e senha.');
  }

  for (const { role, Model } of pickLoginModels(perfil)) {
    const account = await Model.findOne({ where: { email: login } });

    if (!account) {
      continue;
    }

    const isValid = await bcrypt.compare(senha, account.senha_hash);

    if (!isValid) {
      throw new HttpError(401, 'Credenciais invalidas.');
    }

    if (role === 'usuario' && account.status !== 'ativo') {
      throw new HttpError(403, 'Usuario inativo.');
    }

    if (role !== 'usuario' && account.ativo === false) {
      throw new HttpError(403, 'Conta inativa.');
    }

    return {
      token: signToken(account, role),
      usuario: sanitizeAccount(account, role),
    };
  }

  throw new HttpError(401, 'Credenciais invalidas.');
}

module.exports = {
  loginAccount,
  registerOwner,
  registerUser,
};
