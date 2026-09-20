'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { apiGet } from '../../lib/api';
import { formatMoney, formatDate } from '../../lib/format';
import { paymentLabel } from '../../lib/labels';
import { Spinner, EmptyState, StatusBadge } from '../../components/Ui';

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login?next=/orders');
      return;
    }
    apiGet('/orders/my', { auth: true })
      .then((d) => setOrders(d.orders))
      .finally(() => setLoading(false));
  }, [authLoading, user, router]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-ink-strong">Mes commandes</h1>
      {loading ? (
        <Spinner />
      ) : !orders || orders.length === 0 ? (
        <EmptyState
          title="Aucune commande"
          subtitle="Vos commandes apparaîtront ici."
          action={
            <Link href="/products" className="btn-primary">
              Commencer mes achats
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <Link key={o.id} href={`/orders/${o.id}`} className="card block p-5 hover:shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-ink-strong">{o.number}</p>
                  <p className="text-sm text-ink-muted">{formatDate(o.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge value={o.paymentStatus === 'PAID' ? o.status : o.paymentStatus} />
                  <span className="font-bold text-brand-600">{formatMoney(o.total)}</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-ink-muted">
                {o.items?.length} article(s) — paiement {paymentLabel(o.paymentMethod)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}