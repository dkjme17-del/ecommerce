import { prisma } from '../lib/prisma.js';

export async function listNotifications(req, res, next) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const unread = await prisma.notification.count({
      where: { userId: req.user.id, read: false },
    });
    res.json({ notifications, unread });
  } catch (err) {
    next(err);
  }
}

export async function markRead(req, res, next) {
  try {
    const notification = await prisma.notification.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!notification) return res.status(404).json({ error: { message: 'Introuvable' } });
    const updated = await prisma.notification.update({
      where: { id: notification.id },
      data: { read: true },
    });
    res.json({ notification: updated });
  } catch (err) {
    next(err);
  }
}

export async function markAllRead(req, res, next) {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, read: false },
      data: { read: true },
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}