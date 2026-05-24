import apiClient from './api-client';
import { UserProfile } from '../models/users/UserProfile';
import { ActivityEntry } from '../models/users/ActivityEntry';
import { BillingOperation } from '../models/users/BillingOperation';
import { Subscription } from '../models/users/Subscription';

class UsersService {
  async getMe(): Promise<UserProfile> {
    const { data } = await apiClient.get('/users/me');
    return (data.data || data) as UserProfile;
  }

  async updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    const { data } = await apiClient.patch('/users/me', profile);
    return (data.data || data) as UserProfile;
  }

  async getActivity(): Promise<ActivityEntry[]> {
    const { data } = await apiClient.get('/users/me/activity');
    return (data.data || data || []) as ActivityEntry[];
  }

  async getBillingHistory(): Promise<BillingOperation[]> {
    const { data } = await apiClient.get('/users/me/billing');
    return (data.data || data || []) as BillingOperation[];
  }

  async getSubscriptions(): Promise<Subscription[]> {
    const { data } = await apiClient.get('/users/me/subscriptions');
    return (data.data || data || []) as Subscription[];
  }

  async addSubscription(type: string, value: string): Promise<Subscription> {
    const { data } = await apiClient.post('/users/me/subscriptions', { type, value });
    return (data.data || data) as Subscription;
  }

  async removeSubscription(subscriptionId: string): Promise<void> {
    await apiClient.delete(`/users/me/subscriptions/${subscriptionId}`);
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await apiClient.post('/users/me/change-password', { oldPassword, newPassword });
  }

  async uploadAvatar(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return (data.data || data) as { url: string };
  }
}

const usersService = new UsersService();
export default usersService;
export { UsersService };
