'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { apiGet, apiPost, apiPut } from '../lib/api';
import { FormError } from '../components/Ui';

export default function ProductForm({ productId }) {
  const { user } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    compareAtPrice: '',
    stock: '',
    categoryId: '',
    images: [],
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isEdit = !!productId;

  useEffect(() => {
    apiGet('/categories').then((d) => setCategories(d.categories)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    apiGet('/products/seller/all', { auth: true })
      .then((d) => {
        const p = d.products.find((x) => x.id === productId);
        if (!p) return;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  async function uploadImages(files) {
    const fd = new FormData();
    for (const f of files) fd.append('images', f);
    const data = await apiPost('/upload/images', fd, { auth: true, formData: true });
    return data.urls;
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const body = {
      name: form.name,
      description: form.description || undefined,
      price: Math.round(parseFloat(form.price) * 100),
      compareAtPrice: form.compareAtPrice
        ? Math.round(parseFloat(form.compareAtPrice) * 100)
        : undefined,
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
    <form onSubmit={submit} className="card max-w-2xl space-y-4 p-6">
      <h1 className="text-2xl font-bold text-ink-strong">
        {isEdit ? 'Modifier le produit' : 'Nouveau produit'}
      </h1>

      <div>
        <label className="label">Nom du produit</label>
        <input
          className="input"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Prix (FCFA)</label>
          <input
            className="input"
            type="number"
            min="0"
            step="any"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label">Prix barré (optionnel)</label>
          <input
            className="input"
            type="number"
            min="0"
            step="any"
            value={form.compareAtPrice}
            onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Stock</label>
          <input
            className="input"
            type="number"
            min="0"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label">Catégorie</label>
          <select
            className="input"
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            required
          >
            <option value="">Choisir…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Description</label>
        <textarea
          rows={4}
          className="input"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>

      <div>
        <label className="label">Images</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={async (e) => {
            if (!e.target.files?.length) return;
            setLoading(true);
            try {
              const urls = await uploadImages([...e.target.files]);
              setForm((f) => ({ ...f, images: [...f.images, ...urls] }));
            } catch (err) {
              setError(err.message);
            } finally {
              setLoading(false);
              e.target.value = '';
            }
          }}
          className="input"
        />
        {form.images.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {form.images.map((img, i) => (
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt="" className="h-20 w-20 rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))
                  }
                  className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs text-white"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <FormError error={error} />
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Enregistrement…' : isEdit ? 'Mettre à jour' : 'Créer le produit'}
      </button>
    </form>
  );
}