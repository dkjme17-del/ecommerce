import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
        404
      </p>
      <h1 className="mt-4 text-4xl font-black tracking-[-0.06em] text-ink-strong dark:text-white">
        Page introuvable
      </h1>
      <p className="mt-3 max-w-lg text-base text-ink-muted dark:text-ink-faint">
        La page que vous cherchez n’existe pas ou a été déplacée.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center justify-center rounded-full bg-ink-strong px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300"
      >
        Retour à l’accueil
      </Link>
    </main>
  );
}
