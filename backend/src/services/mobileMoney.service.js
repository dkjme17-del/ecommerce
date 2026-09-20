import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/apiError.js';
import { markOrderPaid } from './settlement.service.js';
import { isConfigured as waveConfigured, createCheckoutSession, getCheckoutSession, isPaidCheckout } from './wave.service.js';

let confirmTimers = new Map();

/**
 * Initie un paiement mobile money.
 * - PAYMENT_MODE=live : intégration réelle Wave (Checkout API).
 * - PAYMENT_MODE=sandbox (défaut) : simulation avec confirmation automatique.
 *
 * @param {{ id: string, number: string, total: number, paymentMethod: string }} order
 * @param {string} phone numéro de téléphone du payeur
 * @param {{ successUrl?: string, errorUrl?: string, cancelUrl?: string }} redirects URLs de retour Wave
 */
export async function initiateMobileMoneyPayment(order, phone, redirects = {}) {
  if (env.paymentMode === 'live') {
    return initiateWavePayment(order, phone, redirects);
  }

  const reference = `MOMO-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  // En production, on appellerait ici l'API du fournisseur (USSD / collect)
  console.log(
    `[MOBILE-MONEY/SANDBOX] ${order.paymentMethod} initiation pour ${order.number} (${phone}) — ${order.total} centimes. Réf ${reference}`,
  );

  // On confirme le paiement automatiquement après un délai (simule l'USSD)
  const timer = setTimeout(async () => {
    try {
      await markOrderPaid(order.id, reference);
    } catch (err) {
      console.error('[SANDBOX] Confirmation échouée', err);
    } finally {
      confirmTimers.delete(reference);
    }
  }, env.paymentSandboxDelayMs);
  confirmTimers.set(reference, timer);

  return { reference, mode: 'sandbox', status: 'PENDING' };
}

async function initiateWavePayment(order, phone, redirects) {
  if (order.paymentMethod !== 'WAVE') {
    throw ApiError.badRequest(
      'Seul Wave est intégré pour l’instant (Orange Money et MTN MoMo à venir).',
    );
  }
  if (!waveConfigured()) {
    throw ApiError.badRequest(
      'Paiement Wave non configuré : renseignez WAVE_API_KEY côté serveur, ou passez PAYMENT_MODE=sandbox pour la démo.',
    );
  }

  const session = await createCheckoutSession({
    amount: order.total, // XOF (les montants Wave sont des entiers, pas de décimales)
    clientReference: order.number,
    phone,
    successUrl: redirects.successUrl,
    errorUrl: redirects.errorUrl,
    cancelUrl: redirects.cancelUrl,
  });

  return {
    reference: session.id, // cos-...
    mode: 'wave',
    status: 'PENDING',
    checkoutUrl: session.wave_launch_url,
  };
}

/**
 * Statut d'un paiement. En mode live, interroge Wave et confirme la commande
 * si les fonds sont réceptionnés (payment_status = succeeded).
 */
export async function getMobileMoneyPaymentStatus(ref) {
  if (env.paymentMode === 'live') {
    const session = await getCheckoutSession(ref).catch(() => null);
    if (!session) return { reference: ref, status: 'NOT_FOUND' };

    if (isPaidCheckout(session)) {
      const order = await prismaOrderByRef(ref);
      if (order && order.paymentStatus !== 'PAID') {
        await markOrderPaid(order.id, session.transaction_id || ref);
      }
      return { reference: ref, status: 'PAID' };
    }
    return {
      reference: ref,
      status: session.checkout_status === 'expired' ? 'EXPIRED' : 'PENDING',
    };
  }

  const order = await prismaOrderByRef(ref);
  if (!order) return { reference: ref, status: 'NOT_FOUND' };
  return {
    reference: ref,
    status: order.paymentStatus === 'PAID' ? 'PAID' : 'PENDING',
  };
}

/**
 * Traite un webhook Wave `checkout.session.completed` (après vérification de
 * la signature Wave-Signature dans le contrôleur). Idempotent : markOrderPaid
 * ne crédite qu'une fois une commande non payée.
 */
export async function handleWaveWebhook(body) {
  if (!body || body.type !== 'checkout.session.completed' || !body.data?.id) {
    return { received: true, handled: false };
  }

  const session = body.data;
  if (!isPaidCheckout(session)) {
    return { received: true, handled: false, status: session.payment_status };
  }

  const order = await prismaOrderByRef(session.id);
  if (!order) throw ApiError.notFound(`Aucune commande liée à la session Wave ${session.id}`);
  if (String(order.total) !== String(session.amount)) {
    throw ApiError.badRequest('Montant Wave incohérent avec la commande');
  }

  const paid = await markOrderPaid(order.id, session.transaction_id || session.id);
  return { received: true, handled: true, orderId: paid.id };
}

async function prismaOrderByRef(ref) {
  return prisma.order.findFirst({ where: { transactionRef: ref } });
}