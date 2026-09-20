'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { apiGet, apiPatch, apiDelete } from '../../lib/api';
import { formatMoney } from '../../lib/format';
import { Spinner, EmptyState, FormError } from '../../components/Ui';

export default function CartPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login?next=/cart');
      return;
    }
    loadCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  async function loadCart() {
    setLoading(true);
    try {
      const data = await apiGet('/cart', { auth: true });
      setCart(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function changeQty(productId, quantity) {
    try {
      await apiPatch(`/cart/items/${productId}`, { quantity }, { auth: true });
      await loadCart();
    } catch (e) {
      setError(e.message);
    }
  }

  async function remove(productId) {
    await apiDelete(`/cart/items/${productId}`, { auth: true });
    await loadCart();
  }

  const total = (cart?.items || []).reduce((s, i) => s + i.total, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-ink-strong">Mon panier</h1>

      {loading ? (
        <Spinner />
      ) : error ? (
        <FormError error={error} />
      ) : !cart || cart.items.length === 0 ? (
        <EmptyState
          title="Votre panier est vide"
          subtitle="Parcourez le catalogue et ajoutez des produits."
          action={
            <Link href="/products" className="btn-primary">
              Découvrir les produits
            </Link>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            {cart.items.map((item) => (
              <div key={item.productId} className="card flex items-center gap-4 p-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-paper-sunken">
                  {item.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.images[0]} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-ink-faint">Pas d’image</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/products/${item.slug}`} className="truncate text-sm font-medium text-ink-strong hover:text-brand-600">
                    {item.name}
                  </Link>
                  <p className="text-xs text-ink-faint">{item.store?.name}</p>
                  <p className="mt-1 text-sm font-bold text-brand-600">
                    {formatMoney(item.price)}
                  </p>
                </div>
                <div className="flex items-center rounded-lg border border-line-strong">
                  <button
                    onClick={() => changeQty(item.productId, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className="px-2.5 py-1.5 text-ink-muted hover:bg-paper-sunken"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => changeQty(item.productId, item.quantity + 1)}
                    disabled={item.quantity >= item.stock}
                    className="px-2.5 py-1.5 text-ink-muted hover:bg-paper-sunken"
                  >
                    +
                  </button>
                </div>
                <p className="w-24 text-right text-sm font-semibold text-ink-strong">
                  {formatMoney(item.total)}
                </p>
                <button
                  onClick={() => remove(item.productId)}
                  className="text-ink-faint hover:text-red-600"
                  aria-label="Retirer"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div className="card h-fit p-5">
            <h2 className="text-lg font-semibold text-ink-strong">Résumé</h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-ink-muted">
                <span>Sous-total</span>
                <span>{formatMoney(total)}</span>
              </div>
              <div className="flex justify-between text-ink-muted">
                <span>Livraison</span>
                <span>Calculée au paiement</span>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-base font-bold text-ink-strong">
                <span>Total</span>
                <span>{formatMoney(total)}</span>
              </div>
            </div>
            <Link href="/checkout" className="btn-primary mt-5 w-full">
              Passer commande
            </Link>
            <Link href="/products" className="btn-secondary mt-2 w-full">
              Continuer mes achats
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}