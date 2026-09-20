import { Router } from 'express';
import { upload, validateUploadedImages } from '../middlewares/upload.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.post(
  '/image',
  authenticate,
  upload.single('image'),
  validateUploadedImages(),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'Aucun fichier reçu' } });
    }
    res.status(201).json({
      url: `/uploads/${req.file.filename}`,
    });
  },
);

router.post(
  '/images',
  authenticate,
  upload.array('images', 8),
  validateUploadedImages(false),
  (req, res) => {
    const urls = (req.files || []).map((f) => `/uploads/${f.filename}`);
    res.status(201).json({ urls });
  },
);

export default router;