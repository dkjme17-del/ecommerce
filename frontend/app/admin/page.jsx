'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/auth-context';
import { apiGet } from '../../lib/api';
import { formatMoney } from '../../lib/format';
import { StatusBadge } from '../../components/Ui';
import { Spinner } from '../../components/Ui';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [commissionPercent, setCommissionPercent] = useState(5);

  useEffect(() => {
    apiGet('/config')
      .then((d) => setCommissionPercent(Math.round((d.config?.commissionRate || 0.05) * 100)))
      .catch(() => {});
    if (!user) return;
    apiGet('/admin/stats', { auth: true }).then(setData).catch(() => {});
  }, [user]);

  if (!data) return <Spinner />;

  const s = data.stats;
  const cards = [
    { label: 'Ventes totales', value: formatMoney(s.totalSales), accent: 'text-brand-600' },
    { label: `Commission ${commissionPercent} % cumulée`, value: formatMoney(s.totalCommission), accent: 'text-purple-600' },
    { label: 'Commandes', value: `${s.ordersCount} (${s.paidOrdersCount} payées)` },
    { label: 'Clients', value: s.usersCount },
  ];
  const cards2 = [
    { label: 'Vendeurs', value: s.sellersCount },
    { label: 'Boutiques', value: s.storesCount },
    { label: 'Boutiques à valider', value: s.pendingStores },
    { label: 'Produits', value: s.productsCount },
    { label: 'Versements en attente', value: s.pendingPayoutsCount },
  ];

  return (
    <div>
      <h1 className="mb-5 text-2xl font-bold text-ink-strong">Tableau de bord admin</h1>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">Finances</h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-4">
            <p className={`text-xl font-extrabold ${c.accent}`}>{c.value}</p>
            <p className="mt-1 text-xs text-ink-muted">{c.label}</p>
          </div>
        ))}
      </div>

      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-ink-muted">
        Plateforme
      </h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {cards2.map((c) => (
          <div key={c.label} className="card p-4">
            <p className="text-xl font-bold text-ink-strong">{c.value}</p>
            <p className="mt-1 text-xs text-ink-muted">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Link href="/admin/stores" className="card flex items-center justify-between p-5 hover:shadow-md">
          <span>
            <p className="font-semibold text-ink-strong">Valider les boutiques</p>
            <p className="text-sm text-ink-muted">
              {s.pendingStores > 0
                ? `${s.pendingStores} boutique(s) en attente`
                : 'Toutes les boutiques sont validées'}
            </p>
          </span>
          {s.pendingStores > 0 && (
            <span className="badge bg-amber-100 text-amber-700">{s.pendingStores}</span>
          )}
        </Link>
        <Link href="/admin/payouts" className="card flex items-center justify-between p-5 hover:shadow-md">
          <span>
            <p className="font-semibold text-ink-strong">Traiter les versements</p>
            <p className="text-sm text-ink-muted">
              {s.pendingPayoutsCount > 0
                ? `${s.pendingPayoutsCount} versement(s) en attente`
                : 'Aucun versement en attente'}
            </p>
          </span>
        </Link>
      </div>

      {data.topStores?.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">
            Meilleures boutiques
          </h2>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase text-ink-muted">
                  <th className="px-4 py-3">Boutique</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Revenus nets cumulés</th>
                  <th className="px-4 py-3">Solde</th>
                </tr>
              </thead>
              <tbody>
                {data.topStores.map((st) => (
                  <tr key={st.id} className="border-b border-line-soft last:border-0">
                    <td className="px-4 py-3 font-medium text-ink-strong">{st.name}</td>
                    <td className="px-4 py-3"><StatusBadge value={st.status} /></td>
                    <td className="px-4 py-3">{formatMoney(st.totalEarned)}</td>
                    <td className="px-4 py-3">{formatMoney(st.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}