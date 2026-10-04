import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import { uploadDir } from './middlewares/upload.js';
import apiRoutes from './routes/index.js';
import { notFound, errorHandler } from './middlewares/error.js';
import { prisma } from './lib/prisma.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.set('trust proxy', env.isProduction ? 1 : false);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        baseUri: ["'none'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
  }),
);

app.use(cors({ origin: env.clientUrl.split(',') }));
app.use(
  express.json({
    limit: '2mb',
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.isProduction ? 'combined' : 'dev'));

app.use(
  '/uploads',
  express.static(uploadDir, {
    fallthrough: true,
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', "default-src 'none'");
    },
  }),
);

// Fichiers persistés en base (survivent aux redémarrages des conteneurs) ;
// le repère statique ci-dessus sert de repli pour les fichiers locaux en dev.
app.get('/uploads/:filename', async (req, res, next) => {
  try {
    const media = await prisma.media.findUnique({
      where: { filename: req.params.filename },
    });
    if (!media) {
      return res.status(404).json({ error: { message: 'Fichier introuvable' } });
    }
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'");
    res.setHeader('Content-Type', media.mime);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(media.data);
  } catch (err) {
    next(err);
  }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 400,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.includes('/webhook'),
  message: { error: { message: 'Trop de requêtes, réessayez plus tard.' } },
});
app.use('/api/v1', apiLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Trop de requêtes, réessayez plus tard.' } },
});
app.use('/api/v1/auth', authLimiter);
app.use('/api/v1/payments/webhook', rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));

app.get('/', (_req, res) =>
  res.json({ name: 'DKmarket API', docs: '/api/v1/status' }),
);

app.use('/api/v1', apiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;