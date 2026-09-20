const API_BASE = '/api/v1';

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('mp_token');
}

export async function api(path, { method = 'GET', body, auth = false, formData = false } = {}) {
  const headers = {};
  if (!formData) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: formData ? body : body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  }

  if (!res.ok) {
    const message = data?.error?.message || `Erreur ${res.status}`;
    throw new ApiError(message, res.status, data?.error?.details);
  }

  return data;
}

export const apiGet = (path, opts = {}) => api(path, { method: 'GET', ...opts });
export const apiPost = (path, body, opts = {}) => api(path, { method: 'POST', body, ...opts });
export const apiPut = (path, body, opts = {}) => api(path, { method: 'PUT', body, ...opts });
export const apiPatch = (path, body, opts = {}) => api(path, { method: 'PATCH', body, ...opts });
export const apiDelete = (path, opts = {}) => api(path, { method: 'DELETE', ...opts });