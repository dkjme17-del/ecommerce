import { notFound } from 'next/navigation';
import { serverFetch } from '../../../lib/server';
import ProductCard from '../../../components/ProductCard';
import { formatDateTime } from '../../../lib/format';
import ProductImage from '../../../components/ProductImage';

export const dynamic = 'force-dynamic';

export default async function StorePage({ params }) {
  const { slug } = await params;
  let data;
  try {
    data = await serverFetch(`/api/v1/stores/${slug}`);
  } catch {
    notFound();
  }
  const store = data.store;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="card overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-brand-500 to-brand-700" />
        <div className="px-5 pb-5">
          <div className="-mt-10 flex items-end gap-4">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-paper text-2xl font-bold text-brand-600 shadow">
              {store.logo ? <ProductImage src={store.logo} alt={store.name} className="h-full w-full object-cover" /> : store.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-ink-strong">{store.name}</h1>
              <p className="text-sm text-ink-muted">
                Boutique depuis le {formatDateTime(store.createdAt)}
              </p>
            </div>
          </div>
          {store.description && (
            <p className="mt-4 text-sm text-ink-muted">{store.description}</p>
          )}
        </div>
      </div>

      <h2 className="mb-4 mt-8 text-lg font-bold text-ink-strong">
        Produits ({data.products.length})
      </h2>
      {data.products.length === 0 ? (
        <p className="text-ink-muted">Cette boutique n’a pas encore de produit.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {data.products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}