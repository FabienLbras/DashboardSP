import axios from 'axios';
import { AuthService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const api = axios.create({ baseURL: API_BASE_URL });
api.interceptors.request.use((config) => {
  const token = AuthService.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface Terminal {
  id: number;
  name: string;
  serial_number: string;
  status: 'active' | 'inactive';
  location: string;
  model: string;
  customer_id: number | null;
  property_id: number | null;
  api_key: string | null;
  last_seen_at: string | null;
  created_at: string;
}

export const TerminalService = {
  async list(): Promise<{ items: Terminal[]; total: number }> {
    const { data } = await api.get('/terminals');
    return data;
  },

  async get(id: number): Promise<Terminal> {
    const { data } = await api.get(`/terminals/${id}`);
    return data;
  },

  async create(payload: { name: string; serial_number?: string; status?: string; location?: string; model?: string }): Promise<Terminal> {
    const { data } = await api.post('/terminals', payload);
    return data;
  },

  async update(id: number, payload: { name?: string; serial_number?: string; status?: 'active' | 'inactive'; location?: string; model?: string }): Promise<Terminal> {
    const { data } = await api.put(`/terminals/${id}`, payload);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/terminals/${id}`);
  },

  async generateKey(id: number): Promise<{ terminal: { id: number; name: string; serial_number: string; api_key: string } }> {
    const { data } = await api.post(`/admin/terminals/${id}/generate-key`);
    return data;
  },

  async getKey(id: number): Promise<{ id: number; name: string; serial_number: string; api_key: string | null; last_seen_at: string | null }> {
    const { data } = await api.get(`/admin/terminals/${id}/key`);
    return data;
  },
};
