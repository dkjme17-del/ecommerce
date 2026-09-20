import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/apiError.js';
import { slugify, generateUniqueSuffix } from '../utils/slugify.js';
import { paginate } from '../utils/serializers.js';

const SORTS = {
  newest: { createdAt: 'desc' },
  price_asc: { price: 'asc' },
  price_desc: { price: 'desc' },
  popular: { salesCount: 'desc' },
  rating: { rating: 'desc' },
};

export async function listProducts(req, res, next) {
  try {
    const {
      q,
      category,
      store,
      priceMin,
      priceMax,
      sort = 'popular',
    } = req.query;
    const { page, limit, skip } = paginate(req.query);

    const where = {
      status: 'ACTIVE',
      enabled: true,
      store: { status: 'APPROVED' },
    };

    if (q) {
      where.name = { contains: q, mode: 'insensitive' };
    }
    if (category) {
      where.categoryId = category;
    }
    if (store) {
      where.storeId = store;
    }
    if (priceMin !== undefined) where.price = { gte: parseInt(priceMin, 10) * 100 };
    if (priceMax !== undefined) {
      where.price = { ...where.price, lte: parseInt(priceMax, 10) * 100 };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: SORTS[sort] || SORTS.popular,
        skip,
        take: limit,
        include: {
          store: { select: { id: true, name: true, slug: true } },
          category: { select: { id: true, name: true, slug: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      products,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

export async function getProductBySlug(req, res, next) {
  try {
    const product = await prisma.product.findFirst({
      where: { slug: req.params.slug, status: 'ACTIVE', enabled: true },
      include: {
        store: { select: { id: true, name: true, slug: true, logo: true, status: true } },
        category: { select: { id: true, name: true } },
        reviews: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!product) throw ApiError.notFound('Produit introuvable');
    res.json({ product });
  } catch (err) {
    next(err);
  }
}

export async function storeProducts(req, res, next) {
  try {
    const products = await prisma.product.findMany({
      where: { storeId: req.params.storeId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      include: { category: { select: { name: true } } },
    });
    res.json({ products });
  } catch (err) {
    next(err);
  }
}

export async function featuredProducts(_req, res, next) {
  try {
    const products = await prisma.product.findMany({
      where: { status: 'ACTIVE', enabled: true, store: { status: 'APPROVED' } },
      orderBy: [{ rating: 'desc' }, { salesCount: 'desc' }],
      take: 12,
      include: { store: { select: { id: true, name: true, slug: true } } },
    });
    res.json({ products });
  } catch (err) {
    next(err);
  }
}

/* ---------------- SLUGS ---------------- */

export async function generateProductSlug(name, storeId) {
  const base = slugify(name) || `produit-${generateUniqueSuffix()}`;
  let candidate = base;
  let n = 1;
  while (
    await prisma.product.findFirst({ where: { slug: candidate, storeId } })
  ) {
    candidate = `${base}-${n++}`;
  }
  return candidate;
}

/* ---------------- VENDEUR ---------------- */

export async function sellerListProducts(req, res, next) {
  try {
    const products = await prisma.product.findMany({
      where: { storeId: req.store.id },
      orderBy: { createdAt: 'desc' },
      include: { category: { select: { id: true, name: true } } },
    });
    res.json({ products });
  } catch (err) {
    next(err);
  }
}

export async function createProduct(req, res, next) {
  try {
    const { name, description, price, compareAtPrice, stock = 0, categoryId, images = [] } = req.body;

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) throw ApiError.badRequest('Catégorie invalide');

    const slug = await generateProductSlug(name, req.store.id);

    const product = await prisma.product.create({
      data: {
        storeId: req.store.id,
        categoryId,
        name,
        slug,
        description,
        price,
        compareAtPrice,
        stock,
        images,
        status: 'ACTIVE',
        enabled: stock > 0,
      },
    });

    res.status(201).json({ product });
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(req, res, next) {
  try {
    const product = await getOwnedProduct(req);
    const { name, description, price, compareAtPrice, stock, categoryId, images } = req.body;

    const data = {
      name,
      description,
      price,
      compareAtPrice,
      stock,
      categoryId,
      images,
    };

    if (name !== undefined) {
      data.slug = await generateProductSlug(name, req.store.id);
    }
    if (stock !== undefined) {
      data.enabled = stock > 0;
    }

    for (const k in data) if (data[k] === undefined) delete data[k];

    const updated = await prisma.product.update({
      where: { id: product.id },
      data,
    });
    res.json({ product: updated });
  } catch (err) {
    next(err);
  }
}

export async function deleteProduct(req, res, next) {
  try {
    const product = await getOwnedProduct(req);
    await prisma.product.update({
      where: { id: product.id },
      data: { status: 'ARCHIVED', enabled: false },
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function updateStock(req, res, next) {
  try {
    const product = await getOwnedProduct(req);
    const { stock } = req.body;
    const updated = await prisma.product.update({
      where: { id: product.id },
      data: { stock, enabled: stock > 0 },
    });
    res.json({ product: updated });
  } catch (err) {
    next(err);
  }
}

async function getOwnedProduct(req) {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) throw ApiError.notFound('Produit introuvable');
  if (product.storeId !== req.store.id) {
    throw ApiError.forbidden('Ce produit n’appartient pas à votre boutique');
  }
  return product;
}