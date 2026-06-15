const fs = require('fs/promises');
const path = require('path');
const { Op } = require('sequelize');

const {
  DocumentacaoLocal,
  HorarioDisponivel,
  Notificacao,
  Proprietario,
  Quadra,
  Reserva,
  sequelize,
} = require('../models');
const {
  ensureAdminCourtDocumentation,
  ensureCourtDocumentation,
  isApprovedDocumentation,
} = require('./documentacaoService');
const {
  buildAddressLine,
  resolveCourtLocation,
} = require('./localizacaoService');
const notificacaoService = require('./notificacaoService');
const adminLogService = require('./adminLogService');
const mediaService = require('./mediaService');
const { HttpError } = require('../utils/http');

const ACTIVE_RESERVATION_STATUSES = ['pendente', 'confirmada'];
const OWNER_NOT_APPROVED_MESSAGE = 'Proprietário reprovado ou em análise. Entre em contato com o suporte para mais informações.';
const UPLOADS_DIR = path.resolve(__dirname, '..', '..', 'uploads');
const SERVER_TIMEZONE_OFFSET_MS = 3 * 60 * 60 * 1000;

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

function normalizeCourtModalities(modalidades, modalidade) {
  const values = normalizeStringList(modalidades);
  const primary = String(modalidade || values[0] || 'poliesportiva').trim() || 'poliesportiva';

  return {
    modalidade: primary,
    modalidades: normalizeStringList([primary, ...values]),
  };
}

function buildLocalDateTime(date, time) {
  const normalizedDate = normalizeDate(date);
  const normalizedTime = normalizeTime(time);

  if (!normalizedDate || !normalizedTime) {
    return null;
  }

  const value = new Date(`${normalizedDate}T${normalizedTime}:00-03:00`);
  return Number.isNaN(value.getTime()) ? null : value;
}

function getServerLocalDateISO(now = new Date()) {
  return new Date(now.getTime() - SERVER_TIMEZONE_OFFSET_MS).toISOString().slice(0, 10);
}

function isFutureScheduleForDate(date, startTime, now = new Date()) {
  const today = getServerLocalDateISO(now);

  if (date < today) {
    return false;
  }

  if (date > today) {
    return true;
  }

  const slotStart = buildLocalDateTime(date, startTime);
  return Boolean(slotStart && slotStart > now);
}

function getTemporaryDeactivationState(quadra, now = new Date()) {
  const start = quadra?.desativada_inicio_em ? new Date(quadra.desativada_inicio_em) : null;
  const end = quadra?.desativada_fim_em ? new Date(quadra.desativada_fim_em) : null;
  const hasValidRange = start
    && end
    && !Number.isNaN(start.getTime())
    && !Number.isNaN(end.getTime())
    && end > start;

  if (!hasValidRange) {
    return {
      temporariamenteInativa: false,
      desativacaoAgendada: false,
    };
  }

  return {
    temporariamenteInativa: now >= start && now < end,
    desativacaoAgendada: now < start,
  };
}

function isCourtEffectivelyActive(quadra, now = new Date()) {
  return quadra?.ativa === true && !getTemporaryDeactivationState(quadra, now).temporariamenteInativa;
}

function isCourtUnavailableForSlot(quadra, date, startTime, endTime) {
  const deactivationStart = quadra?.desativada_inicio_em ? new Date(quadra.desativada_inicio_em) : null;
  const deactivationEnd = quadra?.desativada_fim_em ? new Date(quadra.desativada_fim_em) : null;
  const slotStart = buildLocalDateTime(date, startTime);
  const slotEnd = buildLocalDateTime(date, endTime);

  if (
    !deactivationStart
    || !deactivationEnd
    || Number.isNaN(deactivationStart.getTime())
    || Number.isNaN(deactivationEnd.getTime())
    || !slotStart
    || !slotEnd
  ) {
    return false;
  }

  return slotStart < deactivationEnd && slotEnd > deactivationStart;
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

async function deleteStoredUploads(values) {
  const paths = [...new Set((values || []).map(getLocalUploadPath).filter(Boolean))];
  await Promise.all([
    ...paths.map((filePath) => fs.unlink(filePath).catch(() => {})),
    mediaService.deleteMediaAssetsByUrls(values || []),
  ]);
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

function buildExplicitScheduleRows(quadraId, schedules, basePrice) {
  if (!Array.isArray(schedules)) {
    return [];
  }

  return schedules.map((schedule) => {
    const targetDate = normalizeDate(schedule.data);
    const targetWeekday = targetDate ? null : normalizeWeekday(schedule.dia_semana);
    const startTime = normalizeTime(schedule.hora_inicio);
    const endTime = normalizeTime(schedule.hora_fim);
    const scheduleValue = schedule.valor === undefined || schedule.valor === null || schedule.valor === ''
      ? Number(basePrice || 0)
      : Number(schedule.valor);

    if (
      (!targetDate && targetWeekday === null)
      || !startTime
      || !endTime
      || timeToMinutes(endTime) <= timeToMinutes(startTime)
      || !Number.isFinite(scheduleValue)
      || scheduleValue < 0
    ) {
      throw new HttpError(400, 'Informe horários disponíveis válidos para o espaço.');
    }

    return {
      quadra_id: quadraId,
      data: targetDate,
      dia_semana: targetWeekday,
      hora_inicio: startTime,
      hora_fim: endTime,
      valor: scheduleValue,
      valor_especial: scheduleValue !== Number(basePrice || 0),
      disponivel: schedule.disponivel !== false,
    };
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
  const deactivationState = getTemporaryDeactivationState(data);
  const baseActive = data.ativa === true;
  const effectiveActive = baseActive && !deactivationState.temporariamenteInativa;
  const modalities = normalizeCourtModalities(data.modalidades, data.modalidade);

  return {
    ...data,
    ...modalities,
    ativa_base: baseActive,
    ativa: effectiveActive,
    temporariamente_inativa: deactivationState.temporariamenteInativa,
    desativacao_agendada: deactivationState.desativacaoAgendada,
    status_espaco: effectiveActive ? 'ativo' : 'inativo',
    horarios_disponiveis: (data.horarios_disponiveis || [])
      .filter((horario) => includeInactiveSchedules || horario.disponivel !== false)
      .map((horario) => ({
        ...horario,
        valor: getEffectiveScheduleValue(horario, basePrice),
      })),
  };
}

function courtIncludes() {
  return [
    {
      model: Proprietario,
      as: 'proprietario',
      attributes: ['id', 'nome_responsavel', 'nome_empresa', 'status_aprovacao'],
    },
    {
      model: DocumentacaoLocal,
      as: 'documentacao_local',
      required: false,
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
      { numero: { [Op.iLike]: `%${busca}%` } },
      { cep: { [Op.iLike]: `%${busca}%` } },
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

  return quadras
    .map(withEffectiveSchedulePrices)
    .filter((quadra) => incluir_inativas === 'true' || isApprovedDocumentation(quadra.documentacao_local));
}

async function listOwnerCourts(ownerId) {
  const quadras = await Quadra.findAll({
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

  return quadras.map((quadra) => withEffectiveSchedulePrices(quadra, { includeInactiveSchedules: true }));
}

async function listAdminCourts() {
  const quadras = await Quadra.findAll({
    include: [
      ...courtIncludes(),
      {
        model: HorarioDisponivel,
        as: 'horarios_disponiveis',
        separate: true,
        order: [['data', 'ASC'], ['dia_semana', 'ASC'], ['hora_inicio', 'ASC']],
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
    throw new HttpError(404, 'Quadra não encontrada.');
  }

  if (quadra.ativa !== true || !isApprovedDocumentation(quadra.documentacao_local)) {
    throw new HttpError(404, 'Quadra indisponível ou aguardando aprovação documental.');
  }

  return withEffectiveSchedulePrices(quadra);
}

async function getCourtForManagement(id) {
  const quadra = await Quadra.findByPk(id, {
    include: [
      ...courtIncludes(),
      {
        model: HorarioDisponivel,
        as: 'horarios_disponiveis',
        separate: true,
        order: [['dia_semana', 'ASC'], ['hora_inicio', 'ASC']],
      },
    ],
  });

  if (!quadra) {
    throw new HttpError(404, 'Quadra não encontrada.');
  }

  return withEffectiveSchedulePrices(quadra, { includeInactiveSchedules: true });
}

async function createCourt(auth, {
  proprietario_id,
  nome,
  descricao,
  modalidade,
  modalidades,
  tipo_espaco,
  endereco,
  bairro,
  cidade,
  estado,
  cep,
  numero,
  latitude,
  longitude,
  localizacao_confirmada,
  preco_hora,
  imagem_url,
  fotos,
  imagens,
  amenities,
  comodidades,
  horarios_funcionamento,
  funcionamento,
  horarios_disponiveis,
  documentacao,
}) {
  const ownerId = auth.perfil === 'proprietario' ? auth.id : proprietario_id;

  if (auth.perfil === 'proprietario' && auth.account?.status_aprovacao !== 'aprovado') {
    throw new HttpError(403, OWNER_NOT_APPROVED_MESSAGE);
  }

  if (!ownerId || !nome || !cep || !numero) {
    throw new HttpError(400, 'Informe proprietário, nome, CEP e número da quadra.');
  }

  const location = await resolveCourtLocation({
    endereco,
    bairro,
    cidade,
    estado,
    cep,
    numero,
  });
  const confirmedLatitude = Number(latitude);
  const confirmedLongitude = Number(longitude);
  const hasConfirmedCoordinates = localizacao_confirmada === true
    && Number.isFinite(confirmedLatitude)
    && Number.isFinite(confirmedLongitude)
    && confirmedLatitude >= -90
    && confirmedLatitude <= 90
    && confirmedLongitude >= -180
    && confirmedLongitude <= 180;

  if (location.precisao !== 'exata' && !hasConfirmedCoordinates) {
    throw new HttpError(422, 'Confirme a posição exata do marcador no mapa antes de cadastrar a quadra.');
  }

  const normalizedAmenities = normalizeStringList(amenities || comodidades);
  const normalizedModalities = normalizeCourtModalities(modalidades, modalidade);
  const normalizedOperatingHours = normalizeOperatingHours(horarios_funcionamento || funcionamento);
  const normalizedPhotos = buildPhotoList(imagem_url, fotos || imagens);
  const hourlyPrice = preco_hora || 0;
  let courtId;

  await sequelize.transaction(async (transaction) => {
    const documentacaoLocal = await ensureCourtDocumentation(
      auth,
      ownerId,
      {
        ...location,
        endereco: buildAddressLine(location),
      },
      documentacao,
      transaction,
    );
    const hasApprovedDocuments = isApprovedDocumentation(documentacaoLocal);
    const quadra = await Quadra.create({
      proprietario_id: ownerId,
      documentacao_local_id: documentacaoLocal.id,
      nome,
      descricao: descricao || null,
      ...normalizedModalities,
      tipo_espaco: String(tipo_espaco || 'Quadra').trim() || 'Quadra',
      endereco: location.endereco,
      bairro: location.bairro || null,
      cidade: location.cidade,
      estado: location.estado,
      cep: location.cep,
      numero: location.numero,
      latitude: hasConfirmedCoordinates ? confirmedLatitude : location.latitude,
      longitude: hasConfirmedCoordinates ? confirmedLongitude : location.longitude,
      localizacao_confirmada: true,
      preco_hora: hourlyPrice,
      preco_original: null,
      imagem_url: normalizedPhotos[0] || imagem_url || null,
      fotos: normalizedPhotos,
      horarios_funcionamento: normalizedOperatingHours,
      amenities: normalizedAmenities,
      ativa: hasApprovedDocuments,
    }, { transaction });

    const scheduleRows = buildScheduleRows(quadra.id, normalizedOperatingHours, hourlyPrice, horarios_disponiveis);

    if (scheduleRows.length) {
      await HorarioDisponivel.bulkCreate(scheduleRows, { transaction });
    }

    courtId = quadra.id;
  });

  return getCourtForManagement(courtId);
}

async function createAdminCourt(auth, {
  proprietario_id,
  nome,
  descricao,
  modalidade,
  modalidades,
  tipo_espaco,
  endereco,
  bairro,
  cidade,
  estado,
  cep,
  numero,
  latitude,
  longitude,
  preco_hora,
  imagem_url,
  fotos,
  amenities,
  comodidades,
  horarios_funcionamento,
  funcionamento,
  horarios_disponiveis,
  horarios,
  ativa,
}) {
  if (auth?.perfil !== 'admin') {
    throw new HttpError(403, 'Apenas administradores podem cadastrar espaços por esta área.');
  }

  const owner = await Proprietario.findByPk(proprietario_id);
  const trimmedName = String(nome || '').trim();
  const trimmedAddress = String(endereco || '').trim();
  const trimmedCity = String(cidade || '').trim();
  const hourlyPrice = Number(preco_hora);

  if (!owner) {
    throw new HttpError(400, 'Selecione um proprietário válido para o espaço.');
  }

  if (!trimmedName || !trimmedAddress || !trimmedCity) {
    throw new HttpError(400, 'Informe nome, endereço e cidade do espaço.');
  }

  if (!Number.isFinite(hourlyPrice) || hourlyPrice < 0) {
    throw new HttpError(400, 'Informe um valor válido para o espaço.');
  }

  const normalizedModalities = normalizeCourtModalities(modalidades, modalidade);
  const normalizedAmenities = normalizeStringList(amenities || comodidades);
  const normalizedOperatingHours = normalizeOperatingHours(horarios_funcionamento || funcionamento);
  const normalizedPhotos = buildPhotoList(imagem_url, fotos);
  const numericLatitude = Number(latitude);
  const numericLongitude = Number(longitude);
  const hasCoordinates = Number.isFinite(numericLatitude)
    && numericLatitude >= -90
    && numericLatitude <= 90
    && Number.isFinite(numericLongitude)
    && numericLongitude >= -180
    && numericLongitude <= 180;
  let courtId;

  await sequelize.transaction(async (transaction) => {
    const documentacaoLocal = await ensureAdminCourtDocumentation(
      auth,
      owner.id,
      {
        endereco: buildAddressLine({ endereco: trimmedAddress, numero }) || trimmedAddress,
        bairro,
        cidade: trimmedCity,
        estado: estado || 'PR',
        cep,
      },
      transaction,
    );
    const quadra = await Quadra.create({
      proprietario_id: owner.id,
      documentacao_local_id: documentacaoLocal.id,
      nome: trimmedName,
      descricao: String(descricao || '').trim() || null,
      ...normalizedModalities,
      tipo_espaco: String(tipo_espaco || 'Quadra').trim() || 'Quadra',
      endereco: trimmedAddress,
      bairro: String(bairro || '').trim() || null,
      cidade: trimmedCity,
      estado: String(estado || 'PR').trim().toUpperCase().slice(0, 2) || 'PR',
      cep: String(cep || '').trim() || null,
      numero: String(numero || '').trim() || null,
      latitude: hasCoordinates ? numericLatitude : null,
      longitude: hasCoordinates ? numericLongitude : null,
      localizacao_confirmada: hasCoordinates,
      preco_hora: hourlyPrice,
      preco_original: null,
      imagem_url: normalizedPhotos[0] || null,
      fotos: normalizedPhotos,
      horarios_funcionamento: normalizedOperatingHours,
      amenities: normalizedAmenities,
      ativa: ativa !== false,
    }, { transaction });
    const explicitSchedules = Array.isArray(horarios) ? horarios : (
      Array.isArray(horarios_disponiveis) && horarios_disponiveis.some((item) => typeof item === 'object')
        ? horarios_disponiveis
        : []
    );
    const scheduleRows = explicitSchedules.length
      ? buildExplicitScheduleRows(quadra.id, explicitSchedules, hourlyPrice)
      : buildScheduleRows(quadra.id, normalizedOperatingHours, hourlyPrice, horarios_disponiveis);

    if (scheduleRows.length) {
      await HorarioDisponivel.bulkCreate(scheduleRows, { transaction });
    }

    await adminLogService.recordAdminAction(auth, {
      acao: 'CRIAR_ESPACO',
      entidadeId: quadra.id,
      detalhes: {
        nome: quadra.nome,
        proprietario_id: owner.id,
        ativa: quadra.ativa,
      },
      transaction,
    });

    courtId = quadra.id;
  });

  return getCourtForManagement(courtId);
}

async function updateCourt(auth, id, body) {
  const quadra = await findCourtOrThrow(id);

  if (!canManageCourt(auth, quadra)) {
    throw new HttpError(403, 'Você não pode editar esta quadra.');
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
      'modalidades',
      'tipo_espaco',
      'endereco',
      'bairro',
      'cidade',
      'estado',
      'cep',
      'numero',
      'latitude',
      'longitude',
      'localizacao_confirmada',
      'preco_hora',
      'imagem_url',
      'fotos',
      'horarios_funcionamento',
      'amenities',
      'ativa',
    ];

  const previousSnapshot = quadra.toJSON();
  const previousPhotos = buildPhotoList(previousSnapshot.imagem_url, previousSnapshot.fotos);
  const previousPrice = Number(quadra.preco_hora || 0);
  const wasPromotion = Number(quadra.preco_original || 0) > 0;
  let nextPrice = previousPrice;
  let shouldSyncSchedulePrices = false;
  let shouldNotifyPromotion = false;

  if (Object.prototype.hasOwnProperty.call(body, 'preco_hora')) {
    const currentReference = Number(quadra.preco_original || previousPrice);
    nextPrice = Number(body.preco_hora);

    if (!Number.isFinite(nextPrice) || nextPrice < 0) {
      throw new HttpError(400, 'Informe um valor válido para o espaço.');
    }

    shouldSyncSchedulePrices = nextPrice !== previousPrice;
    shouldNotifyPromotion = nextPrice > 0 && nextPrice < previousPrice;
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

  if (
    Object.prototype.hasOwnProperty.call(body, 'modalidades')
    || Object.prototype.hasOwnProperty.call(body, 'modalidade')
  ) {
    const normalizedModalities = normalizeCourtModalities(
      body.modalidades ?? quadra.modalidades,
      body.modalidade ?? quadra.modalidade,
    );
    body.modalidade = normalizedModalities.modalidade;
    body.modalidades = normalizedModalities.modalidades;
  }

  if (
    Object.prototype.hasOwnProperty.call(body, 'fotos')
    || Object.prototype.hasOwnProperty.call(body, 'imagem_url')
  ) {
    const normalizedPhotos = buildPhotoList(
      body.imagem_url,
      Object.prototype.hasOwnProperty.call(body, 'fotos') ? body.fotos : quadra.fotos,
    );
    body.fotos = normalizedPhotos;
    body.imagem_url = normalizedPhotos[0] || null;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'horarios_funcionamento')) {
    body.horarios_funcionamento = normalizeOperatingHours(body.horarios_funcionamento);
  }

  if (auth.perfil === 'admin') {
    const nextName = String(body.nome ?? quadra.nome ?? '').trim();
    const nextAddress = String(body.endereco ?? quadra.endereco ?? '').trim();
    const nextCity = String(body.cidade ?? quadra.cidade ?? '').trim();

    if (!nextName || !nextAddress || !nextCity) {
      throw new HttpError(400, 'Informe nome, endereço e cidade do espaço.');
    }

    body.nome = nextName;
    body.endereco = nextAddress;
    body.cidade = nextCity;
    body.tipo_espaco = String(body.tipo_espaco ?? quadra.tipo_espaco ?? 'Quadra').trim() || 'Quadra';
  }

  if (body.ativa === true && auth.perfil !== 'admin') {
    const documentacao = quadra.documentacao_local_id
      ? await DocumentacaoLocal.findByPk(quadra.documentacao_local_id)
      : null;

    if (!isApprovedDocumentation(documentacao)) {
      throw new HttpError(400, 'A quadra só pode ser ativada após aprovação documental.');
    }
  }

  fields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      quadra[field] = body[field];
    }
  });

  const shouldNotifyUsers = shouldNotifyPromotion && quadra.ativa !== false;
  const notificationType = wasPromotion
    ? notificacaoService.NOTIFICATION_TYPES.PRICE_DROPPED
    : notificacaoService.NOTIFICATION_TYPES.PROMOTION_CREATED;
  const locationFields = ['endereco', 'bairro', 'cidade', 'estado', 'cep', 'numero'];
  const shouldRefreshDocumentation = auth.perfil === 'admin' && locationFields.some((field) => (
    Object.prototype.hasOwnProperty.call(body, field)
  ));
  const changedFields = fields.filter((field) => Object.prototype.hasOwnProperty.call(body, field));

  await sequelize.transaction(async (transaction) => {
    if (shouldRefreshDocumentation || (auth.perfil === 'admin' && body.ativa === true)) {
      const documentacaoLocal = await ensureAdminCourtDocumentation(
        auth,
        quadra.proprietario_id,
        {
          endereco: buildAddressLine({
            endereco: body.endereco ?? quadra.endereco,
            numero: body.numero ?? quadra.numero,
          }) || body.endereco || quadra.endereco,
          bairro: body.bairro ?? quadra.bairro,
          cidade: body.cidade ?? quadra.cidade,
          estado: body.estado ?? quadra.estado,
          cep: body.cep ?? quadra.cep,
        },
        transaction,
      );
      quadra.documentacao_local_id = documentacaoLocal.id;
    }

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

    if (shouldNotifyUsers) {
      await notificacaoService.createPromotionNotifications(quadra, {
        previousPrice,
        newPrice: nextPrice,
        type: notificationType,
        transaction,
      });
    }

    await adminLogService.recordAdminAction(auth, {
      acao: 'EDITAR_ESPACO',
      entidadeId: quadra.id,
      detalhes: {
        nome: quadra.nome,
        campos_alterados: changedFields,
      },
      transaction,
    });
  });

  const updatedCourt = await getCourtForManagement(quadra.id);
  const nextPhotos = buildPhotoList(updatedCourt.imagem_url, updatedCourt.fotos);
  await deleteStoredUploads(previousPhotos.filter((photo) => !nextPhotos.includes(photo)));
  return updatedCourt;
}

async function setCourtTemporaryDeactivation(auth, id, {
  data_inicio,
  hora_inicio,
  data_fim,
  hora_fim,
  motivo,
}) {
  const quadra = await findCourtOrThrow(id);

  if (auth?.perfil !== 'admin') {
    throw new HttpError(403, 'Apenas administradores podem desativar espaços por período.');
  }

  const start = buildLocalDateTime(data_inicio, hora_inicio);
  const end = buildLocalDateTime(data_fim, hora_fim);

  if (!start || !end) {
    throw new HttpError(400, 'Informe data e hora de início e fim da desativação.');
  }

  if (end <= start) {
    throw new HttpError(400, 'O fim da desativação deve ser posterior ao início.');
  }

  if (end <= new Date()) {
    throw new HttpError(400, 'O fim da desativação deve estar no futuro.');
  }

  await sequelize.transaction(async (transaction) => {
    await quadra.update({
      desativada_inicio_em: start,
      desativada_fim_em: end,
      motivo_desativacao: String(motivo || '').trim() || null,
    }, { transaction });

    await adminLogService.recordAdminAction(auth, {
      acao: 'DESATIVAR_ESPACO',
      entidadeId: quadra.id,
      detalhes: {
        nome: quadra.nome,
        inicio_em: start,
        fim_em: end,
        motivo: quadra.motivo_desativacao,
      },
      transaction,
    });
  });

  return getCourtForManagement(quadra.id);
}

async function clearCourtTemporaryDeactivation(auth, id) {
  const quadra = await findCourtOrThrow(id);

  if (auth?.perfil !== 'admin') {
    throw new HttpError(403, 'Apenas administradores podem reativar espaços.');
  }

  await sequelize.transaction(async (transaction) => {
    await quadra.update({
      desativada_inicio_em: null,
      desativada_fim_em: null,
      motivo_desativacao: null,
    }, { transaction });

    await adminLogService.recordAdminAction(auth, {
      acao: 'REATIVAR_ESPACO',
      entidadeId: quadra.id,
      detalhes: { nome: quadra.nome },
      transaction,
    });
  });

  return getCourtForManagement(quadra.id);
}

async function deleteCourtPermanently(auth, id) {
  const quadra = await findCourtOrThrow(id);

  if (!canManageCourt(auth, quadra)) {
    throw new HttpError(403, 'Você não pode remover esta quadra.');
  }

  const snapshot = quadra.toJSON();
  const photos = buildPhotoList(snapshot.imagem_url, snapshot.fotos);

  await quadra.sequelize.transaction(async (transaction) => {
    await adminLogService.recordAdminAction(auth, {
      acao: 'EXCLUIR_ESPACO',
      entidadeId: quadra.id,
      detalhes: {
        nome: quadra.nome,
        proprietario_id: quadra.proprietario_id,
      },
      transaction,
    });

    await Notificacao.destroy({
      where: { quadraId: id },
      transaction,
    });

    await Reserva.destroy({
      where: { quadra_id: id },
      transaction,
    });

    await HorarioDisponivel.destroy({
      where: { quadra_id: id },
      transaction,
    });

    await Quadra.destroy({
      where: { id },
      transaction,
    });

    if (snapshot.documentacao_local_id) {
      const linkedCourts = await Quadra.count({
        where: { documentacao_local_id: snapshot.documentacao_local_id },
        transaction,
      });
      const documentation = await DocumentacaoLocal.findByPk(snapshot.documentacao_local_id, { transaction });

      if (linkedCourts === 0 && documentation && Object.keys(documentation.documentos || {}).length === 0) {
        await documentation.destroy({ transaction });
      }
    }
  });

  await deleteStoredUploads(photos);
}

async function listSchedules(courtId, data) {
  const quadra = await Quadra.findByPk(courtId, {
    include: [
      {
        model: DocumentacaoLocal,
        as: 'documentacao_local',
        required: false,
      },
    ],
  });

  if (!quadra) {
    throw new HttpError(404, 'Quadra não encontrada.');
  }

  if (quadra.ativa !== true || !isApprovedDocumentation(quadra.documentacao_local)) {
    throw new HttpError(404, 'Quadra indisponível para reservas.');
  }

  const targetDate = normalizeDate(data);

  if (data && !targetDate) {
    throw new HttpError(400, 'Informe uma data válida para consultar horários.');
  }

  const now = new Date();

  if (targetDate && targetDate < getServerLocalDateISO(now)) {
    return [];
  }

  if (!isCourtEffectivelyActive(quadra)) {
    return [];
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
  }).filter((horario) => (
    !horario.ocupado
    && (!targetDate || isFutureScheduleForDate(targetDate, horario.hora_inicio, now))
    && (!targetDate || !isCourtUnavailableForSlot(quadra, targetDate, horario.hora_inicio, horario.hora_fim))
  ));

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
    throw new HttpError(403, 'Você não pode gerenciar horários desta quadra.');
  }

  const targetDate = normalizeDate(data);

  if (data && !targetDate) {
    throw new HttpError(400, 'Informe uma data válida para o horário.');
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
    throw new HttpError(400, 'Informe um valor válido para o horário.');
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
      throw new HttpError(409, 'Este horário já está cadastrado para a quadra.');
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

  horario.disponivel = Boolean(disponivel);
  await horario.save();
  return horario;
}

module.exports = {
  clearCourtTemporaryDeactivation,
  createAdminCourt,
  createCourt,
  createSchedule,
  deleteCourtPermanently,
  deleteSchedule,
  getCourt,
  isCourtEffectivelyActive,
  isCourtUnavailableForSlot,
  listAdminCourts,
  listCourts,
  listOwnerCourts,
  listSchedules,
  setCourtTemporaryDeactivation,
  updateCourt,
  updateScheduleAvailability,
};
