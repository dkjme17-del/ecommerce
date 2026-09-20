import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/apiError.js';

async function getOrCreateCart(userId) {
  let cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId } });
  }
  return cart;
}

async function cartWithItems(cartId) {
  return prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        include: {
          product: {
            include: {
              store: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      },
    },
  });
}

function buildPayload(cart) {
  const items = cart.items.map(({ product, quantity }) => ({
    productId: product.id,
    name: product.name,
    slug: product.slug,
    images: product.images,
    price: product.price,
    quantity,
    stock: product.stock,
    total: product.price * quantity,
    store: product.store,
  }));
  return { items, count: items.reduce((s, i) => s + i.quantity, 0) };
}

export async function getCart(req, res, next) {
  try {
    const cart = await getOrCreateCart(req.user.id);
    const full = await cartWithItems(cart.id);
    res.json(buildPayload(full));
  } catch (err) {
    next(err);
  }
}

export async function addItem(req, res, next) {
  try {
    const { productId, quantity = 1 } = req.body;
    const product = await prisma.product.findUnique({ where: { id: productId } });

    if (!product || product.status !== 'ACTIVE' || !product.enabled) {
      throw ApiError.notFound('Produit non disponible');
    }
    if (quantity < 1) throw ApiError.badRequest('Quantité invalide');

    const cart = await getOrCreateCart(req.user.id);

    const existing = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });

    const newQty = (existing?.quantity || 0) + quantity;
    if (newQty > product.stock) {
      throw ApiError.badRequest(`Stock insuffisant (${product.stock} disponible)`);
    }

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQty },
      });
    } else {
      await prisma.cartItem.create({
        data: { cartId: cart.id, productId, quantity },
      });
    }

    const full = await cartWithItems(cart.id);
    res.status(201).json(buildPayload(full));
  } catch (err) {
    next(err);
  }
}

export async function updateItemQuantity(req, res, next) {
  try {
    const { quantity } = req.body;
    const cart = await getOrCreateCart(req.user.id);

    const item = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: req.params.productId,
        },
      },
      include: { product: true },
    });
    if (!item) throw ApiError.notFound('Article pas dans le panier');

    if (quantity < 1) throw ApiError.badRequest('Quantité invalide');
    if (quantity > item.product.stock) {
      throw ApiError.badRequest('Stock insuffisant');
    }

    await prisma.cartItem.update({ where: { id: item.id }, data: { quantity } });

    const full = await cartWithItems(cart.id);
    res.json(buildPayload(full));
  } catch (err) {
    next(err);
  }
}

export async function removeItem(req, res, next) {
  try {
    const cart = await getOrCreateCart(req.user.id);
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id, productId: req.params.productId },
    });
    const full = await cartWithItems(cart.id);
    res.json(buildPayload(full));
  } catch (err) {
    next(err);
  }
}

export async function clearCart(req, res, next) {
  try {
    const cart = await getOrCreateCart(req.user.id);
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    res.json({ items: [], count: 0 });
  } catch (err) {
    next(err);
  }
}