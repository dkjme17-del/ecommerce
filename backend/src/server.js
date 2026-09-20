import app from './app.js';
import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';

async function start() {
  try {
    await prisma.$connect();
    console.log('✓ PostgreSQL connecté');

    app.listen(env.port, () => {
      console.log(`✓ API Marketplace démarrée sur http://localhost:${env.port}`);
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