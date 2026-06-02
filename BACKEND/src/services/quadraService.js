const { Op } = require('sequelize');

const {
  HorarioDisponivel,
  Proprietario,
  Quadra,
  Reserva,
  sequelize,
} = require('../models');
const { HttpError } = require('../utils/http');

const WEEKDAY_BY_NAME = {
  domingo: 0,
  dom: 0,
  segunda: 1,
  seg: 1,
  terca: 2,
  terça: 2,
  ter: 2,
  quarta: 3,
  qua: 3,
  quinta: 4,
  qui: 4,
  sexta: 5,
  sex: 5,
  sabado: 6,
  sábado: 6,
  sab: 6,
};

function normalizeStringList(value) {
  const source = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : [];

  return source
    .map((item) => String(item || '').trim())
    .filter(Boolean);
}

function normalizeWeekday(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const numericValue = Number(value);
  if (Number.isInteger(numericValue) && numericValue >= 0 && numericValue <= 6) {
    return numericValue;
  }

  const textValue = String(value)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  return Object.prototype.hasOwnProperty.call(WEEKDAY_BY_NAME, textValue)
    ? WEEKDAY_BY_NAME[textValue]
    : null;
}

function normalizeTime(value) {
  const match = String(value || '').match(/^(\d{1,2}):(\d{2})/);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function timeToMinutes(value) {
  const [hours, minutes] = String(value).split(':').map(Number);
  return (hours * 60) + minutes;
}

function minutesToTime(value) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function normalizeOperatingHours(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const rawDays = Array.isArray(item.dias)
        ? item.dias
        : Array.isArray(item.dias_semana)
          ? item.dias_semana
          : [item.dia_semana ?? item.dia];
      const dias = [...new Set(rawDays.map(normalizeWeekday))]
        .filter((day) => day !== null)
        .sort((a, b) => a - b);
      const horaInicio = normalizeTime(item.hora_inicio || item.inicio);
      const horaFim = normalizeTime(item.hora_fim || item.fim);

      if (!dias.length || !horaInicio || !horaFim || timeToMinutes(horaFim) <= timeToMinutes(horaInicio)) {
        return null;
      }

      return {
        dias,
        hora_inicio: horaInicio,
        hora_fim: horaFim,
      };
    })
    .filter(Boolean);
}

function buildPhotoList(imagemUrl, fotos) {
  const secondaryPhotos = normalizeStringList(fotos);
  const primaryPhoto = String(imagemUrl || secondaryPhotos[0] || '').trim();

  if (!primaryPhoto) {
    return secondaryPhotos;
  }

  return [
    primaryPhoto,
    ...secondaryPhotos.filter((photo) => photo !== primaryPhoto),
  ];
}

function buildScheduleRows(quadraId, horariosFuncionamento, valor) {
  return horariosFuncionamento.flatMap((range) => {
    const start = timeToMinutes(range.hora_inicio);
    const end = timeToMinutes(range.hora_fim);
    const slots = [];

    range.dias.forEach((diaSemana) => {
      for (let current = start; current < end; current += 60) {
        const slotEnd = Math.min(current + 60, end);

        if (slotEnd > current) {
          slots.push({
            quadra_id: quadraId,
            data: null,
            dia_semana: diaSemana,
            hora_inicio: minutesToTime(current),
            hora_fim: minutesToTime(slotEnd),
            valor,
          });
        }
      }
    });

    return slots;
  });
}

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
    throw new HttpError(404, 'Quadra não encontrada.');
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
    throw new HttpError(404, 'Quadra não encontrada.');
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
  fotos,
  imagens,
  amenities,
  comodidades,
  horarios_funcionamento,
  funcionamento,
}) {
  const ownerId = auth.perfil === 'proprietario' ? auth.id : proprietario_id;

  if (!ownerId || !nome || !endereco) {
    throw new HttpError(400, 'Informe proprietário, nome e endereço da quadra.');
  }

  const normalizedAmenities = normalizeStringList(amenities || comodidades);
  const normalizedOperatingHours = normalizeOperatingHours(horarios_funcionamento || funcionamento);
  const normalizedPhotos = buildPhotoList(imagem_url, fotos || imagens);
  const hourlyPrice = preco_hora || 0;
  let courtId;

  await sequelize.transaction(async (transaction) => {
    const quadra = await Quadra.create({
      proprietario_id: ownerId,
      nome,
      descricao: descricao || null,
      modalidade: modalidade || 'poliesportiva',
      endereco,
      bairro: bairro || null,
      cidade: cidade || 'Campo Mourão',
      estado: estado || 'PR',
      cep: cep || null,
      preco_hora: hourlyPrice,
      imagem_url: normalizedPhotos[0] || imagem_url || null,
      fotos: normalizedPhotos,
      horarios_funcionamento: normalizedOperatingHours,
      amenities: normalizedAmenities,
    }, { transaction });

    const scheduleRows = buildScheduleRows(quadra.id, normalizedOperatingHours, hourlyPrice);

    if (scheduleRows.length) {
      await HorarioDisponivel.bulkCreate(scheduleRows, { transaction });
    }

    courtId = quadra.id;
  });

  return getCourt(courtId);
}

async function updateCourt(auth, id, body) {
  const quadra = await findCourtOrThrow(id);

  if (!canManageCourt(auth, quadra)) {
    throw new HttpError(403, 'Você não pode editar esta quadra.');
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
    'fotos',
    'horarios_funcionamento',
    'amenities',
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
    throw new HttpError(403, 'Você não pode remover esta quadra.');
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
    throw new HttpError(403, 'Você não pode gerenciar horários desta quadra.');
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
    throw new HttpError(403, 'Você não pode gerenciar horários desta quadra.');
  }

  const horario = await HorarioDisponivel.findOne({
    where: {
      id: horarioId,
      quadra_id: quadra.id,
    },
  });

  if (!horario) {
    throw new HttpError(404, 'Horário não encontrado.');
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
