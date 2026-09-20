'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../lib/auth-context';
import { apiGet, apiPatch } from '../../../lib/api';
import { formatDateTime } from '../../../lib/format';
import { paymentLabel } from '../../../lib/labels';
import { Spinner, StatusBadge, EmptyState } from '../../../components/Ui';

export default function AdminStores() {
  const { user } = useAuth();
  const [stores, setStores] = useState(null);
  const [filter, setFilter] = useState('PENDING');

  function load() {
    apiGet(`/admin/stores${filter ? `?status=${filter}` : ''}`, { auth: true })
      .then((d) => setStores(d.stores))
      .catch(() => setStores([]));
  }

  useEffect(() => {
    if (!user) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filter]);

  async function act(id, action) {
    await apiPatch(`/admin/stores/${id}/validate`, { action }, { auth: true });
    load();
  }

  if (!stores) return <Spinner />;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink-strong">Gestion des boutiques</h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input w-auto">
          <option value="PENDING">En attente</option>
          <option value="APPROVED">Approuvées</option>
          <option value="REJECTED">Rejetées</option>
          <option value="SUSPENDED">Suspendues</option>
          <option value="">Toutes</option>
        </select>
      </div>

      {stores.length === 0 ? (
        <EmptyState title="Aucune boutique" subtitle="Aucune boutique dans cette catégorie." />
      ) : (
        <div className="space-y-3">
          {stores.map((st) => (
            <div key={st.id} className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="flex items-center gap-2 font-semibold text-ink-strong">
                    {st.name} <StatusBadge value={st.status} />
                  </p>
                  <p className="text-sm text-ink-muted">
                    {st.owner?.name} · {st.owner?.email} · {st.owner?.phone}
                  </p>
                  <p className="text-xs text-ink-faint">
                    {st._count?.products} produit(s) · créée le {formatDateTime(st.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {st.status !== 'APPROVED' && (
                    <button onClick={() => act(st.id, 'APPROVE')} className="btn-primary px-3 py-1.5 text-xs">
                      Approuver
                    </button>
                  )}
                  {st.status !== 'REJECTED' && st.status !== 'PENDING' && (
                    <button onClick={() => act(st.id, 'REJECT')} className="btn-secondary px-3 py-1.5 text-xs">
                      Rejeter
                    </button>
                  )}
                  <button
                    onClick={() => act(st.id, st.status === 'SUSPENDED' ? 'ACTIVATE' : 'SUSPEND')}
                    className={st.status === 'SUSPENDED' ? 'btn-primary px-3 py-1.5 text-xs' : 'btn-danger px-3 py-1.5 text-xs'}
                  >
                    {st.status === 'SUSPENDED' ? 'Réactiver' : 'Suspendre'}
                  </button>
                </div>
              </div>
              {st.payoutInfo && (
                <p className="mt-2 text-xs text-ink-muted">
                  Versements : {paymentLabel(st.payoutInfo.method)} → {st.payoutInfo.phone}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}