const BASE_URL = '';

/**
 * API client — wraps fetch with error handling
 */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Important for session cookies
    ...options,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    let errorMessage;
    try {
      const data = await response.json();
      errorMessage = data.error || data.message || `HTTP ${response.status}`;
    } catch {
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export const api = {
  // ─── Auth ───────────────────────────────
  getAuthStatus: () => request('/auth/status'),
  initiateAuth: (storeDomain) => request(`/auth/shopify?storeDomain=${encodeURIComponent(storeDomain)}`),
  disconnect: () => request('/auth/disconnect', { method: 'POST' }),

  // ─── AI Execution ──────────────────────
  executePrompt: (prompt) => request('/api/execute', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  }),
  confirmActions: (prompt, actions) => request('/api/execute/confirm', {
    method: 'POST',
    body: JSON.stringify({ prompt, actions }),
  }),

  // ─── Shopify Data ──────────────────────
  getProducts: () => request('/api/shopify/products'),
  getPages: () => request('/api/shopify/pages'),
  getCollections: () => request('/api/shopify/collections'),
  getStoreInfo: () => request('/api/shopify/store'),

  // ─── History ───────────────────────────
  getHistory: (limit = 20, offset = 0) => request(`/api/history?limit=${limit}&offset=${offset}`),
  getHistoryEntry: (id) => request(`/api/history/${id}`),
  undoAction: (id) => request(`/api/history/${id}/undo`, { method: 'POST' }),
  redoAction: (id) => request(`/api/history/${id}/redo`, { method: 'POST' }),

  // ─── Health ────────────────────────────
  healthCheck: () => request('/api/health'),
};
