'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/auth-context';
import { apiGet } from '../../lib/api';
import { formatMoney, formatDateTime } from '../../lib/format';
import { Spinner, StatusBadge, EmptyState } from '../../components/Ui';

export default function SellerDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!user) return;
    apiGet('/seller/stats', { auth: true })
      .then(setData)
      .catch(() => {});
  }, [user]);

  if (!data) return <Spinner />;

  const s = data.stats;
  const cards = [
    { label: 'Revenus totaux (net)', value: formatMoney(s.revenue) },
    { label: 'Solde à recevoir', value: formatMoney(s.balance) },
    { label: 'Ventes', value: s.salesCount },
    { label: 'Produits actifs', value: s.productsCount },
    { label: 'Stock faible (<5)', value: s.lowStock },
    { label: 'Versements en attente', value: s.pendingPayouts },
  ];

  return (
    <div>
      <h1 className="mb-5 text-2xl font-bold text-ink-strong">
        Bonjour, {user?.name}
      </h1>
      <p className="-mt-3 mb-5 text-sm text-ink-muted">
        Commission plateforme : {Math.round(s.commissionRate * 100)} % par vente.
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => (
          <div key={c.label} className="card p-4">
            <p className="text-lg font-bold text-ink-strong">{c.value}</p>
            <p className="text-xs text-ink-muted">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink-strong">Ventes récentes</h2>
          <Link href="/seller/orders" className="text-sm font-medium text-brand-600 hover:underline">
            Voir toutes les commandes →
          </Link>
        </div>
        {data.recentSales?.length === 0 ? (
          <EmptyState
            title="Pas encore de vente"
            subtitle="Ajoutez des produits et partagez votre boutique."
            action={
              <Link href="/seller/products/new" className="btn-primary">
                Ajouter un produit
              </Link>
            }
          />
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase text-ink-muted">
                  <th className="px-4 py-3">Commande</th>
                  <th className="px-4 py-3">Produit</th>
                  <th className="px-4 py-3">Qté</th>
                  <th className="px-4 py-3">Montant</th>
                  <th className="px-4 py-3">Commission</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recentSales.map((it) => (
                  <tr key={it.id} className="border-b border-line-soft last:border-0">
                    <td className="px-4 py-3 font-medium text-ink-strong">{it.order?.number}</td>
                    <td className="px-4 py-3 text-ink-muted line-clamp-1">{it.product?.name}</td>
                    <td className="px-4 py-3">{it.quantity}</td>
                    <td className="px-4 py-3 font-semibold">{formatMoney(it.subtotal)}</td>
                    <td className="px-4 py-3 text-red-500">−{formatMoney(it.commission)}</td>
                    <td className="px-4 py-3"><StatusBadge value={it.status} /></td>
                    <td className="px-4 py-3 text-ink-muted">{formatDateTime(it.createdAt)}</td>
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