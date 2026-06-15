const { Op } = require('sequelize');
const { MediaAsset } = require('../models');
const { HttpError } = require('../utils/http');

const MEDIA_PATH_PREFIX = '/api/media/';
const MEDIA_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getRequestBaseUrl(request) {
  const forwardedProto = request.headers['x-forwarded-proto'];
  const protocol = String(Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto || request.protocol)
    .split(',')[0]
    .trim();

  return `${protocol}://${request.get('host')}`;
}

function buildMediaUrl(request, id) {
  return `${getRequestBaseUrl(request)}${MEDIA_PATH_PREFIX}${id}`;
}

function buildMediaUrlFromBase(baseUrl, id) {
  return `${String(baseUrl || '').replace(/\/+$/, '')}${MEDIA_PATH_PREFIX}${id}`;
}

async function createMediaAsset({
  file,
  ownerPerfil,
  ownerId,
  tipo,
}) {
  if (!file?.buffer?.length) {
    throw new HttpError(400, 'Arquivo de imagem inválido.');
  }

  return MediaAsset.create({
    tipo,
    owner_perfil: ownerPerfil || null,
    owner_id: ownerId || null,
    nome_original: file.originalname || null,
    mime_type: file.mimetype,
    tamanho: file.size || file.buffer.length,
    dados: file.buffer,
  });
}

function extractMediaIdFromUrl(value) {
  const rawValue = String(value || '').trim();

  if (!rawValue) {
    return null;
  }

  let pathname = rawValue;

  try {
    pathname = new URL(rawValue).pathname;
  } catch {
    pathname = rawValue;
  }

  const normalizedPath = pathname.replace(/\\/g, '/');
  const index = normalizedPath.indexOf(MEDIA_PATH_PREFIX);

  if (index < 0) {
    return null;
  }

  const id = normalizedPath.slice(index + MEDIA_PATH_PREFIX.length).split(/[/?#]/)[0];
  return MEDIA_ID_PATTERN.test(id) ? id : null;
}

async function deleteMediaAssetByUrl(value) {
  const id = extractMediaIdFromUrl(value);

  if (!id) {
    return;
  }

  await MediaAsset.destroy({ where: { id } });
}

async function deleteMediaAssetsByUrls(values = []) {
  const ids = [...new Set(values.map(extractMediaIdFromUrl).filter(Boolean))];

  if (!ids.length) {
    return;
  }

  await MediaAsset.destroy({ where: { id: { [Op.in]: ids } } });
}

async function getMediaAsset(id) {
  const media = await MediaAsset.findByPk(id);

  if (!media) {
    throw new HttpError(404, 'Imagem não encontrada.');
  }

  return media;
}

module.exports = {
  buildMediaUrl,
  buildMediaUrlFromBase,
  createMediaAsset,
  deleteMediaAssetByUrl,
  deleteMediaAssetsByUrls,
  getMediaAsset,
};
