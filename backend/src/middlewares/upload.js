import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from '../config/env.js';
import { ApiError } from '../lib/apiError.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const uploadDir = path.resolve(__dirname, '..', '..', env.uploadDir);

// Les fichiers sont reçus en mémoire puis persistés en base (voir
// routes/upload.routes.js) : le disque des conteneurs étant éphémère.
const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowed.includes(file.mimetype)) {
    return cb(new ApiError(400, "Format d'image non supporté"));
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const MAGIC = {
  jpeg: {
    ext: '.jpg',
    mime: 'image/jpeg',
    match: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  png: {
    ext: '.png',
    mime: 'image/png',
    match: (b) =>
      b.length > 8 && b.readUInt32BE(0) === 0x89504e47 && b.readUInt32BE(4) === 0x0d0a1a0a,
  },
  gif: {
    ext: '.gif',
    mime: 'image/gif',
    match: (b) => {
      if (b.length < 6) return false;
      const head = b.toString('ascii', 0, 6);
      return head === 'GIF87a' || head === 'GIF89a';
    },
  },
  webp: {
    ext: '.webp',
    mime: 'image/webp',
    match: (b) =>
      b.length > 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP',
  },
};

/**
 * Vérifie que le contenu d'un fichier uploadé est réellement une image
 * (contrôle des magic bytes) et lui attribue le bon nom/extension.
 */
async function assertUploadedImage(file) {
  const buf = file.buffer;
  const type = Object.values(MAGIC).find((t) => t.match(buf));
  if (!type) {
    throw new ApiError(400, "Le fichier n'est pas une image valide");
  }
  file.filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${type.ext}`;
  file.mimetype = type.mime;
  file.size = buf.length;
  return file;
}

/**
 * Middleware à placer APRÈS upload.single / upload.array : rejette tout
 * fichier dont le contenu ne correspond pas à une image du whitelist.
 */
export function validateUploadedImages(single = true) {
  return async (req, _res, next) => {
    try {
      const files = single ? (req.file ? [req.file] : []) : req.files || [];
      for (const file of files) await assertUploadedImage(file);
      next();
    } catch (err) {
      next(err);
    }
  };
}