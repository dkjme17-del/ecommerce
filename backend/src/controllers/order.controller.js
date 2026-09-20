import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/apiError.js';
import { computeOrderItem } from '../services/commission.service.js';
import { createNotification } from '../services/notification.service.js';

export async function createOrder(req, res, next) {
  try {
    const { items, shippingAddress, paymentMethod, shippingFee = 0 } = req.body;

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.address) {
      throw ApiError.badRequest('Adresse de livraison invalide');
    }
    if (!['WAVE', 'ORANGE_MONEY', 'MTN_MOMO'].includes(paymentMethod)) {
      throw ApiError.badRequest('Méthode de paiement invalide');
    }

    let lines = items;
    if (!lines || lines.length === 0) {
      const cart = await prisma.cart.findUnique({
        where: { userId: req.user.id },
        include: { items: true },
      });
      if (!cart || cart.items.length === 0) {
        throw ApiError.badRequest('Panier vide');
      }
      lines = cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity }));
    }

    const productIds = [...new Set(lines.map((l) => l.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { store: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const orderLines = [];
    let subtotal = 0;

    for (const line of lines) {
      const product = productMap.get(line.productId);
      if (!product || product.status !== 'ACTIVE' || !product.enabled) {
        throw ApiError.badRequest(`Produit ${line.productId} indisponible`);
      }
      const quantity = line.quantity;
      if (quantity < 1) throw ApiError.badRequest('Quantité invalide');
      if (quantity > product.stock) {
        throw ApiError.badRequest(
          `Stock insuffisant pour « ${product.name} » (${product.stock} dispo)`,
        );
      }
      const { subtotal: lineSubtotal, commission, net } = computeOrderItem(
        product.price,
        quantity,
        product.store.commissionRate,
      );
      subtotal += lineSubtotal;
      orderLines.push({
        storeId: product.storeId,
        productId: product.id,
        unitPrice: product.price,
        quantity,
        subtotal: lineSubtotal,
        commission,
        netAmount: net,
      });
    }

    const number = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random()
      .toString(36)
      .slice(2, 7)
      .toUpperCase()}`;

    const order = await prisma.order.create({
      data: {
        number,
        userId: req.user.id,
        paymentMethod,
        subtotal,
        shippingFee,
        total: subtotal + shippingFee,
        address: shippingAddress,
        items: { create: orderLines },
      },
      include: { items: true },
    });

    // Vider le panier si la commande vient de celui-ci
    if (!items || items.length === 0) {
      await prisma.cartItem.deleteMany({ where: { cart: { userId: req.user.id } } });
    }

    await createNotification(
      req.user.id,
      'Commande créée',
      `Votre commande ${number} a été créée. Procédez au paiement.`,
      { orderId: order.id },
    );

    res.status(201).json({ order });
  } catch (err) {
    next(err);
  }
}

export async function myOrders(req, res, next) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { items: { include: { product: { select: { id: true, name: true, slug: true, images: true } }, store: { select: { id: true, name: true, slug: true } } } } },
    });
    res.json({ orders });
  } catch (err) {
    next(err);
  }
}

export async function getOrder(req, res, next) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true, images: true } },
            store: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });

    if (!order) throw ApiError.notFound('Commande introuvable');
    if (order.userId !== req.user.id && !req.user.roles.includes('ADMIN')) {
      throw ApiError.forbidden('Accès refusé');
    }

    res.json({ order });
  } catch (err) {
    next(err);
  }
}

export async function cancelOrder(req, res, next) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });

    if (!order) throw ApiError.notFound('Commande introuvable');
    if (order.userId !== req.user.id) throw ApiError.forbidden('Accès refusé');
    if (!['PENDING', 'PAID'].includes(order.status)) {
      throw ApiError.badRequest('Cette commande ne peut plus être annulée');
    }
    if (order.paymentStatus === 'PAID') {
      // En production : déclencher un remboursement mobile money
      throw ApiError.badRequest('Commande payée : contactez le support pour un remboursement');
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: 'CANCELLED', paymentStatus: 'UNPAID' },
    });

    await createNotification(
      req.user.id,
      'Commande annulée',
      `Votre commande ${updated.number} a été annulée.`,
      { orderId: order.id },
    );

    res.json({ order: updated });
  } catch (err) {
    next(err);
  }
}