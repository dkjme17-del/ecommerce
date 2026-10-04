'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../lib/auth-context';
import { apiGet, apiPost, apiPut } from '../../../lib/api';
import { FormError } from '../../../components/Ui';
import { statusLabel } from '../../../lib/labels';
import { formatMoney } from '../../../lib/format';

export default function SellerSetup() {
  const { user } = useAuth();
  const [store, setStore] = useState(undefined);
  const [config, setConfig] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    logo: '',
    banner: '',
    method: 'WAVE',
    phone: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    if (!user) return;
    apiGet('/config')
      .then((d) => setConfig(d.config))
      .catch(() => {});
    apiGet('/stores/me', { auth: true })
      .then((d) => {
        setStore(d.store);
        if (d.store) {
          setForm({
            name: d.store.name || '',
            description: d.store.description || '',
            logo: d.store.logo || '',
            banner: d.store.banner || '',
            method: d.store.payoutInfo?.method || 'WAVE',
            phone: d.store.payoutInfo?.phone || '',
          });
        }
      })
      .finally(() => setLoading(false));
  }, [user]);

  async function uploadLogo(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setSuccess('');
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const data = await apiPost('/upload/image', fd, { auth: true, formData: true });
      setForm((f) => ({ ...f, logo: data.url }));
      setSuccess('Logo importé — cliquez sur « Mettre à jour » pour l’enregistrer.');
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingLogo(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    const body = {
      name: form.name,
      description: form.description,
      logo: form.logo || undefined,
      banner: form.banner || undefined,
      payoutInfo:
        form.method && form.phone
          ? { method: form.method, phone: form.phone }
          : undefined,
    };
    try {
      if (store) {
        await apiPut('/stores/me', body, { auth: true });
        setSuccess('Boutique mise à jour.');
      } else {
        await apiPost('/stores', body, { auth: true });
        setSuccess(
          'Boutique soumise à validation. Un administrateur va l’approuver prochainement.',
        );
      }
      const d = await apiGet('/stores/me', { auth: true });
      setStore(d.store);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (store === undefined) return <p className="py-10 text-center text-ink-muted">Chargement…</p>;

  const isEdit = !!store;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-ink-strong">
        {isEdit ? 'Ma boutique' : 'Créer ma boutique'}
      </h1>
      <p className="mt-1 text-sm text-ink-muted">
        {isEdit
          ? 'Modifiez votre boutique et vos informations de versement.'
          : 'Remplissez ces informations pour soumettre votre boutique à validation.'}
      </p>

      {isEdit && store.status !== 'APPROVED' && (
        <p className="mt-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Statut actuel : <strong>{statusLabel(store.status)}</strong>. Vos produits ne seront visibles
          qu’une fois la boutique approuvée.
        </p>
      )}

      <form onSubmit={submit} className="card mt-5 space-y-4 p-6">
        <div>
          <label className="label">Nom de la boutique</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea
            rows={3}
            className="input"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Logo</label>
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-paper-sunken">
              {form.logo ? (
                <img
                  src={form.logo}
                  alt="Logo actuel"
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <span className="text-xs text-ink-faint">Aucun</span>
              )}
            </div>
            <div className="flex-1">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={uploadingLogo}
                onChange={uploadLogo}
                className="input disabled:cursor-not-allowed disabled:opacity-60"
              />
              <p className="mt-1 text-xs text-ink-muted">PNG, JPG ou WEBP.</p>
            </div>
          </div>
        </div>
        <div>
          <label className="label">URL du logo (optionnel)</label>
          <input
            className="input"
            placeholder="/uploads/logo.jpg"
            value={form.logo}
            onChange={(e) => setForm({ ...form, logo: e.target.value })}
          />
        </div>

        <div className="rounded-xl bg-paper-muted p-4">
          <p className="font-semibold text-ink-strong">Versement de vos revenus (payouts)</p>
          <p className="mt-1 text-sm text-ink-muted">
            Votre solde net (après commission de {Math.round((config?.commissionRate || 0.01) * 100)}{' '}
            %) est versé automatiquement sur ce compte à partir de{' '}
            {formatMoney(config?.minPayoutAmount ?? 5000)}.
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Opérateur</label>
              <select
                className="input"
                value={form.method}
                onChange={(e) => setForm({ ...form, method: e.target.value })}
              >
                <option value="WAVE">Wave</option>
                <option value="ORANGE_MONEY">Orange Money</option>
                <option value="MTN_MOMO">MTN MoMo</option>
              </select>
            </div>
            <div>
              <label className="label">Numéro</label>
              <input
                className="input"
                placeholder="Votre numéro"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>
        </div>

        <FormError error={error} />
        {success && (
          <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p>
        )}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Enregistrement…' : isEdit ? 'Mettre à jour' : 'Créer ma boutique'}
        </button>
      </form>
    </div>
  );
}