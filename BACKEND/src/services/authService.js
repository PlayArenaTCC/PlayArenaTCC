const bcrypt = require('bcrypt');
const { Op } = require('sequelize');

const { Administrador, Proprietario, Usuario } = require('../models');
const { sanitizeAccount, signToken } = require('../middleware/auth');
const { HttpError } = require('../utils/http');

const SALT_ROUNDS = 10;

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function validatePassword(senha) {
  return (
    typeof senha === 'string'
    && senha.length >= 8
    && /[A-Z]/.test(senha)
    && /\d/.test(senha)
    && /[^\w\s]|_/.test(senha)
  );
}

function validatePasswordConfirmation(senha, confirmarSenha) {
  return senha === confirmarSenha;
}

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

function isValidCpf(value) {
  const digits = onlyDigits(value);

  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) {
    return false;
  }

  const firstCheckDigit = calculateCpfCheckDigit(digits.slice(0, 9));
  const secondCheckDigit = calculateCpfCheckDigit(digits.slice(0, 10));

  return firstCheckDigit === Number(digits[9]) && secondCheckDigit === Number(digits[10]);
}

function calculateCpfCheckDigit(baseDigits) {
  const factor = baseDigits.length + 1;
  const sum = baseDigits
    .split('')
    .reduce((total, digit, index) => total + Number(digit) * (factor - index), 0);
  const remainder = (sum * 10) % 11;

  return remainder === 10 ? 0 : remainder;
}

function passwordRequirementMessage() {
  return 'A senha deve ter ao menos 8 caracteres, uma letra maiuscula, um numero e um caractere especial.';
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

async function registerUser({ nome, cpf, email, senha, confirmar_senha, telefone }) {
  const cpfNormalizado = onlyDigits(cpf);

  if (!nome || !email) {
    throw new HttpError(400, 'Informe nome, CPF, e-mail e senha.');
  }

  if (!isValidCpf(cpfNormalizado)) {
    throw new HttpError(400, 'CPF invalido.');
  }

  if (!validatePassword(senha)) {
    throw new HttpError(400, passwordRequirementMessage());
  }

  if (!validatePasswordConfirmation(senha, confirmar_senha)) {
    throw new HttpError(400, 'As senhas nao conferem.');
  }

  const normalizedEmail = normalizeEmail(email);
  const existingUsuario = await Usuario.findOne({
    where: {
      [Op.or]: [
        { email: normalizedEmail },
        { cpf: cpfNormalizado },
      ],
    },
  });

  if (existingUsuario) {
    throw new HttpError(409, 'Este e-mail ou CPF ja esta cadastrado.');
  }

  try {
    const usuario = await Usuario.create({
      nome: String(nome).trim(),
      cpf: cpfNormalizado,
      email: normalizedEmail,
      senha_hash: await bcrypt.hash(senha, SALT_ROUNDS),
      telefone: telefone || null,
    });

    return {
      token: signToken(usuario, 'usuario'),
      usuario: sanitizeAccount(usuario, 'usuario'),
    };
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new HttpError(409, 'Este e-mail ou CPF ja esta cadastrado.');
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
  confirmar_senha,
  telefone,
}) {
  const cpfNormalizado = onlyDigits(cpf_cnpj);

  if (!isValidCpf(cpfNormalizado)) {
    throw new HttpError(400, 'CPF invalido.');
  }

  if (!validatePassword(senha)) {
    throw new HttpError(400, passwordRequirementMessage());
  }

  if (!nome_responsavel || !email) {
    throw new HttpError(400, 'Informe responsavel, CPF, e-mail e senha.');
  }

  if (!validatePasswordConfirmation(senha, confirmar_senha)) {
    throw new HttpError(400, 'As senhas nao conferem.');
  }

  const normalizedEmail = normalizeEmail(email);
  const existingProprietario = await Proprietario.findOne({
    where: {
      [Op.or]: [
        { email: normalizedEmail },
        { cpf_cnpj: cpfNormalizado },
      ],
    },
  });

  if (existingProprietario) {
    throw new HttpError(409, 'E-mail ou CPF ja cadastrado.');
  }

  try {
    const proprietario = await Proprietario.create({
      nome_responsavel: String(nome_responsavel).trim(),
      nome_empresa: nome_empresa || null,
      cpf_cnpj: cpfNormalizado,
      email: normalizedEmail,
      senha_hash: await bcrypt.hash(senha, SALT_ROUNDS),
      telefone: telefone || null,
    });

    return {
      token: signToken(proprietario, 'proprietario'),
      usuario: sanitizeAccount(proprietario, 'proprietario'),
    };
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new HttpError(409, 'E-mail ou CPF ja cadastrado.');
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
      throw new HttpError(403, 'Usuário inativo.');
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
