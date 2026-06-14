const { Op } = require('sequelize');

const { HorarioDisponivel, Proprietario, Quadra, Reserva } = require('../models');
const { HttpError } = require('../utils/http');

function courtIncludes() {
  return [
    {
      model: Proprietario,
      as: 'proprietario',
      attributes: ['id', 'nome_responsavel', 'nome_empresa', 'telefone', 'email', 'status_aprovacao'],
    },
  ];
}

function isCourtOwner(auth, quadra) {
  return auth.perfil === 'proprietario' && quadra.proprietario_id === auth.id;
}

function canManageCourt(auth, quadra) {
  return auth.perfil === 'admin' || isCourtOwner(auth, quadra);
}

async function findCourtOrThrow(id) {
  const quadra = await Quadra.findByPk(id);

  if (!quadra) {
    throw new HttpError(404, 'Quadra nao encontrada.');
  }

  return quadra;
}

async function listCourts({
  busca,
  cidade,
  modalidade,
  incluir_inativas,
}) {
  const where = {};

  if (incluir_inativas !== 'true') {
    where.ativa = true;
  }

  if (cidade) {
    where.cidade = { [Op.iLike]: `%${cidade}%` };
  }

  if (modalidade) {
    where.modalidade = { [Op.iLike]: `%${modalidade}%` };
  }

  if (busca) {
    where[Op.or] = [
      { nome: { [Op.iLike]: `%${busca}%` } },
      { endereco: { [Op.iLike]: `%${busca}%` } },
      { bairro: { [Op.iLike]: `%${busca}%` } },
      { modalidade: { [Op.iLike]: `%${busca}%` } },
    ];
  }

  return Quadra.findAll({
    where,
    include: courtIncludes(),
    order: [['created_at', 'DESC']],
  });
}

async function listOwnerCourts(ownerId) {
  return Quadra.findAll({
    where: { proprietario_id: ownerId },
    include: [
      ...courtIncludes(),
      {
        model: HorarioDisponivel,
        as: 'horarios_disponiveis',
        separate: true,
        order: [['hora_inicio', 'ASC']],
      },
    ],
    order: [['created_at', 'DESC']],
  });
}

async function getCourt(id) {
  const quadra = await Quadra.findByPk(id, {
    include: [
      ...courtIncludes(),
      {
        model: HorarioDisponivel,
        as: 'horarios_disponiveis',
        where: { disponivel: true },
        required: false,
        separate: true,
        order: [['dia_semana', 'ASC'], ['hora_inicio', 'ASC']],
      },
    ],
  });

  if (!quadra) {
    throw new HttpError(404, 'Quadra nao encontrada.');
  }

  return quadra;
}

async function createCourt(auth, {
  proprietario_id,
  nome,
  descricao,
  modalidade,
  endereco,
  bairro,
  cidade,
  estado,
  cep,
  preco_hora,
  imagem_url,
}) {
  const ownerId = auth.perfil === 'proprietario' ? auth.id : proprietario_id;

  if (!ownerId || !nome || !endereco) {
    throw new HttpError(400, 'Informe proprietario, nome e endereco da quadra.');
  }

  return Quadra.create({
    proprietario_id: ownerId,
    nome,
    descricao: descricao || null,
    modalidade: modalidade || 'poliesportiva',
    endereco,
    bairro: bairro || null,
    cidade: cidade || 'Campo Mourao',
    estado: estado || 'PR',
    cep: cep || null,
    preco_hora: preco_hora || 0,
    imagem_url: imagem_url || null,
  });
}

async function updateCourt(auth, id, body) {
  const quadra = await findCourtOrThrow(id);

  if (!canManageCourt(auth, quadra)) {
    throw new HttpError(403, 'Voce nao pode editar esta quadra.');
  }

  const fields = [
    'nome',
    'descricao',
    'modalidade',
    'endereco',
    'bairro',
    'cidade',
    'estado',
    'cep',
    'preco_hora',
    'imagem_url',
    'ativa',
  ];

  fields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      quadra[field] = body[field];
    }
  });

  await quadra.save();
  return quadra;
}

async function deactivateCourt(auth, id) {
  const quadra = await findCourtOrThrow(id);

  if (!canManageCourt(auth, quadra)) {
    throw new HttpError(403, 'Voce nao pode remover esta quadra.');
  }

  quadra.ativa = false;
  await quadra.save();
}

async function listSchedules(courtId, data) {
  const quadra = await findCourtOrThrow(courtId);
  const where = {
    quadra_id: quadra.id,
    disponivel: true,
  };

  if (data) {
    const weekday = new Date(`${data}T12:00:00`).getDay();
    where[Op.or] = [
      { data },
      {
        data: null,
        dia_semana: weekday,
      },
    ];
  }

  const horarios = await HorarioDisponivel.findAll({
    where,
    order: [['hora_inicio', 'ASC']],
  });

  const reservas = data
    ? await Reserva.findAll({
      where: {
        quadra_id: quadra.id,
        data_reserva: data,
        status: { [Op.notIn]: ['cancelada'] },
      },
    })
    : [];

  const ocupados = new Set(reservas.map((reserva) => `${reserva.hora_inicio}-${reserva.hora_fim}`));

  return horarios.map((horario) => {
    const dataHorario = horario.toJSON();
    dataHorario.ocupado = ocupados.has(`${horario.hora_inicio}-${horario.hora_fim}`);
    dataHorario.valor = dataHorario.valor || quadra.preco_hora;
    return dataHorario;
  });
}

async function createSchedule(auth, courtId, {
  data,
  dia_semana,
  hora_inicio,
  hora_fim,
  valor,
}) {
  const quadra = await findCourtOrThrow(courtId);

  if (!canManageCourt(auth, quadra)) {
    throw new HttpError(403, 'Voce nao pode gerenciar horarios desta quadra.');
  }

  if (!hora_inicio || !hora_fim || (!data && dia_semana === undefined)) {
    throw new HttpError(400, 'Informe data ou dia da semana, hora inicial e hora final.');
  }

  try {
    return await HorarioDisponivel.create({
      quadra_id: quadra.id,
      data: data || null,
      dia_semana: data ? null : Number(dia_semana),
      hora_inicio,
      hora_fim,
      valor: valor || null,
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new HttpError(409, 'Este horario ja esta cadastrado para a quadra.');
    }

    throw error;
  }
}

async function deleteSchedule(auth, courtId, horarioId) {
  const quadra = await findCourtOrThrow(courtId);

  if (!canManageCourt(auth, quadra)) {
    throw new HttpError(403, 'Voce nao pode gerenciar horarios desta quadra.');
  }

  const horario = await HorarioDisponivel.findOne({
    where: {
      id: horarioId,
      quadra_id: quadra.id,
    },
  });

  if (!horario) {
    throw new HttpError(404, 'Horario nao encontrado.');
  }

  horario.disponivel = false;
  await horario.save();
}

module.exports = {
  createCourt,
  createSchedule,
  deactivateCourt,
  deleteSchedule,
  getCourt,
  listCourts,
  listOwnerCourts,
  listSchedules,
  updateCourt,
};
