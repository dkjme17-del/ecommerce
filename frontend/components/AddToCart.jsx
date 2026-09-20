'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { apiPost } from '../lib/api';
import { FormError } from './Ui';

export default function AddToCart({ productId, slug, stock }) {
  const { user } = useAuth();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleAdd() {
    setError('');
    setMessage('');
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/products/${slug || productId}`)}`);
      return;
    }
    setLoading(true);
    try {
      await apiPost('/cart/items', { productId, quantity }, { auth: true });
      setMessage('Ajouté au panier !');
      setTimeout(() => setMessage(''), 2500);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-ink">Quantité</label>
        <div className="flex items-center rounded-lg border border-line-strong">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-3 py-2 text-ink-muted hover:bg-paper-sunken"
          >
            −
          </button>
          <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity(Math.min(stock, quantity + 1))}
            className="px-3 py-2 text-ink-muted hover:bg-paper-sunken"
          >
            +
          </button>
        </div>
      </div>
      <button onClick={handleAdd} disabled={loading || stock === 0} className="btn-primary w-full sm:w-auto">
        {loading ? 'Ajout en cours…' : 'Ajouter au panier'}
      </button>
      {message && <p className="text-sm font-medium text-emerald-600">{message}</p>}
      <FormError error={error} />
    </div>
  );
}