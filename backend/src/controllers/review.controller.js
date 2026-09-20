import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/apiError.js';

export async function listReviews(req, res, next) {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
    });
    if (!product) throw ApiError.notFound('Produit introuvable');

    const reviews = await prisma.review.findMany({
      where: { productId: product.id },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });

    res.json({ reviews });
  } catch (err) {
    next(err);
  }
}

export async function createReview(req, res, next) {
  try {
    const { rating, comment } = req.body;
    if (rating < 1 || rating > 5) {
      throw ApiError.badRequest('La note doit être entre 1 et 5');
    }

    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
    });
    if (!product) throw ApiError.notFound('Produit introuvable');

    // Seul un client ayant acheté et reçu le produit peut noter
    const bought = await prisma.orderItem.findFirst({
      where: {
        productId: product.id,
        order: { userId: req.user.id, status: 'DELIVERED' },
      },
    });
    if (!bought) {
      throw ApiError.forbidden(
        'Vous devez avoir reçu ce produit pour le noter',
      );
    }

    const existing = await prisma.review.findUnique({
      where: { productId_userId: { productId: product.id, userId: req.user.id } },
    });

    let review;
    if (existing) {
      review = await prisma.review.update({
        where: { id: existing.id },
        data: { rating, comment },
      });
    } else {
      review = await prisma.review.create({
        data: { productId: product.id, userId: req.user.id, rating, comment },
      });
    }

    // Recalcul de la moyenne
    const agg = await prisma.review.aggregate({
      where: { productId: product.id },
      _avg: { rating: true },
      _count: true,
    });

    await prisma.product.update({
      where: { id: product.id },
      data: {
        rating: agg._avg.rating || 0,
        numReviews: agg._count,
      },
    });

    res.status(201).json({ review });
  } catch (err) {
    next(err);
  }
}