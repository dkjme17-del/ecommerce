'use client';

import { useState } from 'react';
import ProductImage from './ProductImage';

export default function ProductGallery({ images, name }) {
  const list = Array.isArray(images) ? images.filter(Boolean) : [];
  const [index, setIndex] = useState(0);
  const active = list.length > 0 ? list[Math.min(index, list.length - 1)] : undefined;

  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-paper shadow-card">
      <div className="relative aspect-square">
        <ProductImage src={active} alt={name} className="h-full w-full object-cover" eager />
      </div>
      {list.length > 1 && (
        <div className="flex gap-2 p-3">
          {list.map((img, i) => (
            <button
              key={`${img}-${i}`}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Image ${i + 1} sur ${list.length}`}
              aria-current={i === index}
              className={`h-16 w-16 overflow-hidden rounded-xl border-2 transition ${
                i === index ? 'border-brand-500' : 'border-line hover:border-line-strong'
              }`}
            >
              <ProductImage src={img} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}