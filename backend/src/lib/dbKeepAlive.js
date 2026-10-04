import { prisma } from './prisma.js';

/**
 * Neon Free suspend le compute après ~5 minutes d'inactivité. Pendant le réveil,
 * les premières requêtes échouent ("Can't reach database server", ConnectionReset).
 * Ce heartbeat exécute une requête minimale à intervalle régulier pour maintenir
 * la base réveillée et éviter les erreurs 500 au réveil.
 */
export function startDbKeepAlive({ intervalMs = 120000 } = {}) {
  let paused = false;

  const beat = async () => {
    if (paused) return;
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (err) {
      console.warn('Keep-alive DB échoué, nouvelle tentative à la prochaine passe', err?.message);
    }
  };

  beat();
  const timer = setInterval(beat, intervalMs);
  timer.unref?.();

  return {
    stop: () => clearInterval(timer),
    pause: () => {
      paused = true;
    },
    resume: () => {
      paused = false;
    },
  };
}