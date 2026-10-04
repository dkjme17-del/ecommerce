import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const store = await prisma.store.updateMany({
  where: { slug: 'boutique-alpha' },
  data: { commissionRate: 0.01 },
});

console.log(`stores updated: ${store.count} (boutique-alpha @ 1%)`);
await prisma.$disconnect();