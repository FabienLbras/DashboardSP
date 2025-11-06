import axios from 'axios';

const API_BASE_URL = 'http://localhost:8081/api';

// Create axios instance specifically for auth API
const authAPI = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false, // Set to true if you need to send cookies
});

// Types for authentication
export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  email: string;
  name: string;
}

export interface User {
  email: string;
  name: string;
}

// Authentication service
export class AuthService {
  private static readonly ACCESS_TOKEN_KEY = 'accessToken';
  private static readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private static readonly USER_KEY = 'user';

  // Login method
  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await authAPI.post<AuthResponse>('/auth/login', credentials);
      const authData = response.data;

      // Store tokens and user data
      this.storeAuthData(authData);

      return authData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Logout method
  static logout(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    
    // Clear session storage as well
    sessionStorage.removeItem(this.ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    // Check if token is expired
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  }

  // Get access token
  static getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY) || 
           sessionStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  // Get refresh token
  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY) || 
           sessionStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  // Get current user
  static getCurrentUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY) || 
                    sessionStorage.getItem(this.USER_KEY);
    
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  // Store authentication data
  private static storeAuthData(authData: AuthResponse): void {
    const user: User = {
      email: authData.email,
      name: authData.name
    };

    // Store in localStorage (persistent) and sessionStorage (session-based)
    localStorage.setItem(this.ACCESS_TOKEN_KEY, authData.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, authData.refreshToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  // Refresh token method
  static async refreshToken(): Promise<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await authAPI.post<AuthResponse>('/auth/refresh', {
        refreshToken
      });
      
      const authData = response.data;
      this.storeAuthData(authData);
      
      return authData;
    } catch (error) {
      // If refresh fails, logout user
      this.logout();
      throw error;
    }
  }

  // Validate token with backend
  static async validateToken(): Promise<boolean> {
    const token = this.getAccessToken();
    if (!token) return false;

    try {
      const response = await authAPI.get('/auth/validate', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data.valid;
    } catch {
      return false;
    }
  }

  // Change password
  static async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('No authentication token');
    }

    try {
      await authAPI.post('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmNewPassword: newPassword
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  // Forgot password
  static async forgotPassword(email: string): Promise<string> {
    try {
      const response = await authAPI.post('/auth/forgot-password', { email });
      return response.data.message;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  }

  // Reset password
  static async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await authAPI.post('/auth/reset-password', {
        token,
        newPassword,
        confirmNewPassword: newPassword
      });
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }
}

// Setup axios interceptor for automatic token attachment
authAPI.interceptors.request.use(
  (config) => {
    const token = AuthService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Setup axios interceptor for automatic token refresh
authAPI.interceptors.response.use(
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
          return authAPI(originalRequest);
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

export default AuthService;