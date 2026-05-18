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
    const token = localStorage.getItem('mokine_token');
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
      const isAuthRoute = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');
      if (!isAuthRoute && localStorage.getItem('mokine_token')) {
        // Token expired – clear and redirect
        localStorage.removeItem('mokine_token');
        localStorage.removeItem('mokine_user');
        window.location.href = '/login';
      }
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
  getVets: () => apiClient.get('/auth/vets'),
  forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => apiClient.post('/auth/reset-password', { token, password }),
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
  accept: (id, data = {}) => apiClient.patch(`/consultations/${id}/accept`, data),
  sendMessage: (id, data) => apiClient.post(`/consultations/${id}/messages`, data),
  close: (id, data) => apiClient.patch(`/consultations/${id}/close`, data),
  getPrescriptions: () => apiClient.get('/consultations/prescriptions'),
  createPrescription: (data) => apiClient.post('/consultations/prescriptions', data),
};

// ========== ANIMALS ENDPOINTS ==========
export const animals = {
  getAll: () => apiClient.get('/animals'),
  getById: (id) => apiClient.get(`/animals/${id}`),
  add: (data) => apiClient.post('/animals', data),
  update: (id, data) => apiClient.put(`/animals/${id}`, data),
  delete: (id) => apiClient.delete(`/animals/${id}`),
  addHealthRecord: (id, data) => apiClient.post(`/animals/${id}/health-records`, data),
  getHealthRecords: (id) => apiClient.get(`/animals/${id}/health-records`),
  getAlerts: () => apiClient.get('/animals/alerts'),
  markAlertRead: (id) => apiClient.patch(`/animals/alerts/${id}/read`),
  // Treatments
  addTreatment: (id, data) => apiClient.post(`/animals/${id}/treatments`, data),
  getTreatments: (id) => apiClient.get(`/animals/${id}/treatments`),
  getAllTreatments: () => apiClient.get('/animals/treatments/all'),
  // Reproduction
  addReproductionRecord: (id, data) => apiClient.post(`/animals/${id}/reproduction`, data),
  getReproductionRecords: (id) => apiClient.get(`/animals/${id}/reproduction`),
  // Death & health alerts
  declareDeath: (id, data) => apiClient.post(`/animals/${id}/declare-death`, data),
  reportHealthProblem: (id, data) => apiClient.post(`/animals/${id}/health-alert`, data),
  getDeceased: () => apiClient.get('/animals/deceased'),
};

// ========== MARKETPLACE ENDPOINTS ==========
export const marketplace = {
  getProducts: (params) => apiClient.get('/marketplace/products', { params }),
  getProductById: (id) => apiClient.get(`/marketplace/products/${id}`),
  createProduct: (data) => apiClient.post('/marketplace/products', data),
  updateProduct: (id, data) => apiClient.put(`/marketplace/products/${id}`, data),
  getVendorProducts: () => apiClient.get('/marketplace/products/vendor'),
  createOrder: (data) => apiClient.post('/marketplace/orders', data),
  getOrders: () => apiClient.get('/marketplace/orders'),
  getOrderById: (id) => apiClient.get(`/marketplace/orders/${id}`),
  confirmPayment: (id) => apiClient.patch(`/marketplace/orders/${id}/confirm-payment`),
};

// ========== NOTIFICATIONS ENDPOINTS ==========
export const notifications = {
  getAll: () => apiClient.get('/notifications'),
  getUnreadCount: () => apiClient.get('/notifications/unread/count'),
  markAsRead: (id) => apiClient.put(`/notifications/${id}/read`),
  markAllAsRead: () => apiClient.put('/notifications/all/read'),
  delete: (id) => apiClient.delete(`/notifications/${id}`),
};

// ========== PUBLIC ENDPOINTS (no auth required) ==========
export const publicApi = {
  getPlans: () => apiClient.get('/plans'),
};

// ========== PAYMENTS ENDPOINTS ==========
export const payments = {
  process: (data) => apiClient.post('/payments/process', data),
  getHistory: () => apiClient.get('/payments/history'),
  refund: (data) => apiClient.post('/payments/refund', data),
  // Commercial API subscriptions
  initiateCommercial: (data) => apiClient.post('/payments/commercial/initiate', data),
  verifyCommercial: (subscriptionId) => apiClient.get('/payments/commercial/verify', { params: { subscriptionId } }),
  getCommercialDashboard: (apiKey) => apiClient.get('/payments/commercial/dashboard', { headers: { 'X-API-Key': apiKey } }),
};

// ========== IA ENDPOINTS ==========
export const ia = {
  getQuestionnaire: () => apiClient.get('/ia/questionnaire'),
  analyze: (data) => apiClient.post('/ia/analyze', data),
  diagnose: (data) => apiClient.post('/ia/diagnose', data),
  getHealthReport: (animalId) => apiClient.get('/ia/health-report', { params: { animalId } }),
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
  // ── Global dashboard ──────────────────────────────────────────────────────
  getDashboard: () => apiClient.get('/admin/dashboard'),
  getAnalytics: () => apiClient.get('/admin/analytics'),

  // ── MokineVeto ────────────────────────────────────────────────────────────
  getVets: () => apiClient.get('/admin/veto/vets'),
  updateVet: (id, data) => apiClient.put(`/admin/veto/vets/${id}`, data),
  toggleVetStatus: (id) => apiClient.patch(`/admin/veto/vets/${id}/toggle-status`),

  getFarmers: () => apiClient.get('/admin/veto/farmers'),

  getAnimals: () => apiClient.get('/admin/veto/animals'),
  updateAnimal: (id, data) => apiClient.put(`/admin/veto/animals/${id}`, data),
  deleteAnimal: (id) => apiClient.delete(`/admin/veto/animals/${id}`),

  getConsultations: () => apiClient.get('/admin/veto/consultations'),
  closeConsultation: (id) => apiClient.patch(`/admin/veto/consultations/${id}/close`),

  getPrescriptions: () => apiClient.get('/admin/veto/prescriptions'),

  getAppointments: () => apiClient.get('/admin/veto/appointments'),
  updateAppointmentStatus: (id, status) => apiClient.patch(`/admin/veto/appointments/${id}/status`, { status }),

  getSanitaryAlerts: () => apiClient.get('/admin/veto/sanitary-alerts'),
  verifySanitaryAlert: (id) => apiClient.patch(`/admin/veto/sanitary-alerts/${id}/verify`),
  deleteSanitaryAlert: (id) => apiClient.delete(`/admin/veto/sanitary-alerts/${id}`),

  // ── MokineBox ─────────────────────────────────────────────────────────────
  getBoxStats: () => apiClient.get('/admin/box/stats'),
  getIotDevices: () => apiClient.get('/admin/box/devices'),
  updateIotDevice: (id, data) => apiClient.put(`/admin/box/devices/${id}`, data),
  deleteIotDevice: (id) => apiClient.delete(`/admin/box/devices/${id}`),
  getIotAlerts: () => apiClient.get('/admin/box/alerts'),
  getSensorReadings: () => apiClient.get('/admin/box/readings'),

  // ── MokineMarket ──────────────────────────────────────────────────────────
  getMarketProducts: () => apiClient.get('/admin/market/products'),
  createMarketProduct: (data) => apiClient.post('/admin/market/products', data),
  updateMarketProduct: (id, data) => apiClient.put(`/admin/market/products/${id}`, data),
  deleteMarketProduct: (id) => apiClient.delete(`/admin/market/products/${id}`),

  getOrders: () => apiClient.get('/admin/market/orders'),
  updateOrderStatus: (id, status) => apiClient.patch(`/admin/market/orders/${id}/status`, { status }),

  getVendors: () => apiClient.get('/admin/market/vendors'),

  getKycRequests: () => apiClient.get('/admin/market/kyc'),
  approveKyc: (id) => apiClient.patch(`/admin/market/kyc/${id}/approve`),
  rejectKyc: (id, reason) => apiClient.patch(`/admin/market/kyc/${id}/reject`, { reason }),

  // ── MokineLab ─────────────────────────────────────────────────────────────
  getLabStats: () => apiClient.get('/admin/lab/stats'),
  getContributions: () => apiClient.get('/admin/lab/contributions'),
  approveContribution: (id) => apiClient.patch(`/admin/lab/contributions/${id}/approve`),
  rejectContribution: (id, reason) => apiClient.patch(`/admin/lab/contributions/${id}/reject`, { reason }),

  // ── Plans API (admin) ─────────────────────────────────────────────────────
  getApiPlans: () => apiClient.get('/admin/lab/plans'),
  createApiPlan: (data) => apiClient.post('/admin/lab/plans', data),
  updateApiPlan: (id, data) => apiClient.put(`/admin/lab/plans/${id}`, data),
  toggleApiPlan: (id) => apiClient.patch(`/admin/lab/plans/${id}/toggle`),
  deleteApiPlan: (id) => apiClient.delete(`/admin/lab/plans/${id}`),
  getApiSubscriptions: () => apiClient.get('/admin/lab/subscriptions'),

  // ── MokineField ───────────────────────────────────────────────────────────
  getFarms: () => apiClient.get('/admin/field/farms'),
  getFarmMembers: () => apiClient.get('/admin/field/members'),
  getFarmActivity: () => apiClient.get('/admin/field/activity'),

  // ── System ────────────────────────────────────────────────────────────────
  getSystemUsers: () => apiClient.get('/admin/system/users'),
  createSystemUser: (data) => apiClient.post('/admin/system/users', data),
  updateSystemUser: (id, data) => apiClient.put(`/admin/system/users/${id}`, data),
  toggleSystemUserBlock: (id) => apiClient.patch(`/admin/system/users/${id}/toggle-block`),
  deleteSystemUser: (id) => apiClient.delete(`/admin/system/users/${id}`),

  getSystemPayments: () => apiClient.get('/admin/system/payments'),
  systemProcessRefund: (data) => apiClient.post('/admin/system/payments/refund', data),

  getSystemNotifications: () => apiClient.get('/admin/system/notifications'),
  broadcastNotification: (data) => apiClient.post('/admin/system/notifications/broadcast', data),

  getSystemSettings: () => apiClient.get('/admin/system/settings'),
  updateSystemSettings: (data) => apiClient.put('/admin/system/settings', data),
  getDatabaseBackups: () => apiClient.get('/admin/system/database/backups'),
  resetDatabase: (data) => apiClient.post('/admin/system/database/reset', data),
  restoreDatabase: (snapshotId, data = {}) => apiClient.post(`/admin/system/database/restore/${snapshotId}`, data),
  getDatabaseAnalytics: () => apiClient.get('/admin/system/database/analytics'),

  // ── Legacy (backward compat) ──────────────────────────────────────────────
  getUsers: () => apiClient.get('/admin/users'),
  toggleUserBlock: (userId) => apiClient.post('/admin/users/toggle-block', { userId }),
  deleteUser: (id) => apiClient.delete(`/admin/users/${id}`),
  getVeterinarians: () => apiClient.get('/admin/veterinarians'),
  updateVeterinarian: (id, data) => apiClient.put(`/admin/veterinarians/${id}`, data),
  getPayments: () => apiClient.get('/admin/payments'),
  processRefund: (data) => apiClient.post('/admin/payments/refund', data),
  getProducts: () => apiClient.get('/admin/products'),
  addProduct: (data) => apiClient.post('/admin/products', data),
  updateProduct: (id, data) => apiClient.put(`/admin/products/${id}`, data),
  deleteProduct: (id) => apiClient.delete(`/admin/products/${id}`),
  getSettings: () => apiClient.get('/admin/settings'),
  updateSettings: (data) => apiClient.put('/admin/settings', data),
};

// ========== SMS AUTH ENDPOINTS ==========
export const smsAuth = {
  sendOTP: (data) => apiClient.post('/sms-auth/send-otp', data),
  verifyOTP: (data) => apiClient.post('/sms-auth/verify-otp', data),
  completeProfile: (data) => apiClient.put('/sms-auth/complete-profile', data),
};

// ========== PDF ENDPOINTS ==========
export const pdf = {
  getPrescription: (id) => `${API_BASE_URL}/pdf/prescription/${id}`,
  verifyPrescription: (id) => apiClient.get(`/pdf/verify/${id}`),
};

// ========== VET ENDPOINTS ==========
export const vet = {
  getDashboard: () => apiClient.get('/vet/dashboard'),
  getAgenda: () => apiClient.get('/vet/agenda'),
  createSlot: (data) => apiClient.post('/vet/agenda', data),
  updateSlot: (id, data) => apiClient.put(`/vet/agenda/${id}`, data),
  getPatients: () => apiClient.get('/vet/patients'),
  getInvoices: () => apiClient.get('/vet/invoices'),
  generateInvoice: (data) => apiClient.post('/vet/invoices', data),
  markInvoicePaid: (id) => apiClient.patch(`/vet/invoices/${id}/paid`),
  // Forum
  getForumPosts: (params) => apiClient.get('/vet/forum', { params }),
  createForumPost: (data) => apiClient.post('/vet/forum', data),
  addForumReply: (postId, data) => apiClient.post(`/vet/forum/${postId}/reply`, data),
  likeForumPost: (postId) => apiClient.post(`/vet/forum/${postId}/like`),
  resolveForumPost: (postId) => apiClient.patch(`/vet/forum/${postId}/resolve`),
  // Reminders
  getReminders: () => apiClient.get('/vet/reminders'),
  createReminder: (data) => apiClient.post('/vet/reminders', data),
  markReminderDone: (id) => apiClient.patch(`/vet/reminders/${id}/done`),
  // Sensibilisation
  getSensitisationPosts: (params) => apiClient.get('/vet/sensibilisation', { params }),
  createSensitisationPost: (data) => apiClient.post('/vet/sensibilisation', data),
  // Referral
  getVetsForReferral: () => apiClient.get('/vet/referral/vets'),
  referColleague: (data) => apiClient.post('/vet/referral', data),
  // Support
  getSupportFAQ: () => apiClient.get('/vet/support/faq'),
  // Consultations
  refuseConsultation: (id, reason) => apiClient.patch(`/consultations/${id}/refuse`, { reason }),
  acceptConsultation: (id, mode) => apiClient.patch(`/consultations/${id}/accept`, { mode }),
  requestMoreInfo: (id, question) => apiClient.post(`/consultations/${id}/request-info`, { question }),
};

// ========== VENDOR ENDPOINTS ==========
export const vendor = {
  getDashboard: () => apiClient.get('/vendor/dashboard'),
  submitKYC: (data) => apiClient.post('/vendor/kyc/submit', data),
  getKYCStatus: () => apiClient.get('/vendor/kyc/status'),
  approveKYC: (id) => apiClient.post(`/vendor/kyc/approve/${id}`),
  rejectKYC: (id, reason) => apiClient.post(`/vendor/kyc/reject/${id}`, { reason }),
  updateDelivery: (orderId, data) => apiClient.patch(`/vendor/orders/${orderId}/tracking`, data),
  initiateMobileMoneyPayment: (data) => apiClient.post('/vendor/payment/mobile-money', data),
  confirmMobileMoneyWebhook: (data) => apiClient.post('/vendor/payment/webhook', data),
  getSalesPoints: () => apiClient.get('/vendor/sales-points'),
  createSalesPoint: (data) => apiClient.post('/vendor/sales-points', data),
};

// ========== TEBE IA ENDPOINTS ==========
// ========== PLANS PUBLICS ==========
export const apiPlans = {
  getAll: () => apiClient.get('/plans'),
};

export const tebe = {
  getPublicStats: () => apiClient.get('/tebe/stats'),
  analyzeImage: (data) => apiClient.post('/tebe/analyze-image', data),
  analyzeVideo: (data) => apiClient.post('/tebe/analyze-video', data),
  getConditions: () => apiClient.get('/tebe/conditions'),
  contributeTrainingData: (data) => apiClient.post('/tebe/contribute', data),
};

// ========== IOT ENDPOINTS ==========
export const iot = {
  getDashboard: () => apiClient.get('/iot/dashboard'),
  getDevices: () => apiClient.get('/iot/devices'),
  registerDevice: (data) => apiClient.post('/iot/devices', data),
  getReadings: (deviceId, params) => apiClient.get(`/iot/readings/${deviceId}`, { params }),
  ingestReading: (data) => apiClient.post('/iot/readings', data),
  getAlerts: () => apiClient.get('/iot/alerts'),
};

// ========== SANITARY ALERTS ENDPOINTS ==========
export const sanitaryAlerts = {
  getAll: (params) => apiClient.get('/alerts/sanitary', { params }),
  create: (data) => apiClient.post('/alerts/sanitary', data),
  verify: (id) => apiClient.patch(`/alerts/sanitary/${id}/verify`),
  delete: (id) => apiClient.delete(`/alerts/sanitary/${id}`),
};

// ========== FARMS ENDPOINTS ==========
export const farms = {
  getAll: () => apiClient.get('/farms'),
  create: (data) => apiClient.post('/farms', data),
  getById: (id) => apiClient.get(`/farms/${id}`),
  invite: (id, data) => apiClient.post(`/farms/${id}/invite`, data),
  join: (token) => apiClient.post(`/farms/join/${token}`),
  removeMember: (farmId, memberId) => apiClient.delete(`/farms/${farmId}/members/${memberId}`),
};

// ========== AGENTS TERRAIN ENDPOINTS ==========
export const agents = {
  getAll: () => apiClient.get('/agents'),
  create: (data) => apiClient.post('/agents', data),
  getLocation: (agentId) => apiClient.get(`/agents/${agentId}/location`),
  updateLocation: (agentId, data) => apiClient.patch(`/agents/${agentId}/location`, data),
  sync: (agentId, data) => apiClient.patch(`/agents/${agentId}/sync`, data),
  delete: (agentId) => apiClient.delete(`/agents/${agentId}`),
};

// ========== INTERVENTIONS ENDPOINTS ==========
export const interventions = {
  getAll: (params = {}) => apiClient.get('/interventions', { params }),
  getAgentInterventions: (agentId, params = {}) => apiClient.get(`/interventions/agent/${agentId}/assigned`, { params }),
  create: (data) => apiClient.post('/interventions', data),
  update: (id, data) => apiClient.patch(`/interventions/${id}`, data),
  complete: (id, data) => apiClient.post(`/interventions/${id}/complete`, data),
  getStats: (params = {}) => apiClient.get('/interventions/stats/overview', { params }),
};

// ========== FIELD ACTIVITY ENDPOINTS ==========
export const fieldActivity = {
  getAll: (params = {}) => apiClient.get('/field-activity', { params }),
  log: (data) => apiClient.post('/field-activity', data),
  getTimeline: (farmId, params = {}) => apiClient.get(`/field-activity/timeline/${farmId}`, { params }),
  getAgentPerformance: (agentId, params = {}) => apiClient.get(`/field-activity/agent/${agentId}/performance`, { params }),
  getHeatmap: (farmId, params = {}) => apiClient.get(`/field-activity/heatmap/${farmId}`, { params }),
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
