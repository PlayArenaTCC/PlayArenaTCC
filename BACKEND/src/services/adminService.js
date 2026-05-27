const { Administrador, Proprietario, Quadra, Reserva, Usuario } = require('../models');
const { sanitizeAccount } = require('../middleware/auth');
const { HttpError } = require('../utils/http');

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
  return Usuario.findAll({
    attributes: { exclude: ['senha_hash'] },
    order: [['created_at', 'DESC']],
  });
}

async function updateUserStatus(id, status) {
  const usuario = await Usuario.findByPk(id);

  if (!usuario) {
    throw new HttpError(404, 'Usuario nao encontrado.');
  }

  usuario.status = status === 'inativo' ? 'inativo' : 'ativo';
  await usuario.save();
  return sanitizeAccount(usuario, 'usuario');
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
    throw new HttpError(404, 'Proprietario nao encontrado.');
  }

  if (!statusPermitidos.includes(statusAprovacao)) {
    throw new HttpError(400, 'Status de aprovacao invalido.');
  }

  proprietario.status_aprovacao = statusAprovacao;
  await proprietario.save();
  return sanitizeAccount(proprietario, 'proprietario');
}

async function listAdmins() {
  return Administrador.findAll({
    attributes: { exclude: ['senha_hash'] },
    order: [['created_at', 'DESC']],
  });
}

module.exports = {
  getDashboard,
  listAdmins,
  listOwners,
  listUsers,
  updateOwnerApproval,
  updateUserStatus,
};
