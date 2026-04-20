import axios from 'axios';
import { AuthService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  const token = AuthService.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

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
      } catch {
        AuthService.logout();
        window.location.href = '/signin';
      }
    }
    return Promise.reject(error);
  }
);

export interface EodReport {
  id: number;
  terminal_id: number | null;
  customer_id: number | null;
  property_id: number | null;
  report_date: string;
  total_transactions: number;
  successful_transactions: number;
  failed_transactions: number;
  total_amount: number;
  avg_amount: number;
  currency: string;
  raw_data: any;
  created_at: string;
  terminal_name: string | null;
  terminal_serial: string | null;
}

export const EodService = {
  async list(): Promise<{ items: EodReport[]; total: number }> {
    const { data } = await api.get('/eod-reports');
    return data;
  },
};
