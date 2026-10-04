'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../lib/auth-context';
import { apiGet, apiPost } from '../../../lib/api';
import { formatMoney, formatDateTime } from '../../../lib/format';
import { paymentLabel } from '../../../lib/labels';
import { Spinner, StatusBadge, EmptyState } from '../../../components/Ui';

export default function AdminPayouts() {
  const { user } = useAuth();
  const [payouts, setPayouts] = useState(null);
  const [done, setDone] = useState(null);
  const [config, setConfig] = useState(null);

  function load() {
    apiGet('/admin/payouts/pending', { auth: true })
      .then((d) => setPayouts(d.payouts))
      .catch(() => setPayouts([]));
  }

  useEffect(() => {
    apiGet('/config')
      .then((d) => setConfig(d.config))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function process(id) {
    let reference;
    if (config?.paymentMode === 'live') {
      reference = window.prompt(
        'Transfert réel effectué ? Saisissez la référence du versement (Wave/Orange/…) :',
      );
      if (!reference) return;
    }
    try {
      await apiPost(`/admin/payouts/${id}/process`, reference ? { reference } : {}, { auth: true });
      load();
    } catch (e) {
      alert(e.message);
    }
  }

  async function runAuto() {
    const d = await apiPost('/admin/payouts/auto', {}, { auth: true });
    setDone(d);
    load();
  }

  if (!payouts) return <Spinner />;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink-strong">Versements vendeurs</h1>
        <button onClick={runAuto} className="btn-secondary">
          Déclencher les payouts automatiques
        </button>
      </div>

      {config?.paymentMode === 'live' && (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Mode réel : effectuez le transfert manuellement (Wave/Orange/…), puis cliquez
          « Traiter » et saisissez la référence du versement. Le solde vendeur sera remis à zéro.
        </p>
      )}

      {done && (
        <p className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Payouts automatiques traités : {done.processed?.length} boutique(s).
        </p>
      )}

      {payouts.length === 0 ? (
        <EmptyState
          title="Aucun versement en attente"
          subtitle={
            config?.paymentMode === 'sandbox'
              ? 'Les versements en attente apparaîtront ici. En mode démonstration, ils sont traités automatiquement à chaque vente.'
              : 'Les versements en attente apparaîtront ici après validation.'
          }
        />
      ) : (
        <div className="space-y-3">
          {payouts.map((p) => (
            <div key={p.id} className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-ink-strong">
                    {p.store?.name} — {formatMoney(p.amount)}
                  </p>
                  <p className="text-sm text-ink-muted">
                    {p.store?.owner?.name} · {paymentLabel(p.method)} →{' '}
                    {p.store?.payoutInfo?.phone}
                  </p>
                  <p className="text-xs text-ink-faint">Créé le {formatDateTime(p.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge value={p.status} />
                  <button onClick={() => process(p.id)} className="btn-primary px-3 py-1.5 text-xs">
                    Traiter
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}