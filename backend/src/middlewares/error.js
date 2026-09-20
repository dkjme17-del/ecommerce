import { ApiError } from '../lib/apiError.js';

export function notFound(req, _res, next) {
  next(new ApiError(404, `Route introuvable : ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err, _req, res, _next) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: { message: err.message, details: err.details || undefined },
    });
  }

  // Erreurs Prisma
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: { message: 'Une valeur unique est déjà utilisée (email, téléphone ou slug).' },
    });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: { message: 'Enregistrement introuvable.' } });
  }

  // Erreurs multer
  if (err.name === 'MulterError') {
    return res.status(400).json({ error: { message: `Upload invalide : ${err.message}` } });
  }

  console.error('ERROR', err);
  res.status(500).json({ error: { message: 'Erreur interne du serveur.' } });
}