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

  // Évite les payouts en doublon : un seul payout en attente par boutique.
  const existing = await prisma.payout.findFirst({
    where: { storeId, status: 'PENDING' },
  });
  if (existing) return;

  const amount = store.balance;
  const payout = await prisma.payout.create({
    data: {
      storeId,
      amount,
      commission: 0,
      status: 'PENDING',
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
 * Traite un payout.
 * - Sandbox : transfert simulé, SUCCESS immédiat.
 * - Live : l'admin effectue le transfert réel (Wave/Orange/…), puis confirme
 *   ici en fournissant la référence du transfert. Le solde est alors remis à zéro.
 */
export async function processPayout(payoutId, reference) {
  const payout = await prisma.payout.findUnique({
    where: { id: payoutId },
    include: { store: { include: { owner: true } } },
  });

  if (!payout) throw ApiError.notFound('Payout introuvable');
  if (payout.status !== 'PENDING') return payout;

  if (env.paymentMode === 'live' && !reference) {
    throw ApiError.badRequest(
      'Mode live : indiquez la référence du transfert effectué (Wave/Orange/…) pour confirmer le payout.',
    );
  }

  const finalRef = reference || `PAY-${Date.now()}`;
  const updated = await prisma.$transaction([
    prisma.payout.update({
      where: { id: payout.id },
      data: {
        status: 'SUCCESS',
        reference: finalRef,
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
    `Votre versement de ${new Intl.NumberFormat('fr-FR').format(payout.amount)} centimes a été envoyé avec succès (réf ${finalRef}).`,
    { payoutId: payout.id },
  );

  return updated[0];
}