const fs = require('fs');
const path = require('path');
const multer = require('multer');

const { HttpError } = require('../utils/http');

const PROFILE_PHOTO_DIR = path.join(__dirname, '..', '..', 'uploads', 'profile-photos');
const PHOTO_TYPES = new Set(['image/png', 'image/jpeg']);
const PHOTO_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg']);
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

fs.mkdirSync(PROFILE_PHOTO_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination(_request, _file, callback) {
    callback(null, PROFILE_PHOTO_DIR);
  },
  filename(request, file, callback) {
    const extension = path.extname(file.originalname).toLowerCase();
    const perfil = String(request.auth?.perfil || 'perfil').replace(/[^a-z0-9_-]/gi, '');
    const accountId = String(request.auth?.id || 'conta').replace(/[^a-z0-9-]/gi, '');

    callback(null, `${perfil}-${accountId}-${Date.now()}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_PHOTO_SIZE,
  },
  fileFilter(_request, file, callback) {
    const extension = path.extname(file.originalname).toLowerCase();

    if (PHOTO_TYPES.has(file.mimetype) && PHOTO_EXTENSIONS.has(extension)) {
      callback(null, true);
      return;
    }

    callback(new HttpError(400, 'Envie uma foto em PNG ou JPG.'));
  },
});

function uploadProfilePhoto(request, response, next) {
  upload.single('foto_perfil')(request, response, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return next(new HttpError(400, 'A foto deve ter no maximo 5 MB.'));
      }

      return next(new HttpError(400, 'Nao foi possivel receber a foto.'));
    }

    return next(error);
  });
}

module.exports = {
  uploadProfilePhoto,
};
