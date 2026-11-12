const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/+$/, '');

let csrfToken = null;
let onUnauthorizedHandler = null;

export class ApiError extends Error {
  constructor(message, status = 500, errors = []) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export function setUnauthorizedHandler(fn) {
  onUnauthorizedHandler = fn;
}

export function setCsrfToken(token) {
  if (token) csrfToken = token;
}

export function getApiOrigin() {
  if (API_BASE_URL.startsWith('http')) {
    try {
      return new URL(API_BASE_URL).origin;
    } catch {
      return '';
    }
  }
  return '';
}

export function resolveAssetUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const origin = getApiOrigin();
  return `${origin}${path}`;
}

export async function fetchCsrfToken() {
  const res = await fetch(`${API_BASE_URL}/auth/csrf-token`, {
    method: 'GET',
    credentials: 'include',
  });
  const payload = await res.json();
  if (res.ok && payload?.data?.csrfToken) {
    csrfToken = payload.data.csrfToken;
  }
  return csrfToken;
}

export async function apiRequest(endpoint, options = {}, _retriedCsrf = false) {
  const method = (options.method || 'GET').toUpperCase();
  const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  const isFormData = options.body instanceof FormData;

  if (isMutating && !csrfToken) {
    await fetchCsrfToken();
  }

  const headers = {
    ...(options.headers || {}),
  };

  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  if (isMutating && csrfToken) {
    headers['x-csrf-token'] = csrfToken;
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    method,
    headers,
    credentials: 'include',
  });

  const contentType = res.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await res.json() : null;

  if (res.status === 403 && payload?.message?.includes('CSRF') && !_retriedCsrf) {
    await fetchCsrfToken();
    return apiRequest(endpoint, options, true);
  }

  if (payload?.data?.csrfToken) {
    csrfToken = payload.data.csrfToken;
  }

  if (!res.ok) {
    if (res.status === 401 && onUnauthorizedHandler && !endpoint.startsWith('/auth/')) {
      onUnauthorizedHandler();
    }
    throw new ApiError(
      payload?.message || `Request failed with status ${res.status}`,
      res.status,
      payload?.errors || []
    );
  }

  return payload;
}

export const api = {
  get: (path) => apiRequest(path, { method: 'GET' }),
  post: (path, body) =>
    apiRequest(path, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body || {}),
    }),
  put: (path, body) =>
    apiRequest(path, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body || {}),
    }),
  patch: (path, body) =>
    apiRequest(path, {
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body || {}),
    }),
  delete: (path) => apiRequest(path, { method: 'DELETE' }),
};

