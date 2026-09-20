import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/apiError.js';
import { createNotification } from './notification.service.js';
import { processPayoutsForStore } from './payout.service.js';

/**
 * Confirme le paiement d'une commande dès réception du fournisseur :
 *  - marque la commande PAID (claim atomique : idempotent face aux doublons)
 *  - crédite le solde net (après commission 5 %) de chaque boutique
 *  - retrace les transactions (paiement + commission)
 *  - décrémente le stock, incrémente les ventes
 *  - notifie vendeurs + client
 *  - déclenche les payouts automatiques le cas échéant
 *
 * Tout le volet financier est exécuté dans une transaction : deux appels
 * concurrents (webhook rejoué, race) ne peuvent pas créditer deux fois.
 */
export async function markOrderPaid(orderId, transactionRef) {
  const paid = await prisma.$transaction(async (tx) => {
    // Claim conditionnel : seule une commande non-PAID passe à PAID.
    const claim = await tx.order.updateMany({
      where: { id: orderId, paymentStatus: { not: 'PAID' } },
      data: {
        status: 'PAID',
        paymentStatus: 'PAID',
        transactionRef,
        paidAt: new Date(),
      },
    });

    if (claim.count === 0) {
      // Déjà payée (doublon / webhook rejoué) : retour sans re-créditer.
      const existing = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });
      if (!existing) throw ApiError.notFound('Commande introuvable');
      return existing;
    }

    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { store: true } } },
    });
    if (!order) throw ApiError.notFound('Commande introuvable');

    const items = order.items;

    for (const item of items) {
      await tx.store.update({
        where: { id: item.storeId },
        data: {
          balance: { increment: item.netAmount },
          totalEarned: { increment: item.netAmount },
        },
      });

      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: { decrement: item.quantity },
          salesCount: { increment: item.quantity },
          enabled: true,
        },
      });

      await tx.transaction.create({
        data: {
          orderId: order.id,
          storeId: item.storeId,
          type: 'PAYMENT',
          amount: item.netAmount,
          reference: transactionRef,
        },
      });
      await tx.transaction.create({
        data: {
          orderId: order.id,
          storeId: item.storeId,
          type: 'COMMISSION',
          amount: item.commission,
          reference: transactionRef,
        },
      });
    }

    return tx.order.findUnique({
      where: { id: order.id },
      include: { items: true },
    });
  });

  if (!paid) throw ApiError.notFound('Commande introuvable');

  const items = paid.items;
  const storeIds = [...new Set(items.map((i) => i.storeId))];

  for (const storeId of storeIds) {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: { owner: true },
    });
    if (!store) continue;
    const storeItems = items.filter((i) => i.storeId === storeId);
    const commission = storeItems.reduce((s, i) => s + i.commission, 0);
    await createNotification(
      store.ownerId,
      'Nouvelle commande payée',
      `Commande ${paid.number} payée : ${storeItems.length} article(s). Commission plateforme : ${new Intl.NumberFormat('fr-FR').format(commission)} centimes.`,
      { orderId: paid.id, storeId },
    );
    await processPayoutsForStore(storeId);
  }

  await createNotification(
    paid.userId,
    'Paiement confirmé',
    `Votre commande ${paid.number} a été payée. Merci !`,
    { orderId: paid.id },
  );

  return paid;
}

export async function getOrderTotalCents(order) {
  return order.total;
}