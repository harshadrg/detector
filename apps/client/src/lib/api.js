/**
 * Centralized API client using browser native fetch (Zero Axios rule).
 * Handles automatic JSON serialization, credentials (cookies), CSRF tokens,
 * and Safe UI Context Switching headers.
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
let activeContextRole = null;

export function setCsrfToken(token) {
  cachedCsrfToken = token;
}

export function getCsrfToken() {
  return cachedCsrfToken || getCookie('csrf_token');
}

export function setContextRole(roleCode) {
  activeContextRole = roleCode;
}

export function getContextRole() {
  return activeContextRole;
}

/**
 * Dispatches an HTTP request with credentialed cookies, CSRF protection,
 * and safe UI context headers.
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

  // Attach Safe UI Context Switching header if set
  if (activeContextRole && !headers.has('X-UI-Context-Role')) {
    headers.set('X-UI-Context-Role', activeContextRole);
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
    setContextRole(null);
    return data;
  },
  getMe: async () => {
    return apiFetch('/api/core/auth/me', {
      method: 'GET',
    });
  },
  getContextRoles: async () => {
    return apiFetch('/api/core/auth/context-roles', {
      method: 'GET',
    });
  },
};
