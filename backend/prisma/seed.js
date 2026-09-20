import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const categories = [
  { name: 'Électronique', description: 'Téléphones, ordinateurs, TV', icon: '📱' },
  { name: 'Mode', description: 'Vêtements, chaussures, accessoires', icon: '👗' },
  { name: 'Maison & Cuisine', description: 'Ustensiles, déco', icon: '🏠' },
  { name: 'Beauté & Santé', description: 'Cosmétiques, soins', icon: '💄' },
  { name: 'Sport & Loisirs', description: 'Matériel de sport', icon: '⚽' },
  { name: 'Alimentation', description: 'Produits alimentaires', icon: '🍎' },
];

async function createCategoryWithSlug(name, description, icon) {
  return prisma.category.upsert({
    where: { name },
    update: {},
    create: {
      name,
      slug: name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, ''),
      description,
      icon,
    },
  });
}

async function makeUser(name, email, phone, password, roles) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;
  return prisma.user.create({
    data: {
      name,
      email,
      phone,
      password: await bcrypt.hash(password, 10),
      roles,
    },
  });
}

async function main() {
  console.log('Seeding…');

  // Les catégories restent toujours créées.
  const catDeps = {};
  for (const c of categories) {
    catDeps[c.name] = await createCategoryWithSlug(c.name, c.description, c.icon);
  }

  // Données de démonstration (comptes avec mots de passe connus, boutique,
  // produits, notifications) : désactivées en production sauf si SEED_DEMO=true.
  const seedDemo = process.env.SEED_DEMO === 'true' || process.env.NODE_ENV !== 'production';
  if (!seedDemo) {
    console.log('✓ Catégories créées (données de démonstration désactivées en production).');
    console.log('  Pour les forcer : SEED_DEMO=true node prisma/seed.js');
    return;
  }

  const admin = await makeUser(
    'Administrateur',
    'admin@demo.com',
    '+221770000001',
    'demo123',
    ['ADMIN'],
  );
  const seller = await makeUser(
    'Boutique Alpha',
    'seller@demo.com',
    '+221770000002',
    'demo123',
    ['CUSTOMER', 'SELLER'],
  );
  const client = await makeUser(
    'Client Demo',
    'client@demo.com',
    '+221770000003',
    'demo123',
    ['CUSTOMER'],
  );

  let store = await prisma.store.findUnique({ where: { ownerId: seller.id } });
  if (!store) {
    store = await prisma.store.create({
      data: {
        ownerId: seller.id,
        name: 'Boutique Alpha',
        slug: 'boutique-alpha',
        description: 'Électronique et accessoires de qualité.',
        status: 'APPROVED',
        activatedAt: new Date(),
        payoutInfo: { method: 'ORANGE_MONEY', phone: '+221770000002' },
      },
    });
  }

  const productsData = [
    {
      name: 'Smartphone X200 128 Go',
      price: 180000,
      compareAtPrice: 200000,
      stock: 25,
      cat: 'Électronique',
    },
    {
      name: 'Écouteurs sans fil Pro',
      price: 15000,
      compareAtPrice: 20000,
      stock: 60,
      cat: 'Électronique',
    },
    {
      name: 'Smart TV 43" Ultra HD',
      price: 210000,
      stock: 12,
      cat: 'Électronique',
    },
    {
      name: 'Chemise en coton (homme)',
      price: 12000,
      stock: 80,
      cat: 'Mode',
    },
    {
      name: 'Sac à main en cuir',
      price: 25000,
      compareAtPrice: 30000,
      stock: 30,
      cat: 'Mode',
    },
    {
      name: 'Set de casseroles 10 pièces',
      price: 45000,
      stock: 18,
      cat: 'Maison & Cuisine',
    },
    {
      name: 'Lampe de chevet LED',
      price: 8000,
      stock: 45,
      cat: 'Maison & Cuisine',
    },
    {
      name: 'Crème hydratante visage',
      price: 5000,
      stock: 100,
      cat: 'Beauté & Santé',
    },
    {
      name: 'Ballon de football',
      price: 9000,
      stock: 40,
      cat: 'Sport & Loisirs',
    },
    {
      name: 'Miel naturel 500g',
      price: 4500,
      stock: 55,
      cat: 'Alimentation',
    },
  ];

  for (const p of productsData) {
    const slug = `${p.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')}`;

    await prisma.product.upsert({
      where: { slug },
      update: {},
      create: {
        storeId: store.id,
        categoryId: catDeps[p.cat].id,
        name: p.name,
        slug,
        description: `Produit de démonstration : ${p.name}.`,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        stock: p.stock,
        images: [],
        status: 'ACTIVE',
        enabled: p.stock > 0,
        rating: 4,
        numReviews: 0,
      },
    });
  }

  await prisma.notification.createMany({
    data: [
      { userId: admin.id, type: 'info', title: 'Bienvenue Admin', message: 'Gérez la plateforme depuis votre tableau de bord.' },
      { userId: seller.id, type: 'info', title: 'Boutique en ligne', message: 'Votre boutique est validée, ajoutez des produits.' },
      { userId: client.id, type: 'info', title: 'Bienvenue !', message: 'Découvrez nos produits en avant-première.' },
    ],
  });

  console.log('✓ Seed terminé');
  console.log({ admin: admin.email, seller: seller.email, client: client.email, store: store.slug });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });