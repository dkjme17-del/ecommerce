import Link from 'next/link';
import { serverFetch } from '../lib/server';

export default async function Footer() {
  const configData = await serverFetch('/api/v1/config').catch(() => ({ config: {} }));
  const commissionPercent = Math.round((configData.config?.commissionRate || 0.05) * 100);
  return (
    <footer className="mt-16 border-t border-line bg-paper-muted">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <p className="font-display text-2xl font-bold text-brand-600">Kirene</p>
            <p className="mt-3 max-w-xs text-sm leading-6 text-ink-muted">
              Le marketplace sénégalais qui relie les boutiques locales aux acheteurs — paiement Wave,
              Orange Money et MTN MoMo, livraison partout.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-strong">Acheter</p>
            <ul className="mt-3 space-y-2.5 text-sm text-ink-muted">
              <li><Link href="/products" className="transition-colors hover:text-brand-600">Tous les produits</Link></li>
              <li><Link href="/products?sort=popular" className="transition-colors hover:text-brand-600">Populaires</Link></li>
              <li><Link href="/cart" className="transition-colors hover:text-brand-600">Mon panier</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-strong">Vendre</p>
            <ul className="mt-3 space-y-2.5 text-sm text-ink-muted">
              <li><Link href="/register" className="transition-colors hover:text-brand-600">Ouvrir une boutique</Link></li>
              <li><Link href="/seller" className="transition-colors hover:text-brand-600">Espace vendeur</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-strong">Assistance</p>
            <ul className="mt-3 space-y-2.5 text-sm text-ink-muted">
              <li><Link href="/me" className="transition-colors hover:text-brand-600">Mon compte</Link></li>
              <li><Link href="/orders" className="transition-colors hover:text-brand-600">Mes commandes</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-line py-4">
        <p className="mx-auto max-w-7xl px-4 text-center text-xs text-ink-faint sm:px-6 lg:px-8">
          © {new Date().getFullYear()} Kirene — Commission de {commissionPercent} % par vente. Conçu à Dakar.
        </p>
      </div>
    </footer>
  );
}