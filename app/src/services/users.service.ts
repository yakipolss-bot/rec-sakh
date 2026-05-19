import apiClient from './api-client';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  karma: number;
  level: string;
  createdAt: string;
}

export const usersService = {
  async getMe() {
    const { data } = await apiClient.get('/users/me');
    return (data.data || data) as UserProfile;
  },
};
