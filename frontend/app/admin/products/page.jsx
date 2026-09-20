'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../lib/auth-context';
import { apiGet, apiPatch } from '../../../lib/api';
import { formatMoney } from '../../../lib/format';
import { Spinner, StatusBadge, EmptyState } from '../../../components/Ui';

export default function AdminProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState(null);

  function load() {
    apiGet('/admin/products', { auth: true })
      .then((d) => setProducts(d.products))
      .catch(() => setProducts([]));
  }

  useEffect(() => {
    if (!user) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function act(id, status) {
    await apiPatch(`/admin/products/${id}/status`, { status }, { auth: true });
    load();
  }

  if (!products) return <Spinner />;

  return (
    <div>
      <h1 className="mb-5 text-2xl font-bold text-ink-strong">Gestion des produits</h1>

      {products.length === 0 ? (
        <EmptyState title="Aucun produit" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase text-ink-muted">
                <th className="px-4 py-3">Produit</th>
                <th className="px-4 py-3">Boutique</th>
                <th className="px-4 py-3">Prix</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-line-soft last:border-0">
                  <td className="px-4 py-3 font-medium text-ink-strong">{p.name}</td>
                  <td className="px-4 py-3 text-ink-muted">{p.store?.name}</td>
                  <td className="px-4 py-3">{formatMoney(p.price)}</td>
                  <td className="px-4 py-3">{p.stock}</td>
                  <td className="px-4 py-3"><StatusBadge value={p.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {p.status !== 'ACTIVE' ? (
                        <button onClick={() => act(p.id, 'ACTIVE')} className="btn-primary px-2.5 py-1 text-xs">
                          Activer
                        </button>
                      ) : (
                        <button onClick={() => act(p.id, 'DRAFT')} className="btn-danger px-2.5 py-1 text-xs">
                          Désactiver
                        </button>
                      )}
                    </div>
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