'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../lib/auth-context';
import { apiGet } from '../../../lib/api';
import { formatMoney, formatDateTime } from '../../../lib/format';
import { paymentLabel } from '../../../lib/labels';
import { Spinner, StatusBadge, EmptyState } from '../../../components/Ui';

export default function SellerPayouts() {
  const { user } = useAuth();
  const [payouts, setPayouts] = useState(null);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    apiGet('/config')
      .then((d) => setConfig(d.config))
      .catch(() => {});
    if (!user) return;
    apiGet('/seller/payouts', { auth: true })
      .then((d) => setPayouts(d.payouts))
      .catch(() => setPayouts([]));
  }, [user]);

  if (!payouts) return <Spinner />;

  const totalPaid = payouts
    .filter((p) => p.status === 'SUCCESS')
    .reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-ink-strong">Mes versements</h1>
      <p className="mb-5 text-sm text-ink-muted">
        Total versé : <strong>{formatMoney(totalPaid)}</strong> — vos revenus nets (après
        commission de {Math.round((config?.commissionRate || 0.01) * 100)} %) sont versés
        automatiquement sur votre compte mobile money dès qu’ils atteignent{' '}
        {formatMoney(config?.minPayoutAmount ?? 5000)}.
      </p>

      {payouts.length === 0 ? (
        <EmptyState title="Aucun versement" subtitle="Vos versements apparaîtront après vos ventes." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase text-ink-muted">
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">Commission</th>
                <th className="px-4 py-3">Méthode</th>
                <th className="px-4 py-3">Référence</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p.id} className="border-b border-line-soft last:border-0">
                  <td className="px-4 py-3 font-semibold">{formatMoney(p.amount)}</td>
                  <td className="px-4 py-3 text-red-500">−{formatMoney(p.commission)}</td>
                  <td className="px-4 py-3">{paymentLabel(p.method)}</td>
                  <td className="px-4 py-3 text-ink-muted">{p.reference || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge value={p.status} /></td>
                  <td className="px-4 py-3 text-ink-muted">{formatDateTime(p.processedAt || p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}