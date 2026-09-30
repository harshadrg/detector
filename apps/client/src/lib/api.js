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

export const employeeApi = {
  list: async ({ page = 1, pageSize = 10, status = 'ALL', search = '' } = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      status,
      search,
    });
    return apiFetch(`/api/core/employees?${params.toString()}`, {
      method: 'GET',
    });
  },
  create: async (employeeData) => {
    return apiFetch('/api/core/employees', {
      method: 'POST',
      body: employeeData,
    });
  },
  updateStatus: async (ecode, status) => {
    return apiFetch(`/api/core/employees/${encodeURIComponent(ecode)}/status`, {
      method: 'PATCH',
      body: { status },
    });
  },
};

export const rbacApi = {
  getRoles: async () => {
    return apiFetch('/api/core/rbac/roles', {
      method: 'GET',
    });
  },
  assignRole: async ({ ecode, role_code, action }) => {
    return apiFetch('/api/core/rbac/assign-role', {
      method: 'POST',
      body: { ecode, role_code, action },
    });
  },
};

export const auditApi = {
  getEvents: async ({
    page = 1,
    pageSize = 20,
    module_code = '',
    entity_type = '',
    entity_id = '',
    action = '',
    search = '',
  } = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (module_code && module_code !== 'ALL') params.set('module_code', module_code);
    if (entity_type && entity_type !== 'ALL') params.set('entity_type', entity_type);
    if (entity_id) params.set('entity_id', entity_id);
    if (action) params.set('action', action);
    if (search) params.set('search', search);

    return apiFetch(`/api/core/audit?${params.toString()}`, {
      method: 'GET',
    });
  },
};

export const notificationApi = {
  list: async ({ page = 1, pageSize = 20, unreadOnly = false } = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      unreadOnly: String(unreadOnly),
    });
    return apiFetch(`/api/core/notifications?${params.toString()}`, {
      method: 'GET',
    });
  },
  markAsRead: async (notificationId) => {
    return apiFetch(`/api/core/notifications/${encodeURIComponent(notificationId)}/read`, {
      method: 'PATCH',
    });
  },
  markAllAsRead: async () => {
    return apiFetch('/api/core/notifications/mark-all-read', {
      method: 'POST',
    });
  },
};

export const masterApi = {
  getAll: async () => {
    return apiFetch('/api/modules/bpms/masters/all', {
      method: 'GET',
    });
  },
  getVerticals: async ({ activeOnly = false, search = '' } = {}) => {
    const params = new URLSearchParams();
    if (activeOnly) params.set('activeOnly', 'true');
    if (search) params.set('search', search);
    return apiFetch(`/api/modules/bpms/masters/verticals?${params.toString()}`, {
      method: 'GET',
    });
  },
  createVertical: async (data) => {
    return apiFetch('/api/modules/bpms/masters/verticals', {
      method: 'POST',
      body: data,
    });
  },
  updateVertical: async (id, data) => {
    return apiFetch(`/api/modules/bpms/masters/verticals/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: data,
    });
  },
  getSBUs: async ({ vertical_id = '', activeOnly = false, search = '' } = {}) => {
    const params = new URLSearchParams();
    if (vertical_id) params.set('vertical_id', String(vertical_id));
    if (activeOnly) params.set('activeOnly', 'true');
    if (search) params.set('search', search);
    return apiFetch(`/api/modules/bpms/masters/sbus?${params.toString()}`, {
      method: 'GET',
    });
  },
  createSBU: async (data) => {
    return apiFetch('/api/modules/bpms/masters/sbus', {
      method: 'POST',
      body: data,
    });
  },
  updateSBU: async (id, data) => {
    return apiFetch(`/api/modules/bpms/masters/sbus/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: data,
    });
  },
  getClients: async ({ client_type = '', activeOnly = false, search = '' } = {}) => {
    const params = new URLSearchParams();
    if (client_type && client_type !== 'ALL') params.set('client_type', client_type);
    if (activeOnly) params.set('activeOnly', 'true');
    if (search) params.set('search', search);
    return apiFetch(`/api/modules/bpms/masters/clients?${params.toString()}`, {
      method: 'GET',
    });
  },
  createClient: async (data) => {
    return apiFetch('/api/modules/bpms/masters/clients', {
      method: 'POST',
      body: data,
    });
  },
  updateClient: async (id, data) => {
    return apiFetch(`/api/modules/bpms/masters/clients/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: data,
    });
  },
  getLocations: async ({ state = '', city = '', search = '' } = {}) => {
    const params = new URLSearchParams();
    if (state) params.set('state', state);
    if (city) params.set('city', city);
    if (search) params.set('search', search);
    return apiFetch(`/api/modules/bpms/masters/locations?${params.toString()}`, {
      method: 'GET',
    });
  },
  createLocation: async (data) => {
    return apiFetch('/api/modules/bpms/masters/locations', {
      method: 'POST',
      body: data,
    });
  },
  updateLocation: async (id, data) => {
    return apiFetch(`/api/modules/bpms/masters/locations/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: data,
    });
  },
};

export const importApi = {
  stageUpload: async (formData) => {
    return apiFetch('/api/modules/bpms/imports/stage', {
      method: 'POST',
      body: formData,
    });
  },
  listBatches: async ({ page = 1, pageSize = 10 } = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    return apiFetch(`/api/modules/bpms/imports/batches?${params.toString()}`, {
      method: 'GET',
    });
  },
  getBatch: async (batchId) => {
    return apiFetch(`/api/modules/bpms/imports/${encodeURIComponent(batchId)}`, {
      method: 'GET',
    });
  },
  getStagedRows: async (batchId, { page = 1, pageSize = 20, filter = 'ALL' } = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      filter,
    });
    return apiFetch(`/api/modules/bpms/imports/${encodeURIComponent(batchId)}/rows?${params.toString()}`, {
      method: 'GET',
    });
  },
  commitBatch: async (batchId) => {
    return apiFetch(`/api/modules/bpms/imports/${encodeURIComponent(batchId)}/commit`, {
      method: 'POST',
    });
  },
};

export const processApi = {
  list: async ({
    page = 1,
    pageSize = 20,
    search = '',
    vertical_id = '',
    sbu_id = '',
    status = 'ALL',
    client_type = '',
    sortField = 'process_code',
    sortDirection = 'ASC',
  } = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      sortField,
      sortDirection,
    });
    if (search) params.set('search', search);
    if (vertical_id) params.set('vertical_id', String(vertical_id));
    if (sbu_id) params.set('sbu_id', String(sbu_id));
    if (status && status !== 'ALL') params.set('status', status);
    if (client_type && client_type !== 'ALL') params.set('client_type', client_type);

    return apiFetch(`/api/modules/bpms/processes?${params.toString()}`, {
      method: 'GET',
    });
  },
  getById: async (registryId) => {
    return apiFetch(`/api/modules/bpms/processes/${encodeURIComponent(registryId)}`, {
      method: 'GET',
    });
  },
  create: async (data) => {
    return apiFetch('/api/modules/bpms/processes', {
      method: 'POST',
      body: data,
    });
  },
};


