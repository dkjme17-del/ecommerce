export const CURRENCY = 'FCFA';

export function formatMoney(cents) {
  if (cents === null || cents === undefined) return `0 ${CURRENCY}`;
  const value = Math.round(cents / 100);
  return `${value.toLocaleString('fr-FR')} ${CURRENCY}`;
}

export function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}