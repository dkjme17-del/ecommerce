import { useAuth } from '../lib/auth-context';
import { statusLabel } from '../lib/labels';

export function StatusBadge({ value }) {
  const styles = {
    PENDING: 'bg-amber-100 text-amber-700',
    PAID: 'bg-emerald-100 text-emerald-700',
    PROCESSING: 'bg-sky-100 text-sky-700',
    SHIPPED: 'bg-indigo-100 text-indigo-700',
    DELIVERED: 'bg-emerald-600 text-white',
    CANCELLED: 'bg-red-100 text-red-700',
    REFUNDED: 'bg-ink-faint text-ink',
    APPROVED: 'bg-emerald-100 text-emerald-700',
    REJECTED: 'bg-red-100 text-red-700',
    SUSPENDED: 'bg-orange-100 text-orange-700',
    ACTIVE: 'bg-emerald-100 text-emerald-700',
    ARCHIVED: 'bg-ink-faint text-ink',
    DRAFT: 'bg-ink-faint text-ink',
    UNPAID: 'bg-amber-100 text-amber-700',
    FAILED: 'bg-red-100 text-red-700',
    SUCCESS: 'bg-emerald-100 text-emerald-700',
  };
  const label = statusLabel(value);
  return <span className={`badge ${styles[value] || 'bg-paper-sunken text-ink'}`}>{label}</span>;
}

export function FormError({ error }) {
  if (!error) return null;
  const message = typeof error === 'string' ? error : error?.message || 'Une erreur est survenue';
  const details = typeof error === 'object' && error?.details;
  return (
    <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
      <p>{message}</p>
      {Array.isArray(details) && details.length > 0 && (
        <ul className="mt-1 list-disc pl-5">
          {details.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex justify-center py-10">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
    </div>
  );
}

export function EmptyState({ title, subtitle, action, icon }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong bg-paper px-6 py-16 text-center">
      {icon && (
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/15">
          {icon}
        </span>
      )}
      <p className="text-lg font-semibold text-ink">{title}</p>
      {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-paper shadow-card">
      <div className="skeleton aspect-square" />
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton mt-2 h-5 w-2/5 rounded" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 10 }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function Guard({ role, children, fallback }) {
  const { user, loading, hasRole } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return fallback || null;
  if (role && !hasRole(role)) return fallback || null;
  return children;
}