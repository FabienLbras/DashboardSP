import axios from 'axios';
import { AuthService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const api = axios.create({ baseURL: API_BASE_URL });
api.interceptors.request.use((config) => {
  const token = AuthService.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface SpAdmin {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export const SpAdminService = {
  async list(): Promise<{ items: SpAdmin[]; total: number }> {
    const { data } = await api.get('/admin/sp-admins');
    return data;
  },

  async create(payload: { name: string; email: string; password: string; lang?: string }): Promise<SpAdmin> {
    const { data } = await api.post('/admin/sp-admins', payload);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/admin/sp-admins/${id}`);
  },

  async changeRole(id: number, role: 'super_admin' | 'sp_admin'): Promise<SpAdmin> {
    const { data } = await api.patch(`/admin/sp-admins/${id}/role`, { role });
    return data;
  },
};
