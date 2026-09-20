import Link from 'next/link';
import { serverFetch } from '../lib/server';
import ProductCard from '../components/ProductCard';
import CategoryIcon from '../components/CategoryIcon';
import Reveal from '../components/Reveal';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [featuredData, categoriesData, configData] = await Promise.all([
    serverFetch('/api/v1/products/featured').catch(() => ({ products: [] })),
    serverFetch('/api/v1/categories').catch(() => ({ categories: [] })),
    serverFetch('/api/v1/config').catch(() => ({ config: {} })),
  ]);

  const products = featuredData.products || [];
  const categories = categoriesData.categories || [];
  const commissionPercent = Math.round((configData.config?.commissionRate || 0.05) * 100);

  return (
    <div>
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden bg-brand-900 text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-32 h-96 w-96 rounded-full bg-brand-500/30 blur-3xl" />
          <div className="absolute -bottom-40 right-0 h-[28rem] w-[28rem] rounded-full bg-accent-500/20 blur-3xl" />
          <div className="absolute left-1/3 top-1/4 h-40 w-40 rounded-full bg-emerald-300/20 blur-2xl" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-14 md:grid-cols-[1.15fr_0.85fr] md:items-center md:pb-24 md:pt-20 lg:px-8">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-paper/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-brand-100 backdrop-blur">
              Marketplace sénégalais · Fait à Dakar
            </span>
            <h1 className="mt-6 font-display text-4xl font-bold leading-[1.08] tracking-tight text-white md:text-6xl">
              Achetez la bonne et belle chose,{' '}
              <span className="text-accent-300">simplement.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-brand-50/90 md:text-lg">
              Des produits soigneusement choisis de boutiques locales. Payez en quelques secondes
              avec Wave, Orange Money ou MTN MoMo.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/products"
                className="btn bg-accent-500 text-brand-950 shadow-card hover:-translate-y-px hover:bg-accent-400"
              >
                Découvrir les produits
              </Link>
              <Link
                href="/register"
                className="btn border border-white/30 bg-paper/5 text-white backdrop-blur hover:bg-paper/15"
              >
                Ouvrir une boutique
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-brand-50/80">
              <span className="inline-flex items-center gap-2">
                <PayDot className="bg-emerald-300" /> Wave
              </span>
              <span className="inline-flex items-center gap-2">
                <PayDot className="bg-orange-300" /> Orange Money
              </span>
              <span className="inline-flex items-center gap-2">
                <PayDot className="bg-accent-300" /> MTN MoMo
              </span>
              <span className="text-brand-50/60">Commission {commissionPercent} % seulement</span>
            </div>
          </Reveal>

          <Reveal delay={120} className="hidden md:block">
            <div className="grid grid-cols-2 gap-4">
              {categories.slice(0, 6).map((c, i) => (
                <Link
                  key={c.id}
                  href={`/products?category=${c.id}`}
                  className={`group flex items-center gap-3 rounded-2xl border border-white/10 bg-paper/10 p-4 backdrop-blur transition hover:-translate-y-0.5 hover:bg-paper/20 ${
                    i % 2 === 1 ? 'translate-y-6' : ''
                  }`}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-500/90 text-brand-950 shadow-card">
                    <CategoryIcon name={c.name} className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-white">{c.name}</span>
                    <span className="block text-xs text-brand-50/70">
                      {c._count?.products ?? ''}
                      {(c._count?.products ?? 0) > 1 ? ' produits' : ' produit'}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== Catégories (chips) ===== */}
      <section className="mx-auto max-w-7xl px-4 pt-10 lg:px-8">
        <Reveal>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/products?category=${c.id}`}
                className="group inline-flex items-center gap-2 rounded-full border border-line-strong bg-paper px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700"
              >
                <CategoryIcon name={c.name} className="h-4 w-4 text-ink-muted transition-colors group-hover:text-brand-600" />
                {c.name}
                <span className="text-xs text-ink-faint">{c._count?.products ?? 0}</span>
              </Link>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ===== Produits populaires ===== */}
      <section className="mx-auto max-w-7xl px-4 pb-4 pt-12 lg:px-8">
        <Reveal>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
                Sélection
              </p>
              <h2 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-ink-strong md:text-3xl">
                Produits populaires
              </h2>
            </div>
            <Link
              href="/products"
              className="group inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700"
            >
              Voir tout
              <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.167 10h11.666M10.833 4.167 15.833 10l-5 5.833" />
              </svg>
            </Link>
          </div>
        </Reveal>
        {products.length === 0 ? (
          <p className="text-sm text-ink-muted">Aucun produit disponible pour le moment.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* ===== CTA vendeur ===== */}
      <section className="mx-auto max-w-7xl px-4 pt-16 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-brand-900 px-6 py-10 md:px-10 lg:flex lg:items-center lg:justify-between">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-500/25 blur-2xl" />
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-300">
                Espace vendeur
              </p>
              <h2 className="mt-3 max-w-md font-display text-2xl font-bold tracking-tight text-white md:text-3xl">
                Ouvrez votre boutique et touchez plus de clients
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-6 text-white/70 md:text-base">
                Une commission fixe et transparente de {commissionPercent} %, vos paiements mobile
                money directement sur votre compte.
              </p>
            </div>
            <div className="relative mt-6 flex flex-wrap gap-3 lg:mt-0">
              <Link
                href="/register"
                className="btn bg-accent-500 text-brand-950 hover:bg-accent-400"
              >
                Créer mon compte vendeur
              </Link>
              <Link
                href="/products"
                className="btn border border-white/20 text-white hover:bg-white/10"
              >
                Explorer la boutique
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

function PayDot({ className = '' }) {
  return <span className={`h-2 w-2 rounded-full ${className}`} />;
}