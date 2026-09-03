const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

async function request(endpoint, options = {}) {
  const savedUser = localStorage.getItem('krishimitra_user');
  let token = null;
  if (savedUser) {
    try {
      const parsed = JSON.parse(savedUser);
      token = parsed.accessToken;
    } catch (e) {}
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  const config = {
    ...options,
    headers,
    signal: controller.signal,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    clearTimeout(timeoutId);

    if (response.status === 401) {
      localStorage.removeItem('krishimitra_user');
      window.dispatchEvent(new Event('krishimitra_auth_change'));
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const errorMessage = data?.error?.message || data?.message || 'Something went wrong';
      const error = new Error(errorMessage);
      error.status = response.status;
      error.response = data;
      throw error;
    }

    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      const timeoutError = new Error('Request timeout');
      timeoutError.status = 408;
      throw timeoutError;
    }
    throw err;
  }
}

export const api = {
  get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => request(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body, options) => request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  patch: (endpoint, body, options) => request(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' }),
};

export const authService = {
  requestOTP: (mobile) => api.post('/auth/otp/request', { mobile }),
  verifyOTP: (mobile, otp) => api.post('/auth/otp/verify', { mobile, otp }),
  login: (mobile, password) => api.post('/auth/login', { mobile, password }),
  registerFarmer: (data) => api.post('/auth/register/farmer', data),
  registerCentre: (data) => api.post('/auth/register/centre', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const farmerService = {
  getProfile: () => api.get('/farmers/me'),
  updateProfile: (data) => api.put('/farmers/me', data),
  getStatistics: () => api.get('/farmers/me/statistics'),
  getTrustScore: () => api.get('/farmers/me/trust-score'),
  getBookings: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/farmers/me/bookings${query ? '?' + query : ''}`);
  },
  getPayments: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/farmers/me/payments${query ? '?' + query : ''}`);
  },
};

export const centreService = {
  getAll: () => api.get('/centres'),
  getNearby: (lat, lng, radius = 15) => api.get(`/centres/nearby?latitude=${lat}&longitude=${lng}&radius=${radius}`),
  getById: (id) => api.get(`/centres/${id}`),
  update: (id, data) => api.put(`/centres/${id}`, data),
  getSlotsAvailability: (centreId, date) => api.get(`/centres/${centreId}/slots/availability?date=${date}`),
  getDashboard: (centreId) => api.get(`/centres/${centreId}/dashboard`),
  getCounters: (centreId) => api.get(`/centres/${centreId}/counters`),
  createCounter: (centreId, counterNumber) => api.post(`/centres/${centreId}/counters`, { counterNumber }),
  updateCounterStatus: (counterId, status) => api.patch(`/centres/counters/${counterId}/status`, { status }),
  assignTokenToCounter: (counterId, tokenId) => api.post(`/centres/counters/${counterId}/assign-token`, { tokenId }),
  updateCentreStatus: (centreId, open) => api.patch(`/centres/${centreId}/status`, { open }),
};

export const cropService = {
  getAll: () => api.get('/crops'),
  getById: (id) => api.get(`/crops/${id}`),
};

export const marketService = {
  getRates: () => api.get('/market/rates'),
};

export const bookingService = {
  create: (data) => api.post('/bookings', data),
  getMy: () => api.get('/bookings/my'),
  getById: (id) => api.get(`/bookings/${id}`),
  cancel: (id) => api.patch(`/bookings/${id}/cancel`),
  getAvailability: (centreId, date) => api.get(`/bookings/availability?centreId=${centreId}&date=${date}`),
  getCentreBookings: (centreId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/bookings/centre/${centreId}${query ? '?' + query : ''}`);
  },
  updateStatus: (id, status, counterId) => api.patch(`/bookings/${id}/status`, { status, counterId }),
};


export const tatkaalService = {
  create: (data) => api.post('/tatkaal/bookings', data),
  getAvailability: (centreId, date) => api.get(`/tatkaal/availability?centreId=${centreId}&date=${date}`),
};

export const queueService = {
  getMy: () => api.get('/queue/my'),
  getById: (id) => api.get(`/queue/tokens/${id}`),
  getCentreQueue: (centreId) => api.get(`/queue/centres/${centreId}/queue`),
  call: (id, counterId) => api.post(`/queue/${id}/call`, { counterId }),
  arrive: (id) => api.post(`/queue/${id}/arrive`),
  start: (id, counterId) => api.post(`/queue/${id}/start`, { counterId }),
  complete: (id) => api.post(`/queue/${id}/complete`),
  noShow: (id) => api.post(`/queue/${id}/no-show`),
  cancel: (id) => api.post(`/queue/${id}/cancel`),
};

export const procurementService = {
  create: (data) => api.post('/procurements', data),
  registerWeighing: (id, data) => api.post(`/procurements/${id}/weighing`, data),
  registerQuality: (id, data) => api.post(`/procurements/${id}/quality`, data),
  getMy: () => api.get('/procurements/my'),
  getById: (id) => api.get(`/procurements/${id}`),
  getCentreProcurements: (centreId) => api.get(`/procurements/centres/${centreId}/procurements`),
};

export const paymentService = {
  getMy: () => api.get('/payments/my'),
  getById: (id) => api.get(`/payments/${id}`),
  trigger: (data) => api.post('/payments', data),
  updateStatus: (id, data) => api.patch(`/payments/${id}/status`, data),
};

export const notificationService = {
  getMy: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

export const chatbotService = {
  ask: (message, language) => api.post('/chatbot', { message, language }),
};
