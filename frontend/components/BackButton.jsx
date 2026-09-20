'use client';

import { useRouter } from 'next/navigation';

export default function BackButton({ className = 'mb-4 text-sm font-medium text-brand-600 hover:underline' }) {
  const router = useRouter();
  return (
    <button type="button" onClick={() => router.back()} className={className}>
      ← Retour
    </button>
  );
}