import { notFound } from 'next/navigation';
import Link from 'next/link';
import { serverFetch } from '../../../lib/server';
import { formatMoney } from '../../../lib/format';
import { StarRating } from '../../../components/StarRating';
import AddToCart from '../../../components/AddToCart';
import ReviewForm from '../../../components/ReviewForm';
import BackButton from '../../../components/BackButton';

export const dynamic = 'force-dynamic';

export default async function ProductDetailPage({ params }) {
  const { slug } = await params;

  let data;
  try {
    data = await serverFetch(`/api/v1/products/${slug}`);
  } catch {
    notFound();
  }

  const p = data.product;
  const isDiscounted =
    p.compareAtPrice && p.compareAtPrice > p.price;
  const savings = isDiscounted
    ? p.compareAtPrice - p.price
    : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
      <BackButton />

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Galerie */}
        <div className="overflow-hidden rounded-3xl border border-line bg-paper shadow-card">
          <div className="relative">
            {p.images?.[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.images[0]}
                alt={p.name}
                className="aspect-square w-full object-cover"
              />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center bg-paper-sunken text-ink-faint">
                Pas d’image
              </div>
            )}
            {isDiscounted && (
              <span className="absolute left-4 top-4 badge bg-accent-500 text-brand-950">
                Promo
              </span>
            )}
          </div>
          {p.images?.length > 1 && (
            <div className="flex gap-2 p-3">
              {p.images.map((img, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={img}
                  alt=""
                  className="h-16 w-16 rounded-xl border border-line object-cover"
                />
              ))}
            </div>
          )}
        </div>

        {/* Achat */}
        <div>
          <nav className="flex items-center gap-1.5 text-sm text-ink-faint">
            <Link href="/products" className="transition-colors hover:text-brand-600">
              Boutique
            </Link>
            <span>/</span>
            <span className="truncate text-ink-muted">{p.name}</span>
          </nav>

          <Link
            href={`/stores/${p.store.slug}`}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 transition-colors hover:text-brand-700"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 8.5 5 4.5h10l1.5 4M3.5 8.5v7a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-7M3.5 8.5a2 2 0 0 1 4 0 2 2 0 0 1 4 0 2 2 0 0 1 4 0" />
            </svg>
            {p.store.name}
          </Link>

          <h1 className="mt-2 font-display text-2xl font-bold leading-tight tracking-tight text-ink-strong md:text-3xl">
            {p.name}
          </h1>

          <div className="mt-3 flex items-center gap-2">
            <StarRating value={p.rating} />
            <span className="text-sm text-ink-muted">
              {p.numReviews > 0 ? `${p.numReviews} avis` : 'Pas encore d’avis'}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap items-end gap-3">
            <p className="text-3xl font-extrabold tracking-tight text-brand-600">
              {formatMoney(p.price)}
            </p>
            {isDiscounted && (
              <>
                <p className="pb-1 text-lg text-ink-faint line-through">
                  {formatMoney(p.compareAtPrice)}
                </p>
                <span className="badge bg-accent-100 text-accent-700">
                  Économisez {formatMoney(savings)}
                </span>
              </>
            )}
          </div>

          <p className="mt-2 text-sm">
            {p.stock > 0 ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600">
                <Dot className="bg-emerald-500" />
                En stock — {p.stock} disponible
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-medium text-red-600">
                <Dot className="bg-red-500" />
                Rupture de stock
              </span>
            )}
          </p>

          <div className="mt-6">
            <AddToCart productId={p.id} slug={p.slug} stock={p.stock} />
          </div>

          <div className="mt-6 grid gap-2.5 rounded-2xl border border-line bg-paper-muted p-4 text-sm text-ink-muted">
            <span className="inline-flex items-center gap-2.5">
              <ReassIcon d="M12 3 3.5 7.5 12 12l8.5-4.5L12 3Zm-8.5 4.5V17l8.5 4.5V12" />
              Paiement sécurisé — Wave, Orange Money, MTN MoMo
            </span>
            <span className="inline-flex items-center gap-2.5">
              <ReassIcon d="M12 3v9l6.5 3.5M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Z" />
              Livraison rapide partout au Sénégal
            </span>
            <span className="inline-flex items-center gap-2.5">
              <ReassIcon d="M20 13.5 4 21V3l16 7.5-16 7.5L20 6" />
              Retours simples sous 7 jours
            </span>
          </div>

          {p.description && (
            <div className="mt-8">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-strong">
                Description
              </h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-7 text-ink-muted">
                {p.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Avis */}
      <section className="mt-14">
        <h2 className="font-display text-xl font-bold tracking-tight text-ink-strong">
          Avis clients
        </h2>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            {p.reviews?.length === 0 ? (
              <p className="text-sm text-ink-muted">Aucun avis pour le moment.</p>
            ) : (
              p.reviews.map((r) => (
                <div key={r.id} className="card p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-ink-strong">{r.user.name}</p>
                    <StarRating value={r.rating} size="sm" />
                  </div>
                  {r.comment && <p className="mt-2 text-sm text-ink-muted">{r.comment}</p>}
                </div>
              ))
            )}
          </div>
          <ReviewForm slug={p.slug} />
        </div>
      </section>
    </div>
  );
}

function Dot({ className = '' }) {
  return <span className={`h-2 w-2 rounded-full ${className}`} />;
}

function ReassIcon({ d }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-brand-600" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}