import crypto from 'crypto';
import { env } from '../config/env.js';
import { ApiError } from '../lib/apiError.js';
import { prisma } from '../lib/prisma.js';
import { markOrderPaid } from './settlement.service.js';

/**
 * Client GeniusPay Merchant API — https://geniuspay.ci/docs/api
 *
 * Authentification : clé publique (`pk_sandbox_...` / `pk_live_...`) + clé
 * secrète (`sk_...`), envoyées dans les headers. L'environnement (sandbox ou
 * live) est déterminé par le préfixe des clés.
 */

export function isConfigured() {
  return Boolean(env.geniuspayApiKey && env.geniuspayApiSecret);
}

export function isSandbox() {
  return env.geniuspayApiKey.includes('sandbox');
}

function authHeaders() {
  return {
    'X-API-Key': env.geniuspayApiKey,
    'X-API-Secret': env.geniuspayApiSecret,
    Authorization: `Bearer ${env.geniuspayApiKey}`,
    'Content-Type': 'application/json',
  };
}

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${env.geniuspayBaseUrl}${path}`, {
    method,
    headers: authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json.error?.message || json.message || 'erreur inconnue';
    throw new ApiError(res.status || 400, `GeniusPay ${res.status}: ${msg}`);
  }
  return json;
}

/**
 * Crée un paiement GeniusPay et retourne l'URL de checkout hébergée.
 * Sans `payment_method`, le client choisit son moyen chez GeniusPay
 * (Wave, Orange Money, MTN MoMo, Moov, carte). Les metadata permettent
 * de lier la transaction à notre commande via le webhook.
 */
export async function createPayment({ order, customer, phone, redirects = {} }) {
  const payload = {
    amount: order.total, // XOF (entier)
    currency: 'XOF',
    description: `Commande ${order.number}`,
    customer: {
      name: customer?.name || customer?.fullName || '',
      email: customer?.email || undefined,
      phone: phone || customer?.phone || undefined,
    },
    metadata: { order_id: order.id },
    success_url: redirects.successUrl,
    error_url: redirects.errorUrl,
  };

  const json = await request('/payments', { method: 'POST', body: payload });
  const data = json.data || {};
  return {
    reference: data.reference,
    status: data.status,
    checkoutUrl: data.checkout_url || data.payment_url || null,
    metadata: data.metadata || {},
  };
}

/** Récupère l'état d'un paiement GeniusPay par sa référence (MTX-...). */
export async function getPaymentStatus(reference) {
  const json = await request(`/payments/${reference}`);
  return json.data || {};
}

/**
 * Vérifie la signature HMAC-SHA256 d'un webhook GeniusPay.
 * Format : signature = HMAC-SHA256("<timestamp>.<json_payload>", whsec).
 * Le timestamp ne doit pas avoir plus de 5 minutes (anti-rejeu).
 */
export function verifyWebhookSignature(rawBody, signatureHeader, timestampHeader) {
  const secret = env.geniuspayWebhookSecret;
  if (!secret || !rawBody || !signatureHeader || !timestampHeader) return false;

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestampHeader, 10)) > 300) return false;

  const payload =
    typeof rawBody === 'string' ? rawBody : Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : JSON.stringify(rawBody);
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${timestampHeader}.${payload}`)
    .digest('hex');
  const a = Buffer.from(String(signatureHeader));
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Traite un webhook GeniusPay (après vérification de la signature).
 * Idempotent : markOrderPaid ne crédite qu'une fois une commande non payée.
 */
export async function handleGeniusPayWebhook(body) {
  const data = body?.data;
  if (!data || !data.reference) {
    return { received: true, handled: false };
  }

  if (body.event === 'payment.success' || data.status === 'completed') {
    const orderId = data.metadata?.order_id;
    let order = orderId
      ? await prisma.order.findUnique({ where: { id: orderId } })
      : await prisma.order.findFirst({ where: { transactionRef: data.reference } });

    if (!order && orderId) {
      order = await prisma.order.findFirst({ where: { transactionRef: data.reference } });
    }
    if (!order) {
      throw ApiError.notFound(`Aucune commande liée au paiement GeniusPay ${data.reference}`);
    }
    if (Number(data.amount) !== Number(order.total)) {
      console.warn(
        `[GeniusPay] Montant du webhook (${data.amount}) diffère du total de la commande ${order.number} (${order.total}) — ref ${data.reference}. Paiement tout de même encaissé (signature vérifiée).`,
      );
    }

    const paid = await markOrderPaid(order.id, data.reference);
    return { received: true, handled: true, orderId: paid.id };
  }

  return { received: true, handled: false, event: body.event };
}