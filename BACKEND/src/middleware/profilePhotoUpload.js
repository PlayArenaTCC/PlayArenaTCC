const path = require('path');
const multer = require('multer');

const { HttpError } = require('../utils/http');

const PHOTO_TYPES = new Set(['image/png', 'image/jpeg']);
const PHOTO_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg']);
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
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
        return next(new HttpError(400, 'A foto deve ter no máximo 5 MB.'));
      }

      return next(new HttpError(400, 'Não foi possível receber a foto.'));
    }

    return next(error);
  });
}

module.exports = {
  uploadProfilePhoto,
};
