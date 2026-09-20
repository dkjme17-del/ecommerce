import crypto from 'crypto';
import { env } from '../config/env.js';
import { ApiError } from '../lib/apiError.js';

/**
 * Client Wave Checkout API — https://docs.wave.com/checkout
 *
 * Authentification par clé API (Bearer) obtenue depuis business.wave.com
 * (portail développeur). Wave ne propose pas de sandbox : les clés sont
 * liées au portefeuille marchand réel. En développement, laisser
 * PAYMENT_MODE=sandbox pour conserver la simulation.
 */

export function isConfigured() {
  return Boolean(env.waveApiKey);
}

function waveSignature(body) {
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = `${timestamp}${body}`;
  const signature = crypto
    .createHmac('sha256', env.waveSigningSecret)
    .update(payload)
    .digest('hex');
  return `t=${timestamp},v1=${signature}`;
}

function waveHeaders(body = '') {
  const headers = {
    Authorization: `Bearer ${env.waveApiKey}`,
    'Content-Type': 'application/json',
  };
  if (env.waveSigningSecret) {
    headers['Wave-Signature'] = waveSignature(body);
  }
  return headers;
}

async function request(path, { method = 'GET', body } = {}) {
  const raw = body ? JSON.stringify(body) : '';
  const res = await fetch(`${env.waveBaseUrl}${path}`, {
    method,
    headers: waveHeaders(raw),
    body: method === 'GET' ? undefined : raw,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const details = json.code || json.message || 'erreur inconnue';
    throw new ApiError(res.status || 400, `Wave API ${res.status}: ${details}`);
  }
  return json;
}

/**
 * Crée une session de paiement Wave.
 * @param {{ amount: number, clientReference: string, phone?: string, successUrl: string, errorUrl: string, cancelUrl: string }} params
 * @returns {Promise<{ id: string, wave_launch_url: string, checkout_status: string, payment_status: string, transaction_id?: string }>}
 */
export async function createCheckoutSession(params) {
  return request('/v1/checkout/sessions', {
    method: 'POST',
    body: {
      amount: String(params.amount),
      currency: env.waveCurrency,
      client_reference: params.clientReference,
      restrict_payer_mobile: params.phone || undefined,
      success_url: params.successUrl,
      error_url: params.errorUrl,
      cancel_url: params.cancelUrl,
    },
  });
}

/**
 * Récupère une session Wave par son identifiant (cos-...).
 */
export async function getCheckoutSession(sessionId) {
  return request(`/v1/checkout/sessions/${sessionId}`);
}

/**
 * Une session est « payée » quand Wave a réceptionné les fonds, et seulement là.
 * (checkout_status complete ≠ fonds reçus : payment_status peut rester processing.)
 */
export function isPaidCheckout(session) {
  return session?.checkout_status === 'complete' && session?.payment_status === 'succeeded';
}

/**
 * Vérifie la signature « Wave-Signature » d'un webhook entrant.
 * Format : t={timestamp},v1={hmac-sha256(timestamp + corpsBrut, webhookSecret)}.
 * Plusieurs valeurs v1= sont acceptées (rotation de secret). Rejet des
 * messages de plus de 5 minutes (anti-rejeu).
 */
export function verifyWebhookSignature(rawBody, signatureHeader) {
  if (!env.waveWebhookSecret) return false;
  if (!rawBody || !signatureHeader) return false;

  let timestamp = null;
  const signatures = [];
  for (const part of String(signatureHeader).split(',')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const key = part.slice(0, eq);
    const value = part.slice(eq + 1);
    if (key === 't') timestamp = value;
    else if (key === 'v1') signatures.push(value);
  }
  if (!timestamp || signatures.length === 0) return false;

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp, 10)) > 300) return false;

  const body = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody);
  const expected = crypto
    .createHmac('sha256', env.waveWebhookSecret)
    .update(`${timestamp}${body}`)
    .digest('hex');
  const expectedBuf = Buffer.from(expected);

  return signatures.some((sig) => {
    const sigBuf = Buffer.from(sig);
    return sigBuf.length === expectedBuf.length && crypto.timingSafeEqual(sigBuf, expectedBuf);
  });
}