import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/apiError.js';
import { createNotification } from '../services/notification.service.js';
import { processPayout } from '../services/payout.service.js';
import { env } from '../config/env.js';

export async function stats(_req, res, next) {
  try {
    const [
      totalSales,
      totalCommission,
      ordersCount,
      paidOrdersCount,
      usersCount,
      sellersCount,
      storesCount,
      pendingStores,
      productsCount,
      pendingPayoutsCount,
      stores,
    ] = await Promise.all([
      prisma.order.aggregate({
        where: { paymentStatus: 'PAID' },
        _sum: { total: true },
      }),
      prisma.transaction.aggregate({
        where: { type: 'COMMISSION' },
        _sum: { amount: true },
      }),
      prisma.order.count(),
      prisma.order.count({ where: { paymentStatus: 'PAID' } }),
      prisma.user.count(),
      prisma.user.count({ where: { roles: { has: 'SELLER' } } }),
      prisma.store.count(),
      prisma.store.count({ where: { status: 'PENDING' } }),
      prisma.product.count(),
      prisma.payout.count({ where: { status: 'PENDING' } }),
      prisma.store.findMany({ orderBy: { totalEarned: 'desc' }, take: 5 }),
    ]);

    res.json({
      stats: {
        totalSales: totalSales._sum.total || 0,
        totalCommission: totalCommission._sum.amount || 0,
        ordersCount,
        paidOrdersCount,
        usersCount,
        sellersCount,
        storesCount,
        pendingStores,
        productsCount,
        pendingPayoutsCount,
      },
      topStores: stores,
    });
  } catch (err) {
    next(err);
  }
}

export async function sales(req, res, next) {
  try {
    const { from, to, status, paymentStatus } = req.query;
    const where = {};
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }
    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 100,
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { include: { store: { select: { name: true } } } },
      },
    });

    res.json({ orders });
  } catch (err) {
    next(err);
  }
}

export async function commissions(_req, res, next) {
  try {
    const txns = await prisma.transaction.findMany({
      where: { type: { in: ['PAYMENT', 'COMMISSION'] } },
      orderBy: { createdAt: 'desc' },
      take: 600,
      include: {
        order: {
          select: {
            id: true,
            number: true,
            status: true,
            createdAt: true,
            transactionRef: true,
            user: { select: { name: true } },
          },
        },
        store: { select: { id: true, name: true } },
      },
    });

    const rows = new Map();
    for (const t of txns) {
      const key = `${t.orderId}|${t.storeId}`;
      const row = rows.get(key) || {
        orderId: t.orderId,
        orderNumber: t.order?.number,
        client: t.order?.user?.name,
        store: t.store?.name,
        orderStatus: t.order?.status,
        reference: t.order?.transactionRef,
        gross: 0,
        commission: 0,
        net: 0,
        deliveredAt: t.createdAt,
      };
      if (t.type === 'PAYMENT') row.net += t.amount;
      else row.commission += t.amount;
      row.gross = row.net + row.commission;
      rows.set(key, row);
    }

    const commissions = [...rows.values()]
      .filter((r) => r.commission > 0)
      .sort((a, b) => new Date(b.deliveredAt) - new Date(a.deliveredAt));

    res.json({ total: commissions.reduce((s, r) => s + r.commission, 0), commissions });
  } catch (err) {
    next(err);
  }
}

export async function listStores(req, res, next) {
  try {
    const { status } = req.query;
    const stores = await prisma.store.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { id: true, name: true, email: true, phone: true } },
        _count: { select: { products: true } },
      },
    });
    res.json({ stores });
  } catch (err) {
    next(err);
  }
}

export async function validateStore(req, res, next) {
  try {
    const { action } = req.body; // APPROVE | REJECT | SUSPEND | ACTIVATE
    const store = await prisma.store.findUnique({
      where: { id: req.params.id },
      include: { owner: true },
    });
    if (!store) throw ApiError.notFound('Boutique introuvable');

    let status;
    if (action === 'APPROVE') status = 'APPROVED';
    else if (action === 'REJECT') status = 'REJECTED';
    else if (action === 'SUSPEND') status = 'SUSPENDED';
    else if (action === 'ACTIVATE') status = 'APPROVED';
    else throw ApiError.badRequest('Action invalide');

    const updated = await prisma.store.update({
      where: { id: store.id },
      data: {
        status,
        activatedAt: status === 'APPROVED' ? store.activatedAt || new Date() : undefined,
      },
    });

    await createNotification(
      store.ownerId,
      status === 'APPROVED' ? 'Boutique validée 🎉' : `Boutique ${status.toLowerCase()}`,
      status === 'APPROVED'
        ? `Félicitations, votre boutique « ${store.name} » est en ligne ! Vous pouvez ajouter vos produits.`
        : `Votre boutique « ${store.name} » a été ${status.toLowerCase()} par l’administration.`,
      { storeId: store.id },
    );

    res.json({ store: updated });
  } catch (err) {
    next(err);
  }
}

export async function listUsers(req, res, next) {
  try {
    const { role } = req.query;
    const users = await prisma.user.findMany({
      where: role ? { roles: { has: role } } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { store: { select: { id: true, name: true, status: true } } },
    });
    res.json({
      users: users.map(({ password, ...u }) => u),
    });
  } catch (err) {
    next(err);
  }
}

export async function updateUserStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!['ACTIVE', 'SUSPENDED'].includes(status)) {
      throw ApiError.badRequest('Statut invalide');
    }
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) throw ApiError.notFound('Utilisateur introuvable');
    if (user.roles.includes('ADMIN')) {
      throw ApiError.forbidden('Impossible de suspendre un administrateur');
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { status },
    });

    await createNotification(
      user.id,
      status === 'ACTIVE' ? 'Compte réactivé' : 'Compte suspendu',
      status === 'ACTIVE'
        ? 'Votre compte a été réactivé par l’administration.'
        : 'Votre compte a été suspendu. Contactez le support.',
    );

    res.json({ user: { id: updated.id, status: updated.status } });
  } catch (err) {
    next(err);
  }
}

export async function listProducts(_req, res, next) {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        store: { select: { id: true, name: true, slug: true } },
        category: { select: { id: true, name: true } },
      },
    });
    res.json({ products });
  } catch (err) {
    next(err);
  }
}

export async function updateProductStatus(req, res, next) {
  try {
    const { status, enabled } = req.body;
    if (!['ACTIVE', 'DRAFT', 'ARCHIVED'].includes(status)) {
      throw ApiError.badRequest('Statut invalide');
    }
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { store: true },
    });
    if (!product) throw ApiError.notFound('Produit introuvable');

    const updated = await prisma.product.update({
      where: { id: product.id },
      data: {
        status,
        enabled: enabled !== undefined ? enabled : product.enabled,
      },
    });

    await createNotification(
      product.store.ownerId,
      status === 'ACTIVE' ? 'Produit autorisé' : `Produit ${status.toLowerCase()}`,
      `Votre produit « ${product.name} » est maintenant ${status === 'ACTIVE' ? 'visible sur la plateforme' : status.toLowerCase()} par l’administration.`,
      { productId: product.id },
    );

    res.json({ product: updated });
  } catch (err) {
    next(err);
  }
}

export async function pendingPayouts(_req, res, next) {
  try {
    const payouts = await prisma.payout.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      include: {
        store: { select: { id: true, name: true, payoutInfo: true, owner: { select: { name: true, phone: true } } } },
      },
    });
    res.json({ payouts });
  } catch (err) {
    next(err);
  }
}

export async function processOnePayout(req, res, next) {
  try {
    const payout = await processPayout(req.params.id, req.body?.reference);
    res.json({ payout });
  } catch (err) {
    next(err);
  }
}

export async function runAutoPayouts(_req, res, next) {
  try {
    const stores = await prisma.store.findMany({
      where: { balance: { gte: env.minPayoutAmount } },
    });
    const results = [];
    for (const store of stores) {
      const pending = await prisma.payout.findFirst({
        where: { storeId: store.id, status: 'PENDING' },
      });
      if (pending) continue;
      await createPayoutFor(store.id);
    }
    res.json({ success: true, processed: results });
  } catch (err) {
    next(err);
  }
}

async function createPayoutFor(storeId) {
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  const payout = await prisma.payout.create({
    data: {
      storeId,
      amount: store.balance,
      commission: 0,
      method: store.payoutInfo?.method || 'WAVE',
    },
    });
    if (env.paymentMode === 'sandbox') await processPayout(payout.id);
    return payout;
  }