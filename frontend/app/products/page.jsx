'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiGet } from '../../lib/api';
import { EmptyState, ProductGridSkeleton } from '../../components/Ui';
import ProductCard from '../../components/ProductCard';

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-6">
          <ProductGridSkeleton />
        </div>
      }
    >
      <ProductsBrowser />
    </Suspense>
  );
}

function ProductsBrowser() {
  const sp = useSearchParams();
  const router = useRouter();

  const q = sp.get('q') || '';
  const category = sp.get('category') || '';
  const sort = sp.get('sort') || 'popular';
  const priceMax = sp.get('priceMax') || '';
  const page = parseInt(sp.get('page') || '1', 10);

  const [data, setData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    if (sort) params.set('sort', sort);
    if (priceMax) params.set('priceMax', priceMax);
    params.set('page', String(page));

    apiGet(`/products?${params.toString()}`)
      .then((d) => setData(d))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [q, category, sort, priceMax, page]);

  useEffect(() => {
    apiGet('/categories')
      .then((d) => setCategories(d.categories))
      .catch(() => {});
  }, []);

  function updateParam(key, value) {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== 'page') params.delete('page');
    router.push(`/products?${params.toString()}`);
  }

  const sorts = [
    { value: 'popular', label: 'Populaire' },
    { value: 'newest', label: 'Nouveautés' },
    { value: 'price_asc', label: 'Prix croissant' },
    { value: 'price_desc', label: 'Prix décroissant' },
    { value: 'rating', label: 'Mieux notés' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
          Boutique
        </p>
        <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-ink-strong md:text-3xl">
          {q ? `Résultats pour « ${q} »` : 'Tous les produits'}
        </h1>
      </div>

      {/* Filtres */}
      <div className="sticky top-16 z-30 -mx-4 mb-6 flex flex-wrap items-center gap-3 border-b border-line bg-paper/90 px-4 py-3 backdrop-blur">
        <select
          value={category}
          onChange={(e) => updateParam('category', e.target.value)}
          className="input w-auto"
        >
          <option value="">Toutes catégories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => updateParam('sort', e.target.value)}
          className="input w-auto"
        >
          {sorts.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <select
          value={priceMax}
          onChange={(e) => updateParam('priceMax', e.target.value)}
          className="input w-auto"
        >
          <option value="">Tous les prix</option>
          <option value="5000">Moins de 5 000 FCFA</option>
          <option value="20000">Moins de 20 000 FCFA</option>
          <option value="100000">Moins de 100 000 FCFA</option>
          <option value="500000">Moins de 500 000 FCFA</option>
        </select>
        <span className="ml-auto text-sm text-ink-muted">
          {!loading && data?.pagination ? (
            <>{(data.pagination.total ?? 0).toLocaleString('fr-FR')} produits</>
          ) : null}
        </span>
      </div>

      {loading ? (
        <ProductGridSkeleton />
      ) : error ? (
        <div className="rounded-2xl bg-red-50 p-5 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      ) : (
        <>
          {data.products.length === 0 ? (
            <EmptyState
              title={q ? 'Aucun résultat pour cette recherche' : 'Aucun produit trouvé'}
              subtitle="Essayez d’autres mots-clés, catégories ou filtres de prix."
              action={
                <button onClick={() => router.push('/products')} className="btn-secondary">
                  Réinitialiser les filtres
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {data.products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          {data.pagination?.pages > 1 && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {page > 1 && (
                <button
                  onClick={() => updateParam('page', String(page - 1))}
                  className="btn-secondary"
                >
                  Précédent
                </button>
              )}
              {Array.from({ length: data.pagination.pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => updateParam('page', String(p))}
                  className={`rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
                    p === page
                      ? 'bg-brand-600 text-white'
                      : 'border border-line-strong bg-paper text-ink hover:bg-paper-muted'
                  }`}
                >
                  {p}
                </button>
              ))}
              {page < data.pagination.pages && (
                <button
                  onClick={() => updateParam('page', String(page + 1))}
                  className="btn-secondary"
                >
                  Suivant
                </button>
              )}
            </div>
          )}
        </>
      )}

      <div className="mt-10">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 transition-colors hover:text-brand-700">
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.833 10H4.167M9.167 4.167 4.167 10l5 5.833" />
          </svg>
          Retour à l’accueil
        </Link>
      </div>
    </div>
  );
}