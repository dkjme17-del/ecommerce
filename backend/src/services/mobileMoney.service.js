import crypto from 'crypto';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/apiError.js';
import { markOrderPaid } from './settlement.service.js';

let confirmTimers = new Map();

/**
 * Initie un paiement mobile money.
 * En mode sandbox : simule l'initiation puis confirme après un délai.
 * En mode live : à intégrer avec les SDK Wave / Orange Money / MTN MoMo.
 *
 * @param {{ id: string, number: string, total: number, paymentMethod: string }} order
 * @param {string} phone numéro de téléphone payeur
 */
export async function initiateMobileMoneyPayment(order, phone) {
  const reference = `MOMO-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  if (env.paymentMode === 'sandbox') {
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

  throw ApiError.badRequest(
    'Mode live non implémenté : intégrer les SDK Wave / Orange Money / MTN MoMo dans mobileMoney.service.js',
  );
}

/**
 * Statut d'un paiement.
 */
export async function getMobileMoneyPaymentStatus(ref) {
  const order = await prismaOrderByRef(ref);
  if (!order) return { reference: ref, status: 'NOT_FOUND' };
  return {
    reference: ref,
    status: order.paymentStatus === 'PAID' ? 'PAID' : 'PENDING',
  };
}

/**
 * Signe un corps de webhook avec HMAC-SHA256 (hex minuscule).
 * @param {Buffer|string} rawBody
 */
export function signWebhookBody(rawBody) {
  return crypto.createHmac('sha256', env.momoWebhookSecret).update(rawBody).digest('hex');
}

/**
 * Vérifie la signature HMAC-SHA256 d'un webhook reçu du fournisseur.
 * Le header attendu : x-momo-signature (hex du HMAC du corps brut).
 */
export function verifyWebhookSignature(rawBody, signature) {
  if (!env.momoWebhookSecret) return false;
  if (!rawBody || !signature) return false;
  const expected = signWebhookBody(rawBody);
  const a = Buffer.from(String(signature));
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Webhook reçu du fournisseur mobile money.
 * Doit être appelé APRÈS vérification de la signature via verifyWebhookSignature.
 */
export async function handleMobileMoneyWebhook(body) {
  const ref = body.reference || body.transaction_ref;
  const status = (body.status || '').toUpperCase();

  if (!ref) throw ApiError.badRequest('Référence manquante');
  if (status === 'SUCCESS' || status === 'COMPLETED' || status === 'PAID') {
    const order = await prismaOrderByRef(ref);
    if (!order) throw ApiError.notFound(`Aucune commande liée à la référence ${ref}`);
    return markOrderPaid(order.id, ref);
  }
  return { reference: ref, status: 'NOT_CONFIRMED' };
}

async function prismaOrderByRef(ref) {
  return prisma.order.findFirst({ where: { transactionRef: ref } });
}