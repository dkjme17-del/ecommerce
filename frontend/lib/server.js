const BASE = process.env.API_URL || 'http://localhost:4000';

export async function serverFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error?.message || `Erreur API ${res.status}`);
  }
  return data;
}