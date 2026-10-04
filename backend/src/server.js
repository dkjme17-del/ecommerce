import app from './app.js';
import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';
import { startDbKeepAlive } from './lib/dbKeepAlive.js';

const RETRIES = 5;

async function connectWithRetry() {
  for (let i = 1; i <= RETRIES; i += 1) {
    try {
      await prisma.$connect();
      return;
    } catch (err) {
      console.warn(`Connexion PostgreSQL refusée (essai ${i}/${RETRIES}) : ${err?.message}`);
      await new Promise((r) => setTimeout(r, 2000 * i));
    }
  }
  throw new Error('Base de données injoignable après plusieurs essais');
}

async function start() {
  try {
    await connectWithRetry();
    await prisma.$queryRaw`SELECT 1`;
    console.log('✓ PostgreSQL connecté');

    // Neon Free suspend la base après ~5 min d'inactivité : on la maintient réveillée.
    startDbKeepAlive();

        app.listen(env.port, '0.0.0.0', () => {
        console.log(`✓ API DKmarket démarrée sur le port ${env.port}`);
      });
        } catch (err) {
    console.error('Échec du démarrage', err);
    process.exit(1);
  }
}

start();

async function shutdown() {
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);