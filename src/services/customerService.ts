import axios from 'axios';
import { AuthService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const api = axios.create({ baseURL: API_BASE_URL });
api.interceptors.request.use((config) => {
  const token = AuthService.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  property_count?: number;
  user_count?: number;
}

export interface Property {
  id: number;
  customer_id: number;
  name: string;
  type: 'hotel' | 'restaurant' | 'retail' | string;
  address?: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface CustomerUser {
  id: number;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

export interface CustomerDetail extends Customer {
  properties: Property[];
  users: CustomerUser[];
}

export const CustomerService = {
  async list(): Promise<{ items: Customer[]; total: number }> {
    const { data } = await api.get('/admin/customers');
    return data;
  },

  async get(id: number): Promise<CustomerDetail> {
    const { data } = await api.get(`/admin/customers/${id}`);
    return data;
  },

  async create(payload: Pick<Customer, 'name' | 'email' | 'phone' | 'address'>): Promise<Customer> {
    const { data } = await api.post('/admin/customers', payload);
    return data;
  },

  async update(id: number, payload: Partial<Customer>): Promise<Customer> {
    const { data } = await api.put(`/admin/customers/${id}`, payload);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/admin/customers/${id}`);
  },

  // Properties
  async addProperty(customerId: number, payload: Pick<Property, 'name' | 'type' | 'address'>): Promise<Property> {
    const { data } = await api.post(`/admin/customers/${customerId}/properties`, payload);
    return data;
  },

  async updateProperty(customerId: number, propertyId: number, payload: Partial<Property>): Promise<Property> {
    const { data } = await api.put(`/admin/customers/${customerId}/properties/${propertyId}`, payload);
    return data;
  },

  async deleteProperty(customerId: number, propertyId: number): Promise<void> {
    await api.delete(`/admin/customers/${customerId}/properties/${propertyId}`);
  },

  // Users
  async addUser(customerId: number, payload: { name: string; email: string; role: string; password: string }): Promise<CustomerUser> {
    const { data } = await api.post(`/admin/customers/${customerId}/users`, payload);
    return data;
  },

  async updateUser(customerId: number, userId: number, payload: { name: string; role: string }): Promise<CustomerUser> {
    const { data } = await api.put(`/admin/customers/${customerId}/users/${userId}`, payload);
    return data;
  },

  async deleteUser(customerId: number, userId: number): Promise<void> {
    await api.delete(`/admin/customers/${customerId}/users/${userId}`);
  },
};
