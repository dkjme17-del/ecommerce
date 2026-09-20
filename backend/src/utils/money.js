export const CURRENCY = 'FCFA';

export function toCents(amount) {
  return Math.round(amount * 100);
}

export function fromCents(cents) {
  return (cents / 100).toFixed(2);
}

export function formatCents(cents) {
  const value = (cents / 100).toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return `${value} ${CURRENCY}`;
}