const path = require('path');
const multer = require('multer');

const { HttpError } = require('../utils/http');

const PHOTO_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const PHOTO_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const MAX_PHOTO_COUNT = 10;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_PHOTO_SIZE,
    files: MAX_PHOTO_COUNT,
  },
  fileFilter(_request, file, callback) {
    const extension = path.extname(file.originalname).toLowerCase();

    if (PHOTO_TYPES.has(file.mimetype) && PHOTO_EXTENSIONS.has(extension)) {
      callback(null, true);
      return;
    }

    callback(new HttpError(400, 'Envie fotos em PNG, JPG ou WebP.'));
  },
});

function uploadCourtPhotos(request, response, next) {
  upload.array('fotos', MAX_PHOTO_COUNT)(request, response, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return next(new HttpError(400, 'Cada foto deve ter no máximo 5 MB.'));
      }

      if (error.code === 'LIMIT_FILE_COUNT') {
        return next(new HttpError(400, 'Envie no máximo 10 fotos por quadra.'));
      }

      return next(new HttpError(400, 'Não foi possível receber as fotos.'));
    }

    return next(error);
  });
}

module.exports = {
  uploadCourtPhotos,
};
