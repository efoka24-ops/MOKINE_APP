import axios from 'axios';

// Configuration API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Instance axios avec configuration par défaut
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Intercepteur pour ajouter le token JWT
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ========== AUTH ENDPOINTS ==========
export const auth = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  logout: () => apiClient.post('/auth/logout'),
  getProfile: () => apiClient.get('/auth/profile'),
  updateProfile: (data) => apiClient.put('/auth/profile', data),
};

// ========== APPOINTMENTS ENDPOINTS ==========
export const appointments = {
  getAll: () => apiClient.get('/appointments'),
  getById: (id) => apiClient.get(`/appointments/${id}`),
  create: (data) => apiClient.post('/appointments', data),
  update: (id, data) => apiClient.put(`/appointments/${id}`, data),
  cancel: (id) => apiClient.delete(`/appointments/${id}`),
};

// ========== CONSULTATIONS ENDPOINTS ==========
export const consultations = {
  getAll: () => apiClient.get('/consultations'),
  getById: (id) => apiClient.get(`/consultations/${id}`),
  create: (data) => apiClient.post('/consultations', data),
  update: (id, data) => apiClient.put(`/consultations/${id}`, data),
};

// ========== ANIMALS ENDPOINTS ==========
export const animals = {
  getAll: () => apiClient.get('/animals'),
  getById: (id) => apiClient.get(`/animals/${id}`),
  add: (data) => apiClient.post('/animals', data),
  update: (id, data) => apiClient.put(`/animals/${id}`, data),
  delete: (id) => apiClient.delete(`/animals/${id}`),
};

// ========== NOTIFICATIONS ENDPOINTS ==========
export const notifications = {
  getAll: () => apiClient.get('/notifications'),
  getUnreadCount: () => apiClient.get('/notifications/unread/count'),
  markAsRead: (id) => apiClient.put(`/notifications/${id}/read`),
  delete: (id) => apiClient.delete(`/notifications/${id}`),
};

// ========== PAYMENTS ENDPOINTS ==========
export const payments = {
  process: (data) => apiClient.post('/payments/process', data),
  getHistory: () => apiClient.get('/payments/history'),
  refund: (data) => apiClient.post('/payments/refund', data),
};

// ========== IA ENDPOINTS ==========
export const ia = {
  analyze: (data) => apiClient.post('/ia/analyze', data),
  diagnose: (data) => apiClient.post('/ia/diagnose', data),
  getHealthReport: (animalId, params) => 
    apiClient.get(`/ia/health-report/${animalId}`, { params }),
};

// ========== USERS ENDPOINTS ==========
export const users = {
  getProfile: () => apiClient.get('/users/profile'),
  updateProfile: (data) => apiClient.put('/users/profile', data),
  getSubscription: () => apiClient.get('/users/subscription'),
  updateSettings: (data) => apiClient.put('/users/settings', data),
};

// ========== ADMIN ENDPOINTS ==========
export const admin = {
  // Dashboard
  getDashboard: () => apiClient.get('/admin/dashboard'),

  // Users Management
  getUsers: () => apiClient.get('/admin/users'),
  toggleUserBlock: (userId) => apiClient.post('/admin/users/toggle-block', { userId }),
  deleteUser: (id) => apiClient.delete(`/admin/users/${id}`),

  // Veterinarians Management
  getVeterinarians: () => apiClient.get('/admin/veterinarians'),
  updateVeterinarian: (id, data) => apiClient.put(`/admin/veterinarians/${id}`, data),

  // Payments Management
  getPayments: () => apiClient.get('/admin/payments'),
  processRefund: (data) => apiClient.post('/admin/payments/refund', data),

  // Products Management
  getProducts: () => apiClient.get('/admin/products'),
  addProduct: (data) => apiClient.post('/admin/products', data),
  updateProduct: (id, data) => apiClient.put(`/admin/products/${id}`, data),
  deleteProduct: (id) => apiClient.delete(`/admin/products/${id}`),

  // Settings
  getSettings: () => apiClient.get('/admin/settings'),
  updateSettings: (data) => apiClient.put('/admin/settings', data),
};

// ========== VIDEOSDK ENDPOINTS ==========
export const authToken = process.env.REACT_APP_TOKENPRIERE;

export const createMeeting = async ({ token }) => {
  const res = await fetch(`https://api.videosdk.live/v2/rooms`, {
    method: 'POST',
    headers: {
      authorization: `${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });

  const { roomId } = await res.json();
  return roomId;
};

// Health check
export const healthCheck = () => apiClient.get('/health');

export default apiClient;
