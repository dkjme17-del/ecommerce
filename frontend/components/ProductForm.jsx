'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { apiGet, apiPost, apiPut } from '../lib/api';
import { FormError } from '../components/Ui';
import ProductImage from '../components/ProductImage';

const MAX_IMAGES = 8;

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

export default function ProductForm({ productId }) {
  const { user } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    compareAtPrice: '',
    stock: '0',
    categoryId: '',
    images: [],
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const isEdit = !!productId;

  useEffect(() => {
    apiGet('/categories').then((d) => setCategories(d.categories)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    apiGet(`/products/seller/${productId}`, { auth: true })
      .then((d) => {
        const p = d.product;
        setForm({
          name: p.name,
          description: p.description || '',
          price: String(p.price / 100),
          compareAtPrice: p.compareAtPrice ? String(p.compareAtPrice / 100) : '',
          stock: String(p.stock),
          categoryId: p.categoryId,
          images: p.images || [],
        });
      })
      .catch((e) => setError(e.message));
  }, [productId, isEdit]);

  async function uploadImages(files) {
    const fd = new FormData();
    for (const f of files) fd.append('images', f);
    const data = await apiPost('/upload/images', fd, { auth: true, formData: true });
    return data.urls;
  }

  function validate() {
    const e = {};
    if (String(form.name || '').trim().length < 2) {
      e.name = 'Le nom doit contenir au moins 2 caractères.';
    }
    const price = parseFloat(form.price);
    if (Number.isNaN(price) || price <= 0) {
      e.price = 'Saisissez un prix supérieur à 0.';
    }
    const stock = parseInt(form.stock, 10);
    if (Number.isNaN(stock) || stock < 0) {
      e.stock = 'Le stock doit être un nombre positif.';
    }
    if (!form.categoryId) {
      e.categoryId = 'Choisissez une catégorie.';
    }
    if (form.compareAtPrice) {
      const compare = parseFloat(form.compareAtPrice);
      if (Number.isNaN(compare) || compare <= 0) {
        e.compareAtPrice = 'Prix barré invalide.';
      } else if (price && compare <= price) {
        e.compareAtPrice = 'Le prix barré doit être supérieur au prix de vente.';
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setLoading(true);
    const price = Math.round(parseFloat(form.price) * 100);
    const compare = form.compareAtPrice
      ? Math.round(parseFloat(form.compareAtPrice) * 100)
      : undefined;
    const body = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      price,
      compareAtPrice: compare !== undefined && compare > price ? compare : undefined,
      stock: parseInt(form.stock, 10) || 0,
      categoryId: form.categoryId,
      images: form.images,
    };
    try {
      if (isEdit) {
        await apiPut(`/products/${productId}`, body, { auth: true });
      } else {
        await apiPost('/products', body, { auth: true });
      }
      router.push('/seller/products');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="card max-w-2xl space-y-4 p-6" noValidate>
      <h1 className="text-2xl font-bold text-ink-strong">
        {isEdit ? 'Modifier le produit' : 'Nouveau produit'}
      </h1>

      <div>
        <label className="label">Nom du produit</label>
        <input
          className="input"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          maxLength={120}
          placeholder="Ex. Smartphone X200 128 Go"
        />
        <FieldError message={errors.name} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Prix (FCFA)</label>
          <input
            className="input"
            type="number"
            min="1"
            step="any"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
          <FieldError message={errors.price} />
        </div>
        <div>
          <label className="label">Prix barré (optionnel)</label>
          <input
            className="input"
            type="number"
            min="1"
            step="any"
            value={form.compareAtPrice}
            onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })}
          />
          <FieldError message={errors.compareAtPrice} />
          {!errors.compareAtPrice && form.compareAtPrice && (
            <p className="mt-1 text-xs text-ink-faint">Ancien prix affiché en barré lors des promos.</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Stock</label>
          <input
            className="input"
            type="number"
            min="0"
            max="1000000"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
          />
          <FieldError message={errors.stock} />
        </div>
        <div>
          <label className="label">Catégorie</label>
          <select
            className="input"
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
          >
            <option value="">Choisir…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <FieldError message={errors.categoryId} />
        </div>
      </div>

      <div>
        <label className="label">Description</label>
        <textarea
          rows={4}
          maxLength={2000}
          className="input"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>

      <div>
        <label className="label">
          Images{' '}
          <span className="font-normal text-ink-faint">
            ({form.images.length}/{MAX_IMAGES})
          </span>
        </label>
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={uploading || form.images.length >= MAX_IMAGES}
          onChange={async (e) => {
            if (!e.target.files?.length) return;
            const files = [...e.target.files];
            const room = MAX_IMAGES - form.images.length;
            if (files.length > room) {
              setError(`Maximum ${MAX_IMAGES} images par produit (${files.length - room} en trop).`);
              e.target.value = '';
              return;
            }
            setUploading(true);
            setError('');
            try {
              const urls = await uploadImages(files);
              setForm((f) => ({ ...f, images: [...f.images, ...urls] }));
            } catch (err) {
              setError(err.message);
            } finally {
              setUploading(false);
              e.target.value = '';
            }
          }}
          className="input disabled:cursor-not-allowed disabled:opacity-60"
        />
        {uploading && <p className="mt-1 text-xs text-ink-muted">Envoi des images…</p>}
        {form.images.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {form.images.map((img, i) => (
              <div key={`${img}-${i}`} className="relative">
                <div className="h-20 w-20 overflow-hidden rounded-lg">
                  <ProductImage src={img} alt="" className="h-full w-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))
                  }
                  aria-label="Retirer cette image"
                  className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs text-white transition hover:bg-red-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <FormError error={error} />
      <button type="submit" disabled={loading || uploading} className="btn-primary w-full">
        {loading ? 'Enregistrement…' : isEdit ? 'Mettre à jour' : 'Créer le produit'}
      </button>
    </form>
  );
}