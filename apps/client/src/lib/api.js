/**
 * Centralized API client using browser native fetch (Zero Axios rule).
 * Handles automatic JSON serialization, credentials (cookies), and CSRF token transmission.
 */

class ApiError extends Error {
  constructor(message, code = 'API_ERROR', status = 500, details = []) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/**
 * Extracts a cookie value by name from document.cookie.
 * @param {string} name
 * @returns {string|null}
 */
export function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

let cachedCsrfToken = null;

export function setCsrfToken(token) {
  cachedCsrfToken = token;
}

export function getCsrfToken() {
  return cachedCsrfToken || getCookie('csrf_token');
}

/**
 * Dispatches an HTTP request with credentialed cookies and CSRF protection.
 *
 * @param {string} endpoint - API path, e.g. '/api/core/auth/login'
 * @param {RequestInit} [options={}]
 * @returns {Promise<any>} Response envelope data payload
 */
export async function apiFetch(endpoint, options = {}) {
  const headers = new Headers(options.headers || {});

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  // Attach CSRF token on mutating requests
  const method = (options.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfToken = getCsrfToken();
    if (csrfToken && !headers.has('X-CSRF-Token')) {
      headers.set('X-CSRF-Token', csrfToken);
    }
  }

  // Auto-set JSON content-type if body is an object
  let body = options.body;
  if (body && typeof body === 'object' && !(body instanceof FormData) && !(body instanceof Blob)) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(body);
  }

  const config = {
    ...options,
    method,
    headers,
    body,
    credentials: options.credentials || 'include',
  };

  const response = await fetch(endpoint, config);

  let jsonResult;
  try {
    jsonResult = await response.json();
  } catch {
    throw new ApiError(
      `Invalid server response format (${response.status} ${response.statusText})`,
      'INVALID_JSON',
      response.status
    );
  }

  if (!response.ok || !jsonResult.success) {
    const errorPayload = jsonResult?.error || {};
    throw new ApiError(
      errorPayload.message || 'An unexpected API request failure occurred.',
      errorPayload.code || 'HTTP_ERROR_' + response.status,
      response.status,
      errorPayload.details || []
    );
  }

  return jsonResult.data;
}

export const authApi = {
  login: async (credentials) => {
    const data = await apiFetch('/api/core/auth/login', {
      method: 'POST',
      body: credentials,
    });
    if (data?.csrfToken) {
      setCsrfToken(data.csrfToken);
    }
    return data;
  },
  logout: async () => {
    const data = await apiFetch('/api/core/auth/logout', {
      method: 'POST',
    });
    setCsrfToken(null);
    return data;
  },
  getMe: async () => {
    return apiFetch('/api/core/auth/me', {
      method: 'GET',
    });
  },
};
