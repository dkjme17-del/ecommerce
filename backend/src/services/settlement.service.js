import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/apiError.js';
import { createNotification } from './notification.service.js';
import { processPayoutsForStore } from './payout.service.js';
import { sendOrderPaidEmail, sendSellerSettledEmail, sendAdminCommissionEmail } from './email.service.js';

/**
 * Confirme le paiement d'une commande à la réception du webhook fournisseur :
 *  - marque la commande PAID (claim atomique : idempotent face aux doublons)
 *  - décrémente le stock, incrémente les ventes
 *  - ne crédite AUCUN solde : le net vendeur et la commission 1 % admin ne sont
 *    comptabilisés qu'à la livraison (settleDeliveredItem).
 */
export async function markOrderPaid(orderId, transactionRef) {
  const paid = await prisma.$transaction(async (tx) => {
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
      const existing = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: { include: { store: true, product: { select: { name: true } } } }, user: true },
      });
      if (!existing) throw ApiError.notFound('Commande introuvable');
      return existing;
    }

    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { store: true, product: { select: { name: true } } } }, user: true },
    });
    if (!order) throw ApiError.notFound('Commande introuvable');

    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: { decrement: item.quantity },
          salesCount: { increment: item.quantity },
          enabled: true,
        },
      });
    }

    return order;
  }, { timeout: 60000 });

  const storeIds = [...new Set(paid.items.map((i) => i.storeId))];
  for (const storeId of storeIds) {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: { owner: true },
    });
    if (!store) continue;
    const storeItems = paid.items.filter((i) => i.storeId === storeId);
    await createNotification(
      store.ownerId,
      'Commande payée — à livrer',
      `La commande ${paid.number} est payée (${storeItems.length} article(s)). Préparez la livraison : votre solde (net) sera crédité à la livraison, commission plateforme 1 % incluse.`,
      { orderId: paid.id, storeId },
    );
  }

  await createNotification(
    paid.userId,
    'Paiement confirmé',
    `Votre commande ${paid.number} a été payée. Merci !`,
    { orderId: paid.id },
  );
  if (paid.user?.email) sendOrderPaidEmail(paid.user.email, paid).catch(() => {});

  return paid;
}

/**
 * Comptabilise le règlement d'une ligne livrée :
 *  - crédite le solde net (après commission 1 %) de la boutique
 *  - retrace les transactions (paiement + commission)
 *  - idempotent : la colonne settledAt est un claim atomique.
 */
export async function settleDeliveredItem(itemId) {
  const settled = await prisma.$transaction(async (tx) => {
    const claim = await tx.orderItem.updateMany({
      where: { id: itemId, settledAt: null, order: { paymentStatus: 'PAID' } },
      data: { settledAt: new Date() },
    });

    const item = await tx.orderItem.findUnique({
      where: { id: itemId },
      include: {
        store: { include: { owner: true } },
        order: true,
        product: { select: { name: true } },
      },
    });
    if (!item) throw ApiError.notFound('Ligne introuvable');

    if (claim.count === 0) return item;

    await tx.store.update({
      where: { id: item.storeId },
      data: {
        balance: { increment: item.netAmount },
        totalEarned: { increment: item.netAmount },
      },
    });

    await tx.transaction.create({
      data: {
        orderId: item.orderId,
        storeId: item.storeId,
        type: 'PAYMENT',
        amount: item.netAmount,
        reference: item.order.transactionRef,
        metadata: { itemId: item.id },
      },
    });
    await tx.transaction.create({
      data: {
        orderId: item.orderId,
        storeId: item.storeId,
        type: 'COMMISSION',
        amount: item.commission,
        reference: item.order.transactionRef,
        metadata: { itemId: item.id },
      },
    });

    return item;
  }, { timeout: 60000 });

  if (settled.settledAt && settled.order?.paymentStatus === 'PAID') {
    const commission = new Intl.NumberFormat('fr-FR').format(settled.commission);
    const net = new Intl.NumberFormat('fr-FR').format(settled.netAmount);
    await createNotification(
      settled.store.ownerId,
      'Vente encaissée',
      `Article livré (commande ${settled.order.number}) : ${net} c crédités à votre solde. Commission plateforme : ${commission} c.`,
      { orderId: settled.orderId, storeId: settled.storeId },
    );
    await processPayoutsForStore(settled.storeId);

    if (settled.store?.owner?.email) {
      sendSellerSettledEmail(settled.store.owner.email, settled).catch(() => {});
    }
    const admin = await prisma.user.findFirst({ where: { roles: { has: 'ADMIN' } } });
    if (admin?.email) sendAdminCommissionEmail(admin.email, settled).catch(() => {});
  }

  return settled;
}

export async function getOrderTotalCents(order) {
  return order.total;
}