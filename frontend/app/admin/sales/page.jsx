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
  const [commissions, setCommissions] = useState(null);
  const [to, setTo] = useState('');

  useEffect(() => {
    if (!user) return;
    apiGet(`/admin/sales${to ? `?to=${to}` : ''}`, { auth: true })
      .then((d) => setData(d))
      .catch(() => setData({ orders: [] }));
    apiGet('/admin/commissions', { auth: true })
      .then((d) => setCommissions(d))
      .catch(() => setCommissions({ total: 0, commissions: [] }));
  }, [user, to]);

  if (!data || !commissions) return <Spinner />;

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
                <th className="px-4 py-3">Réf. paiement</th>
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
                  <td className="px-4 py-3 font-mono text-xs text-ink-muted">{o.transactionRef || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge value={o.status} /></td>
                  <td className="px-4 py-3 text-ink-muted">{formatDateTime(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-ink-strong">Mes commissions (1 %)</h2>
          <p className="text-sm text-ink-muted">
            Encaisées à la livraison, par paiement livré.
            Total : <strong className="text-brand-600">{formatMoney(commissions.total)}</strong>
          </p>
        </div>
        {commissions.commissions.length === 0 ? (
          <EmptyState
            title="Aucune commission pour l'instant"
            subtitle="Vos 1 % apparaîtront ici après chaque paiement livré."
          />
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase text-ink-muted">
                  <th className="px-4 py-3">Commande</th>
                  <th className="px-4 py-3">Réf. paiement</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Boutique</th>
                  <th className="px-4 py-3">Brut</th>
                  <th className="px-4 py-3">Commission (1 %)</th>
                  <th className="px-4 py-3">Net vendeur</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {commissions.commissions.map((c, i) => (
                  <tr key={i} className="border-b border-line-soft last:border-0">
                    <td className="px-4 py-3 font-medium text-ink-strong">{c.orderNumber}</td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-muted">{c.reference || '—'}</td>
                    <td className="px-4 py-3">{c.client}</td>
                    <td className="px-4 py-3 text-ink-muted">{c.store}</td>
                    <td className="px-4 py-3">{formatMoney(c.gross)}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-600">+{formatMoney(c.commission)}</td>
                    <td className="px-4 py-3">{formatMoney(c.net)}</td>
                    <td className="px-4 py-3"><StatusBadge value={c.orderStatus} /></td>
                    <td className="px-4 py-3 text-ink-muted">{formatDateTime(c.deliveredAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}