'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { apiGet, apiPost } from '../../lib/api';
import { formatMoney } from '../../lib/format';
import { paymentLabel } from '../../lib/labels';
import { Spinner, FormError } from '../../components/Ui';

const METHODS = [
  { value: 'WAVE', label: 'Wave', desc: 'Paiement via l’app Wave' },
  { value: 'ORANGE_MONEY', label: 'Orange Money', desc: '#144# via téléphone' },
  { value: 'MTN_MOMO', label: 'MTN MoMo', desc: '*126# via téléphone' },
];

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ fullName: '', phone: '', city: '', address: '', method: 'WAVE' });
  const [error, setError] = useState('');
  const [stage, setStage] = useState('form'); // form | paying | paid
  const [config, setConfig] = useState(null);

  useEffect(() => {
    apiGet('/config')
      .then((d) => setConfig(d.config))
      .catch(() => {});
    if (authLoading) return;
    if (!user) {
      router.push('/login?next=/checkout');
      return;
    }
    setForm((f) => ({ ...f, fullName: user.name, phone: user.phone }));
    apiGet('/cart', { auth: true })
      .then(setCart)
      .finally(() => setLoading(false));
  }, [authLoading, user, router]);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setStage('paying');
    try {
      const order = await apiPost(
        '/orders',
        {
          paymentMethod: form.method,
          shippingAddress: {
            fullName: form.fullName,
            phone: form.phone,
            city: form.city,
            address: form.address,
          },
        },
        { auth: true },
      );
      const payment = await apiPost(
        '/payments/momo/initiate',
        { orderId: order.order.id, phone: form.phone },
        { auth: true },
      );

      // Paiement réel (Wave) : redirection vers la page de paiement Wave.
      if (payment.payment?.checkoutUrl) {
        setStage('paying');
        window.location.href = payment.payment.checkoutUrl;
        return;
      }

      // Mode sandbox : attente de la confirmation (~3 s)
      const deadline = Date.now() + 30000;
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 2000));
        const detail = await apiGet(`/orders/${order.order.id}`, { auth: true });
        if (detail.order.paymentStatus === 'PAID') {
          setStage('paid');
          setTimeout(() => router.push(`/orders/${order.order.id}`), 1200);
          return;
        }
      }
      setError('Le paiement prend trop de temps, vérifiez le statut dans Mes commandes.');
      setStage('form');
    } catch (err) {
      setError(err.message);
      setStage('form');
    }
  }

  const total = (cart?.items || []).reduce((s, i) => s + i.total, 0);

  if (loading || authLoading) return <Spinner />;

  if (stage === 'paying') {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        <h1 className="mt-4 text-xl font-bold text-ink-strong">Paiement en cours…</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Confirmez le paiement {paymentLabel(form.method)} sur votre téléphone.
        </p>
        <p className="mt-4 rounded-lg bg-amber-50 px-4 py-2 text-xs text-amber-700">
          {config?.paymentMode === 'sandbox'
            ? 'Mode démonstration : le paiement sandbox est confirmé automatiquement.'
            : 'Confirmez la réception du paiement sur votre téléphone.'}
        </p>
      </div>
    );
  }

  if (stage === 'paid') {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-600">
          ✓
        </div>
        <h1 className="mt-4 text-xl font-bold text-ink-strong">Commande payée !</h1>
        <p className="mt-2 text-sm text-ink-muted">Redirection vers le suivi de commande…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-ink-strong">Paiement</h1>

      {!cart || cart.items.length === 0 ? (
        <p className="text-ink-muted">
          Votre panier est vide.{' '}
          <Link href="/products" className="font-semibold text-brand-600 hover:underline">
            Voir les produits
          </Link>
        </p>
      ) : (
        <form onSubmit={submit} className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="card p-5">
              <h2 className="mb-4 font-semibold text-ink-strong">Adresse de livraison</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <input className="input" placeholder="Nom complet" value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
                <input className="input" placeholder="Téléphone" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                <input className="input" placeholder="Ville / Quartier" value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })} required />
                <input className="input" placeholder="Adresse détaillée" value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })} required />
              </div>
            </div>

            <div className="card p-5">
              <h2 className="mb-4 font-semibold text-ink-strong">Mode de paiement</h2>
              {config?.paymentMode === 'live' && (
                <p className="mb-3 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700 dark:bg-brand-500/15">
                  Paiements réels : seuls les moyens intégrés au lancement sont proposés.
                </p>
              )}
              <div className="space-y-3">
                {METHODS.map((m) => {
                  const disabled = config?.paymentMode === 'live' && m.value !== 'WAVE';
                  return (
                    <label key={m.value}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                        form.method === m.value ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10' : 'border-line'
                      } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
                    >
                      <input
                        type="radio"
                        name="method"
                        value={m.value}
                        checked={form.method === m.value}
                        disabled={disabled}
                        onChange={() => setForm({ ...form, method: m.value })}
                        className="h-4 w-4 text-brand-600"
                      />
                      <span className="flex-1">
                        <span className="block text-sm font-semibold text-ink-strong">{m.label}</span>
                        <span className="block text-xs text-ink-muted">{m.desc}</span>
                      </span>
                      {disabled && (
                        <span className="badge bg-paper-sunken text-ink-muted">Bientôt</span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="card h-fit p-5">
            <h2 className="font-semibold text-ink-strong">Votre commande</h2>
            <ul className="mt-3 max-h-48 space-y-2 overflow-auto text-sm">
              {cart.items.map((i) => (
                <li key={i.productId} className="flex justify-between gap-3 text-ink-muted">
                  <span className="truncate">{i.name} × {i.quantity}</span>
                  <span className="font-medium">{formatMoney(i.total)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-between border-t border-line pt-3 text-lg font-bold text-ink-strong">
              <span>Total</span>
              <span>{formatMoney(total)}</span>
            </div>
            <p className="mt-2 text-xs text-ink-faint">
              Commission plateforme de {Math.round((config?.commissionRate || 0.05) * 100)} %,
              déduite du vendeur.
            </p>
            <button type="submit" className="btn-primary mt-4 w-full">
              Payer {formatMoney(total)}
            </button>
            <FormError error={error} />
          </div>
        </form>
      )}
    </div>
  );
}