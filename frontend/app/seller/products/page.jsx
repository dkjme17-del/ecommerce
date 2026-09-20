'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
import { apiGet, apiPatch, apiPut, apiDelete } from '../../../lib/api';
import { formatMoney } from '../../../lib/format';
import { Spinner, StatusBadge, EmptyState, FormError } from '../../../components/Ui';
import ProductImage from '../../../components/ProductImage';

const FILTERS = [
  { key: 'active', label: 'Actifs' },
  { key: 'archived', label: 'Archivés' },
];

export default function SellerProducts() {
  const { user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState(null);
  const [filter, setFilter] = useState('active');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  useEffect(() => {
    if (!user) return;
    apiGet('/products/seller/all', { auth: true })
      .then((d) => setProducts(d.products))
      .catch((e) => setError(e.message));
  }, [user]);

  async function setStock(id, delta) {
    const current = products.find((p) => p.id === id);
    if (!current) return;
    const next = Math.max(0, current.stock + delta);
    if (next === current.stock) return;
    setBusyId(id);
    setError('');
    try {
      await apiPatch(`/products/${id}/stock`, { stock: next }, { auth: true });
      setProducts((list) => list.map((p) => (p.id === id ? { ...p, stock: next } : p)));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function doDelete(p) {
    setBusyId(p.id);
    setError('');
    try {
      await apiDelete(`/products/${p.id}`, { auth: true });
      setProducts((list) => list.filter((x) => x.id !== p.id));
      setPendingDelete(null);
      router.refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function reactivate(p) {
    setBusyId(p.id);
    setError('');
    try {
      await apiPut(`/products/${p.id}`, { status: 'ACTIVE' }, { auth: true });
      setProducts((list) =>
        list.map((x) =>
          x.id === p.id ? { ...x, status: 'ACTIVE', enabled: x.stock > 0 } : x,
        ),
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  if (!products) return <Spinner />;

  const visible = products.filter((p) =>
    filter === 'archived' ? p.status !== 'ACTIVE' : p.status === 'ACTIVE',
  );

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink-strong">Mes produits</h1>
        <Link href="/seller/products/new" className="btn-primary">
          + Ajouter un produit
        </Link>
      </div>

      <div className="mb-4 inline-flex rounded-full border border-line bg-paper p-1">
        {FILTERS.map((f) => {
          const count = products.filter((p) =>
            f.key === 'archived' ? p.status !== 'ACTIVE' : p.status === 'ACTIVE',
          ).length;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                filter === f.key
                  ? 'bg-brand-600 text-white'
                  : 'text-ink-muted hover:text-ink-strong'
              }`}
            >
              {f.label} ({count})
            </button>
          );
        })}
      </div>

      <FormError error={error} />

      {visible.length === 0 ? (
        <EmptyState
          title={filter === 'archived' ? 'Aucun produit archivé' : 'Aucun produit actif'}
          subtitle={
            filter === 'archived'
              ? 'Les produits supprimés apparaissent ici et restent réactivables.'
              : 'Ajoutez votre premier produit pour commencer à vendre.'
          }
          action={
            filter === 'active' ? (
              <Link href="/seller/products/new" className="btn-primary">
                Ajouter un produit
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {visible.map((p) => (
            <div
              key={p.id}
              className={`card flex items-center gap-4 p-4 ${
                p.status !== 'ACTIVE' ? 'opacity-70' : ''
              }`}
            >
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-paper-sunken">
                <ProductImage src={p.images?.[0]} alt={p.name} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-semibold text-ink-strong">
                  <span className="truncate">{p.name}</span>
                  <StatusBadge value={p.status} />
                </p>
                <p className="text-sm text-ink-muted">
                  {formatMoney(p.price)} · {p.category?.name}
                </p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <button
                    onClick={() => setStock(p.id, -1)}
                    disabled={busyId === p.id || p.stock <= 0}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-paper-sunken text-sm font-semibold text-ink transition hover:bg-ink-faint disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Diminuer le stock"
                    title="Diminuer le stock"
                  >
                    −
                  </button>
                  <span className="min-w-10 text-center text-xs text-ink-muted">
                    <strong className="text-ink">{p.stock}</strong> en stock
                  </span>
                  <button
                    onClick={() => setStock(p.id, 1)}
                    disabled={busyId === p.id}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-paper-sunken text-sm font-semibold text-ink transition hover:bg-ink-faint disabled:opacity-40"
                    aria-label="Augmenter le stock"
                    title="Augmenter le stock"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={`/seller/products/${p.id}/edit`}
                  className="btn-secondary px-3 py-1.5 text-xs"
                >
                  Modifier
                </Link>
                {p.status !== 'ACTIVE' ? (
                  <button
                    onClick={() => reactivate(p)}
                    disabled={busyId === p.id}
                    className="btn-secondary px-3 py-1.5 text-xs"
                  >
                    Réactiver
                  </button>
                ) : (
                  <button
                    onClick={() => setPendingDelete(p)}
                    disabled={busyId === p.id}
                    className="btn-danger px-3 py-1.5 text-xs"
                  >
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-line bg-paper p-6 shadow-card-hover">
            <h2 className="text-lg font-bold text-ink-strong">Supprimer ce produit ?</h2>
            <p className="mt-2 text-sm text-ink-muted">
              « {pendingDelete.name} » sera retiré de la vitrine et archivé. Il pourra être
              réactivé à tout moment — aucune vente passée n'est affectée.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setPendingDelete(null)}
                disabled={busyId === pendingDelete.id}
                className="btn-secondary px-4 py-2"
              >
                Annuler
              </button>
              <button
                onClick={() => doDelete(pendingDelete)}
                disabled={busyId === pendingDelete.id}
                className="btn-danger px-4 py-2"
              >
                {busyId === pendingDelete.id ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}