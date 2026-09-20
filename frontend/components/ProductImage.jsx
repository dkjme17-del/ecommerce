'use client';

import { useState } from 'react';

export default function ProductImage({ src, alt = '', className = '', eager = false }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt || 'Pas d’image'}
        className={`flex items-center justify-center bg-paper-sunken text-ink-faint ${className}`}
      >
        <span className="flex flex-col items-center gap-1.5 p-2 text-center">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="m21 15-5-5L5 21" />
          </svg>
          <span className="text-[10px] font-semibold uppercase tracking-wider">Pas d’image</span>
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}