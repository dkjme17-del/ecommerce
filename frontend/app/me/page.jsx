'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { apiGet, apiPatch } from '../../lib/api';
import { formatDateTime } from '../../lib/format';
import { roleLabel } from '../../lib/labels';
import { Spinner, StatusBadge } from '../../components/Ui';

export default function MePage() {
  const { user, loading, hasRole } = useAuth();
  const router = useRouter();
  const [notifs, setNotifs] = useState(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login?next=/me');
      return;
    }
    apiGet('/notifications', { auth: true })
      .then((d) => setNotifs(d))
      .catch(() => {});
  }, [loading, user, router]);

  async function markRead(id) {
    await apiPatch(`/notifications/${id}/read`, {}, { auth: true });
    setNotifs((n) => ({
      ...n,
      notifications: n.notifications.map((x) => (x.id === id ? { ...x, read: true } : x)),
      unread: Math.max(0, n.unread - 1),
    }));
  }

  if (loading || !user) return <Spinner />;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-ink-strong">Mon compte</h1>

      <div className="card mt-5 p-5">
        <p className="text-lg font-semibold text-ink-strong">{user.name}</p>
        <p className="text-sm text-ink-muted">{user.email} · {user.phone}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className={`badge ${user.roles.includes('ADMIN') ? 'bg-purple-100 text-purple-700' : 'bg-paper-sunken text-ink'}`}>
            {user.roles.map(roleLabel).join(', ')}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/orders" className="btn-secondary">Mes commandes</Link>
          <Link href="/cart" className="btn-secondary">Mon panier</Link>
          {hasRole('SELLER') && <Link href="/seller" className="btn-primary">Espace vendeur</Link>}
          {hasRole('ADMIN') && <Link href="/admin" className="btn-primary">Espace admin</Link>}
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink-strong">Notifications</h2>
          {notifs?.unread > 0 && (
            <span className="badge bg-brand-100 text-brand-700">{notifs.unread} non lues</span>
          )}
        </div>

        {!notifs || notifs.notifications.length === 0 ? (
          <p className="text-ink-muted">Aucune notification.</p>
        ) : (
          <div className="space-y-2">
            {notifs.notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => markRead(n.id)}
                className={`card block w-full p-4 text-left hover:shadow-sm ${!n.read ? 'border-brand-300' : ''}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm font-semibold text-ink-strong ${!n.read ? '' : 'font-medium text-ink-muted'}`}>
                    {n.title}
                  </p>
                  <span className="shrink-0 text-xs text-ink-faint">{formatDateTime(n.createdAt)}</span>
                </div>
                {n.message && (
                  <p className={`mt-1 text-sm text-ink-muted ${n.read ? 'text-ink-faint' : ''}`}>
                    {n.message}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}