import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor – attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor – handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── AUTH ────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  getUsers: () => api.get('/auth/users'),
  updateRole: (id, role) => api.put(`/auth/users/${id}/role`, { role })
};

// ─── PRODUCTS ────────────────────────────────────────────────────────────────
export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`)
};

// ─── CATEGORIES ──────────────────────────────────────────────────────────────
export const categoryAPI = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`)
};

// ─── INVENTORY ───────────────────────────────────────────────────────────────
export const inventoryAPI = {
  getAll: (params) => api.get('/inventory', { params }),
  getByProduct: (productId) => api.get(`/inventory/${productId}`),
  initialize: (data) => api.post('/inventory', data),
  adjust: (productId, data) => api.post(`/inventory/${productId}/adjust`, data),
  updateSettings: (productId, data) => api.put(`/inventory/${productId}`, data),
  getFilterMeta: () => api.get('/inventory/meta/filters'),
  getLowStock: () => api.get('/inventory/alerts/low-stock'),
  getSummary: () => api.get('/inventory/dashboard/summary'),
  // Stock Transfer endpoints
  initiateTransfer: (data) => api.post('/inventory/transfer/initiate', data),
  getTransfers: (params) => api.get('/inventory/transfer', { params }),
  receiveTransfer: (transferId) => api.put(`/inventory/transfer/${transferId}/received`),
  cancelTransfer: (transferId) => api.delete(`/inventory/transfer/${transferId}`)
};

// ─── TRANSACTIONS ────────────────────────────────────────────────────────────
export const transactionAPI = {
  getAll: (params) => api.get('/transactions', { params })
};

// ─── SUPPLIERS ───────────────────────────────────────────────────────────────
export const supplierAPI = {
  getAll: (params) => api.get('/suppliers', { params }),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
  getStats: () => api.get('/suppliers/stats/summary')
};

export default api;
