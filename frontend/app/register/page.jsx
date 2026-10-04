'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiPost } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { FormError } from '../../components/Ui';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    asSeller: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiPost('/auth/register', {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        asSeller: form.asSeller,
      });
      login(data.token, data.user);
      router.push(form.asSeller ? '/seller/setup' : '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12">
      <div className="card p-6">
        <h1 className="text-xl font-bold text-ink-strong">Créer un compte</h1>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="label">Nom complet</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Téléphone</label>
            <input
              className="input"
              placeholder="Votre numéro de téléphone"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Mot de passe</label>
            <input
              type="password"
              className="input"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              minLength={6}
              required
            />
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-line p-3">
            <input
              type="checkbox"
              checked={form.asSeller}
              onChange={(e) => set('asSeller', e.target.checked)}
              className="h-4 w-4 rounded border-line-strong text-brand-600"
            />
            <span className="text-sm text-ink">
              Je souhaite ouvrir une boutique et <strong>vendre mes produits</strong>
            </span>
          </label>

          <FormError error={error} />
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Création…' : 'Créer mon compte'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-ink-muted">
          Déjà inscrit ?{' '}
          <Link href="/login" className="font-semibold text-brand-600 hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}