import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/apiError.js';
import { env } from '../config/env.js';
import {
  initiateMobileMoneyPayment,
  getMobileMoneyPaymentStatus,
  handleWaveWebhook,
} from '../services/mobileMoney.service.js';
import { verifyWebhookSignature } from '../services/wave.service.js';
import {
  verifyWebhookSignature as geniuspayVerify,
  handleGeniusPayWebhook,
} from '../services/geniuspay.service.js';

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

    const baseUrl = env.clientUrl.split(',')[0].trim();
    const result = await initiateMobileMoneyPayment(order, phone, {
      successUrl: `${baseUrl}/orders/${order.id}?payment=success`,
      errorUrl: `${baseUrl}/checkout?payment=error`,
      cancelUrl: `${baseUrl}/checkout?payment=cancelled`,
    });

    if (order.transactionRef !== result.reference) {
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
        checkoutUrl: result.checkoutUrl || null,
        message:
          result.mode === 'geniuspay'
            ? 'Vous êtes redirigé vers le paiement sécurisé (Wave, Orange Money, MTN MoMo, Moov ou carte).'
            : result.mode === 'wave'
              ? 'Vous êtes redirigé vers Wave pour confirmer le paiement.'
              : `Paiement ${order.paymentMethod.replace('_', ' ')} initié. Confirmez sur votre téléphone.`,
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
    const signature = req.headers['wave-signature'];
    if (!verifyWebhookSignature(req.rawBody, signature)) {
      throw ApiError.unauthorized('Signature Wave invalide ou expirée');
    }
    const result = await handleWaveWebhook(req.body);
    res.json({ result });
  } catch (err) {
    next(err);
  }
}

export async function geniuspayWebhook(req, res, next) {
  try {
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];
    if (!geniuspayVerify(req.rawBody, signature, timestamp)) {
      throw ApiError.unauthorized('Signature webhook GeniusPay invalide ou expirée');
    }
    const result = await handleGeniusPayWebhook(req.body);
    res.json({ result });
  } catch (err) {
    next(err);
  }
}