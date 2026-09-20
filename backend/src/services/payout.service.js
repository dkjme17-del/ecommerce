import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { createNotification } from './notification.service.js';
import { ApiError } from '../lib/apiError.js';

/**
 * Crée et (en sandbox) traite le payout d'une boutique lorsque son solde
 * atteint le seuil MIN_PAYOUT_AMOUNT. En mode live, le payout reste PENDING
 * et sera traité par l'admin ou un worker.
 * @param {string} storeId
 */
export async function processPayoutsForStore(storeId) {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    include: { owner: true, payouts: true },
  });

  if (!store) return;
  if (store.balance < env.minPayoutAmount) return;
  if (!store.payoutInfo || !store.payoutInfo.method) return;

  const amount = store.balance;
  const payout = await prisma.payout.create({
    data: {
      storeId,
      amount,
      commission: 0,
      status: env.paymentMode === 'sandbox' ? 'PENDING' : 'PENDING',
      method: store.payoutInfo.method,
    },
  });

  await createNotification(
    store.ownerId,
    'Payout en préparation',
    `Votre solde (${new Intl.NumberFormat('fr-FR').format(amount)} centimes) va être versé sur ${store.payoutInfo.method}.`,
    { payoutId: payout.id },
  );

  if (env.paymentMode === 'sandbox') {
    await processPayout(payout.id);
  }
}

/**
 * Traite un payout (appelé par l'admin ou automatiquement en sandbox).
 * En sandbox le transfert est simulé : SUCCESS immédiat.
 */
export async function processPayout(payoutId) {
  const payout = await prisma.payout.findUnique({
    where: { id: payoutId },
    include: { store: { include: { owner: true } } },
  });

  if (!payout) throw ApiError.notFound('Payout introuvable');
  if (payout.status !== 'PENDING') return payout;

  if (env.paymentMode === 'sandbox') {
    // Simulation d'un transfert mobile money réussi
    const reference = `PAY-${Date.now()}`;
    const updated = await prisma.$transaction([
      prisma.payout.update({
        where: { id: payout.id },
        data: {
          status: 'SUCCESS',
          reference,
          processedAt: new Date(),
        },
      }),
      prisma.store.update({
        where: { id: payout.storeId },
        data: { balance: 0 },
      }),
    ]);

    await createNotification(
      payout.store.ownerId,
      'Payout effectué',
      `Votre versement de ${new Intl.NumberFormat('fr-FR').format(payout.amount)} centimes a été envoyé avec succès (réf ${reference}).`,
      { payoutId: payout.id },
    );

    return updated[0];
  }

  // Mode live : à connecter à l'API du fournisseur
  throw ApiError.badRequest('Payout en mode live non implémenté');
}