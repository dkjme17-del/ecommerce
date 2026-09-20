'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { Spinner } from '../../components/Ui';

export default function AdminLayout({ children }) {
  const { user, loading, hasRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login?next=/admin');
    } else if (!hasRole('ADMIN')) {
      router.push('/');
    }
  }, [loading, user, hasRole, router]);

  if (loading || !user || !hasRole('ADMIN')) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        {loading ? (
          <Spinner />
        ) : (
          <>
            <h1 className="text-xl font-bold text-ink-strong">Accès réservé</h1>
            <p className="mt-2 text-sm text-ink-muted">Espace administrateur de la plateforme.</p>
          </>
        )}
      </div>
    );
  }

  const links = [
    { href: '/admin', label: 'Tableau de bord' },
    { href: '/admin/stores', label: 'Boutiques' },
    { href: '/admin/products', label: 'Produits' },
    { href: '/admin/sales', label: 'Ventes' },
    { href: '/admin/users', label: 'Utilisateurs' },
    { href: '/admin/payouts', label: 'Versements' },
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
                pathname === l.href ? 'bg-purple-50 text-purple-700' : 'text-ink-muted hover:bg-paper-sunken'
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
                pathname === l.href ? 'bg-purple-600 text-white' : 'border border-line-strong bg-paper text-ink'
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