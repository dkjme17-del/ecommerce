'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { apiGet } from '../../lib/api';
import { Spinner } from '../../components/Ui';

export default function SellerLayout({ children }) {
  const { user, loading, hasRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [store, setStore] = useState(undefined);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login?next=/seller');
      return;
    }
    if (!hasRole('SELLER')) {
      router.push('/');
      return;
    }
    apiGet('/stores/me', { auth: true })
      .then((d) => setStore(d.store))
      .catch(() => setStore(null));
  }, [loading, user, hasRole, router]);

  if (loading || store === undefined) return <div className="py-10"><Spinner /></div>;

  if (!store || store.status !== 'APPROVED') {
    if (pathname === '/seller/setup') return <div className="mx-auto max-w-3xl px-4 py-8">{children}</div>;
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        {store && store.status === 'PENDING' ? (
          <>
            <h1 className="text-xl font-bold text-ink-strong">Boutique en attente de validation</h1>
            <p className="mt-2 text-sm text-ink-muted">
              Votre boutique « {store.name} » est en cours de revue par l’administrateur. Revenez
              un peu plus tard.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-ink-strong">Bienvenue dans l’espace vendeur</h1>
            <p className="mt-2 text-sm text-ink-muted">
              Ouvrez votre boutique pour commencer à vendre sur la plateforme.
            </p>
            <Link href="/seller/setup" className="btn-primary mt-5">
              Créer ma boutique
            </Link>
          </>
        )}
        <Link href="/" className="mt-6 block text-sm font-medium text-brand-600 hover:underline">
          ← Retour à l’accueil
        </Link>
      </div>
    );
  }

  const links = [
    { href: '/seller', label: 'Tableau de bord' },
    { href: '/seller/products', label: 'Produits' },
    { href: '/seller/orders', label: 'Commandes' },
    { href: '/seller/payouts', label: 'Versements' },
    { href: '/seller/setup', label: 'Ma boutique' },
  ];

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:grid-cols-[200px_1fr]">
      <aside className="hidden md:block">
        <nav className="sticky top-20 space-y-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`block rounded-lg px-3.5 py-2 text-sm font-medium ${
                pathname === l.href
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-ink-muted hover:bg-paper-sunken'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div>
        <nav className="mb-4 flex gap-2 overflow-x-auto md:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium ${
                pathname === l.href ? 'bg-brand-600 text-white' : 'border border-line-strong bg-paper text-ink'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        {children}
      </div>
    </div>
  );
}