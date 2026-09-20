import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/apiError.js';
import { slugify } from '../utils/slugify.js';
import { publicStore } from '../utils/serializers.js';
import { createNotification } from '../services/notification.service.js';

export async function createStore(req, res, next) {
  try {
    const existing = await prisma.store.findUnique({
      where: { ownerId: req.user.id },
    });
    if (existing) {
      throw ApiError.conflict('Vous avez déjà une boutique');
    }

    const base = slugify(req.body.name) || 'boutique';
    let slug = base;
    let n = 1;
    while (await prisma.store.findUnique({ where: { slug } })) {
      slug = `${base}-${n++}`;
    }

    const store = await prisma.store.create({
      data: {
        ownerId: req.user.id,
        name: req.body.name,
        slug,
        description: req.body.description,
        logo: req.body.logo,
        banner: req.body.banner,
        payoutInfo: req.body.payoutInfo || null,
        status: 'PENDING',
      },
    });

    await createNotification(
      req.user.id,
      'Boutique en attente de validation',
      `Votre boutique « ${store.name} » a été soumise à validation par l’administrateur.`,
      { storeId: store.id },
    );

    res.status(201).json({ store });
  } catch (err) {
    next(err);
  }
}

export async function getMyStore(req, res, next) {
  try {
    const store = await prisma.store.findUnique({
      where: { ownerId: req.user.id },
      include: {
        _count: {
          select: {
            products: true,
            orderItems: true,
            payouts: true,
          },
        },
      },
    });
    if (!store) {
      return res.json({ store: null });
    }
    res.json({ store });
  } catch (err) {
    next(err);
  }
}

export async function updateStore(req, res, next) {
  try {
    const store = await prisma.store.findUnique({
      where: { ownerId: req.user.id },
    });
    if (!store) throw ApiError.notFound('Aucune boutique');

    const data = {};
    const allowed = ['name', 'description', 'logo', 'banner', 'payoutInfo'];
    for (const k of allowed) {
      if (req.body[k] !== undefined) data[k] = req.body[k];
    }

    if (data.name) {
      const base = slugify(data.name);
      let slug = base;
      let n = 1;
      const exists = (s) =>
        prisma.store.findFirst({
          where: { slug: s, NOT: { id: store.id } },
        });
      while (await exists(slug)) {
        slug = `${base}-${n++}`;
      }
      data.slug = slug;
    }

    if (data.payoutInfo) {
      const method = data.payoutInfo.method;
      if (!['WAVE', 'ORANGE_MONEY', 'MTN_MOMO'].includes(method)) {
        throw ApiError.badRequest('Méthode de paiement pour les payouts invalide');
      }
      if (!/^\+?[0-9\s-]{8,15}$/.test(data.payoutInfo.phone || '')) {
        throw ApiError.badRequest('Numéro de paiement invalide');
      }
    }

    const updated = await prisma.store.update({
      where: { id: store.id },
      data,
    });
    res.json({ store: updated });
  } catch (err) {
    next(err);
  }
}

export async function getPublicStore(req, res, next) {
  try {
    const store = await prisma.store.findUnique({
      where: { slug: req.params.slug },
      include: {
        products: {
          where: { status: 'ACTIVE', enabled: true },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { products: true } },
      },
    });
    if (!store || store.status !== 'APPROVED') {
      throw ApiError.notFound('Boutique introuvable');
    }
    res.json({ store: publicStore(store), products: store.products });
  } catch (err) {
    next(err);
  }
}