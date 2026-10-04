import { Router } from 'express';
import { upload, validateUploadedImages } from '../middlewares/upload.js';
import { authenticate } from '../middlewares/auth.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

async function persist(file) {
  await prisma.media.upsert({
    where: { filename: file.filename },
    update: { data: file.buffer, mime: file.mimetype, size: file.size },
    create: {
      filename: file.filename,
      data: file.buffer,
      mime: file.mimetype,
      size: file.size,
    },
  });
  return `/uploads/${file.filename}`;
}

router.post(
  '/image',
  authenticate,
  upload.single('image'),
  validateUploadedImages(),
  async (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'Aucun fichier reçu' } });
    }
    try {
      const url = await persist(req.file);
      res.status(201).json({ url });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/images',
  authenticate,
  upload.array('images', 8),
  validateUploadedImages(false),
  async (req, res, next) => {
    const files = req.files || [];
    try {
      const urls = [];
      for (const file of files) {
        urls.push(await persist(file));
      }
      res.status(201).json({ urls });
    } catch (err) {
      next(err);
    }
  },
);

export default router;