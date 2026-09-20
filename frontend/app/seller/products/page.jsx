'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
import { apiGet, apiPatch, apiDelete } from '../../../lib/api';
import { formatMoney } from '../../../lib/format';
import { Spinner, StatusBadge, EmptyState, FormError } from '../../../components/Ui';

export default function SellerProducts() {
  const { user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    apiGet('/products/seller/all', { auth: true })
      .then((d) => setProducts(d.products))
      .catch((e) => setError(e.message));
  }, [user]);

  async function setStock(id, current) {
    const next = Math.max(0, current - 1);
    try {
      await apiPatch(`/products/${id}/stock`, { stock: next }, { auth: true });
      setProducts((list) => list.map((p) => (p.id === id ? { ...p, stock: next } : p)));
    } catch (e) {
      setError(e.message);
    }
  }

  async function archive(id, name) {
    if (!confirm(`Supprimer « ${name} » ?`)) return;
    await apiDelete(`/products/${id}`, { auth: true });
    setProducts((list) => list.filter((p) => p.id !== id));
    router.refresh();
  }

  if (!products) return <Spinner />;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink-strong">Mes produits</h1>
        <Link href="/seller/products/new" className="btn-primary">
          + Ajouter un produit
        </Link>
      </div>

      <FormError error={error} />

      {products.length === 0 ? (
        <EmptyState
          title="Aucun produit"
          subtitle="Ajoutez votre premier produit pour commencer à vendre."
          action={
            <Link href="/seller/products/new" className="btn-primary">
              Ajouter un produit
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <div key={p.id} className="card flex items-center gap-4 p-4">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-paper-sunken">
                {p.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-ink-faint">Pas d’image</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-semibold text-ink-strong">
                  <span className="truncate">{p.name}</span>
                  <StatusBadge value={p.status} />
                </p>
                <p className="text-sm text-ink-muted">
                  {formatMoney(p.price)} · {p.category?.name}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-ink-muted">
                    Stock : <strong>{p.stock}</strong>
                  </span>
                  <button
                    onClick={() => setStock(p.id, p.stock)}
                    className="rounded-full bg-paper-sunken px-2 py-0.5 text-xs font-medium text-ink hover:bg-ink-faint"
                    title="Décrémenter le stock"
                  >
                    −1
                  </button>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link href={`/seller/products/${p.id}/edit`} className="btn-secondary px-3 py-1.5 text-xs">
                  Modifier
                </Link>
                <button onClick={() => archive(p.id, p.name)} className="btn-danger px-3 py-1.5 text-xs">
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}