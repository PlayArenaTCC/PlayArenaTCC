require('dotenv').config();

const fs = require('fs/promises');
const path = require('path');
const {
  Administrador,
  MediaAsset,
  Proprietario,
  Quadra,
  Usuario,
  sequelize,
} = require('./models');
const mediaService = require('./services/mediaService');

const UPLOADS_DIR = path.resolve(__dirname, '..', 'uploads');
const PROFILE_UPLOAD_PATH = '/uploads/profile-photos/';
const COURT_UPLOAD_PATH = '/uploads/court-photos/';
const apiBaseUrl = process.env.API_PUBLIC_URL
  || process.env.BACKEND_URL
  || process.env.PUBLIC_API_URL
  || `http://localhost:${process.env.PORT || 3333}`;

function hasUploadPath(value, uploadPath) {
  return String(value || '').includes(uploadPath);
}

function getLocalUploadPath(value, uploadPath) {
  const rawValue = String(value || '').trim();

  if (!rawValue || !hasUploadPath(rawValue, uploadPath)) {
    return null;
  }

  let pathname = rawValue;

  try {
    pathname = new URL(rawValue).pathname;
  } catch {
    pathname = rawValue;
  }

  let decodedPath = pathname.replace(/\\/g, '/');

  try {
    decodedPath = decodeURIComponent(pathname).replace(/\\/g, '/');
  } catch {
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

function getMimeType(filePath) {
  const extension = path.extname(filePath).toLowerCase();

  if (extension === '.png') {
    return 'image/png';
  }

  if (extension === '.webp') {
    return 'image/webp';
  }

  return 'image/jpeg';
}

async function createMediaFromLocalFile({
  filePath,
  ownerPerfil,
  ownerId,
  tipo,
}) {
  const data = await fs.readFile(filePath);
  const media = await MediaAsset.create({
    tipo,
    owner_perfil: ownerPerfil,
    owner_id: ownerId,
    nome_original: path.basename(filePath),
    mime_type: getMimeType(filePath),
    tamanho: data.length,
    dados: data,
  });

  return mediaService.buildMediaUrlFromBase(apiBaseUrl, media.id);
}

async function migrateProfilePhotos(Model, perfil, filesToDelete) {
  const accounts = await Model.findAll();

  for (const account of accounts) {
    const currentUrl = account.foto_perfil_url;
    const filePath = getLocalUploadPath(currentUrl, PROFILE_UPLOAD_PATH);

    if (!filePath) {
      continue;
    }

    const exists = await fs.access(filePath).then(() => true).catch(() => false);

    if (!exists) {
      continue;
    }

    const nextUrl = await createMediaFromLocalFile({
      filePath,
      ownerPerfil: perfil,
      ownerId: account.id,
      tipo: 'foto_perfil',
    });

    await account.update({ foto_perfil_url: nextUrl });
    filesToDelete.add(filePath);
  }
}

async function migrateCourtPhotos(filesToDelete) {
  const courts = await Quadra.findAll();
  const migratedUrls = new Map();

  for (const court of courts) {
    const originalPhotos = [
      court.imagem_url,
      ...(Array.isArray(court.fotos) ? court.fotos : []),
    ].filter(Boolean);

    let changed = false;

    for (const photoUrl of originalPhotos) {
      if (migratedUrls.has(photoUrl)) {
        continue;
      }

      const filePath = getLocalUploadPath(photoUrl, COURT_UPLOAD_PATH);

      if (!filePath) {
        continue;
      }

      const exists = await fs.access(filePath).then(() => true).catch(() => false);

      if (!exists) {
        continue;
      }

      const nextUrl = await createMediaFromLocalFile({
        filePath,
        ownerPerfil: 'proprietario',
        ownerId: court.proprietario_id,
        tipo: 'foto_quadra',
      });

      migratedUrls.set(photoUrl, nextUrl);
      filesToDelete.add(filePath);
    }

    const nextImageUrl = migratedUrls.get(court.imagem_url) || court.imagem_url;
    const nextPhotos = (Array.isArray(court.fotos) ? court.fotos : []).map((photoUrl) => (
      migratedUrls.get(photoUrl) || photoUrl
    ));

    changed = nextImageUrl !== court.imagem_url
      || JSON.stringify(nextPhotos) !== JSON.stringify(court.fotos || []);

    if (changed) {
      await court.update({
        imagem_url: nextImageUrl,
        fotos: nextPhotos,
      });
    }
  }
}

async function run() {
  const filesToDelete = new Set();

  await migrateProfilePhotos(Usuario, 'usuario', filesToDelete);
  await migrateProfilePhotos(Proprietario, 'proprietario', filesToDelete);
  await migrateProfilePhotos(Administrador, 'admin', filesToDelete);
  await migrateCourtPhotos(filesToDelete);
  await Promise.all([...filesToDelete].map((filePath) => fs.unlink(filePath).catch(() => {})));
}

run()
  .catch(() => {
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
