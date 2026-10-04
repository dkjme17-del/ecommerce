'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { useTheme } from '../lib/theme';

export default function Navbar() {
  const { user, logout, hasRole } = useAuth();
  const { theme, toggle } = useTheme();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);

  function onSearch(e) {
    e.preventDefault();
    router.push(q ? `/products?q=${encodeURIComponent(q)}` : '/products');
  }

  const navLink =
    'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-paper-sunken hover:text-ink-strong';

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-display text-2xl font-bold tracking-tight text-brand-600">
            DKmarket
          </span>
        </Link>

        <form onSubmit={onSearch} className="hidden flex-1 sm:flex">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un produit…"
            className="w-full rounded-l-xl border border-r-0 border-line-strong bg-paper-muted px-3.5 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-brand-500 focus:bg-paper focus:outline-none focus:ring-4 focus:ring-brand-500/10"
          />
          <button
            type="submit"
            className="rounded-r-xl bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Rechercher
          </button>
        </form>

        <div className="ml-auto hidden items-center gap-1 md:flex">
          <button
            type="button"
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
            className="rounded-xl p-2.5 text-ink-muted transition-colors hover:bg-paper-sunken hover:text-ink-strong"
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <Link href="/cart" className={navLink}>
            <CartIcon /> Panier
          </Link>
          {hasRole('SELLER') && (
            <Link href="/seller" className={navLink}>
              Vendre
            </Link>
          )}
          {hasRole('ADMIN') && (
            <Link href="/admin" className={navLink}>
              Admin
            </Link>
          )}
          {user ? (
            <span className="flex items-center gap-1">
              <Link href="/me" className={navLink}>
                <span className="hidden lg:inline">{user.name}</span>
                <span className="lg:hidden">Compte</span>
              </Link>
              <button
                onClick={() => {
                  logout();
                  router.push('/');
                }}
                className="rounded-xl px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/40"
              >
                Déconnexion
              </button>
            </span>
          ) : (
            <Link href="/login" className="btn-primary">
              Se connecter
            </Link>
          )}
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="ml-auto rounded-xl p-2 text-ink-muted hover:bg-paper-sunken md:hidden"
          aria-label="Menu"
          aria-expanded={open}
        >
          <MenuIcon />
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-paper px-4 py-3 md:hidden">
          <form onSubmit={onSearch} className="mb-3 flex">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un produit…"
              className="w-full rounded-l-xl border border-r-0 border-line-strong bg-paper-muted px-3.5 py-2 text-sm"
            />
            <button type="submit" className="rounded-r-xl bg-brand-600 px-4 text-white">OK</button>
          </form>
          <div className="mb-3 flex items-center gap-2">
            <button
              type="button"
              onClick={toggle}
              aria-label={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
              className="inline-flex items-center gap-2 rounded-xl border border-line-strong px-3 py-2 text-sm text-ink-muted"
            >
              {theme === 'dark' ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
              {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            </button>
          </div>
          <nav className="flex flex-col">
            <Link href="/cart" onClick={() => setOpen(false)} className={navLink}>Panier</Link>
            <Link href="/products" onClick={() => setOpen(false)} className={navLink}>Tous les produits</Link>
            <Link href="/register" onClick={() => setOpen(false)} className={navLink}>Devenir vendeur</Link>
            {user ? (
              <>
                <Link href="/me" onClick={() => setOpen(false)} className={navLink}>Mon compte</Link>
                {hasRole('SELLER') && <Link href="/seller" onClick={() => setOpen(false)} className={navLink}>Espace vendeur</Link>}
                {hasRole('ADMIN') && <Link href="/admin" onClick={() => setOpen(false)} className={navLink}>Espace admin</Link>}
                <button
                  onClick={() => {
                    logout();
                    router.push('/');
                  }}
                  className="rounded-xl px-3 py-2 text-left text-sm font-medium text-red-600"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <Link href="/login" onClick={() => setOpen(false)} className={navLink}>
                Se connecter
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

function CartIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
    </svg>
  );
}

function SunIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="12" r="4.2" />
      <path strokeLinecap="round" d="M12 2.5v2.2M12 19.3v2.2M4.93 4.93l1.56 1.56M17.51 17.51l1.56 1.56M2.5 12h2.2M19.3 12h2.2M4.93 19.07l1.56-1.56M17.51 6.49l1.56-1.56" />
    </svg>
  );
}

function MoonIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.8A8.8 8.8 0 0 1 11.2 3a8.8 8.8 0 1 0 9.8 9.8Z" />
    </svg>
  );
}