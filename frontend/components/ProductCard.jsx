import Link from 'next/link';
import { formatMoney } from '../lib/format';
import { StarRating } from './StarRating';

export default function ProductCard({ product }) {
  const image = product.images?.[0];

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-paper shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-500/40 hover:shadow-card-hover"
    >
      <div className="relative aspect-square overflow-hidden bg-paper-sunken">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-ink-faint">
            Pas d’image
          </div>
        )}
        {product.salesCount > 0 && (
          <span className="absolute left-2 top-2 badge bg-emerald-100 text-emerald-700">
            Populaire
          </span>
        )}
        {product.stock === 0 && (
          <span className="absolute inset-0 flex items-center justify-center bg-paper/70 text-sm font-semibold text-red-600 backdrop-blur-[2px]">
            Rupture de stock
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-1 text-sm font-medium text-ink-strong transition-colors group-hover:text-brand-700">
          {product.name}
        </p>
        <div className="flex items-center gap-1.5">
          <StarRating value={product.rating} size="sm" />
          <span className="text-xs text-ink-faint">
            {product.numReviews > 0 ? `(${product.numReviews})` : ''}
          </span>
        </div>
        <div className="mt-auto">
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <p className="text-xs text-ink-faint line-through">
              {formatMoney(product.compareAtPrice)}
            </p>
          )}
          <p className="text-base font-bold text-brand-600">{formatMoney(product.price)}</p>
          <p className="mt-0.5 text-xs text-ink-faint line-clamp-1">{product.store?.name}</p>
        </div>
      </div>
    </Link>
  );
}