import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/apiError.js';
import { createNotification } from '../services/notification.service.js';
import { settleDeliveredItem } from '../services/settlement.service.js';

const ITEM_STATUS_FLOW = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

export async function stats(req, res, next) {
  try {
    const store = req.store;
    const [salesCount, productsCount, pendingPayouts, lowStock, pendingAgg] = await Promise.all([
      prisma.orderItem.count({
        where: { storeId: store.id, status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } },
      }),
      prisma.product.count({ where: { storeId: store.id, status: 'ACTIVE' } }),
      prisma.payout.count({ where: { storeId: store.id, status: 'PENDING' } }),
      prisma.product.count({ where: { storeId: store.id, stock: { lt: 5 }, status: 'ACTIVE' } }),
      prisma.orderItem.aggregate({
        where: { storeId: store.id, status: { not: 'DELIVERED' }, order: { paymentStatus: 'PAID' } },
        _sum: { netAmount: true },
      }),
    ]);

    const recentSales = await prisma.orderItem.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        order: { select: { id: true, number: true, createdAt: true, paymentStatus: true } },
        product: { select: { id: true, name: true, slug: true, images: true } },
      },
    });

    res.json({
      stats: {
        revenue: store.totalEarned,
        balance: store.balance,
        pendingBalance: pendingAgg._sum.netAmount || 0,
        salesCount,
        productsCount,
        pendingPayouts,
        lowStock,
        commissionRate: store.commissionRate,
      },
      recentSales,
    });
  } catch (err) {
    next(err);
  }
}

export async function orders(req, res, next) {
  try {
    const { status } = req.query;
    const where = { storeId: req.store.id };
    if (status) where.status = status;

    const items = await prisma.orderItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: {
            id: true,
            number: true,
            createdAt: true,
            paymentStatus: true,
              paymentMethod: true,
              transactionRef: true,
              address: true,
            user: { select: { id: true, name: true, phone: true } },
          },
        },
        product: { select: { id: true, name: true, slug: true, images: true } },
      },
    });

    res.json({ items });
  } catch (err) {
    next(err);
  }
}

export async function updateOrderItemStatus(req, res, next) {
  try {
    const item = await prisma.orderItem.findFirst({
      where: { id: req.params.id, storeId: req.store.id },
      include: { order: true },
    });
    if (!item) throw ApiError.notFound('Ligne de commande introuvable');

    const { status } = req.body;
    const idx = ITEM_STATUS_FLOW.indexOf(status);
    if (idx === -1) {
      throw ApiError.badRequest('Statut invalide');
    }
    if (idx !== ITEM_STATUS_FLOW.indexOf(item.status) + 1) {
      throw ApiError.badRequest('Transition de statut invalide');
    }
    if (item.order.paymentStatus !== 'PAID') {
      throw ApiError.badRequest('La commande n’est pas payée');
    }

    const updated = await prisma.orderItem.update({
      where: { id: item.id },
      data: { status },
    });

    if (status === 'DELIVERED') {
      await settleDeliveredItem(item.id);
      await createNotification(
        item.order.userId,
        'Colis livré',
        `Votre article de la commande ${item.order.number} a été livré. N'hésitez pas à laisser un avis.`,
        { orderId: item.orderId },
      );

      // Si toutes les lignes sont livrées → commande DELIVERED
      const pendingItems = await prisma.orderItem.count({
        where: { orderId: item.orderId, status: { not: 'DELIVERED' } },
      });
      if (pendingItems === 0) {
        await prisma.order.update({
          where: { id: item.orderId },
          data: { status: 'DELIVERED' },
        });
      }
    }

    res.json({ item: updated });
  } catch (err) {
    next(err);
  }
}

export async function payouts(req, res, next) {
  try {
    const payouts = await prisma.payout.findMany({
      where: { storeId: req.store.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ payouts });
  } catch (err) {
    next(err);
  }
}