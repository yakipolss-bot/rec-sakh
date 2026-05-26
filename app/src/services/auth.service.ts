import axios from 'axios';
import apiClient from './api-client';
import { AuthResponse } from '../models/auth/AuthResponse';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

const api = axios.create({ baseURL: API_BASE_URL });

function getLocalStorage(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(key);
}

function setLocalStorage(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, value);
}

function removeLocalStorage(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
}

function persistTokens(accessToken: string, refreshToken: string): void {
  if (accessToken) setLocalStorage('accessToken', accessToken);
  if (refreshToken) setLocalStorage('refreshToken', refreshToken);
}

function clearTokens(): void {
  removeLocalStorage('accessToken');
  removeLocalStorage('refreshToken');
}

function dispatchAuthEvent(event: 'login' | 'logout') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(`auth:${event}`));
  }
}

class AuthService {
  async register(email: string, password: string, name: string, phone?: string) {
    const { data } = await api.post('/auth/register', { email, password, name, phone });
    const body = data.data || data;
    if (body.accessToken) {
      persistTokens(body.accessToken, body.refreshToken);
      dispatchAuthEvent('login');
      return {
        user: body.user,
        accessToken: body.accessToken,
        refreshToken: body.refreshToken,
      };
    }
    clearTokens();
    return { user: { id: '', email, name, role: 'authenticated', avatarUrl: null }, accessToken: '', refreshToken: '' };
  }

  async login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password });
    const body = data.data || data;
    persistTokens(body.accessToken, body.refreshToken);
    dispatchAuthEvent('login');

    let result: AuthResponse = {
      user: body.user,
      accessToken: body.accessToken,
      refreshToken: body.refreshToken,
    };

    try {
      const axiosInstance = axios.create({
        baseURL: API_BASE_URL,
        headers: { Authorization: `Bearer ${body.accessToken}` },
      });
      const { data: profileData } = await axiosInstance.get('/users/me');
      const userProfile = profileData.data || profileData;
      result = {
        ...result,
        user: { ...result.user, role: userProfile.role || result.user.role },
      };
    } catch {
      console.warn('Failed to fetch user role from database, using token role');
    }

    return result;
  }

  async logout() {
    const accessToken = getLocalStorage('accessToken');
    try {
      await api.post('/auth/logout', { accessToken });
    } catch {
      // ignore logout errors
    }
    clearTokens();
    dispatchAuthEvent('logout');
  }

  async refresh() {
    const refreshToken = getLocalStorage('refreshToken');
    if (!refreshToken) {
      clearTokens();
      throw new Error('No refresh token');
    }
    const { data } = await api.post('/auth/refresh', { refreshToken });
    const body = data.data || data;
    persistTokens(body.accessToken, body.refreshToken);
    return { accessToken: body.accessToken, refreshToken: body.refreshToken };
  }

  async getSession(): Promise<AuthResponse | null> {
    const accessToken = getLocalStorage('accessToken');
    if (!accessToken) return null;

    try {
      const { data } = await apiClient.get('/auth/session');
      const body = data.data || data;
      if (body.user) {
        persistTokens(accessToken, getLocalStorage('refreshToken') || '');
        return {
          user: body.user,
          accessToken,
          refreshToken: getLocalStorage('refreshToken') || '',
        } as AuthResponse;
      }
      return null;
    } catch {
      return null;
    }
  }

  async getProfile(): Promise<{ id: string; email: string; name: string; role: string; avatarUrl: string | null } | null> {
    const accessToken = getLocalStorage('accessToken');
    if (!accessToken) {
      const session = await this.getSession();
      return session?.user || null;
    }

    try {
      const { data: profileData } = await apiClient.get('/users/me');
      const profile = profileData.data || profileData;
      return {
        id: profile.id,
        email: profile.email || '',
        name: profile.name || 'User',
        role: profile.role || 'user',
        avatarUrl: profile.avatarUrl || null,
      };
    } catch {
      const session = await this.getSession();
      return session?.user || null;
    }
  }

  async recover(email: string) {
    const { data } = await api.post('/auth/forgot-password', { email });
    const body = data.data || data;
    return { message: body.message || 'Ссылка для восстановления отправлена на вашу почту' };
  }

  async resetPassword(password: string) {
    const accessToken = getLocalStorage('accessToken');
    if (!accessToken) throw new Error('No access token. Use the link from the recovery email.');

    await api.post('/auth/reset-password', { password }, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return { message: 'Пароль успешно изменён' };
  }

  async sendSmsCode(phone: string) {
    await api.post('/auth/send-sms', { phone });
    return { message: 'SMS код отправлен' };
  }

  async verifySmsCode(phone: string, token: string) {
    const { data } = await api.post('/auth/verify-sms', { phone, token });
    const body = data.data || data;
    if (body.accessToken) {
      persistTokens(body.accessToken, body.refreshToken);
    }
    return { message: 'Телефон подтверждён', verified: true };
  }

  async signInWithOAuth(provider: 'telegram' | 'vkontakte' | 'yandex') {
    const { getOAuthUrl } = await import('./supabase');
    const url = getOAuthUrl(provider === 'vkontakte' ? 'vk' : provider);
    window.location.href = url;
  }

  onAuthStateChange(_callback: (event: string, session: AuthResponse | null) => void) {
    return { data: { subscription: { unsubscribe: () => {} } } };
  }
}

const authService = new AuthService();
export default authService;
export { AuthService };
