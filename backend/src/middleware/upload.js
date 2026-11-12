const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const env = require('../config/env');
const { AppError } = require('../utils/apiResponse');

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const PUBLIC_ITEMS_DIR = path.resolve(__dirname, '../../uploads/items');
const PRIVATE_EVIDENCE_DIR = path.resolve(__dirname, '../../private_uploads/evidence');

fs.mkdirSync(PUBLIC_ITEMS_DIR, { recursive: true });
fs.mkdirSync(PRIVATE_EVIDENCE_DIR, { recursive: true });

function createStorage(targetDir) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, targetDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase();
      const safeExt = ALLOWED_EXTENSIONS.has(ext) ? ext : '.jpg';
      const randomName = `${Date.now()}-${crypto.randomBytes(16).toString('hex')}${safeExt}`;
      cb(null, randomName);
    },
  });
}

function imageFileFilter(req, file, cb) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const baseName = path.basename(file.originalname || '');

  // Reject suspicious path traversal characters or double-extension executable names
  if (
    baseName.includes('..') ||
    baseName.includes('/') ||
    baseName.includes('\\') ||
    !ALLOWED_MIME_TYPES.has(file.mimetype) ||
    !ALLOWED_EXTENSIONS.has(ext)
  ) {
    return cb(
      new AppError(
        'Invalid file type. Only JPG, JPEG, PNG, and WebP images are allowed.',
        400
      )
    );
  }
  return cb(null, true);
}

const uploadItemImage = multer({
  storage: createStorage(PUBLIC_ITEMS_DIR),
  fileFilter: imageFileFilter,
  limits: {
    fileSize: env.uploadMaxSizeBytes,
    files: 1,
  },
}).single('image');

const uploadClaimEvidence = multer({
  storage: createStorage(PRIVATE_EVIDENCE_DIR),
  fileFilter: imageFileFilter,
  limits: {
    fileSize: env.uploadMaxSizeBytes,
    files: 1,
  },
}).single('evidence');

function handleUpload(multerMiddleware) {
  return (req, res, next) => {
    multerMiddleware(req, res, (err) => {
      if (!err) return next();
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new AppError('Uploaded file exceeds the 5 MB size limit.', 400));
        }
        return next(new AppError(`Upload error: ${err.message}`, 400));
      }
      return next(err);
    });
  };
}

function safeResolveUploadPath(baseDir, storedFilename) {
  if (!storedFilename) return null;
  const cleanName = path.basename(storedFilename);
  const resolved = path.resolve(baseDir, cleanName);
  if (!resolved.startsWith(baseDir + path.sep)) {
    return null;
  }
  return resolved;
}

module.exports = {
  PUBLIC_ITEMS_DIR,
  PRIVATE_EVIDENCE_DIR,
  uploadItemImage: handleUpload(uploadItemImage),
  uploadClaimEvidence: handleUpload(uploadClaimEvidence),
  safeResolveUploadPath,
};

