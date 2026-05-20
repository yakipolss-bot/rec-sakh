import { supabase } from './supabase';
import axios from 'axios';
import type { AuthResponse as SupabaseAuthResponse } from '@supabase/supabase-js';

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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

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

function extractName(user: { user_metadata?: { name?: string }; email?: string }): string {
  return user.user_metadata?.name || user.email?.split('@')[0] || 'User';
}

function toAuthResponse(session: SupabaseAuthResponse['data']['session']): AuthResponse | null {
  if (!session?.user) return null;
  return {
    user: {
      id: session.user.id,
      email: session.user.email || '',
      name: extractName(session.user),
      role: session.user.role || 'authenticated',
      avatarUrl: session.user.user_metadata?.avatar_url || null,
    },
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
  };
}

export const authService = {
  async register(email: string, password: string, name: string, phone?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, ...(phone ? { phone } : {}) },
      },
    });
    if (error) throw error;
    const result = toAuthResponse(data.session);
    if (!result && data.user) {
      clearTokens();
      return { user: { id: data.user.id, email: data.user.email || '', name: extractName(data.user), role: 'authenticated', avatarUrl: null }, accessToken: '', refreshToken: '' };
    }
    persistTokens(result!.accessToken, result!.refreshToken);
    return result!;
  },

  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const result = toAuthResponse(data.session);
    if (!result) throw new Error('Login failed');
    persistTokens(result.accessToken, result.refreshToken);
    return result;
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    clearTokens();
    if (error) throw error;
  },

  async refresh() {
    const refreshToken = getLocalStorage('refreshToken');
    if (!refreshToken) {
      clearTokens();
      throw new Error('No refresh token');
    }
    const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
    const { accessToken, refreshToken: newRefreshToken } = data.data || data;
    persistTokens(accessToken, newRefreshToken);
    return { accessToken, refreshToken: newRefreshToken };
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    const result = toAuthResponse(data.session);
    if (result) persistTokens(result.accessToken, result.refreshToken);
    return result;
  },

  async getProfile() {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) throw new Error('Not authenticated');
    return {
      id: session.user.id,
      email: session.user.email || '',
      name: extractName(session.user),
      role: 'authenticated',
      avatarUrl: session.user.user_metadata?.avatar_url || null,
    };
  },

  async recover(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?type=recovery`,
    });
    if (error) throw error;
    return { message: 'Ссылка для восстановления отправлена на вашу почту' };
  },

  async resetPassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    return { message: 'Пароль успешно изменён' };
  },

  async sendSmsCode(phone: string) {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) throw error;
    return { message: 'SMS код отправлен' };
  },

  async verifySmsCode(phone: string, token: string) {
    const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
    if (error) throw error;
    return { message: 'Телефон подтверждён', verified: true };
  },

  async signInWithOAuth(provider: 'telegram' | 'vkontakte' | 'yandex') {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider === 'vkontakte' ? 'vk' : provider,
    });
    if (error) throw error;
    const { data } = await supabase.auth.getSession();
    const result = toAuthResponse(data.session);
    if (result) persistTokens(result.accessToken, result.refreshToken);
  },

  onAuthStateChange(callback: (event: string, session: AuthResponse | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      const result = toAuthResponse(session);
      if (result && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        persistTokens(result.accessToken, result.refreshToken);
      }
      if (event === 'SIGNED_OUT') {
        clearTokens();
      }
      callback(event, result);
    });
  },
};
