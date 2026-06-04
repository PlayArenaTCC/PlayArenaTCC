const fs = require('fs');
const path = require('path');
const multer = require('multer');

const { HttpError } = require('../utils/http');

const DOCUMENT_DIR = path.join(__dirname, '..', '..', 'uploads', 'documentos');
const DOCUMENT_TYPES = new Set(['application/pdf', 'image/png', 'image/jpeg', 'image/webp']);
const DOCUMENT_EXTENSIONS = new Set(['.pdf', '.png', '.jpg', '.jpeg', '.webp']);
const MAX_DOCUMENT_SIZE = 8 * 1024 * 1024;
const MAX_DOCUMENT_COUNT = 8;

fs.mkdirSync(DOCUMENT_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination(_request, _file, callback) {
    callback(null, DOCUMENT_DIR);
  },
  filename(request, file, callback) {
    const extension = path.extname(file.originalname).toLowerCase();
    const ownerId = String(request.auth.id || 'proprietario').replace(/[^a-z0-9-]/gi, '');
    const field = String(file.fieldname || 'documento').replace(/[^a-z0-9_-]/gi, '');

    callback(null, `${ownerId}-${field}-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_DOCUMENT_SIZE,
    files: MAX_DOCUMENT_COUNT,
  },
  fileFilter(_request, file, callback) {
    const extension = path.extname(file.originalname).toLowerCase();

    if (DOCUMENT_TYPES.has(file.mimetype) && DOCUMENT_EXTENSIONS.has(extension)) {
      callback(null, true);
      return;
    }

    callback(new HttpError(400, 'Envie documentos em PDF, PNG, JPG ou WebP.'));
  },
});

function uploadDocuments(request, response, next) {
  upload.any()(request, response, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return next(new HttpError(400, 'Cada documento deve ter no maximo 8 MB.'));
      }

      if (error.code === 'LIMIT_FILE_COUNT') {
        return next(new HttpError(400, 'Envie no maximo 8 documentos por analise.'));
      }

      return next(new HttpError(400, 'Nao foi possivel receber os documentos.'));
    }

    return next(error);
  });
}

module.exports = {
  uploadDocuments,
};
