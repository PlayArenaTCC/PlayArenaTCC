const bcrypt = require('bcrypt');
const fs = require('fs/promises');
const path = require('path');
const { Op } = require('sequelize');

const {
  Administrador,
  CadastroPendente,
  DocumentacaoLocal,
  HorarioDisponivel,
  Proprietario,
  Quadra,
  RecuperacaoSenha,
  Reserva,
  Usuario,
  sequelize,
} = require('../models');
const { sanitizeAccount, signToken } = require('../middleware/auth');
const {
  generateEmailVerificationCode,
  sendVerificationEmail,
} = require('./emailService');
const {
  clearExpiredTemporaryUserBlock,
  formatTemporaryBlockMessage,
  isUserTemporarilyBlocked,
} = require('./userAccessService');
const { HttpError } = require('../utils/http');

const SALT_ROUNDS = 10;
const DEFAULT_CODE_EXPIRATION_MINUTES = 10;
const DEFAULT_MAX_VERIFICATION_ATTEMPTS = 5;
const DEFAULT_RESEND_COOLDOWN_SECONDS = 60;
const DEFAULT_MAX_RESENDS = 3;
const UPLOADS_DIR = path.resolve(__dirname, '..', '..', 'uploads');
const PROFILE_PHOTO_DIR = path.join(UPLOADS_DIR, 'profile-photos');
const COURT_PHOTO_DIR = path.join(UPLOADS_DIR, 'court-photos');
const DOCUMENT_DIR = path.join(UPLOADS_DIR, 'documentos');

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function getEmailError(email) {
  const value = String(email || '').trim();

  if (!value) {
    return 'Informe o e-mail.';
  }

  if (/\s/.test(value)) {
    return 'O e-mail nao pode conter espacos.';
  }

  if (!value.includes('@')) {
    return 'O e-mail precisa conter @. Exemplo: nome@email.com.';
  }

  const [localPart, domainPart, extraPart] = value.split('@');

  if (extraPart !== undefined) {
    return 'O e-mail deve conter apenas um @.';
  }

  if (!localPart) {
    return 'Digite a parte antes do @ no e-mail.';
  }

  if (!domainPart) {
    return 'Digite o dominio depois do @. Exemplo: nome@email.com.';
  }

  if (!domainPart.includes('.')) {
    return 'O dominio do e-mail precisa ter ponto. Exemplo: nome@email.com.';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
    return 'Digite um e-mail valido. Exemplo: nome@email.com.';
  }

  return '';
}

function ensureValidEmail(email) {
  const error = getEmailError(email);

  if (error) {
    throw new HttpError(400, error);
  }

  return normalizeEmail(email);
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

function getCpfError(value) {
  const digits = onlyDigits(value);

  if (!digits) {
    return 'Informe o CPF.';
  }

  if (digits.length !== 11) {
    return 'CPF deve ter 11 digitos.';
  }

  if (/^(\d)\1+$/.test(digits)) {
    return 'CPF invalido: todos os digitos sao iguais.';
  }

  if (!isValidCpf(digits)) {
    return 'CPF invalido. Confira os numeros digitados.';
  }

  return '';
}

function validatePasswordConfirmation(senha, confirmarSenha) {
  return senha === confirmarSenha;
}

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

function normalizePhone(telefone, { required = false } = {}) {
  const digits = onlyDigits(telefone);

  if (!digits) {
    if (required) {
      throw new HttpError(400, 'Informe um telefone com DDD.');
    }

    return null;
  }

  if (![10, 11].includes(digits.length)) {
    throw new HttpError(400, 'Telefone deve ter DDD e 8 ou 9 digitos.');
  }

  return `${digits.slice(0, 2)} ${digits.slice(2)}`;
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

function passwordRequirementMessage(senha) {
  const value = String(senha || '');
  const missingRequirements = [];

  if (value.length < 8) {
    missingRequirements.push('8 caracteres');
  }

  if (!/[A-Z]/.test(value)) {
    missingRequirements.push('uma letra maiuscula');
  }

  if (!/\d/.test(value)) {
    missingRequirements.push('um numero');
  }

  if (!/[^\w\s]|_/.test(value)) {
    missingRequirements.push('um caractere especial');
  }

  if (!missingRequirements.length) {
    return '';
  }

  return `A senha precisa ter ${missingRequirements.join(', ')}.`;
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

async function buildUserRegistration({ nome, cpf, email, senha, confirmar_senha, telefone }) {
  const cpfNormalizado = onlyDigits(cpf);
  const normalizedEmail = ensureValidEmail(email);

  if (!String(nome || '').trim()) {
    throw new HttpError(400, 'Informe o nome completo.');
  }

  const cpfError = getCpfError(cpf);

  if (cpfError) {
    throw new HttpError(400, cpfError);
  }

  if (!senha) {
    throw new HttpError(400, 'Informe uma senha.');
  }

  if (!validatePassword(senha)) {
    throw new HttpError(400, passwordRequirementMessage(senha));
  }

  if (!confirmar_senha) {
    throw new HttpError(400, 'Confirme a senha.');
  }

  if (!validatePasswordConfirmation(senha, confirmar_senha)) {
    throw new HttpError(400, 'As senhas nao conferem.');
  }

  const [existingUsuario, existingProprietario, existingAdministrador] = await Promise.all([
    Usuario.findOne({
      where: {
        [Op.or]: [
          { email: normalizedEmail },
          { cpf: cpfNormalizado },
        ],
      },
    }),
    Proprietario.findOne({
      where: {
        [Op.or]: [
          { email: normalizedEmail },
          { cpf_cnpj: cpfNormalizado },
        ],
      },
    }),
    Administrador.findOne({
      where: {
        [Op.or]: [
          { email: normalizedEmail },
          { cpf: cpfNormalizado },
        ],
      },
    }),
  ]);

  if (existingUsuario?.email === normalizedEmail) {
    throw new HttpError(409, 'Este e-mail ja esta cadastrado como usuario.');
  }

  if (existingUsuario?.cpf === cpfNormalizado) {
    throw new HttpError(409, 'Este CPF ja esta cadastrado como usuario.');
  }

  if (existingProprietario?.email === normalizedEmail) {
    throw new HttpError(409, 'Este e-mail ja esta cadastrado como proprietario. Use outro e-mail ou faca login.');
  }

  if (existingProprietario?.cpf_cnpj === cpfNormalizado) {
    throw new HttpError(409, 'Este CPF ja esta cadastrado como proprietario.');
  }

  if (existingAdministrador?.email === normalizedEmail) {
    throw new HttpError(409, 'Este e-mail ja esta cadastrado como administrador.');
  }

  if (existingAdministrador?.cpf === cpfNormalizado) {
    throw new HttpError(409, 'Este CPF ja esta cadastrado como administrador.');
  }

  const telefoneNormalizado = normalizePhone(telefone);

  return {
    emailVerificacao: normalizedEmail,
    telefone: telefoneNormalizado,
    payload: {
      nome: String(nome).trim(),
      cpf: cpfNormalizado,
      email: normalizedEmail,
      senha_hash: await bcrypt.hash(senha, SALT_ROUNDS),
      telefone: telefoneNormalizado,
    },
  };
}

async function registerUser(registrationData) {
  const registration = await buildUserRegistration(registrationData);

  return createPendingRegistration({
    perfil: 'usuario',
    ...registration,
  });
}

async function buildOwnerRegistration({
  nome_responsavel,
  nome_empresa,
  cpf_cnpj,
  email,
  senha,
  confirmar_senha,
  telefone,
}) {
  const cpfNormalizado = onlyDigits(cpf_cnpj);
  const normalizedEmail = ensureValidEmail(email);

  if (!String(nome_responsavel || '').trim()) {
    throw new HttpError(400, 'Informe o nome do responsavel.');
  }

  const cpfError = getCpfError(cpf_cnpj);

  if (cpfError) {
    throw new HttpError(400, cpfError);
  }

  if (!senha) {
    throw new HttpError(400, 'Informe uma senha.');
  }

  if (!validatePassword(senha)) {
    throw new HttpError(400, passwordRequirementMessage(senha));
  }

  if (!confirmar_senha) {
    throw new HttpError(400, 'Confirme a senha.');
  }

  if (!validatePasswordConfirmation(senha, confirmar_senha)) {
    throw new HttpError(400, 'As senhas nao conferem.');
  }

  const [existingProprietario, existingUsuario, existingAdministrador] = await Promise.all([
    Proprietario.findOne({
      where: {
        [Op.or]: [
          { email: normalizedEmail },
          { cpf_cnpj: cpfNormalizado },
        ],
      },
    }),
    Usuario.findOne({
      where: {
        [Op.or]: [
          { email: normalizedEmail },
          { cpf: cpfNormalizado },
        ],
      },
    }),
    Administrador.findOne({
      where: {
        [Op.or]: [
          { email: normalizedEmail },
          { cpf: cpfNormalizado },
        ],
      },
    }),
  ]);

  if (existingProprietario?.email === normalizedEmail) {
    throw new HttpError(409, 'Este e-mail ja esta cadastrado como proprietario.');
  }

  if (existingProprietario?.cpf_cnpj === cpfNormalizado) {
    throw new HttpError(409, 'Este CPF ja esta cadastrado como proprietario.');
  }

  if (existingUsuario?.email === normalizedEmail) {
    throw new HttpError(409, 'Este e-mail ja esta cadastrado como usuario. Use outro e-mail ou faca login.');
  }

  if (existingUsuario?.cpf === cpfNormalizado) {
    throw new HttpError(409, 'Este CPF ja esta cadastrado como usuario.');
  }

  if (existingAdministrador?.email === normalizedEmail) {
    throw new HttpError(409, 'Este e-mail ja esta cadastrado como administrador.');
  }

  if (existingAdministrador?.cpf === cpfNormalizado) {
    throw new HttpError(409, 'Este CPF ja esta cadastrado como administrador.');
  }

  const telefoneNormalizado = normalizePhone(telefone);

  return {
    emailVerificacao: normalizedEmail,
    telefone: telefoneNormalizado,
    payload: {
      nome_responsavel: String(nome_responsavel).trim(),
      nome_empresa: nome_empresa || null,
      cpf_cnpj: cpfNormalizado,
      email: normalizedEmail,
      senha_hash: await bcrypt.hash(senha, SALT_ROUNDS),
      telefone: telefoneNormalizado,
    },
  };
}

async function registerOwner(registrationData) {
  const registration = await buildOwnerRegistration(registrationData);

  return createPendingRegistration({
    perfil: 'proprietario',
    ...registration,
  });
}

async function createAdminAccount({
  nome,
  cpf,
  email,
  telefone,
  senha,
  confirmar_senha,
}) {
  const cpfNormalizado = onlyDigits(cpf);
  const normalizedEmail = ensureValidEmail(email);

  if (!String(nome || '').trim()) {
    throw new HttpError(400, 'Informe o nome completo.');
  }

  const cpfError = getCpfError(cpf);

  if (cpfError) {
    throw new HttpError(400, cpfError);
  }

  const telefoneNormalizado = normalizePhone(telefone, { required: true });

  if (!senha) {
    throw new HttpError(400, 'Informe uma senha.');
  }

  if (!validatePassword(senha)) {
    throw new HttpError(400, passwordRequirementMessage(senha));
  }

  if (!confirmar_senha) {
    throw new HttpError(400, 'Confirme a senha.');
  }

  if (!validatePasswordConfirmation(senha, confirmar_senha)) {
    throw new HttpError(400, 'As senhas nao conferem.');
  }

  const [existingUsuario, existingProprietario, existingAdministrador] = await Promise.all([
    Usuario.findOne({
      where: {
        [Op.or]: [
          { email: normalizedEmail },
          { cpf: cpfNormalizado },
        ],
      },
    }),
    Proprietario.findOne({
      where: {
        [Op.or]: [
          { email: normalizedEmail },
          { cpf_cnpj: cpfNormalizado },
        ],
      },
    }),
    Administrador.findOne({
      where: {
        [Op.or]: [
          { email: normalizedEmail },
          { cpf: cpfNormalizado },
        ],
      },
    }),
  ]);

  if (existingUsuario?.email === normalizedEmail) {
    throw new HttpError(409, 'Este e-mail ja esta cadastrado como usuario.');
  }

  if (existingUsuario?.cpf === cpfNormalizado) {
    throw new HttpError(409, 'Este CPF ja esta cadastrado como usuario.');
  }

  if (existingProprietario?.email === normalizedEmail) {
    throw new HttpError(409, 'Este e-mail ja esta cadastrado como proprietario.');
  }

  if (existingProprietario?.cpf_cnpj === cpfNormalizado) {
    throw new HttpError(409, 'Este CPF ja esta cadastrado como proprietario.');
  }

  if (existingAdministrador?.email === normalizedEmail) {
    throw new HttpError(409, 'Este e-mail ja esta cadastrado como administrador.');
  }

  if (existingAdministrador?.cpf === cpfNormalizado) {
    throw new HttpError(409, 'Este CPF ja esta cadastrado como administrador.');
  }

  try {
    return await Administrador.create({
      nome: String(nome).trim(),
      cpf: cpfNormalizado,
      email: normalizedEmail,
      telefone: telefoneNormalizado,
      senha_hash: await bcrypt.hash(senha, SALT_ROUNDS),
      nivel_acesso: 'admin',
      ativo: true,
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new HttpError(409, 'Este e-mail ou CPF ja esta cadastrado.');
    }

    throw error;
  }
}

function getCodeExpirationMinutes() {
  const minutes = Number(process.env.EMAIL_CODE_EXPIRATION_MINUTES || DEFAULT_CODE_EXPIRATION_MINUTES);

  if (!Number.isFinite(minutes) || minutes < 1 || minutes > 60) {
    return DEFAULT_CODE_EXPIRATION_MINUTES;
  }

  return minutes;
}

function getMaxVerificationAttempts() {
  const attempts = Number(process.env.EMAIL_MAX_VERIFICATION_ATTEMPTS || DEFAULT_MAX_VERIFICATION_ATTEMPTS);

  if (!Number.isInteger(attempts) || attempts < 1 || attempts > 10) {
    return DEFAULT_MAX_VERIFICATION_ATTEMPTS;
  }

  return attempts;
}

function getResendCooldownSeconds() {
  const seconds = Number(process.env.EMAIL_RESEND_COOLDOWN_SECONDS || DEFAULT_RESEND_COOLDOWN_SECONDS);

  if (!Number.isInteger(seconds) || seconds < 0 || seconds > 600) {
    return DEFAULT_RESEND_COOLDOWN_SECONDS;
  }

  return seconds;
}

function getMaxResends() {
  const resends = Number(process.env.EMAIL_MAX_RESENDS || DEFAULT_MAX_RESENDS);

  if (!Number.isInteger(resends) || resends < 0 || resends > 10) {
    return DEFAULT_MAX_RESENDS;
  }

  return resends;
}

function maskEmail(email) {
  const [name, domain] = String(email || '').split('@');

  if (!name || !domain) {
    return email;
  }

  const visible = name.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(name.length - 2, 3))}@${domain}`;
}

function buildPendingRegistrationResponse(cadastroPendente, emailProvider = 'local') {
  const expiresInSeconds = Math.max(
    0,
    Math.ceil((new Date(cadastroPendente.expira_em).getTime() - Date.now()) / 1000),
  );
  const isLocalEmail = emailProvider === 'local';

  return {
    verification_id: cadastroPendente.id,
    email: maskEmail(cadastroPendente.email_verificacao),
    email_provider: emailProvider,
    expira_em: cadastroPendente.expira_em,
    expires_in_seconds: expiresInSeconds,
    message: isLocalEmail
      ? 'Codigo gerado em modo teste. Veja o terminal do backend.'
      : 'Codigo de verificacao enviado por e-mail.',
  };
}

function buildEmailDeliveryError(error) {
  const message = String(error?.message || '');

  if (message.toLowerCase().includes('domain')) {
    return 'Nao foi possivel enviar o e-mail. O remetente de teste onboarding@resend.dev so envia para o e-mail da sua conta Resend. Para enviar para outros e-mails, verifique um dominio no Resend e use RESEND_FROM_EMAIL=PlayArena <no-reply@seudominio.com>.';
  }

  if (
    message.toLowerCase().includes('gmail')
    || message.toLowerCase().includes('invalid login')
    || message.toLowerCase().includes('application-specific password')
    || message.includes('535')
  ) {
    return 'Nao foi possivel enviar o e-mail pelo Gmail. Verifique se EMAIL_PROVIDER=gmail, se GMAIL_USER esta correto e se GMAIL_APP_PASSWORD e uma senha de app de 16 caracteres gerada com a verificacao em duas etapas ativada.';
  }

  return `Nao foi possivel enviar o e-mail de verificacao. ${message}`;
}

async function cleanupExpiredPendingRegistrations() {
  await CadastroPendente.destroy({
    where: {
      expira_em: {
        [Op.lt]: new Date(),
      },
    },
  });
}

async function createPendingRegistration({ perfil, payload, emailVerificacao, telefone }) {
  await cleanupExpiredPendingRegistrations();

  const expirationMinutes = getCodeExpirationMinutes();
  const expiraEm = new Date(Date.now() + expirationMinutes * 60 * 1000);
  const now = new Date();

  await CadastroPendente.destroy({
    where: {
      perfil,
      email_verificacao: emailVerificacao,
    },
  });

  const code = generateEmailVerificationCode();
  const cadastroPendente = await CadastroPendente.create({
    perfil,
    payload,
    email_verificacao: emailVerificacao,
    telefone,
    telefone_e164: null,
    codigo_hash: await bcrypt.hash(code, SALT_ROUNDS),
    expira_em: expiraEm,
    ultimo_envio_em: now,
  });

  try {
    const emailResult = await sendVerificationEmail({
      to: emailVerificacao,
      code,
      name: payload.nome || payload.nome_responsavel,
    });

    await cadastroPendente.update({
      email_provider: emailResult.provider,
      provider_reference: emailResult.messageId,
    });

    return buildPendingRegistrationResponse(cadastroPendente, emailResult.provider);
  } catch (error) {
    await cadastroPendente.destroy().catch(() => {});
    throw new HttpError(502, buildEmailDeliveryError(error));
  }
}

async function resendRegistrationCode({ verification_id }) {
  const cadastroPendente = await CadastroPendente.findByPk(verification_id);

  if (!cadastroPendente) {
    throw new HttpError(404, 'Cadastro pendente nao encontrado. Refaca o cadastro para receber um novo e-mail.');
  }

  if (cadastroPendente.expira_em < new Date()) {
    await cadastroPendente.destroy();
    throw new HttpError(410, 'Codigo expirado. Refaca o cadastro para receber um novo e-mail.');
  }

  const maxResends = getMaxResends();

  if (cadastroPendente.reenvios >= maxResends) {
    await cadastroPendente.destroy();
    throw new HttpError(429, 'Limite de reenvios atingido. Refaca o cadastro para receber outro codigo por e-mail.');
  }

  const cooldownSeconds = getResendCooldownSeconds();
  const lastSentAt = new Date(cadastroPendente.ultimo_envio_em).getTime();
  const waitSeconds = Math.ceil((lastSentAt + cooldownSeconds * 1000 - Date.now()) / 1000);

  if (cooldownSeconds > 0 && waitSeconds > 0) {
    throw new HttpError(429, `Aguarde ${waitSeconds} segundos para reenviar o codigo.`);
  }

  const expirationMinutes = getCodeExpirationMinutes();
  const expiraEm = new Date(Date.now() + expirationMinutes * 60 * 1000);
  const code = generateEmailVerificationCode();

  try {
    const emailResult = await sendVerificationEmail({
      to: cadastroPendente.email_verificacao,
      code,
      name: cadastroPendente.payload?.nome || cadastroPendente.payload?.nome_responsavel,
    });

    await cadastroPendente.update({
      codigo_hash: await bcrypt.hash(code, SALT_ROUNDS),
      email_provider: emailResult.provider,
      provider_reference: emailResult.messageId,
      tentativas: 0,
      reenvios: cadastroPendente.reenvios + 1,
      expira_em: expiraEm,
      ultimo_envio_em: new Date(),
    });

    return buildPendingRegistrationResponse(cadastroPendente, emailResult.provider);
  } catch (error) {
    throw new HttpError(502, buildEmailDeliveryError(error));
  }
}

function buildPasswordResetResponse(recuperacaoSenha, emailProvider = 'local') {
  const expiresInSeconds = Math.max(
    0,
    Math.ceil((new Date(recuperacaoSenha.expira_em).getTime() - Date.now()) / 1000),
  );

  return {
    reset_id: recuperacaoSenha.id,
    email: maskEmail(recuperacaoSenha.email),
    email_provider: emailProvider,
    expira_em: recuperacaoSenha.expira_em,
    expires_in_seconds: expiresInSeconds,
    message: emailProvider === 'local'
      ? 'Codigo de recuperacao gerado em modo teste. Veja o terminal do backend.'
      : 'Codigo de recuperacao enviado por e-mail.',
  };
}

async function cleanupExpiredPasswordRecoveries() {
  await RecuperacaoSenha.destroy({
    where: {
      expira_em: {
        [Op.lt]: new Date(),
      },
    },
  });
}

async function findPasswordResetAccount(email) {
  const usuario = await Usuario.findOne({ where: { email } });

  if (usuario) {
    return {
      account: usuario,
      displayName: usuario.nome,
      perfil: 'usuario',
    };
  }

  const proprietario = await Proprietario.findOne({ where: { email } });

  if (proprietario) {
    return {
      account: proprietario,
      displayName: proprietario.nome_responsavel || proprietario.nome_empresa,
      perfil: 'proprietario',
    };
  }

  return null;
}

async function requestPasswordReset({ email }) {
  const normalizedEmail = ensureValidEmail(email);
  const found = await findPasswordResetAccount(normalizedEmail);

  if (!found) {
    throw new HttpError(404, 'Nenhuma conta foi encontrada com este e-mail.');
  }

  if (found.perfil === 'usuario' && found.account.status !== 'ativo') {
    throw new HttpError(403, 'Usuario inativo. Nao e possivel recuperar a senha desta conta.');
  }

  if (found.perfil === 'proprietario' && found.account.ativo === false) {
    throw new HttpError(403, 'Conta inativa. Nao e possivel recuperar a senha desta conta.');
  }

  await cleanupExpiredPasswordRecoveries();
  await RecuperacaoSenha.destroy({ where: { email: normalizedEmail } });

  const code = generateEmailVerificationCode();
  const expirationMinutes = getCodeExpirationMinutes();
  const expiraEm = new Date(Date.now() + expirationMinutes * 60 * 1000);
  const recuperacaoSenha = await RecuperacaoSenha.create({
    perfil: found.perfil,
    conta_id: found.account.id,
    email: normalizedEmail,
    codigo_hash: await bcrypt.hash(code, SALT_ROUNDS),
    expira_em: expiraEm,
    ultimo_envio_em: new Date(),
  });

  try {
    const emailResult = await sendVerificationEmail({
      to: normalizedEmail,
      code,
      name: found.displayName,
    });

    return buildPasswordResetResponse(recuperacaoSenha, emailResult.provider);
  } catch (error) {
    await recuperacaoSenha.destroy().catch(() => {});
    throw new HttpError(502, buildEmailDeliveryError(error));
  }
}

async function assertPasswordResetCode(recuperacaoSenha, codigo) {
  if (!recuperacaoSenha) {
    throw new HttpError(404, 'Solicitacao de recuperacao nao encontrada. Peça um novo codigo.');
  }

  if (recuperacaoSenha.expira_em < new Date()) {
    await recuperacaoSenha.destroy();
    throw new HttpError(410, 'Codigo expirado. Solicite um novo codigo de recuperacao.');
  }

  const normalizedCode = onlyDigits(codigo);

  if (!/^\d{4,10}$/.test(normalizedCode)) {
    throw new HttpError(400, 'Informe o codigo numerico recebido por e-mail.');
  }

  const maxAttempts = getMaxVerificationAttempts();

  if (recuperacaoSenha.tentativas >= maxAttempts) {
    await recuperacaoSenha.destroy();
    throw new HttpError(429, 'Limite de tentativas atingido. Solicite outro codigo.');
  }

  const codeMatches = await bcrypt.compare(normalizedCode, recuperacaoSenha.codigo_hash);

  if (!codeMatches) {
    const nextAttempts = recuperacaoSenha.tentativas + 1;

    if (nextAttempts >= maxAttempts) {
      await recuperacaoSenha.destroy();
      throw new HttpError(429, 'Codigo invalido. Limite de tentativas atingido.');
    }

    await recuperacaoSenha.update({ tentativas: nextAttempts });
    throw new HttpError(400, 'Codigo invalido. Verifique o e-mail e tente novamente.');
  }

  return normalizedCode;
}

async function verifyPasswordResetCode({ reset_id, codigo }) {
  const recuperacaoSenha = await RecuperacaoSenha.findByPk(reset_id);
  await assertPasswordResetCode(recuperacaoSenha, codigo);
  await recuperacaoSenha.update({ validado_em: new Date() });

  return {
    reset_id: recuperacaoSenha.id,
    email: maskEmail(recuperacaoSenha.email),
    message: 'Codigo validado. Defina sua nova senha.',
  };
}

async function resetPassword({ reset_id, codigo, senha, confirmar_senha }) {
  const recuperacaoSenha = await RecuperacaoSenha.findByPk(reset_id);
  await assertPasswordResetCode(recuperacaoSenha, codigo);

  if (!senha) {
    throw new HttpError(400, 'Informe a nova senha.');
  }

  if (!validatePassword(senha)) {
    throw new HttpError(400, passwordRequirementMessage(senha));
  }

  if (!confirmar_senha) {
    throw new HttpError(400, 'Confirme a nova senha.');
  }

  if (!validatePasswordConfirmation(senha, confirmar_senha)) {
    throw new HttpError(400, 'As senhas nao conferem.');
  }

  const Model = recuperacaoSenha.perfil === 'usuario' ? Usuario : Proprietario;
  const account = await Model.findByPk(recuperacaoSenha.conta_id);

  if (!account) {
    await recuperacaoSenha.destroy();
    throw new HttpError(404, 'Conta nao encontrada. Solicite a recuperacao novamente.');
  }

  await account.update({
    senha_hash: await bcrypt.hash(senha, SALT_ROUNDS),
  });
  await recuperacaoSenha.destroy();

  return {
    message: 'Senha atualizada com sucesso. Faca login com a nova senha.',
  };
}

async function changeAdminPassword({
  account,
  perfil,
  nova_senha,
  confirmar_nova_senha,
}) {
  if (perfil !== 'admin' || !account) {
    throw new HttpError(403, 'Apenas administradores podem alterar a senha por esta area.');
  }

  if (!nova_senha) {
    throw new HttpError(400, 'Informe a nova senha.');
  }

  if (!validatePassword(nova_senha)) {
    throw new HttpError(400, passwordRequirementMessage(nova_senha));
  }

  if (!confirmar_nova_senha) {
    throw new HttpError(400, 'Confirme a nova senha.');
  }

  if (!validatePasswordConfirmation(nova_senha, confirmar_nova_senha)) {
    throw new HttpError(400, 'As senhas nao conferem.');
  }

  await account.update({
    senha_hash: await bcrypt.hash(nova_senha, SALT_ROUNDS),
  });

  return {
    message: 'Senha atualizada com sucesso. Use a nova senha no proximo login.',
  };
}

async function confirmRegistrationCode({ verification_id, codigo }) {
  const cadastroPendente = await CadastroPendente.findByPk(verification_id);

  if (!cadastroPendente) {
    throw new HttpError(404, 'Cadastro pendente nao encontrado. Solicite um novo codigo.');
  }

  if (cadastroPendente.expira_em < new Date()) {
    await cadastroPendente.destroy();
    throw new HttpError(410, 'Codigo expirado. Refaca o cadastro para receber um novo e-mail.');
  }

  const normalizedCode = onlyDigits(codigo);

  if (!/^\d{4,10}$/.test(normalizedCode)) {
    throw new HttpError(400, 'Informe o codigo numerico recebido por e-mail.');
  }

  const maxAttempts = getMaxVerificationAttempts();

  if (cadastroPendente.tentativas >= maxAttempts) {
    await cadastroPendente.destroy();
    throw new HttpError(429, 'Limite de tentativas atingido. Refaca o cadastro para receber outro codigo.');
  }

  async function rejectInvalidCode() {
    const nextAttempts = cadastroPendente.tentativas + 1;

    if (nextAttempts >= maxAttempts) {
      await cadastroPendente.destroy();
      throw new HttpError(429, 'Codigo invalido. Limite de tentativas atingido.');
    }

    await cadastroPendente.update({ tentativas: nextAttempts });
    throw new HttpError(400, 'Codigo invalido. Verifique o e-mail e tente novamente.');
  }

  if (!cadastroPendente.codigo_hash) {
    throw new HttpError(400, 'Cadastro pendente sem codigo. Solicite um novo codigo.');
  }

  const codeMatches = await bcrypt.compare(normalizedCode, cadastroPendente.codigo_hash);

  if (!codeMatches) {
    await rejectInvalidCode();
  }

  return sequelize.transaction(async (transaction) => {
    const account = await createConfirmedAccount(cadastroPendente, transaction);
    await cadastroPendente.destroy({ transaction });

    return {
      usuario: sanitizeAccount(account, cadastroPendente.perfil),
      message: 'E-mail validado com sucesso. Cadastro concluido.',
    };
  });
}

async function createConfirmedAccount(cadastroPendente, transaction) {
  const payload = cadastroPendente.payload || {};

  try {
    if (cadastroPendente.perfil === 'usuario') {
      await ensureUserIsAvailable(payload, transaction);
      return Usuario.create(payload, { transaction });
    }

    await ensureOwnerIsAvailable(payload, transaction);
    return Proprietario.create(payload, { transaction });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new HttpError(
        409,
        cadastroPendente.perfil === 'usuario'
          ? 'Este e-mail ou CPF ja esta cadastrado.'
          : 'E-mail ou CPF ja cadastrado.',
      );
    }

    throw error;
  }
}

async function ensureUserIsAvailable(payload, transaction) {
  const existingUsuario = await Usuario.findOne({
    where: {
      [Op.or]: [
        { email: payload.email },
        { cpf: payload.cpf },
      ],
    },
    transaction,
  });

  if (existingUsuario) {
    throw new HttpError(409, 'Este e-mail ou CPF ja esta cadastrado.');
  }

  const existingProprietario = await Proprietario.findOne({
    where: {
      [Op.or]: [
        { email: payload.email },
        { cpf_cnpj: payload.cpf },
      ],
    },
    transaction,
  });

  if (existingProprietario) {
    throw new HttpError(409, 'Este e-mail ou CPF ja esta cadastrado como proprietario.');
  }

  const existingAdministrador = await Administrador.findOne({
    where: {
      [Op.or]: [
        { email: payload.email },
        { cpf: payload.cpf },
      ],
    },
    transaction,
  });

  if (existingAdministrador) {
    throw new HttpError(409, 'Este e-mail ou CPF ja esta cadastrado como administrador.');
  }
}

async function ensureOwnerIsAvailable(payload, transaction) {
  const existingProprietario = await Proprietario.findOne({
    where: {
      [Op.or]: [
        { email: payload.email },
        { cpf_cnpj: payload.cpf_cnpj },
      ],
    },
    transaction,
  });

  if (existingProprietario) {
    throw new HttpError(409, 'E-mail ou CPF ja cadastrado.');
  }

  const existingUsuario = await Usuario.findOne({
    where: {
      [Op.or]: [
        { email: payload.email },
        { cpf: payload.cpf_cnpj },
      ],
    },
    transaction,
  });

  if (existingUsuario) {
    throw new HttpError(409, 'Este e-mail ou CPF ja esta cadastrado como usuario.');
  }

  const existingAdministrador = await Administrador.findOne({
    where: {
      [Op.or]: [
        { email: payload.email },
        { cpf: payload.cpf_cnpj },
      ],
    },
    transaction,
  });

  if (existingAdministrador) {
    throw new HttpError(409, 'Este e-mail ou CPF ja esta cadastrado como administrador.');
  }
}

async function loginAccount({ email, senha, perfil }) {
  const login = ensureValidEmail(email);

  if (!senha) {
    throw new HttpError(400, 'Informe a senha.');
  }

  for (const { role, Model } of pickLoginModels(perfil)) {
    const account = await Model.findOne({ where: { email: login } });

    if (!account) {
      continue;
    }

    const isValid = await bcrypt.compare(senha, account.senha_hash);

    if (!isValid) {
      throw new HttpError(401, 'Senha incorreta para este e-mail.');
    }

    if (role === 'usuario') {
      await clearExpiredTemporaryUserBlock(account);

      if (isUserTemporarilyBlocked(account)) {
        throw new HttpError(403, formatTemporaryBlockMessage(account));
      }

      if (account.status !== 'ativo') {
        throw new HttpError(403, 'Usuario inativo. Entre em contato com o suporte.');
      }
    }

    if (role !== 'usuario' && account.ativo === false) {
      throw new HttpError(403, 'Conta inativa. Entre em contato com o suporte.');
    }

    return {
      token: signToken(account, role),
      usuario: sanitizeAccount(account, role),
    };
  }

  throw new HttpError(404, 'Nenhuma conta foi encontrada com este e-mail.');
}

async function updateProfile({ account, perfil, telefone, fotoPerfilUrl }) {
  if (!['usuario', 'proprietario'].includes(perfil)) {
    throw new HttpError(403, 'Este perfil nao permite edicao de dados pessoais.');
  }

  const updates = {};

  if (telefone !== undefined) {
    updates.telefone = normalizePhone(telefone);
  }

  if (fotoPerfilUrl) {
    updates.foto_perfil_url = fotoPerfilUrl;
  }

  if (Object.keys(updates).length) {
    await account.update(updates);
  }

  return {
    usuario: sanitizeAccount(account, perfil),
  };
}

function getLocalUploadPath(value) {
  const rawValue = String(value || '').trim();

  if (!rawValue) {
    return null;
  }

  let pathname = rawValue;

  try {
    pathname = new URL(rawValue).pathname;
  } catch (_error) {
    pathname = rawValue;
  }

  let normalizedPathname = pathname.replace(/\\/g, '/');

  try {
    normalizedPathname = decodeURIComponent(pathname).replace(/\\/g, '/');
  } catch (_error) {
    normalizedPathname = pathname.replace(/\\/g, '/');
  }
  const uploadIndex = normalizedPathname.indexOf('/uploads/');

  if (uploadIndex < 0) {
    return null;
  }

  const relativePath = normalizedPathname.slice(uploadIndex + '/uploads/'.length);
  const absolutePath = path.resolve(UPLOADS_DIR, relativePath);
  const root = `${UPLOADS_DIR}${path.sep}`.toLowerCase();

  if (!absolutePath.toLowerCase().startsWith(root)) {
    return null;
  }

  return absolutePath;
}

async function deleteLocalUpload(value) {
  const uploadPath = getLocalUploadPath(value);

  if (uploadPath) {
    await fs.unlink(uploadPath).catch(() => {});
  }
}

async function deleteUploadsByPrefix(directory, prefix) {
  const entries = await fs.readdir(directory, { withFileTypes: true }).catch(() => []);
  await Promise.all(entries
    .filter((entry) => entry.isFile() && entry.name.startsWith(prefix))
    .map((entry) => fs.unlink(path.join(directory, entry.name)).catch(() => {})));
}

function collectCourtUploads(quadras) {
  return quadras.flatMap((quadra) => [
    quadra.imagem_url,
    ...(Array.isArray(quadra.fotos) ? quadra.fotos : []),
  ]).filter(Boolean);
}

function collectDocumentationUploads(documentacoes) {
  return documentacoes.flatMap((documentacao) => Object.values(documentacao.documentos || {})).filter(Boolean);
}

async function cleanupAccountUploads({
  account,
  perfil,
  quadras = [],
  documentacoes = [],
}) {
  const uploadUrls = [
    account.foto_perfil_url,
    ...collectCourtUploads(quadras),
    ...collectDocumentationUploads(documentacoes),
  ];

  await Promise.all([
    ...uploadUrls.map(deleteLocalUpload),
    deleteUploadsByPrefix(PROFILE_PHOTO_DIR, `${perfil}-${account.id}-`),
    perfil === 'proprietario' ? deleteUploadsByPrefix(COURT_PHOTO_DIR, `${account.id}-`) : Promise.resolve(),
    perfil === 'proprietario' ? deleteUploadsByPrefix(DOCUMENT_DIR, `${account.id}-`) : Promise.resolve(),
  ]);
}

async function deleteAccount({ account, perfil }) {
  if (!['usuario', 'proprietario'].includes(perfil)) {
    throw new HttpError(403, 'Este perfil nao permite exclusao de conta.');
  }

  const accountSnapshot = account.toJSON ? account.toJSON() : { ...account };
  const uploadContext = {
    account: accountSnapshot,
    perfil,
    quadras: [],
    documentacoes: [],
  };

  await sequelize.transaction(async (transaction) => {
    await RecuperacaoSenha.destroy({
      where: {
        perfil,
        conta_id: account.id,
      },
      transaction,
    });
    await CadastroPendente.destroy({
      where: {
        perfil,
        email_verificacao: account.email,
      },
      transaction,
    });

    if (perfil === 'usuario') {
      await Reserva.destroy({
        where: { usuario_id: account.id },
        transaction,
      });
      await Usuario.destroy({
        where: { id: account.id },
        transaction,
      });
      return;
    }

    const quadras = await Quadra.findAll({
      where: { proprietario_id: account.id },
      attributes: ['id', 'imagem_url', 'fotos'],
      transaction,
    });
    const documentacoes = await DocumentacaoLocal.findAll({
      where: { proprietario_id: account.id },
      attributes: ['id', 'documentos'],
      transaction,
    });
    uploadContext.quadras = quadras.map((quadra) => (quadra.toJSON ? quadra.toJSON() : quadra));
    uploadContext.documentacoes = documentacoes.map((documentacao) => (
      documentacao.toJSON ? documentacao.toJSON() : documentacao
    ));

    const quadraIds = quadras.map((quadra) => quadra.id);

    if (quadraIds.length) {
      await Reserva.destroy({
        where: {
          quadra_id: { [Op.in]: quadraIds },
        },
        transaction,
      });
      await HorarioDisponivel.destroy({
        where: {
          quadra_id: { [Op.in]: quadraIds },
        },
        transaction,
      });
      await Quadra.destroy({
        where: {
          id: { [Op.in]: quadraIds },
        },
        transaction,
      });
    }

    await DocumentacaoLocal.destroy({
      where: { proprietario_id: account.id },
      transaction,
    });

    await Proprietario.destroy({
      where: { id: account.id },
      transaction,
    });
  });

  await cleanupAccountUploads(uploadContext);

  return {
    message: 'Conta excluida com sucesso.',
  };
}

module.exports = {
  changeAdminPassword,
  confirmRegistrationCode,
  createAdminAccount,
  deleteAccount,
  loginAccount,
  registerOwner,
  registerUser,
  requestPasswordReset,
  resetPassword,
  resendRegistrationCode,
  verifyPasswordResetCode,
  updateProfile,
};
