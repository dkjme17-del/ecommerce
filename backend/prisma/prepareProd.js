import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const mode = process.argv[2];
const file = process.argv[3] || 'prod-dump.json';
if (!['export', 'import'].includes(mode)) {
  console.error('Usage: node prisma/prepareProd.js <export|import> [dump.json]');
  console.error('  export : lit la base pointée par DATABASE_URL/.env et écrit le dump.');
  console.error('  import : lit le dump et l\'insère dans la base pointée par DATABASE_URL/.env.');
  process.exit(1);
}

const prisma = new PrismaClient();

async function exportData() {
  const users = await prisma.user.findMany({ include: { store: true } });
  const categories = await prisma.category.findMany();
  const products = await prisma.product.findMany({
    where: { status: 'ACTIVE' },
    include: { category: true, store: { include: { owner: true } } },
  });
  const dump = {
    exportedAt: new Date().toISOString(),
    categories: categories.map((c) => ({
      name: c.name,
      slug: c.slug,
      description: c.description,
      icon: c.icon,
    })),
    users: users.map((u) => ({
      email: u.email,
      name: u.name,
      phone: u.phone,
      password: u.password,
      roles: u.roles,
      status: u.status,
      avatar: u.avatar,
    })),
    products: products.map((p) => ({
      name: p.name,
      slug: p.slug,
      description: p.description,
      categorySlug: p.category.slug,
      storeOwnerEmail: p.store.owner.email,
      storeName: p.store.name,
      storeSlug: p.store.slug,
      storeDescription: p.store.description,
      storeStatus: p.store.status,
      storeCommissionRate: p.store.commissionRate,
      storePayoutInfo: p.store.payoutInfo,
      storeLogo: p.store.logo,
      storeLogoPublicId: null,
      storeActivatedAt: p.store.activatedAt,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      stock: p.stock,
      images: p.images,
      status: p.status,
      enabled: p.enabled,
      rating: p.rating,
    })),
  };
  fs.writeFileSync(file, JSON.stringify(dump, null, 2));
  console.log(`export OK: ${dump.users.length} users, ${dump.categories.length} categories, ${dump.products.length} produits -> ${file}`);
}

async function importData() {
  if (!fs.existsSync(file)) {
    console.error(`Aucun dump trouvé : ${file}`);
    process.exit(1);
  }
  const dump = JSON.parse(fs.readFileSync(file, 'utf8'));

  for (const c of dump.categories) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
  }
  console.log(`categories: ${dump.categories.length}`);

  for (const u of dump.users) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (!existing) await prisma.user.create({ data: u });
  }
  console.log(`users: ${dump.users.length}`);

  for (const p of dump.products) {
    const owner = await prisma.user.findUnique({ where: { email: p.storeOwnerEmail } });
    if (!owner) {
      console.log(`skip ${p.name}: owner absent`);
      continue;
    }
    let store = await prisma.store.findUnique({ where: { ownerId: owner.id } });
    if (!store) {
      store = await prisma.store.create({
        data: {
          ownerId: owner.id,
          name: p.storeName,
          slug: p.storeSlug,
          description: p.storeDescription,
          status: p.storeStatus,
          commissionRate: p.storeCommissionRate,
          payoutInfo: p.storePayoutInfo,
          logo: p.storeLogo,
          activatedAt: p.storeActivatedAt,
        },
      });
      console.log(`store: ${store.slug}`);
    }
    const cat = await prisma.category.findUnique({ where: { slug: p.categorySlug } });
    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (existing) continue;
    await prisma.product.create({
      data: {
        storeId: store.id,
        categoryId: cat.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        stock: p.stock,
        images: p.images,
        status: p.status,
        enabled: p.enabled,
        rating: p.rating,
        numReviews: 0,
        salesCount: 0,
      },
    });
    console.log(`product: ${p.name}`);
  }
  console.log('import terminé.');
}

(mode === 'export' ? exportData() : importData())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });