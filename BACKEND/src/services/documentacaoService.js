const {
  Administrador,
  DocumentacaoLocal,
  Proprietario,
  Quadra,
} = require('../models');
const { HttpError } = require('../utils/http');

const DOCUMENT_STATUS = {
  PENDING: 'pendente',
  REVIEWING: 'em_analise',
  APPROVED: 'aprovado',
  REJECTED: 'reprovado',
};

const OWNER_TYPE_LABELS = {
  dono_local: 'Dono do local',
  gerenciador: 'Gerenciador',
};

const REQUIRED_DOCUMENTS_BY_OWNER_TYPE = {
  dono_local: [
    'documento_pessoal',
    'cpf',
    'comprovante_endereco',
    'comprovante_posse',
  ],
  gerenciador: [
    'documento_pessoal',
    'cpf',
    'comprovante_endereco',
    'autorizacao_gerenciamento',
  ],
};

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function normalizeLocation({ endereco, bairro, cidade, estado, cep } = {}) {
  const normalized = {
    endereco: String(endereco || '').trim(),
    bairro: String(bairro || '').trim() || null,
    cidade: String(cidade || 'Campo Mourao').trim(),
    estado: String(estado || 'PR').trim().toUpperCase().slice(0, 2) || 'PR',
    cep: String(cep || '').trim() || null,
  };

  if (!normalized.endereco) {
    throw new HttpError(400, 'Informe o endereco do espaco para validar a documentacao.');
  }

  if (!normalized.cidade) {
    throw new HttpError(400, 'Informe a cidade do espaco para validar a documentacao.');
  }

  return normalized;
}

function buildLocationKey(location) {
  const normalized = normalizeLocation(location);

  return [
    normalized.cep ? normalizeText(normalized.cep) : '',
    normalizeText(normalized.endereco),
    normalizeText(normalized.bairro),
    normalizeText(normalized.cidade),
    normalizeText(normalized.estado),
  ].filter(Boolean).join('|');
}

function normalizeOwnerType(value) {
  const ownerType = String(value || '').trim();

  if (!Object.prototype.hasOwnProperty.call(REQUIRED_DOCUMENTS_BY_OWNER_TYPE, ownerType)) {
    throw new HttpError(400, 'Selecione o tipo de proprietario: dono_local ou gerenciador.');
  }

  return ownerType;
}

function normalizeDocuments(value) {
  const source = value && typeof value === 'object' ? value : {};

  return Object.entries(source).reduce((documents, [key, documentValue]) => {
    const url = String(documentValue || '').trim();

    if (url) {
      documents[key] = url;
    }

    return documents;
  }, {});
}

function assertRequiredDocuments(ownerType, documents) {
  const requiredDocuments = REQUIRED_DOCUMENTS_BY_OWNER_TYPE[ownerType] || [];
  const missing = requiredDocuments.filter((key) => !documents[key]);

  if (missing.length) {
    throw new HttpError(400, 'Envie todos os documentos obrigatorios antes de cadastrar o espaco.');
  }
}

function documentationIncludes() {
  return [
    {
      model: Proprietario,
      as: 'proprietario',
      attributes: ['id', 'nome_responsavel', 'nome_empresa', 'email', 'telefone'],
    },
    {
      model: Administrador,
      as: 'administrador',
      attributes: ['id', 'nome', 'email'],
      required: false,
    },
    {
      model: Quadra,
      as: 'quadras',
      attributes: ['id', 'nome', 'endereco', 'bairro', 'cidade', 'estado', 'ativa'],
      required: false,
    },
  ];
}

async function findOwnerDocumentation(ownerId, location, transaction) {
  return DocumentacaoLocal.findOne({
    where: {
      proprietario_id: ownerId,
      endereco_key: buildLocationKey(location),
    },
    transaction,
  });
}

async function ensureCourtDocumentation(auth, ownerId, location, payload = {}, transaction) {
  const normalizedLocation = normalizeLocation(location);
  const enderecoKey = buildLocationKey(normalizedLocation);
  const existingDocumentation = await DocumentacaoLocal.findOne({
    where: {
      proprietario_id: ownerId,
      endereco_key: enderecoKey,
    },
    transaction,
  });

  if (existingDocumentation && existingDocumentation.status !== DOCUMENT_STATUS.REJECTED) {
    return existingDocumentation;
  }

  const ownerType = normalizeOwnerType(payload.tipo_proprietario);
  const documents = normalizeDocuments(payload.documentos);
  assertRequiredDocuments(ownerType, documents);

  const documentationData = {
    proprietario_id: ownerId,
    tipo_proprietario: ownerType,
    endereco_key: enderecoKey,
    ...normalizedLocation,
    documentos: documents,
    status: DOCUMENT_STATUS.REVIEWING,
    enviado_em: new Date(),
    responsavel_id: auth.id,
    administrador_id: null,
    analisado_em: null,
    motivo_reprovacao: null,
  };

  if (existingDocumentation) {
    await existingDocumentation.update(documentationData, { transaction });
    return existingDocumentation;
  }

  return DocumentacaoLocal.create(documentationData, { transaction });
}

async function ensureAdminCourtDocumentation(auth, ownerId, location, transaction) {
  const normalizedLocation = normalizeLocation(location);
  const enderecoKey = buildLocationKey(normalizedLocation);
  const existingDocumentation = await DocumentacaoLocal.findOne({
    where: {
      proprietario_id: ownerId,
      endereco_key: enderecoKey,
    },
    transaction,
  });
  const documentationData = {
    proprietario_id: ownerId,
    tipo_proprietario: existingDocumentation?.tipo_proprietario || 'gerenciador',
    endereco_key: enderecoKey,
    ...normalizedLocation,
    documentos: existingDocumentation?.documentos || {},
    status: DOCUMENT_STATUS.APPROVED,
    enviado_em: existingDocumentation?.enviado_em || new Date(),
    responsavel_id: existingDocumentation?.responsavel_id || auth.id,
    administrador_id: auth.id,
    analisado_em: new Date(),
    motivo_reprovacao: null,
  };

  if (existingDocumentation) {
    await existingDocumentation.update(documentationData, { transaction });
    return existingDocumentation;
  }

  return DocumentacaoLocal.create(documentationData, { transaction });
}

async function listOwnerDocumentations(ownerId) {
  return DocumentacaoLocal.findAll({
    where: { proprietario_id: ownerId },
    include: documentationIncludes(),
    order: [['created_at', 'DESC']],
  });
}

async function listDocumentations({ status } = {}) {
  const where = {};

  if (status) {
    where.status = status;
  }

  return DocumentacaoLocal.findAll({
    where,
    include: documentationIncludes(),
    order: [
      ['status', 'ASC'],
      ['created_at', 'DESC'],
    ],
  });
}

async function reviewDocumentation(adminAuth, id, { status, motivo_reprovacao } = {}) {
  const nextStatus = String(status || '').trim();
  const allowedStatuses = [DOCUMENT_STATUS.APPROVED, DOCUMENT_STATUS.REJECTED];

  if (!allowedStatuses.includes(nextStatus)) {
    throw new HttpError(400, 'Informe aprovado ou reprovado para a analise documental.');
  }

  const documentation = await DocumentacaoLocal.findByPk(id);

  if (!documentation) {
    throw new HttpError(404, 'Documentacao nao encontrada.');
  }

  const reason = String(motivo_reprovacao || '').trim();

  if (nextStatus === DOCUMENT_STATUS.REJECTED && !reason) {
    throw new HttpError(400, 'Informe o motivo da reprovacao.');
  }

  await documentation.sequelize.transaction(async (transaction) => {
    await documentation.update({
      status: nextStatus,
      administrador_id: adminAuth.id,
      analisado_em: new Date(),
      motivo_reprovacao: nextStatus === DOCUMENT_STATUS.REJECTED ? reason : null,
    }, { transaction });

    await Quadra.update({
      ativa: nextStatus === DOCUMENT_STATUS.APPROVED,
    }, {
      where: {
        documentacao_local_id: documentation.id,
      },
      transaction,
    });
  });

  return DocumentacaoLocal.findByPk(id, {
    include: documentationIncludes(),
  });
}

async function hasApprovedDocumentation(ownerId, location) {
  const documentation = await findOwnerDocumentation(ownerId, location);
  return isApprovedDocumentation(documentation);
}

function isApprovedDocumentation(documentation) {
  return documentation?.status === DOCUMENT_STATUS.APPROVED;
}

module.exports = {
  DOCUMENT_STATUS,
  OWNER_TYPE_LABELS,
  REQUIRED_DOCUMENTS_BY_OWNER_TYPE,
  buildLocationKey,
  ensureAdminCourtDocumentation,
  ensureCourtDocumentation,
  hasApprovedDocumentation,
  isApprovedDocumentation,
  listDocumentations,
  listOwnerDocumentations,
  normalizeLocation,
  reviewDocumentation,
};
