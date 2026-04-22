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

function normalizeCustomer<T extends Customer>(customer: T): T {
  return {
    ...customer,
    zoho_contact_id: customer.zoho_contact_id ?? customer.zoho_id ?? null,
    fixed_fee: customer.fixed_fee != null ? Number(customer.fixed_fee) : null,
    included_tx_count: customer.included_tx_count != null ? Number(customer.included_tx_count) : null,
    extra_tx_unit_price: customer.extra_tx_unit_price != null ? Number(customer.extra_tx_unit_price) : null,
    price_per_terminal: customer.price_per_terminal != null ? Number(customer.price_per_terminal) : null,
    tax_rate: customer.tax_rate != null ? Number(customer.tax_rate) : null,
  };
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  status: 'active' | 'inactive';
  zoho_id?: string | null;
  zoho_contact_id?: string | null;
  fixed_fee?: number | null;
  included_tx_count?: number | null;
  extra_tx_unit_price?: number | null;
  price_per_terminal?: number | null;
  tax_rate?: number | null;
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

export interface PropertyRole {
  property_id: number;
  property_name: string;
  property_type: string;
  role: string;
}

export interface CustomerUser {
  id: number;
  email: string;
  name: string;
  role: string;
  created_at: string;
  property_roles: PropertyRole[];
}

export interface CustomerDetail extends Customer {
  properties: Property[];
  users: CustomerUser[];
}

export const CustomerService = {
  async list(): Promise<{ items: Customer[]; total: number }> {
    const { data } = await api.get('/admin/customers');
    return {
      ...data,
      items: Array.isArray(data?.items) ? data.items.map(normalizeCustomer) : [],
    };
  },

  async get(id: number): Promise<CustomerDetail> {
    const { data } = await api.get(`/admin/customers/${id}`);
    return normalizeCustomer(data);
  },

  async create(payload: Pick<Customer, 'name' | 'email' | 'phone' | 'address'> & {
    zoho_id?: string | null;
    fixed_fee?: number | null;
    included_tx_count?: number | null;
    extra_tx_unit_price?: number | null;
    price_per_terminal?: number | null;
    tax_rate?: number | null;
  }): Promise<Customer> {
    const { data } = await api.post('/admin/customers', payload);
    return normalizeCustomer(data);
  },

  async update(id: number, payload: Partial<Customer>): Promise<Customer> {
    const { data } = await api.put(`/admin/customers/${id}`, payload);
    return normalizeCustomer(data);
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
  async addUser(customerId: number, payload: { name: string; email: string; password: string; property_roles: { property_id: number; role: string }[] }): Promise<CustomerUser> {
    const { data } = await api.post(`/admin/customers/${customerId}/users`, payload);
    return data;
  },

  async updateUser(customerId: number, userId: number, payload: { name: string; property_roles: { property_id: number; role: string }[] }): Promise<CustomerUser> {
    const { data } = await api.put(`/admin/customers/${customerId}/users/${userId}`, payload);
    return data;
  },

  async deleteUser(customerId: number, userId: number): Promise<void> {
    await api.delete(`/admin/customers/${customerId}/users/${userId}`);
  },
};
