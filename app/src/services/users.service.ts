import apiClient from './api-client';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  role: string;
  avatarUrl: string | null;
  avatar?: string;
  karma: number;
  level: string;
  registeredAt: string;
  createdAt?: string;
  commentsCount?: number;
  adsCount?: number;
  subscriptions?: string[];
}

export interface ActivityEntry {
  id: string;
  type: 'comment' | 'ad' | 'favorite' | 'login' | 'subscription';
  description: string;
  date: string;
  link?: string;
}

export interface BillingOperation {
  id: string;
  type: 'payment' | 'withdrawal' | 'subscription';
  method: string;
  amount: number;
  status: 'success' | 'pending' | 'failed';
  date: string;
  description: string;
}

export interface Subscription {
  id: string;
  type: 'category' | 'author' | 'keyword';
  value: string;
  subscribedAt: string;
}

export const usersService = {
  async getMe(): Promise<UserProfile> {
    const { data } = await apiClient.get('/users/me');
    return (data.data || data) as UserProfile;
  },

  async updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    const { data } = await apiClient.put('/users/me', profile);
    return (data.data || data) as UserProfile;
  },

  async getActivity(): Promise<ActivityEntry[]> {
    const { data } = await apiClient.get('/users/me/activity');
    return (data.data || data || []) as ActivityEntry[];
  },

  async getBillingHistory(): Promise<BillingOperation[]> {
    const { data } = await apiClient.get('/users/me/billing');
    return (data.data || data || []) as BillingOperation[];
  },

  async getSubscriptions(): Promise<Subscription[]> {
    const { data } = await apiClient.get('/users/me/subscriptions');
    return (data.data || data || []) as Subscription[];
  },

  async addSubscription(type: string, value: string): Promise<Subscription> {
    const { data } = await apiClient.post('/users/me/subscriptions', { type, value });
    return (data.data || data) as Subscription;
  },

  async removeSubscription(subscriptionId: string): Promise<void> {
    await apiClient.delete(`/users/me/subscriptions/${subscriptionId}`);
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await apiClient.post('/users/me/change-password', { oldPassword, newPassword });
  },

  async uploadAvatar(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return (data.data || data) as { url: string };
  },
};
