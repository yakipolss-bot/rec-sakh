import apiClient from './api-client';

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

class NotificationsService {
  async getAll(params?: { page?: number; perPage?: number; type?: string; isRead?: boolean }): Promise<{ data: NotificationItem[]; meta: any }> {
    const { data } = await apiClient.get('/notifications', { params });
    return data;
  }

  async getUnreadCount(): Promise<number> {
    const { data } = await apiClient.get('/notifications/unread-count');
    const body = data.data || data;
    return body.unreadCount || 0;
  }

  async markAsRead(id: string): Promise<void> {
    await apiClient.patch(`/notifications/${id}/read`);
  }

  async markAllAsRead(): Promise<void> {
    await apiClient.patch('/notifications/read-all');
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/notifications/${id}`);
  }
}

const notificationsService = new NotificationsService();
export default notificationsService;
export { NotificationsService };
