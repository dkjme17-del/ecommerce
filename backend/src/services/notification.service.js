import { prisma } from '../lib/prisma.js';

export async function createNotification(userId, title, message, metadata = {}, type = 'info') {
  return prisma.notification.create({
    data: { userId, type, title, message, metadata },
  });
}