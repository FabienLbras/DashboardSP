import axios from 'axios';
import AuthService from './authService';

const API_BASE_URL = 'http://webhooks.success-payment.com/api';

// Create axios instance for general API calls
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = AuthService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for automatic token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await AuthService.refreshToken();
        const newToken = AuthService.getAccessToken();
        
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout and redirect
        AuthService.logout();
        window.location.href = '/signin';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API service methods
export const apiService = {
  // Generic methods
  get: (url: string, config = {}) => api.get(url, config),
  post: (url: string, data = {}, config = {}) => api.post(url, data, config),
  put: (url: string, data = {}, config = {}) => api.put(url, data, config),
  patch: (url: string, data = {}, config = {}) => api.patch(url, data, config),
  delete: (url: string, config = {}) => api.delete(url, config),

  // User management
  user: {
    getProfile: () => api.get('/user/profile'),
    updateProfile: (data: any) => api.put('/user/profile', data),
    changePassword: (data: any) => api.post('/user/change-password', data),
  },

  // Transactions
  transactions: {
    getAll: (params = {}) => api.get('/transactions', { params }),
    getById: (id: string) => api.get(`/transactions/${id}`),
    create: (data: any) => api.post('/transactions', data),
    update: (id: string, data: any) => api.put(`/transactions/${id}`, data),
    delete: (id: string) => api.delete(`/transactions/${id}`),
    getStats: (params = {}) => api.get('/transactions/stats', { params }),
  },

  // Terminals
  terminals: {
    getAll: (params = {}) => api.get('/terminals', { params }),
    getById: (id: string) => api.get(`/terminals/${id}`),
    create: (data: any) => api.post('/terminals', data),
    update: (id: string, data: any) => api.put(`/terminals/${id}`, data),
    delete: (id: string) => api.delete(`/terminals/${id}`),
  },

  // Dashboard
  dashboard: {
    getOverview: () => api.get('/dashboard/overview'),
    getStats: () => api.get('/dashboard/stats'),
    getRecentActivity: () => api.get('/dashboard/recent-activity'),
  },
};

export default api;