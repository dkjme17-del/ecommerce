import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/apiError.js';
import { slugify, generateUniqueSuffix } from '../utils/slugify.js';

export async function listCategories(req, res, next) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });

    // Seuls les produits réellement visibles dans la vitrine sont comptés
    // (ACTIVE + activé + boutique approuvée), pour correspondre au catalogue.
    const counts = await prisma.product.groupBy({
      by: ['categoryId'],
      where: { status: 'ACTIVE', enabled: true, store: { status: 'APPROVED' } },
      _count: { _all: true },
    });
    const countByCategory = new Map(counts.map((c) => [c.categoryId, c._count._all]));

    res.json({
      categories: categories.map((c) => ({
        ...c,
        _count: { products: countByCategory.get(c.id) ?? 0 },
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function createCategory(req, res, next) {
  try {
    const { name, description, icon, parentId } = req.body;
    const slug = await uniqueCategorySlug(name);
    const category = await prisma.category.create({
      data: { name, slug, description, icon, parentId },
    });
    res.status(201).json({ category });
  } catch (err) {
    next(err);
  }
}

export async function updateCategory(req, res, next) {
  try {
    const { name, description, icon, parentId } = req.body;
    const data = { description, icon, parentId };
    if (name !== undefined) {
      data.name = name;
      data.slug = await uniqueCategorySlug(name, req.params.id);
    }
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data,
    });
    res.json({ category });
  } catch (err) {
    next(err);
  }
}

export async function deleteCategory(req, res, next) {
  try {
    const count = await prisma.product.count({
      where: { categoryId: req.params.id },
    });
    if (count > 0) {
      throw ApiError.conflict('Cette catégorie contient des produits, déplacez-les avant de la supprimer');
    }
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function uniqueCategorySlug(name, ignoreId) {
  const base = slugify(name);
  let candidate = base;
  let n = 1;
  while (
    await prisma.category.findFirst({
      where: { slug: candidate, NOT: ignoreId ? { id: ignoreId } : undefined },
    })
  ) {
    candidate = `${base}-${n++}`;
  }
  return candidate;
}