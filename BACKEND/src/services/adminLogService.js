const { LogAdministrativo } = require('../models');

async function recordAdminAction(auth, {
  acao,
  entidade = 'quadra',
  entidadeId = null,
  detalhes = {},
  transaction,
}) {
  if (auth?.perfil !== 'admin' || !auth.id || !acao) {
    return null;
  }

  const administradorNome = auth.account?.nome || auth.account?.email || 'Administrador';

  return LogAdministrativo.create({
    administrador_id: auth.id,
    acao,
    entidade,
    entidade_id: entidadeId,
    detalhes: {
      administrador_nome: administradorNome,
      ...detalhes,
    },
  }, { transaction });
}

module.exports = {
  recordAdminAction,
};
