const { Op } = require('sequelize');

const {
  Administrador,
  AdvertenciaProprietario,
  AvisoAdministrativo,
  AvisoAdvertenciaItem,
  CadastroPendente,
  CredencialBanida,
  DocumentacaoLocal,
  HorarioDisponivel,
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
const advertenciaProprietarioService = require('./advertenciaProprietarioService');
const documentacaoService = require('./documentacaoService');
const notificacaoService = require('./notificacaoService');
const quadraService = require('./quadraService');
const realtimeService = require('./realtimeService');
const {
  buildLocalDateTime,
  formatTemporaryBlockMessage,
  withEffectiveAccountStatus,
} = require('./userAccessService');
const { HttpError } = require('../utils/http');

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

async function clearExpiredTemporaryBlocks(Model) {
  await Model.update({
    bloqueada_inicio_em: null,
    bloqueada_fim_em: null,
    motivo_bloqueio: null,
  }, {
    where: {
      bloqueada_fim_em: { [Op.lte]: new Date() },
    },
  });
}

async function listUsers() {
  await clearExpiredTemporaryBlocks(Usuario);

  const usuarios = await Usuario.findAll({
    attributes: { exclude: ['senha_hash'] },
    order: [['created_at', 'DESC']],
  });

  return usuarios.map((usuario) => withEffectiveAccountStatus(usuario, 'usuario'));
}

async function listOwners() {
  await clearExpiredTemporaryBlocks(Proprietario);

  const proprietarios = await Proprietario.findAll({
    attributes: { exclude: ['senha_hash'] },
    order: [['created_at', 'DESC']],
  });

  return proprietarios.map((proprietario) => withEffectiveAccountStatus(proprietario, 'proprietario'));
}

async function findUserOrThrow(id) {
  const usuario = await Usuario.findByPk(id);

  if (!usuario) {
    throw new HttpError(404, 'Usuário não encontrado.');
  }

  return usuario;
}

async function findOwnerOrThrow(id) {
  const proprietario = await Proprietario.findByPk(id);

  if (!proprietario) {
    throw new HttpError(404, 'Proprietário não encontrado.');
  }

  return proprietario;
}

async function findAccountOrThrow(role, id) {
  return role === 'proprietario'
    ? findOwnerOrThrow(id)
    : findUserOrThrow(id);
}

function accountDisplayName(account, role) {
  if (role === 'proprietario') {
    return account.nome_responsavel || account.nome_empresa || 'Proprietário';
  }

  return account.nome || 'Usuário';
}

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

function accountCpf(account, role) {
  return role === 'proprietario'
    ? onlyDigits(account.cpf_cnpj)
    : onlyDigits(account.cpf);
}

function sanitizeManagedAccount(account, role) {
  return withEffectiveAccountStatus(sanitizeAccount(account, role), role);
}

function accessChangeMessage(account, role, type) {
  if (type === 'temporary') {
    return formatTemporaryBlockMessage(account);
  }

  return role === 'proprietario'
    ? 'Sua conta de proprietário foi banida. Você será desconectado agora.'
    : 'Sua conta foi banida. Você será desconectado agora.';
}

async function createUserAccessNotification(account, type, reason, transaction) {
  const message = type === 'temporary'
    ? formatTemporaryBlockMessage(account)
    : `Sua conta foi banida permanentemente. Motivo: ${reason}`;

  await notificacaoService.createAccountBlockedNotification(account.id, {
    title: type === 'temporary' ? 'Conta temporariamente bloqueada' : 'Conta banida',
    message,
    metadata: {
      accessType: type,
      reason,
    },
    transaction,
  });
}

function broadcastAccountAccess(account, role, type) {
  realtimeService.broadcastAccountAccessChange({
    perfil: role,
    accountId: account.id,
    type: type === 'temporary' ? 'temporary_block' : 'permanent_ban',
    message: accessChangeMessage(account, role, type),
  });
}

async function blockAccountTemporarily(auth, role, id, {
  data_inicio,
  hora_inicio,
  data_fim,
  hora_fim,
  motivo,
} = {}) {
  const account = await findAccountOrThrow(role, id);
  const start = buildLocalDateTime(data_inicio, hora_inicio);
  const end = buildLocalDateTime(data_fim, hora_fim);
  const reason = String(motivo || '').trim();

  if (!start || !end) {
    throw new HttpError(400, 'Informe data e hora de início e fim do bloqueio.');
  }

  if (end <= start) {
    throw new HttpError(400, 'A data final do bloqueio deve ser posterior a data inicial.');
  }

  if (end <= new Date()) {
    throw new HttpError(400, 'A data final do bloqueio deve estar no futuro.');
  }

  if (!reason) {
    throw new HttpError(400, 'Informe o motivo do bloqueio temporário.');
  }

  if (role === 'usuario' && account.status !== 'ativo') {
    throw new HttpError(400, 'Apenas usuários ativos podem receber um bloqueio temporário.');
  }

  if (role === 'proprietario' && account.ativo === false) {
    throw new HttpError(400, 'Apenas proprietários ativos podem receber um bloqueio temporário.');
  }

  await sequelize.transaction(async (transaction) => {
    await account.update({
      bloqueada_inicio_em: start,
      bloqueada_fim_em: end,
      motivo_bloqueio: reason,
    }, { transaction });

    if (role === 'usuario') {
      await createUserAccessNotification(account, 'temporary', reason, transaction);
    }

    await adminLogService.recordAdminAction(auth, {
      acao: 'BLOQUEIO_TEMPORARIO',
      entidade: role,
      entidadeId: account.id,
      detalhes: {
        conta_id: account.id,
        conta_nome: accountDisplayName(account, role),
        conta_email: account.email,
        perfil: role,
        motivo: reason,
        data_acao: new Date(),
        inicio_bloqueio: start,
        fim_bloqueio: end,
      },
      transaction,
    });
  });

  broadcastAccountAccess(account, role, 'temporary');
  return sanitizeManagedAccount(account, role);
}

async function clearAccountTemporaryBlock(auth, role, id) {
  const account = await findAccountOrThrow(role, id);

  await sequelize.transaction(async (transaction) => {
    await account.update({
      bloqueada_inicio_em: null,
      bloqueada_fim_em: null,
      motivo_bloqueio: null,
    }, { transaction });

    await adminLogService.recordAdminAction(auth, {
      acao: 'REMOVER_BLOQUEIO_TEMPORARIO',
      entidade: role,
      entidadeId: account.id,
      detalhes: {
        conta_id: account.id,
        conta_nome: accountDisplayName(account, role),
        conta_email: account.email,
        perfil: role,
        data_acao: new Date(),
      },
      transaction,
    });
  });

  return sanitizeManagedAccount(account, role);
}

async function banAccount(auth, role, id, { motivo } = {}) {
  const account = await findAccountOrThrow(role, id);
  const reason = String(motivo || '').trim();

  if (!reason) {
    throw new HttpError(400, 'Informe o motivo do banimento.');
  }

  await sequelize.transaction(async (transaction) => {
    if (role === 'usuario') {
      await account.update({
        status: 'inativo',
        bloqueada_inicio_em: null,
        bloqueada_fim_em: null,
        motivo_bloqueio: reason,
      }, { transaction });
      await createUserAccessNotification(account, 'permanent', reason, transaction);
    } else {
      await account.update({
        ativo: false,
        bloqueada_inicio_em: null,
        bloqueada_fim_em: null,
        motivo_bloqueio: reason,
      }, { transaction });
      await Quadra.update({
        ativa: false,
        desativada_inicio_em: null,
        desativada_fim_em: null,
        motivo_desativacao: 'Proprietário banido pela administração.',
      }, {
        where: { proprietario_id: account.id },
        transaction,
      });
    }

    await adminLogService.recordAdminAction(auth, {
      acao: 'BANIMENTO',
      entidade: role,
      entidadeId: account.id,
      detalhes: {
        conta_id: account.id,
        conta_nome: accountDisplayName(account, role),
        conta_email: account.email,
        perfil: role,
        motivo: reason,
        data_acao: new Date(),
      },
      transaction,
    });

    await RecuperacaoSenha.destroy({
      where: {
        perfil: role,
        conta_id: account.id,
      },
      transaction,
    });

    await CadastroPendente.destroy({
      where: {
        perfil: role,
        email_verificacao: account.email,
      },
      transaction,
    });

    await Reserva.update({
      cancelado_por_id: null,
      cancelado_por_perfil: null,
      cancelado_por_nome: null,
    }, {
      where: { cancelado_por_id: account.id },
      transaction,
    });
  });

  broadcastAccountAccess(account, role, 'permanent');
  return sanitizeManagedAccount(account, role);
}

async function unbanAccount(auth, role, id) {
  const account = await findAccountOrThrow(role, id);

  await sequelize.transaction(async (transaction) => {
    if (role === 'usuario') {
      await account.update({
        status: 'ativo',
        motivo_bloqueio: null,
        bloqueada_inicio_em: null,
        bloqueada_fim_em: null,
      }, { transaction });
    } else {
      await account.update({
        ativo: true,
        motivo_bloqueio: null,
        bloqueada_inicio_em: null,
        bloqueada_fim_em: null,
      }, { transaction });
    }

    await adminLogService.recordAdminAction(auth, {
      acao: 'DESBANIR_CONTA',
      entidade: role,
      entidadeId: account.id,
      detalhes: {
        conta_id: account.id,
        conta_nome: accountDisplayName(account, role),
        conta_email: account.email,
        perfil: role,
        data_acao: new Date(),
      },
      transaction,
    });
  });

  return sanitizeManagedAccount(account, role);
}

async function storeBannedCredentials(auth, role, account, reason, transaction) {
  const email = String(account.email || '').trim().toLowerCase();
  const cpf = accountCpf(account, role);

  if (!email && !cpf) {
    return;
  }

  const conditions = [
    ...(email ? [{ email }] : []),
    ...(cpf ? [{ cpf }] : []),
  ];
  const existing = conditions.length
    ? await CredencialBanida.findOne({
      where: { [Op.or]: conditions },
      transaction,
    })
    : null;
  const payload = {
    perfil: role,
    email: email || `deleted-${account.id}@blocked.local`,
    cpf: cpf || null,
    motivo: reason,
    administrador_id: auth.id,
  };

  if (existing) {
    await existing.update(payload, { transaction });
    return;
  }

  await CredencialBanida.create(payload, { transaction });
}

async function deleteUserAccountData(account, transaction) {
  const reservations = await Reserva.findAll({
    where: { usuario_id: account.id },
    attributes: ['id'],
    transaction,
  });
  const reservationIds = reservations.map((reserva) => reserva.id);
  const notificationConditions = [{ userId: account.id }];

  if (reservationIds.length) {
    const warnings = await AdvertenciaProprietario.findAll({
      where: { reserva_id: { [Op.in]: reservationIds } },
      attributes: ['id'],
      transaction,
    });
    const warningIds = warnings.map((warning) => warning.id);

    if (warningIds.length) {
      await AvisoAdvertenciaItem.destroy({
        where: { advertencia_id: { [Op.in]: warningIds } },
        transaction,
      });
      await AdvertenciaProprietario.destroy({
        where: { id: { [Op.in]: warningIds } },
        transaction,
      });
    }

    notificationConditions.push({ reservationId: { [Op.in]: reservationIds } });
  }

  await Notificacao.destroy({
    where: { [Op.or]: notificationConditions },
    transaction,
  });
  await Reserva.destroy({
    where: { usuario_id: account.id },
    transaction,
  });
  await Usuario.destroy({
    where: { id: account.id },
    transaction,
  });
}

async function deleteOwnerAccountData(account, transaction) {
  const quadras = await Quadra.findAll({
    where: { proprietario_id: account.id },
    attributes: ['id'],
    transaction,
  });
  const quadraIds = quadras.map((quadra) => quadra.id);
  const warnings = await AdvertenciaProprietario.findAll({
    where: { proprietario_id: account.id },
    attributes: ['id'],
    transaction,
  });
  const warningIds = warnings.map((warning) => warning.id);
  const avisos = await AvisoAdministrativo.findAll({
    where: { proprietario_id: account.id },
    attributes: ['id'],
    transaction,
  });
  const avisoIds = avisos.map((aviso) => aviso.id);

  if (warningIds.length || avisoIds.length) {
    await AvisoAdvertenciaItem.destroy({
      where: {
        [Op.or]: [
          ...(warningIds.length ? [{ advertencia_id: { [Op.in]: warningIds } }] : []),
          ...(avisoIds.length ? [{ aviso_administrativo_id: { [Op.in]: avisoIds } }] : []),
        ],
      },
      transaction,
    });
  }

  await AvisoAdministrativo.destroy({
    where: { proprietario_id: account.id },
    transaction,
  });
  await AdvertenciaProprietario.destroy({
    where: { proprietario_id: account.id },
    transaction,
  });

  if (quadraIds.length) {
    await Notificacao.destroy({
      where: { quadraId: { [Op.in]: quadraIds } },
      transaction,
    });
    await Reserva.destroy({
      where: { quadra_id: { [Op.in]: quadraIds } },
      transaction,
    });
    await HorarioDisponivel.destroy({
      where: { quadra_id: { [Op.in]: quadraIds } },
      transaction,
    });
    await Quadra.destroy({
      where: { id: { [Op.in]: quadraIds } },
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
}

async function deleteAccountPermanently(auth, role, id, { motivo } = {}) {
  const account = await findAccountOrThrow(role, id);
  const reason = String(motivo || '').trim();
  const uploadContext = {
    account: account.toJSON ? account.toJSON() : { ...account },
    perfil: role,
    quadras: [],
    documentacoes: [],
  };

  if (!reason) {
    throw new HttpError(400, 'Informe o motivo da exclusão permanente.');
  }

  if (role === 'proprietario') {
    const [quadras, documentacoes] = await Promise.all([
      Quadra.findAll({
        where: { proprietario_id: account.id },
        attributes: ['id', 'imagem_url', 'fotos'],
      }),
      DocumentacaoLocal.findAll({
        where: { proprietario_id: account.id },
        attributes: ['id', 'documentos'],
      }),
    ]);
    uploadContext.quadras = quadras.map((quadra) => (quadra.toJSON ? quadra.toJSON() : quadra));
    uploadContext.documentacoes = documentacoes.map((documentacao) => (
      documentacao.toJSON ? documentacao.toJSON() : documentacao
    ));
  }

  await sequelize.transaction(async (transaction) => {
    await storeBannedCredentials(auth, role, account, reason, transaction);

    await adminLogService.recordAdminAction(auth, {
      acao: 'EXCLUIR_CONTA_E_BLOQUEAR_CREDENCIAIS',
      entidade: role,
      entidadeId: account.id,
      detalhes: {
        conta_id: account.id,
        conta_nome: accountDisplayName(account, role),
        conta_email: account.email,
        conta_cpf: accountCpf(account, role),
        perfil: role,
        motivo: reason,
        data_acao: new Date(),
      },
      transaction,
    });

    await RecuperacaoSenha.destroy({
      where: {
        perfil: role,
        conta_id: account.id,
      },
      transaction,
    });
    await CadastroPendente.destroy({
      where: {
        perfil: role,
        email_verificacao: account.email,
      },
      transaction,
    });
    await Reserva.update({
      cancelado_por_id: null,
      cancelado_por_perfil: null,
      cancelado_por_nome: null,
    }, {
      where: { cancelado_por_id: account.id },
      transaction,
    });

    if (role === 'usuario') {
      await deleteUserAccountData(account, transaction);
    } else {
      await deleteOwnerAccountData(account, transaction);
    }
  });

  await authService.cleanupAccountUploads(uploadContext);
  broadcastAccountAccess(account, role, 'permanent');
  return true;
}

async function blockUserTemporarily(auth, id, payload) {
  return blockAccountTemporarily(auth, 'usuario', id, payload);
}

async function clearUserTemporaryBlock(auth, id) {
  return clearAccountTemporaryBlock(auth, 'usuario', id);
}

async function banUser(auth, id, payload) {
  return banAccount(auth, 'usuario', id, payload);
}

async function unbanUser(auth, id) {
  return unbanAccount(auth, 'usuario', id);
}

async function deleteUserAccount(auth, id, payload) {
  return deleteAccountPermanently(auth, 'usuario', id, payload);
}

async function blockOwnerTemporarily(auth, id, payload) {
  return blockAccountTemporarily(auth, 'proprietario', id, payload);
}

async function clearOwnerTemporaryBlock(auth, id) {
  return clearAccountTemporaryBlock(auth, 'proprietario', id);
}

async function banOwner(auth, id, payload) {
  return banAccount(auth, 'proprietario', id, payload);
}

async function unbanOwner(auth, id) {
  return unbanAccount(auth, 'proprietario', id);
}

async function deleteOwnerAccount(auth, id, payload) {
  return deleteAccountPermanently(auth, 'proprietario', id, payload);
}

async function updateOwnerApproval(id, statusAprovacao) {
  const proprietario = await Proprietario.findByPk(id);
  const statusPermitidos = ['pendente', 'aprovado', 'reprovado'];

  if (!proprietario) {
    throw new HttpError(404, 'Proprietário não encontrado.');
  }

  if (!statusPermitidos.includes(statusAprovacao)) {
    throw new HttpError(400, 'Status de aprovação inválido.');
  }

  proprietario.status_aprovacao = statusAprovacao;
  await proprietario.save();
  return sanitizeManagedAccount(proprietario, 'proprietario');
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

async function listAdminAlerts() {
  return advertenciaProprietarioService.listAvisosAdministrativos();
}

async function getAdminAlert(id) {
  return advertenciaProprietarioService.getAvisoAdministrativo(id);
}

async function updateAdminAlertStatus(id, status) {
  return advertenciaProprietarioService.updateAvisoStatus(id, status);
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
  deactivateSpace,
  deleteOwnerAccount,
  deleteUserAccount,
  deleteSpace,
  getDashboard,
  getAdminAlert,
  listAdminAlerts,
  listDocumentations,
  listAdmins,
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
