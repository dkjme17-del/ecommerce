'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../lib/auth-context';
import { apiGet, apiPatch } from '../../../lib/api';
import { formatMoney, formatDateTime } from '../../../lib/format';
import { statusLabel } from '../../../lib/labels';
import { Spinner, StatusBadge, EmptyState } from '../../../components/Ui';

const FLOW = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

export default function SellerOrders() {
  const { user } = useAuth();
  const [items, setItems] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (!user) return;
    apiGet(`/seller/orders${statusFilter ? `?status=${statusFilter}` : ''}`, { auth: true })
      .then((d) => setItems(d.items))
      .catch(() => setItems([]));
  }, [user, statusFilter]);

  async function nextStatus(item) {
    if (item.order?.paymentStatus !== 'PAID') return;
    const idx = FLOW.indexOf(item.status);
    if (idx === -1 || idx >= FLOW.length - 1) return;
    const next = FLOW[idx + 1];
    try {
      await apiPatch(`/seller/orders/${item.id}/status`, { status: next }, { auth: true });
      setItems((list) => list.map((x) => (x.id === item.id ? { ...x, status: next } : x)));
    } catch (e) {
      alert(e.message);
    }
  }

  if (!items) return <Spinner />;

  const paidCount = items.filter((i) => i.order?.paymentStatus === 'PAID').length;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink-strong">Commandes de ma boutique</h1>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-auto">
          <option value="">Tous les statuts</option>
          {FLOW.map((s) => (
            <option key={s} value={s}>{statusLabel(s)}</option>
          ))}
        </select>
      </div>
      <p className="-mt-3 mb-4 text-sm text-ink-muted">
        {paidCount} commande(s) payée(s) sur {items.length}.
      </p>

      {items.length === 0 ? (
        <EmptyState title="Aucune commande" subtitle="Les commandes payées apparaîtront ici." />
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <div key={it.id} className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-ink-strong">
                    {it.order?.number} — {it.product?.name}
                  </p>
                  <p className="text-xs text-ink-muted">
                    Client : {it.order?.user?.name} · {it.order?.user?.phone}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {it.quantity} × {formatMoney(it.unitPrice)} ={' '}
                    <strong>{formatMoney(it.subtotal)}</strong> · net vendeur{' '}
                    {formatMoney(it.netAmount)} (commission −{formatMoney(it.commission)})
                  </p>
                  <p className="text-xs text-ink-faint">{formatDateTime(it.createdAt)}</p>
                  {it.order?.transactionRef && (
                    <p className="text-xs text-ink-faint">
                      Numéro de paiement :{' '}
                      <span className="font-mono font-medium text-ink-muted">{it.order.transactionRef}</span>
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge value={it.status} />
                  <button
                    onClick={() => nextStatus(it)}
                    disabled={it.order?.paymentStatus !== 'PAID' || it.status === 'DELIVERED'}
                    className="btn-secondary px-3 py-1.5 text-xs"
                    title="Passer au statut suivant"
                  >
                    {it.status === 'DELIVERED' ? 'Livrée' : 'Faire avancer →'}
                  </button>
                </div>
              </div>

              <div className="mt-2 border-t border-line-soft pt-2 text-xs text-ink-faint">
                  Adresse : {it.order?.address?.fullName} — {it.order?.address?.address}
                  {it.order?.address?.city ? `, ${it.order?.address?.city}` : ''}
                </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}