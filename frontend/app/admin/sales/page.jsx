'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../lib/auth-context';
import { apiGet } from '../../../lib/api';
import { formatMoney, formatDateTime } from '../../../lib/format';
import { paymentLabel } from '../../../lib/labels';
import { Spinner, StatusBadge, EmptyState } from '../../../components/Ui';

export default function AdminSales() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [to, setTo] = useState('');

  useEffect(() => {
    if (!user) return;
    apiGet(`/admin/sales${to ? `?to=${to}` : ''}`, { auth: true })
      .then((d) => setData(d))
      .catch(() => setData({ orders: [] }));
  }, [user, to]);

  if (!data) return <Spinner />;

  const total = data.orders.reduce((s, o) => s + (o.paymentStatus === 'PAID' ? o.total : 0), 0);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-strong">Toutes les ventes</h1>
          <p className="text-sm text-ink-muted">
            Total payé : <strong>{formatMoney(total)}</strong> sur {data.orders.length} commande(s)
          </p>
        </div>
        <input type="date" className="input w-auto" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>

      {data.orders.length === 0 ? (
        <EmptyState title="Aucune vente" subtitle="Aucune commande pour cette période." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase text-ink-muted">
                <th className="px-4 py-3">N°</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Boutiques</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Paiement</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.orders.map((o) => (
                <tr key={o.id} className="border-b border-line-soft last:border-0">
                  <td className="px-4 py-3 font-medium text-ink-strong">{o.number}</td>
                  <td className="px-4 py-3">{o.user?.name}</td>
                  <td className="px-4 py-3 text-ink-muted">
                    {[...new Set(o.items?.map((i) => i.store?.name))].join(', ')}
                  </td>
                  <td className="px-4 py-3 font-semibold">{formatMoney(o.total)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge value={o.paymentStatus} /> {paymentLabel(o.paymentMethod)}
                  </td>
                  <td className="px-4 py-3"><StatusBadge value={o.status} /></td>
                  <td className="px-4 py-3 text-ink-muted">{formatDateTime(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}