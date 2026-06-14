const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const { HttpError } = require('../utils/http');

const DOCUMENT_DIR = path.join(__dirname, '..', '..', 'uploads', 'documentos');
const DOCUMENT_TYPES = new Set(['application/pdf', 'image/png', 'image/jpeg', 'image/webp']);
const DOCUMENT_EXTENSIONS = new Set(['.pdf', '.png', '.jpg', '.jpeg', '.webp']);
const MAX_DOCUMENT_SIZE = 8 * 1024 * 1024;
const MAX_DOCUMENT_COUNT = 8;
const DOCUMENT_FIELDS = new Set([
  'documento_pessoal',
  'cpf',
  'comprovante_endereco',
  'comprovante_posse',
  'autorizacao_gerenciamento',
]);
const DOCUMENT_FIELD_LABELS = {
  documento_pessoal: 'Documento pessoal (RG ou CNH)',
  cpf: 'CPF ou CNPJ',
  comprovante_endereco: 'Comprovante de endereço',
  comprovante_posse: 'Documento de posse/propriedade do local',
  autorizacao_gerenciamento: 'Autorização do proprietário',
};

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

function getDocumentFieldLabel(field) {
  return DOCUMENT_FIELD_LABELS[field] || field;
}

async function cleanupUploadedFiles(files = []) {
  await Promise.all((files || []).map((file) => (
    file?.path ? fs.promises.unlink(file.path).catch(() => {}) : Promise.resolve()
  )));
}

async function hashUploadedFile(file) {
  try {
    const buffer = await fs.promises.readFile(file.path);
    return crypto.createHash('sha256').update(buffer).digest('hex');
  } catch {
    throw new HttpError(400, 'Não foi possível validar os documentos enviados.');
  }
}

async function assertUploadedDocumentsMatchFields(files = []) {
  const usedFields = new Set();
  const usedHashes = new Map();

  for (const file of files || []) {
    if (!DOCUMENT_FIELDS.has(file.fieldname)) {
      throw new HttpError(400, 'Envie documentos somente nos campos obrigatórios do formulário.');
    }

    if (usedFields.has(file.fieldname)) {
      throw new HttpError(400, `Envie apenas um arquivo para ${getDocumentFieldLabel(file.fieldname)}.`);
    }

    usedFields.add(file.fieldname);

    const hash = await hashUploadedFile(file);

    if (usedHashes.has(hash)) {
      const firstField = usedHashes.get(hash);
      throw new HttpError(
        400,
        `O mesmo arquivo foi enviado em "${getDocumentFieldLabel(firstField)}" e "${getDocumentFieldLabel(file.fieldname)}". Envie documentos diferentes para cada campo.`,
      );
    }

    usedHashes.set(hash, file.fieldname);
  }
}

function uploadDocuments(request, response, next) {
  upload.any()(request, response, async (error) => {
    if (!error) {
      try {
        await assertUploadedDocumentsMatchFields(request.files || []);
        return next();
      } catch (validationError) {
        await cleanupUploadedFiles(request.files);
        return next(validationError);
      }
    }

    await cleanupUploadedFiles(request.files);

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return next(new HttpError(400, 'Cada documento deve ter no máximo 8 MB.'));
      }

      if (error.code === 'LIMIT_FILE_COUNT') {
        return next(new HttpError(400, 'Envie no máximo 8 documentos por análise.'));
      }

      return next(new HttpError(400, 'Não foi possível receber os documentos.'));
    }

    return next(error);
  });
}

module.exports = {
  uploadDocuments,
};
