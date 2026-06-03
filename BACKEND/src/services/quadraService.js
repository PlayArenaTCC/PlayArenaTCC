const { Op } = require('sequelize');

const { HorarioDisponivel, Proprietario, Quadra, Reserva } = require('../models');
const { HttpError } = require('../utils/http');

<<<<<<< Updated upstream
=======
const ACTIVE_RESERVATION_STATUSES = ['pendente', 'confirmada'];

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
    .filter(Boolean)
    .filter((item, index, list) => (
      list.findIndex((current) => current.toLowerCase() === item.toLowerCase()) === index
    ));
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

function normalizeDate(value) {
  if (!value) {
    return null;
  }

  const text = String(value).trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return null;
  }

  const date = new Date(`${text}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : text;
}

function weekdayFromDate(value) {
  const date = normalizeDate(value);
  return date ? new Date(`${date}T12:00:00`).getDay() : null;
}

function normalizeTimeList(value) {
  const source = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : [];

  return [...new Set(source.map(normalizeTime))]
    .filter(Boolean)
    .sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
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

function buildScheduleRows(quadraId, horariosFuncionamento, valor, horariosDisponiveis = []) {
  const selectedStartMinutes = normalizeTimeList(horariosDisponiveis).map(timeToMinutes);

  return horariosFuncionamento.flatMap((range) => {
    const start = timeToMinutes(range.hora_inicio);
    const end = timeToMinutes(range.hora_fim);
    const slots = [];

    range.dias.forEach((diaSemana) => {
      const startMinutes = selectedStartMinutes.length
        ? selectedStartMinutes.filter((minutes) => minutes >= start && minutes < end)
        : Array.from({ length: Math.ceil((end - start) / 60) }, (_, index) => start + (index * 60));

      startMinutes.forEach((current) => {
        const slotEnd = Math.min(current + 60, end);

        if (slotEnd > current) {
          slots.push({
            quadra_id: quadraId,
            data: null,
            dia_semana: diaSemana,
            hora_inicio: minutesToTime(current),
            hora_fim: minutesToTime(slotEnd),
            valor,
            valor_especial: false,
          });
        }
      });
    });

    return slots;
  });
}

function getEffectiveScheduleValue(schedule, basePrice) {
  const base = Number(basePrice || 0);

  if (schedule?.valor_especial) {
    return Number(schedule.valor || base || 0);
  }

  return base;
}

function withEffectiveSchedulePrices(quadra, { includeInactiveSchedules = false } = {}) {
  if (!quadra) {
    return quadra;
  }

  const data = typeof quadra.toJSON === 'function' ? quadra.toJSON() : quadra;
  const basePrice = Number(data.preco_hora || 0);

  return {
    ...data,
    horarios_disponiveis: (data.horarios_disponiveis || [])
      .filter((horario) => includeInactiveSchedules || horario.disponivel !== false)
      .map((horario) => ({
        ...horario,
        valor: getEffectiveScheduleValue(horario, basePrice),
      })),
  };
}

>>>>>>> Stashed changes
function courtIncludes() {
  return [
    {
      model: Proprietario,
      as: 'proprietario',
      attributes: ['id', 'nome_responsavel', 'nome_empresa', 'status_aprovacao'],
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

  const quadras = await Quadra.findAll({
    where,
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
    order: [['created_at', 'DESC']],
  });

  return quadras.map(withEffectiveSchedulePrices);
}

async function listOwnerCourts(ownerId) {
  const quadras = await Quadra.findAll({
    where: { proprietario_id: ownerId, ativa: true },
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

  return quadras.map((quadra) => withEffectiveSchedulePrices(quadra, { includeInactiveSchedules: true }));
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

  return withEffectiveSchedulePrices(quadra);
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
<<<<<<< Updated upstream
=======
  fotos,
  imagens,
  amenities,
  comodidades,
  horarios_funcionamento,
  funcionamento,
  horarios_disponiveis,
>>>>>>> Stashed changes
}) {
  const ownerId = auth.perfil === 'proprietario' ? auth.id : proprietario_id;

  if (!ownerId || !nome || !endereco) {
    throw new HttpError(400, 'Informe proprietario, nome e endereco da quadra.');
  }

<<<<<<< Updated upstream
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
=======
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
      preco_original: null,
      imagem_url: normalizedPhotos[0] || imagem_url || null,
      fotos: normalizedPhotos,
      horarios_funcionamento: normalizedOperatingHours,
      amenities: normalizedAmenities,
    }, { transaction });

    const scheduleRows = buildScheduleRows(quadra.id, normalizedOperatingHours, hourlyPrice, horarios_disponiveis);

    if (scheduleRows.length) {
      await HorarioDisponivel.bulkCreate(scheduleRows, { transaction });
    }

    courtId = quadra.id;
>>>>>>> Stashed changes
  });
}

async function updateCourt(auth, id, body) {
  const quadra = await findCourtOrThrow(id);

  if (!canManageCourt(auth, quadra)) {
    throw new HttpError(403, 'Voce nao pode editar esta quadra.');
  }

  const fields = auth.perfil === 'proprietario'
    ? [
      'preco_hora',
      'imagem_url',
      'fotos',
      'amenities',
    ]
    : [
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

  let previousPrice = Number(quadra.preco_hora || 0);
  let nextPrice = previousPrice;
  let shouldSyncSchedulePrices = false;

  if (Object.prototype.hasOwnProperty.call(body, 'preco_hora')) {
    const currentReference = Number(quadra.preco_original || previousPrice);
    nextPrice = Number(body.preco_hora || 0);
    shouldSyncSchedulePrices = nextPrice !== previousPrice;
    body.preco_hora = nextPrice;

    if (nextPrice > 0 && nextPrice < currentReference) {
      quadra.preco_original = currentReference;
    } else if (nextPrice >= currentReference) {
      quadra.preco_original = null;
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, 'amenities')) {
    body.amenities = normalizeStringList(body.amenities);
  }

  fields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      quadra[field] = body[field];
    }
  });

  await sequelize.transaction(async (transaction) => {
    await quadra.save({ transaction });

    if (shouldSyncSchedulePrices) {
      await HorarioDisponivel.update({
        valor: nextPrice,
      }, {
        where: {
          quadra_id: quadra.id,
          [Op.or]: [
            { valor_especial: false },
            { valor_especial: null },
          ],
        },
        transaction,
      });
    }
  });

  return getCourt(quadra.id);
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
  const targetDate = normalizeDate(data);

  if (data && !targetDate) {
    throw new HttpError(400, 'Informe uma data valida para consultar horarios.');
  }

  const where = {
    quadra_id: quadra.id,
    disponivel: true,
  };

  if (targetDate) {
    const weekday = weekdayFromDate(targetDate);
    where[Op.or] = [
      { data: targetDate },
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

  const reservas = targetDate
    ? await Reserva.findAll({
      where: {
        quadra_id: quadra.id,
        data_reserva: targetDate,
        status: { [Op.in]: ACTIVE_RESERVATION_STATUSES },
      },
    })
    : [];

  const ocupados = new Set(reservas.map((reserva) => `${reserva.hora_inicio}-${reserva.hora_fim}`));
  const availableSchedules = horarios.map((horario) => {
    const dataHorario = horario.toJSON();
    dataHorario.ocupado = ocupados.has(`${horario.hora_inicio}-${horario.hora_fim}`);
    dataHorario.valor = getEffectiveScheduleValue(dataHorario, quadra.preco_hora);
    return dataHorario;
  }).filter((horario) => !horario.ocupado);

  const schedulesBySlot = new Map();
  availableSchedules.forEach((horario) => {
    const key = `${horario.hora_inicio}-${horario.hora_fim}`;
    const current = schedulesBySlot.get(key);

    if (!current || (horario.data && !current.data)) {
      schedulesBySlot.set(key, horario);
    }
  });

  return [...schedulesBySlot.values()];
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

  const targetDate = normalizeDate(data);

  if (data && !targetDate) {
    throw new HttpError(400, 'Informe uma data valida para o horario.');
  }

  const targetWeekday = targetDate ? null : normalizeWeekday(dia_semana);
  const startTime = normalizeTime(hora_inicio);
  const endTime = normalizeTime(hora_fim);

  if (!startTime || !endTime || timeToMinutes(endTime) <= timeToMinutes(startTime) || (!targetDate && targetWeekday === null)) {
    throw new HttpError(400, 'Informe data ou dia da semana, hora inicial e hora final.');
  }

  const basePrice = Number(quadra.preco_hora || 0);
  const scheduleValue = valor === undefined || valor === null || valor === ''
    ? basePrice
    : Number(valor);

  if (!Number.isFinite(scheduleValue) || scheduleValue < 0) {
    throw new HttpError(400, 'Informe um valor valido para o horario.');
  }

  const scheduleWhere = {
    quadra_id: quadra.id,
    data: targetDate,
    dia_semana: targetWeekday,
    hora_inicio: startTime,
    hora_fim: endTime,
  };
  const scheduleData = {
    ...scheduleWhere,
    valor: scheduleValue,
    valor_especial: scheduleValue !== basePrice,
    disponivel: true,
  };
  try {
    const matchingSchedules = await HorarioDisponivel.findAll({
      where: scheduleWhere,
      order: [['valor_especial', 'DESC'], ['updated_at', 'DESC']],
    });
    const [existingSchedule, ...duplicatedSchedules] = matchingSchedules;

    if (existingSchedule) {
      await existingSchedule.update(scheduleData);
      if (duplicatedSchedules.length) {
        await HorarioDisponivel.update({
          disponivel: false,
        }, {
          where: {
            id: duplicatedSchedules.map((horario) => horario.id),
          },
        });
      }
      return existingSchedule;
    }

    return await HorarioDisponivel.create(scheduleData);
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

  await sequelize.transaction(async (transaction) => {
    await Reserva.update({
      horario_disponivel_id: null,
    }, {
      where: {
        horario_disponivel_id: horario.id,
      },
      transaction,
    });

    await horario.destroy({ transaction });
  });
}

async function updateScheduleAvailability(auth, courtId, horarioId, disponivel) {
  const quadra = await findCourtOrThrow(courtId);

  if (!canManageCourt(auth, quadra)) {
    throw new HttpError(403, 'VocÃª nÃ£o pode gerenciar horÃ¡rios desta quadra.');
  }

  const horario = await HorarioDisponivel.findOne({
    where: {
      id: horarioId,
      quadra_id: quadra.id,
    },
  });

  if (!horario) {
    throw new HttpError(404, 'HorÃ¡rio nÃ£o encontrado.');
  }

  horario.disponivel = Boolean(disponivel);
  await horario.save();
  return horario;
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
  updateScheduleAvailability,
};
