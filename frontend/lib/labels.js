export const STATUS_LABELS = {
  PENDING: 'En attente',
  PAID: 'Payé',
  PROCESSING: 'En préparation',
  SHIPPED: 'Expédié',
  DELIVERED: 'Livré',
  CANCELLED: 'Annulé',
  REFUNDED: 'Remboursé',
  APPROVED: 'Approuvé',
  REJECTED: 'Rejeté',
  SUSPENDED: 'Suspendu',
  ACTIVE: 'Actif',
  ARCHIVED: 'Archivé',
  DRAFT: 'Brouillon',
  UNPAID: 'Non payé',
  FAILED: 'Échoué',
  SUCCESS: 'Réussi',
};

export function statusLabel(value) {
  if (!value) return '';
  return STATUS_LABELS[value] || value.replace(/_/g, ' ').toLowerCase();
}

export const ROLE_LABELS = {
  CUSTOMER: 'Client',
  SELLER: 'Vendeur',
  ADMIN: 'Admin',
};

export function roleLabel(role) {
  return ROLE_LABELS[role] || role;
}

export const PAYMENT_LABELS = {
  WAVE: 'Wave',
  ORANGE_MONEY: 'Orange Money',
  MTN_MOMO: 'MTN MoMo',
};

export function paymentLabel(method) {
  return PAYMENT_LABELS[method] || (method ? method.replace(/_/g, ' ') : '');
}