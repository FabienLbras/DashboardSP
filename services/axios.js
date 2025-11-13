import axios from 'axios';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: 'http://webhooks.success-payment.com/api/auth/login',
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add auth token and other common headers
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage or your auth state management
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request timestamp for debugging
    config.metadata = { startTime: new Date() };
    
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
      data: config.data,
      params: config.params,
    });

    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and logging
apiClient.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const endTime = new Date();
    const duration = endTime - response.config.metadata.startTime;
    
    console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      duration: `${duration}ms`,
      data: response.data,
    });

    return response;
  },
  (error) => {
    const { response, config } = error;

    // Calculate request duration for failed requests
    if (config?.metadata?.startTime) {
      const endTime = new Date();
      const duration = endTime - config.metadata.startTime;
      console.error(`[API Error] ${config.method?.toUpperCase()} ${config.url} (${duration}ms)`, error);
    }

    if (response) {
      // Server responded with error status
      switch (response.status) {
        case 401:
          // Unauthorized - redirect to login or refresh token
          console.error('Unauthorized access - redirecting to login');
          localStorage.removeItem('authToken');
          sessionStorage.removeItem('authToken');
          // You can dispatch a logout action here or redirect to login
          window.location.href = '/signin';
          break;
          
        case 403:
          console.error('Forbidden - insufficient permissions');
          break;
          
        case 404:
          console.error('Resource not found');
          break;
          
        case 422:
          console.error('Validation error:', response.data);
          break;
          
        case 429:
          console.error('Rate limit exceeded');
          break;
          
        case 500:
          console.error('Internal server error');
          break;
          
        default:
          console.error(`API Error ${response.status}:`, response.data);
      }
    } else if (error.request) {
      // Network error
      console.error('Network error - no response received:', error.message);
    } else {
      // Request setup error
      console.error('Request setup error:', error.message);
    }

    return Promise.reject(error);
  }
);

// API service methods for common operations
export const apiService = {
  // Generic methods
  get: (url, config = {}) => apiClient.get(url, config),
  post: (url, data = {}, config = {}) => apiClient.post(url, data, config),
  put: (url, data = {}, config = {}) => apiClient.put(url, data, config),
  patch: (url, data = {}, config = {}) => apiClient.patch(url, data, config),
  delete: (url, config = {}) => apiClient.delete(url, config),

  // Authentication endpoints
  auth: {
    login: (credentials) => apiClient.post('/auth/login', credentials),
    logout: () => apiClient.post('/auth/logout'),
    register: (userData) => apiClient.post('/auth/register', userData),
    refreshToken: () => apiClient.post('/auth/refresh'),
    forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }),
    resetPassword: (token, password) => apiClient.post('/auth/reset-password', { token, password }),
    verifyEmail: (token) => apiClient.post('/auth/verify-email', { token }),
  },

  // User management
  user: {
    getProfile: () => apiClient.get('/user/profile'),
    updateProfile: (data) => apiClient.put('/user/profile', data),
    changePassword: (data) => apiClient.post('/user/change-password', data),
    uploadAvatar: (formData) => apiClient.post('/user/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  },

  // Payment transactions
  transactions: {
    getAll: (params = {}) => apiClient.get('/transactions', { params }),
    getById: (id) => apiClient.get(`/transactions/${id}`),
    create: (data) => apiClient.post('/transactions', data),
    update: (id, data) => apiClient.put(`/transactions/${id}`, data),
    delete: (id) => apiClient.delete(`/transactions/${id}`),
    getStats: (params = {}) => apiClient.get('/transactions/stats', { params }),
    export: (params = {}) => apiClient.get('/transactions/export', { 
      params,
      responseType: 'blob' // For file downloads
    }),
  },

  // Dashboard analytics
  dashboard: {
    getOverview: () => apiClient.get('/dashboard/overview'),
    getChartData: (type, params = {}) => apiClient.get(`/dashboard/charts/${type}`, { params }),
    getRecentActivity: () => apiClient.get('/dashboard/recent-activity'),
  },

  // Payment methods
  paymentMethods: {
    getAll: () => apiClient.get('/payment-methods'),
    create: (data) => apiClient.post('/payment-methods', data),
    update: (id, data) => apiClient.put(`/payment-methods/${id}`, data),
    delete: (id) => apiClient.delete(`/payment-methods/${id}`),
    setDefault: (id) => apiClient.post(`/payment-methods/${id}/set-default`),
  },

  // Settings
  settings: {
    get: () => apiClient.get('/settings'),
    update: (data) => apiClient.put('/settings', data),
    getNotificationPreferences: () => apiClient.get('/settings/notifications'),
    updateNotificationPreferences: (data) => apiClient.put('/settings/notifications', data),
  },
};

// Utility functions for common operations
export const apiUtils = {
  // Handle API errors consistently
  handleError: (error) => {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'An unexpected error occurred';
  },

  // Format API responses
  formatResponse: (response) => ({
    data: response.data,
    status: response.status,
    message: response.data?.message || 'Success',
  }),

  // Check if error is a network error
  isNetworkError: (error) => !error.response && error.request,

  // Check if error is unauthorized
  isUnauthorized: (error) => error.response?.status === 401,

  // Retry failed requests
  retryRequest: async (requestFn, maxRetries = 3, delay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await requestFn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  },
};

// Export the configured axios instance
export default apiClient;