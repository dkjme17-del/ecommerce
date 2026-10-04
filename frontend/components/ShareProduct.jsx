'use client';

import { useState } from 'react';

function ShareIcon({ d, className = 'h-4 w-4', fill = false }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={fill ? 'currentColor' : 'none'} stroke={fill ? 'none' : 'currentColor'} strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

export default function ShareProduct({ name }) {
  const [copied, setCopied] = useState(false);

  let url = '';
  if (typeof window !== 'undefined') {
    url = window.location.href;
  }
  const text = `Découvrez « ${name} » sur DKmarket`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  async function nativeShare() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: name, text, url });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-ink-muted">Partager :</span>
      <button
        type="button"
        onClick={() => {
          void nativeShare().then((ok) => {
            if (!ok) copyLink();
          });
        }}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-paper-muted text-ink-muted transition-colors hover:bg-brand-600 hover:text-white"
        aria-label="Partager"
        title="Partager"
      >
        <ShareIcon d="M12 3v12m0-12L7 8m5-5 5 5M4 13v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
      </button>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white transition hover:bg-emerald-600"
        aria-label="Partager sur WhatsApp"
        title="WhatsApp"
      >
        <ShareIcon fill d="M12.04 2a9.9 9.9 0 0 0-8.5 14.9L2 22l5.25-1.5A9.9 9.9 0 1 0 12.04 2Zm5.7 14.1c-.24.68-1.4 1.3-1.94 1.35-.52.05-.96.24-3.22-.66-2.72-1.09-4.45-3.9-4.59-4.08-.14-.18-1.1-1.46-1.1-2.79 0-1.33.7-1.98.95-2.25.25-.27.54-.34.72-.34.18 0 .37 0 .53.01.17.01.4-.06.62.48.24.56.79 1.93.86 2.07.07.14.12.31.02.5-.1.19-.15.3-.3.47-.15.16-.31.37-.44.5-.15.14-.3.29-.13.57.17.28.75 1.24 1.61 2 .1.1.22.15.34.15.66 0 1.93-1.2 2.23-1.64.14-.24-.11-.33-.24-.44-.46-.4-.84-.7-1.2-1.1-.25-.22-.15-.62.05-.74l.34-.24c.3-.24.56-.36.8-.58.15-.14.26-.31.12-.6-.13-.28-.62-1.68-.85-2.3-.22-.6-.45-.52-.62-.53h-.6c-.18 0-.48.07-.74.34-.25.27-.97.95-.97 2.33 0 1.37 1 2.7 1.14 2.89.14.18 1.97 3 4.77 4.2.67.29 1.18.23 1.62.14.49-.1 1.4-.57 1.6-1.13.2-.55.2-1.03.14-1.13-.06-.1-.22-.16-.46-.28Z" />
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-700"
        aria-label="Partager sur Facebook"
        title="Facebook"
      >
        <ShareIcon fill d="M13.5 22v-8h2.7l.4-3.1h-3.1V8.9c0-.9.25-1.5 1.55-1.5h1.65V4.6c-.3-.04-1.3-.13-2.44-.13-2.4 0-4.06 1.47-4.06 4.16v2.32H7.5V14h2.58v8h3.42Z" />
      </a>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-slate-700"
        aria-label="Partager sur X"
        title="X"
      >
        <ShareIcon fill d="M18.9 2h3.4l-7.4 8.5L23.6 22h-6.8l-5.2-6.9L5.6 22H2.2l7.9-9.1L2 2h7l4.7 6.2L18.9 2Zm-1.2 18h1.9L7 3.9H5L17.7 20Z" />
      </a>
      <button
        type="button"
        onClick={copyLink}
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-sm font-medium text-ink-muted transition-colors hover:border-brand-600 hover:text-brand-600"
        title="Copier le lien"
      >
        {copied ? (
          <span className="text-emerald-600">Lien copié ✓</span>
        ) : (
          <>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 15 9m-5.2 7.2a3.2 3.2 0 0 1-4.5.1L6 14.6a3.2 3.2 0 0 1-.2-4.5l3-3a3.2 3.2 0 0 1 4.5.2m1.4 1.4 3-3a3.2 3.2 0 0 0-.3-4.5 3.2 3.2 0 0 0-4.5.2M9 15l-1.6 1.6" transform="translate(0 0)"/>
            </svg>
            Copier le lien
          </>
        )}
      </button>
    </div>
  );
}