import apiClient from './api-client';

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    avatarUrl: string | null;
  };
  accessToken: string;
  refreshToken: string;
}

function ssrGuard<T>(fn: () => T, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  return fn();
}

export const authService = {
  async register(email: string, password: string, name: string, phone?: string) {
    const { data } = await apiClient.post('/auth/register', {
      email,
      password,
      name,
      phone,
    });
    const result = data.data || data;
    if (result.accessToken) {
      ssrGuard(() => { localStorage.setItem('accessToken', result.accessToken); }, undefined);
      ssrGuard(() => { localStorage.setItem('refreshToken', result.refreshToken); }, undefined);
    }
    return result as AuthResponse;
  },

  async login(email: string, password: string) {
    const { data } = await apiClient.post('/auth/login', { email, password });
    const result = data.data || data;
    if (result.accessToken) {
      ssrGuard(() => { localStorage.setItem('accessToken', result.accessToken); }, undefined);
      ssrGuard(() => { localStorage.setItem('refreshToken', result.refreshToken); }, undefined);
    }
    return result as AuthResponse;
  },

  async refresh() {
    const refreshToken = ssrGuard(() => localStorage.getItem('refreshToken'), null);
    const { data } = await apiClient.post('/auth/refresh', { refreshToken });
    const result = data.data || data;
    if (result.accessToken) {
      ssrGuard(() => { localStorage.setItem('accessToken', result.accessToken); }, undefined);
      ssrGuard(() => { localStorage.setItem('refreshToken', result.refreshToken); }, undefined);
    }
    return result as AuthResponse;
  },

  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      ssrGuard(() => { localStorage.removeItem('accessToken'); }, undefined);
      ssrGuard(() => { localStorage.removeItem('refreshToken'); }, undefined);
    }
  },

  async getProfile() {
    const { data } = await apiClient.get('/users/me');
    return (data.data || data) as AuthResponse['user'];
  },

  async recover(email: string) {
    const { data } = await apiClient.post('/auth/recover', { email });
    return data.data || data;
  },

  async resetPassword(token: string, password: string) {
    const { data } = await apiClient.post('/auth/reset-password', { token, password });
    return data.data || data;
  },
};
