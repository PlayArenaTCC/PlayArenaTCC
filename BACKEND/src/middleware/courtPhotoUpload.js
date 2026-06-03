const fs = require('fs');
const path = require('path');
const multer = require('multer');

const { HttpError } = require('../utils/http');

const COURT_PHOTO_DIR = path.join(__dirname, '..', '..', 'uploads', 'court-photos');
const PHOTO_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const PHOTO_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const MAX_PHOTO_COUNT = 10;

fs.mkdirSync(COURT_PHOTO_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination(_request, _file, callback) {
    callback(null, COURT_PHOTO_DIR);
  },
  filename(request, file, callback) {
    const extension = path.extname(file.originalname).toLowerCase();
    const ownerId = String(request.auth?.id || 'proprietario').replace(/[^a-z0-9-]/gi, '');

    callback(null, `${ownerId}-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
  },
});

const upload = multer({
  storage,
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
        return next(new HttpError(400, 'Cada foto deve ter no maximo 5 MB.'));
      }

      if (error.code === 'LIMIT_FILE_COUNT') {
        return next(new HttpError(400, 'Envie no maximo 10 fotos por quadra.'));
      }

      return next(new HttpError(400, 'Nao foi possivel receber as fotos.'));
    }

    return next(error);
  });
}

module.exports = {
  uploadCourtPhotos,
};
