import { env } from '../config/env.js';

/**
 * Calcule la commission plateforme sur un montant.
 * @param {number} amountCents montant en centimes
 * @param {number} [rate] taux (défaut COMMISSION_RATE, 5 %)
 * @returns {{commission: number, net: number}} commission et net en centimes
 */
export function splitCommission(amountCents, rate = env.commissionRate) {
  const commission = Math.round(amountCents * rate);
  const net = amountCents - commission;
  return { commission, net };
}

/**
 * Applique la ligne de commission sur un OrderItem déjà calculé.
 * Prix unitaire fourni, quantity, on reçoit le subtotal en centimes
 * et on retourne commission + net.
 */
export function computeOrderItem(unitPriceCents, quantity, rate = env.commissionRate) {
  const subtotal = unitPriceCents * quantity;
  return { subtotal, ...splitCommission(subtotal, rate) };
}