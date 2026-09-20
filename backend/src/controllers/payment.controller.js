import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/apiError.js';
import {
  initiateMobileMoneyPayment,
  getMobileMoneyPaymentStatus,
  handleMobileMoneyWebhook,
  verifyWebhookSignature,
} from '../services/mobileMoney.service.js';

export async function initiatePayment(req, res, next) {
  try {
    const { orderId, phone } = req.body;
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) throw ApiError.notFound('Commande introuvable');
    if (order.userId !== req.user.id) throw ApiError.forbidden('Accès refusé');
    if (order.paymentStatus === 'PAID') {
      throw ApiError.badRequest('Commande déjà payée');
    }
    if (!/^\+?[0-9\s-]{8,15}$/.test(phone || '')) {
      throw ApiError.badRequest('Numéro de téléphone invalide');
    }

    const result = await initiateMobileMoneyPayment(order, phone);

    if (result.mode === 'sandbox' && order.transactionRef !== result.reference) {
      await prisma.order.update({
        where: { id: order.id },
        data: { transactionRef: result.reference },
      });
    }

    res.json({
      payment: {
        reference: result.reference,
        status: result.status,
        mode: result.mode,
        message: `Paiement ${order.paymentMethod.replace('_', ' ')} initié. Confirmez sur votre téléphone.`,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function paymentStatus(req, res, next) {
  try {
    const status = await getMobileMoneyPaymentStatus(req.params.reference);
    res.json({ payment: status });
  } catch (err) {
    next(err);
  }
}

export async function webhook(req, res, next) {
  try {
    const signature = req.headers['x-momo-signature'] || req.headers['x-signature'];
    if (!verifyWebhookSignature(req.rawBody, signature)) {
      throw ApiError.unauthorized('Signature webhook invalide ou manquante');
    }
    const result = await handleMobileMoneyWebhook(req.body);
    res.json({ result });
  } catch (err) {
    next(err);
  }
}