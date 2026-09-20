'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../lib/auth-context';
import { apiGet, apiPatch } from '../../../lib/api';
import { formatDateTime } from '../../../lib/format';
import { roleLabel } from '../../../lib/labels';
import { Spinner, StatusBadge, EmptyState } from '../../../components/Ui';

export default function AdminUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState(null);
  const [role, setRole] = useState('SELLER');

  function load() {
    apiGet(`/admin/users${role ? `?role=${role}` : ''}`, { auth: true })
      .then((d) => setUsers(d.users))
      .catch(() => setUsers([]));
  }

  useEffect(() => {
    if (!user) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, role]);

  async function act(id, status) {
    await apiPatch(`/admin/users/${id}/status`, { status }, { auth: true });
    load();
  }

  if (!users) return <Spinner />;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink-strong">Utilisateurs</h1>
        <select value={role} onChange={(e) => setRole(e.target.value)} className="input w-auto">
          <option value="SELLER">Vendeurs</option>
          <option value="CUSTOMER">Clients</option>
          <option value="">Tous</option>
        </select>
      </div>

      {users.length === 0 ? (
        <EmptyState title="Aucun utilisateur" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase text-ink-muted">
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Téléphone</th>
                <th className="px-4 py-3">Rôles</th>
                <th className="px-4 py-3">Boutique</th>
                <th className="px-4 py-3">Inscrit</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-line-soft last:border-0">
                  <td className="px-4 py-3 font-medium text-ink-strong">{u.name}</td>
                  <td className="px-4 py-3 text-ink-muted">{u.email}</td>
                  <td className="px-4 py-3 text-ink-muted">{u.phone}</td>
                  <td className="px-4 py-3">{u.roles.map(roleLabel).join(', ')}</td>
                  <td className="px-4 py-3 text-ink-muted">{u.store?.name || '—'}</td>
                  <td className="px-4 py-3 text-ink-muted">{formatDateTime(u.createdAt)}</td>
                  <td className="px-4 py-3"><StatusBadge value={u.status} /></td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => act(u.id, u.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED')}
                      className={u.status === 'SUSPENDED' ? 'btn-primary px-2.5 py-1 text-xs' : 'btn-danger px-2.5 py-1 text-xs'}
                    >
                      {u.status === 'SUSPENDED' ? 'Réactiver' : 'Suspendre'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}