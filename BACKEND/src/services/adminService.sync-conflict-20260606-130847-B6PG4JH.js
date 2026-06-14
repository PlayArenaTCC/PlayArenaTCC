const fs = require('fs/promises');
const path = require('path');
const { Op } = require('sequelize');

const {
  Administrador,
  CadastroPendente,
  Notificacao,
  Proprietario,
  Quadra,
  RecuperacaoSenha,
  Reserva,
  Usuario,
  sequelize,
} = require('../models');
const { sanitizeAccount } = require('../middleware/auth');
const adminLogService = require('./adminLogService');
const authService = require('./authService');
const documentacaoService = require('./documentacaoService');
const quadraService = require('./quadraService');
const {
  buildLocalDateTime,
  withEffectiveUserStatus,
} = require('./userAccessService');
const { HttpError } = require('../utils/http');

const UPLOADS_DIR = path.resolve(__dirname, '..', '..', 'uploads');
const PROFILE_PHOTO_DIR = path.join(UPLOADS_DIR, 'profile-photos');

function requireSuperAdmin(auth) {
  if (auth?.perfil !== 'admin' || auth.account?.nivel_acesso !== 'super_admin') {
    throw new HttpError(403, 'Apenas o administrador principal pode gerenciar administradores.');
  }
}

async function getDashboard() {
  const [
    totalUsuarios,
    totalProprietarios,
    totalQuadras,
    totalReservas,
    receita,
  ] = await Promise.all([
    Usuario.count(),
    Proprietario.count(),
    Quadra.count(),
    Reserva.count(),
    Reserva.sum('valor_total', { where: { status: ['confirmada', 'concluida'] } }),
  ]);

  return {
    totalUsuarios,
    totalProprietarios,
    totalQuadras,
    totalReservas,
    receita: Number(receita || 0),
  };
}

async function listUsers() {
  await Usuario.update({
    bloqueada_inicio_em: null,
    bloqueada_fim_em: null,
    motivo_bloqueio: null,
  }, {
    where: {
      bloqueada_fim_em: { [Op.lte]: new Date() },
    },
  });

  const usuarios = await Usuario.findAll({
    attributes: { exclude: ['senha_hash'] },
    order: [['created_at', 'DESC']],
  });

  return usuarios.map((usuario) => withEffectiveUserStatus(usuario));
}

async function findUserOrThrow(id) {
  const usuario = await Usuario.findByPk(id);

  if (!usuario) {
    throw new HttpError(404, 'Usuário não encontrado.');
  }

  return usuario;
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

  let decodedPath = pathname.replace(/\\/g, '/');

  try {
    decodedPath = decodeURIComponent(pathname).replace(/\\/g, '/');
  } catch (_error) {
    decodedPath = pathname.replace(/\\/g, '/');
  }

  const uploadIndex = decodedPath.indexOf('/uploads/');

  if (uploadIndex < 0) {
    return null;
  }

  const relativePath = decodedPath.slice(uploadIndex + '/uploads/'.length);
  const absolutePath = path.resolve(UPLOADS_DIR, relativePath);
  const uploadsRoot = `${UPLOADS_DIR}${path.sep}`.toLowerCase();

  return absolutePath.toLowerCase().startsWith(uploadsRoot) ? absolutePath : null;
}

async function deleteUserProfileUploads(usuario) {
  const profilePath = getLocalUploadPath(usuario.foto_perfil_url);
  const entries = await fs.readdir(PROFILE_PHOTO_DIR, { withFileTypes: true }).catch(() => []);
  const prefixedPaths = entries
    .filter((entry) => entry.isFile() && entry.name.startsWith(`usuario-${usuario.id}-`))
    .map((entry) => path.join(PROFILE_PHOTO_DIR, entry.name));
  const paths = [...new Set([profilePath, ...prefixedPaths].filter(Boolean))];

  await Promise.all(paths.map((filePath) => fs.unlink(filePath).catch(() => {})));
}

async function blockUserTemporarily(auth, id, {
  data_inicio,
  hora_inicio,
  data_fim,
  hora_fim,
  motivo,
} = {}) {
  const usuario = await findUserOrThrow(id);
  const start = buildLocalDateTime(data_inicio, hora_inicio);
  const end = buildLocalDateTime(data_fim, hora_fim);
  const reason = String(motivo || '').trim();

  if (!start || !end) {
    throw new HttpError(400, 'Informe data e hora de início e fim do bloqueio.');
  }

  if (end <= start) {
    throw new HttpError(400, 'A data final do bloqueio deve ser posterior à data inicial.');
  }

  if (end <= new Date()) {
    throw new HttpError(400, 'A data final do bloqueio deve estar no futuro.');
  }

  if (!reason) {
    throw new HttpError(400, 'Informe o motivo do bloqueio temporário.');
  }

  if (usuario.status !== 'ativo') {
    throw new HttpError(400, 'Apenas usuários ativos podem receber um bloqueio temporário.');
  }

  await sequelize.transaction(async (transaction) => {
    await usuario.update({
      bloqueada_inicio_em: start,
      bloqueada_fim_em: end,
      motivo_bloqueio: reason,
    }, { transaction });

    await adminLogService.recordAdminAction(auth, {
      acao: 'BLOQUEIO_TEMPORARIO',
      entidade: 'usuario',
      entidadeId: usuario.id,
      detalhes: {
        usuario_id: usuario.id,
        usuario_nome: usuario.nome,
        usuario_email: usuario.email,
        motivo: reason,
        data_acao: new Date(),
        inicio_bloqueio: start,
        fim_bloqueio: end,
      },
      transaction,
    });
  });

  return withEffectiveUserStatus(sanitizeAccount(usuario, 'usuario'));
}

async function clearUserTemporaryBlock(auth, id) {
  const usuario = await findUserOrThrow(id);

  await sequelize.transaction(async (transaction) => {
    await usuario.update({
      bloqueada_inicio_em: null,
      bloqueada_fim_em: null,
      motivo_bloqueio: null,
    }, { transaction });

    await adminLogService.recordAdminAction(auth, {
      acao: 'REMOVER_BLOQUEIO_TEMPORARIO',
      entidade: 'usuario',
      entidadeId: usuario.id,
      detalhes: {
        usuario_id: usuario.id,
        usuario_nome: usuario.nome,
        usuario_email: usuario.email,
        data_acao: new Date(),
      },
      transaction,
    });
  });

  return withEffectiveUserStatus(sanitizeAccount(usuario, 'usuario'));
}

async function banUser(auth, id, { motivo } = {}) {
  const usuario = await findUserOrThrow(id);
  const reason = String(motivo || '').trim();
  const snapshot = usuario.toJSON();

  if (!reason) {
    throw new HttpError(400, 'Informe o motivo do banimento.');
  }

  await sequelize.transaction(async (transaction) => {
    const reservations = await Reserva.findAll({
      where: { usuario_id: usuario.id },
      attributes: ['id'],
      transaction,
    });
    const reservationIds = reservations.map((reserva) => reserva.id);
    const notificationConditions = [{ userId: usuario.id }];

    if (reservationIds.length) {
      notificationConditions.push({ reservationId: { [Op.in]: reservationIds } });
    }

    await adminLogService.recordAdminAction(auth, {
      acao: 'BANIMENTO',
      entidade: 'usuario',
      entidadeId: usuario.id,
      detalhes: {
        usuario_id: usuario.id,
        usuario_nome: usuario.nome,
        usuario_email: usuario.email,
        motivo: reason,
        data_acao: new Date(),
      },
      transaction,
    });

    await Notificacao.destroy({
      where: { [Op.or]: notificationConditions },
      transaction,
    });

    await RecuperacaoSenha.destroy({
      where: {
        perfil: 'usuario',
        conta_id: usuario.id,
      },
      transaction,
    });

    await CadastroPendente.destroy({
      where: {
        perfil: 'usuario',
        email_verificacao: usuario.email,
      },
      transaction,
    });

    await Reserva.update({
      cancelado_por_id: null,
      cancelado_por_perfil: null,
      cancelado_por_nome: null,
    }, {
      where: { cancelado_por_id: usuario.id },
      transaction,
    });

    await Reserva.destroy({
      where: { usuario_id: usuario.id },
      transaction,
    });

    await Usuario.destroy({
      where: { id: usuario.id },
      transaction,
    });
  });

  await deleteUserProfileUploads(snapshot);
}

async function listOwners() {
  return Proprietario.findAll({
    attributes: { exclude: ['senha_hash'] },
    order: [['created_at', 'DESC']],
  });
}

async function updateOwnerApproval(id, statusAprovacao) {
  const proprietario = await Proprietario.findByPk(id);
  const statusPermitidos = ['pendente', 'aprovado', 'reprovado'];

  if (!proprietario) {
    throw new HttpError(404, 'Proprietário não encontrado.');
  }

  if (!statusPermitidos.includes(statusAprovacao)) {
    throw new HttpError(400, 'Status de aprovacao invalido.');
  }

  proprietario.status_aprovacao = statusAprovacao;
  await proprietario.save();
  return sanitizeAccount(proprietario, 'proprietario');
}

async function listAdmins(auth) {
  requireSuperAdmin(auth);

  return Administrador.findAll({
    attributes: { exclude: ['senha_hash'] },
    order: [['created_at', 'DESC']],
  });
}

async function createAdmin(auth, payload) {
  requireSuperAdmin(auth);
  const administrador = await authService.createAdminAccount(payload);
  return sanitizeAccount(administrador, 'admin');
}

async function changeOwnPassword(auth, payload) {
  return authService.changeAdminPassword({
    account: auth.account,
    perfil: auth.perfil,
    ...payload,
  });
}

async function listSpaces() {
  return quadraService.listAdminCourts();
}

async function createSpace(auth, payload) {
  return quadraService.createAdminCourt(auth, payload);
}

async function updateSpace(auth, id, payload) {
  return quadraService.updateCourt(auth, id, payload);
}

async function deactivateSpace(auth, id, payload) {
  return quadraService.setCourtTemporaryDeactivation(auth, id, payload);
}

async function clearSpaceDeactivation(auth, id) {
  return quadraService.clearCourtTemporaryDeactivation(auth, id);
}

async function deleteSpace(auth, id) {
  return quadraService.deleteCourtPermanently(auth, id);
}

async function listDocumentations(query) {
  return documentacaoService.listDocumentations(query);
}

async function reviewDocumentation(auth, id, payload) {
  return documentacaoService.reviewDocumentation(auth, id, payload);
}

module.exports = {
  banUser,
  blockUserTemporarily,
  changeOwnPassword,
  clearUserTemporaryBlock,
  clearSpaceDeactivation,
  createAdmin,
  createSpace,
  deactivateSpace,
  deleteSpace,
  getDashboard,
  listDocumentations,
  listAdmins,
  listOwners,
  listSpaces,
  listUsers,
  reviewDocumentation,
  updateOwnerApproval,
  updateSpace,
};
