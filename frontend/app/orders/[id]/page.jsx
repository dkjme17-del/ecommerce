'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
import { apiGet, apiPost } from '../../../lib/api';
import { formatMoney, formatDate } from '../../../lib/format';
import { statusLabel, paymentLabel } from '../../../lib/labels';
import { Spinner, StatusBadge, FormError } from '../../../components/Ui';
import ProductImage from '../../../components/ProductImage';

const STEPS = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

export default function OrderDetailPage() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push(`/login?next=/orders/${id}`);
      return;
    }
    apiGet(`/orders/${id}`, { auth: true })
      .then((d) => setOrder(d.order))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [authLoading, user, id, router]);

  async function cancel() {
    try {
      await apiPost(`/orders/${id}/cancel`, {}, { auth: true });
      const d = await apiGet(`/orders/${id}`, { auth: true });
      setOrder(d.order);
    } catch (e) {
      setError(e.message);
    }
  }

  if (loading || authLoading) return <Spinner />;

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <FormError error={error} />
      </div>
    );
  }

  const currentStep = STEPS.indexOf(order.status);
  const canCancel = ['PENDING', 'PAID'].includes(order.status);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/orders" className="text-sm font-medium text-brand-600 hover:underline">
        ← Mes commandes
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-ink-strong">{order.number}</h1>
        <div className="flex items-center gap-3">
          <StatusBadge value={order.status} />
          <span className="font-bold text-brand-600">{formatMoney(order.total)}</span>
        </div>
      </div>
      <p className="text-sm text-ink-muted">Passée le {formatDate(order.createdAt)}</p>

      {/* Timeline */}
      <div className="card mt-6 p-5">
        <h2 className="mb-4 font-semibold text-ink-strong">Suivi</h2>
        <div className="flex items-center">
          {STEPS.map((s, i) => (
            <div key={s} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center text-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                    i <= currentStep ? 'bg-brand-600 text-white' : 'bg-ink-faint text-ink-faint'
                  }`}
                >
                  {i + 1}
                </div>
                <p className="mt-1 text-xs text-ink-muted">{statusLabel(s)}</p>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`mx-1 h-0.5 flex-1 ${
                    i < currentStep ? 'bg-brand-600' : 'bg-ink-faint'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Articles */}
      <div className="card mt-6 p-5">
        <h2 className="mb-3 font-semibold text-ink-strong">Articles</h2>
        <div className="space-y-3">
          {order.items.map((it) => (
            <div key={it.id} className="flex items-center gap-4">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-paper-sunken">
                <ProductImage src={it.product?.images?.[0]} alt={it.product?.name} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/products/${it.product.slug}`} className="truncate text-sm font-medium text-ink-strong hover:text-brand-600">
                  {it.product.name}
                </Link>
                <p className="text-xs text-ink-faint">
                  {it.store?.name} · {it.quantity} × {formatMoney(it.unitPrice)}
                </p>
              </div>
              <span className="text-sm font-semibold text-ink-strong">{formatMoney(it.subtotal)}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-1.5 border-t border-line pt-3 text-sm">
          <div className="flex justify-between text-ink-muted">
            <span>Sous-total</span>
            <span>{formatMoney(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-ink-muted">
            <span>Livraison</span>
            <span>{formatMoney(order.shippingFee)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-ink-strong">
            <span>Total ({paymentLabel(order.paymentMethod)})</span>
            <span>{formatMoney(order.total)}</span>
          </div>
        </div>
      </div>

      <div className="card mt-6 p-5">
        <h2 className="mb-2 font-semibold text-ink-strong">Livraison</h2>
        <p className="text-sm text-ink-muted">{order.address?.fullName} — {order.address?.phone}</p>
        <p className="text-sm text-ink-muted">{order.address?.address}, {order.address?.city}</p>
        {canCancel && (
          <button onClick={cancel} className="btn-danger mt-4">
            Annuler la commande
          </button>
        )}
      </div>

      <FormError error={error} />
    </div>
  );
}