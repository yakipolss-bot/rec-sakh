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
      localStorage.setItem('accessToken', result.accessToken);
      localStorage.setItem('refreshToken', result.refreshToken);
    }
    return result as AuthResponse;
  },

  async login(email: string, password: string) {
    const { data } = await apiClient.post('/auth/login', { email, password });
    const result = data.data || data;
    if (result.accessToken) {
      localStorage.setItem('accessToken', result.accessToken);
      localStorage.setItem('refreshToken', result.refreshToken);
    }
    return result as AuthResponse;
  },

  async refresh() {
    const refreshToken = localStorage.getItem('refreshToken');
    const { data } = await apiClient.post('/auth/refresh', { refreshToken });
    const result = data.data || data;
    if (result.accessToken) {
      localStorage.setItem('accessToken', result.accessToken);
      localStorage.setItem('refreshToken', result.refreshToken);
    }
    return result as AuthResponse;
  },

  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
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
