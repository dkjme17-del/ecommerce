'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { apiPost } from '../lib/api';
import { FormError } from './Ui';
import { StarRating } from './StarRating';

export default function ReviewForm({ slug }) {
  const { user } = useAuth();
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!user) {
      router.push(`/login?next=/products/${slug}`);
      return;
    }
    setLoading(true);
    try {
      await apiPost(`/products/${slug}/reviews`, { rating, comment }, { auth: true });
      setDone(true);
    } catch (err) {
      if (err.status === 403) {
        setError('Vous devez avoir reçu ce produit pour le noter.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="card flex items-center justify-center p-6 text-sm font-medium text-emerald-600">
        Merci, votre avis a été enregistré.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card p-5 space-y-4">
      <h3 className="font-semibold text-ink-strong">Laisser un avis</h3>
      <div>
        <span className="label">Votre note</span>
        <div
          className="inline-flex cursor-pointer gap-1"
          onClick={(e) => {
            const idx = [...e.currentTarget.children].findIndex((c) => c === e.target) + 1;
            if (idx > 0) setRating(idx);
          }}
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <Star star={i <= rating} key={i} />
          ))}
        </div>
      </div>
      <div>
        <label className="label">Commentaire (optionnel)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="input"
          placeholder="Partagez votre expérience…"
        />
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Envoi…' : 'Publier mon avis'}
      </button>
      <FormError error={error} />
    </form>
  );
}

function Star({ star, size = 'md' }) {
  const sizes = { md: 'h-5 w-5' };
  return (
    <svg
      className={`${sizes[size]} ${star ? 'text-amber-400' : 'text-ink-faint'}`}
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 0 0 .95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 0 0-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.539 1.118l-3.366-2.445a1 1 0 0 0-1.176 0l-3.366 2.445c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 0 0-.364-1.118L2.05 9.385c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 0 0 .95-.69l1.287-3.958Z" />
    </svg>
  );
}