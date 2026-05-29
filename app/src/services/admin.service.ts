import apiClient from './api-client';
import { DashboardData } from '../models/admin/DashboardData';
import { RecentAction } from '../models/admin/RecentAction';
import { Alert } from '../models/admin/Alert';
import { AdminUser } from '../models/admin/AdminUser';
import { StaffMember } from '../models/admin/StaffMember';
import { StaffScheduleItem } from '../models/admin/StaffScheduleItem';
import { ModerationQueueItem } from '../models/admin/ModerationQueueItem';
import { ModerationRule } from '../models/admin/ModerationRule';
import { ModerationStats } from '../models/admin/ModerationStats';
import { SystemHealthData } from '../models/admin/SystemHealthData';
import { AuditLogEntry } from '../models/admin/AuditLogEntry';
import { Setting } from '../models/admin/Setting';
import { AnalyticsDashboard } from '../models/admin/AnalyticsDashboard';
import { EventItem } from '../models/admin/EventItem';
import { MediaFile } from '../models/admin/MediaFile';
import { Comment } from '../models/admin/Comment';
import { Transaction } from '../models/admin/Transaction';
import { Tariff } from '../models/admin/Tariff';
import { AdCampaign } from '../models/admin/AdCampaign';
import { AdPlacement } from '../models/admin/AdPlacement';

class AdminService {
  // ── Dashboard ──

  async getDashboard(): Promise<DashboardData> {
    const [dashboardRes, , healthRes] = await Promise.all([
      apiClient.get('/admin/dashboard'),
      apiClient.get('/admin/audit').catch(() => null),
      apiClient.get('/admin/health').catch(() => null),
    ]);

    const dashboard = dashboardRes.data?.data || dashboardRes.data;
    const health = healthRes?.data?.data || healthRes?.data;

    return {
      stats: {
        uptime: dashboard?.uptime
          ? `${Math.floor(dashboard.uptime / 86400)}д ${Math.floor((dashboard.uptime % 86400) / 3600)}ч ${Math.floor((dashboard.uptime % 3600) / 60)}м`
          : '—',
        cpuLoad: dashboard?.memoryUsage
          ? Math.round((dashboard.memoryUsage.heapUsed / dashboard.memoryUsage.heapTotal) * 100)
          : 0,
        errors500: 0,
        apiResponseTime: 0,
        usersOnline: dashboard?.onlineUsers ?? 0,
      },
      analytics: {
        onlineUsers: dashboard?.onlineUsers ?? 0,
        usersToday: dashboard?.usersToday ?? 0,
        publishedToday: dashboard?.publishedToday ?? 0,
        commentsToday: dashboard?.commentsToday ?? 0,
        pendingModeration: dashboard?.pendingModeration ?? 0,
        totalNews: dashboard?.totalNews ?? 0,
        totalUsers: dashboard?.totalUsers ?? 0,
        totalComments: dashboard?.totalComments ?? 0,
      },
      health: health ?? dashboard,
    };
  }

  async getRecentActions(): Promise<RecentAction[]> {
    const { data } = await apiClient.get('/admin/audit');
    const items = data?.data || data || [];
    return (Array.isArray(items) ? items : []).map((log: Record<string, unknown>) => ({
      id: log.id as string,
      user: (log.user as { name?: string })?.name || 'Система',
      action: log.action as string,
      target: (log.entityType as string) || '',
      timestamp: log.createdAt ? new Date(log.createdAt as string).toLocaleString('ru-RU') : '',
    }));
  }

  async getAlerts(): Promise<Alert[]> {
    const { data } = await apiClient.get('/admin/health');
    const health = data?.data || data;
    const alerts: Alert[] = [];

    if (health?.cacheStatus && health.cacheStatus !== 'healthy') {
      alerts.push({ id: 'cache', type: 'warning', message: `Кэш: ${health.cacheStatus}`, timestamp: 'сейчас' });
    }
    if (health?.databaseStatus && health.databaseStatus !== 'connected') {
      alerts.push({ id: 'db', type: 'critical', message: `База данных: ${health.databaseStatus}`, timestamp: 'сейчас' });
    }
    if (health?.memoryUsage) {
      const pct = Math.round((health.memoryUsage.heapUsed / health.memoryUsage.heapTotal) * 100);
      if (pct > 80) {
        alerts.push({
          id: 'memory', type: 'warning',
          message: `Память: ${pct}% (${health.memoryUsage.heapUsed}MB / ${health.memoryUsage.heapTotal}MB)`,
          timestamp: 'сейчас',
        });
      }
    }
    return alerts;
  }

  // ── Users ──

  async getUsers(params?: { page?: number; perPage?: number; search?: string; role?: string; status?: string }): Promise<{ data: AdminUser[]; meta: Record<string, unknown> }> {
    const { data } = await apiClient.get('/users', { params });
    return { data: data?.data || [], meta: data?.meta || {} };
  }

  async getUserById(id: string): Promise<AdminUser> {
    const { data } = await apiClient.get(`/users/${id}`);
    return data?.data || data;
  }

  async updateUser(userId: string, dto: Record<string, unknown>): Promise<AdminUser> {
    const { data } = await apiClient.patch(`/users/${userId}`, dto);
    return data?.data || data;
  }

  async blockUser(userId: string): Promise<void> {
    await apiClient.delete(`/users/${userId}`);
  }

  async changeUserStatus(userId: string, status: string): Promise<void> {
    await apiClient.patch(`/users/${userId}`, { status });
  }

  async changeUserRole(userId: string, role: string): Promise<void> {
    await apiClient.patch(`/admin/users/${userId}/role`, { role });
  }

  // ── Staff ──

  async getStaff(params?: Record<string, unknown>): Promise<{ data: StaffMember[]; meta: Record<string, unknown> }> {
    const { data } = await apiClient.get('/admin/staff', { params });
    return { data: data?.data || [], meta: data?.meta || {} };
  }

  async getStaffById(id: string): Promise<StaffMember> {
    const { data } = await apiClient.get(`/admin/staff/${id}`);
    return data?.data || data;
  }

  async getStaffSchedule(): Promise<StaffScheduleItem[]> {
    const { data } = await apiClient.get('/admin/staff/schedule');
    return data?.data || data || [];
  }

  async createStaffSchedule(dto: { staffId: string; date: string; shift: string }): Promise<StaffScheduleItem> {
    const { data } = await apiClient.post('/admin/staff/schedule', dto);
    return data?.data || data;
  }

  // ── Moderation ──

  async getModerationQueue(params?: Record<string, unknown>): Promise<{ data: ModerationQueueItem[]; meta: Record<string, unknown> }> {
    const { data } = await apiClient.get('/admin/moderation/queue', { params });
    return { data: data?.data || [], meta: data?.meta || {} };
  }

  async reviewModeration(id: string, dto: { status: 'approved' | 'rejected'; reason?: string }): Promise<void> {
    await apiClient.post(`/admin/moderation/queue/${id}/review`, dto);
  }

  async getModerationRules(): Promise<ModerationRule[]> {
    const { data } = await apiClient.get('/admin/moderation/rules');
    return data?.data || data || [];
  }

  async createModerationRule(dto: Record<string, unknown>): Promise<ModerationRule> {
    const { data } = await apiClient.post('/admin/moderation/rules', dto);
    return data?.data || data;
  }

  async updateModerationRule(id: string, dto: Partial<ModerationRule>): Promise<ModerationRule> {
    const { data } = await apiClient.patch(`/admin/moderation/rules/${id}`, dto);
    return data?.data || data;
  }

  async deleteModerationRule(id: string): Promise<void> {
    await apiClient.delete(`/admin/moderation/rules/${id}`);
  }

  async getModerationStats(): Promise<ModerationStats> {
    const { data } = await apiClient.get('/admin/moderation/stats');
    return data?.data || data;
  }

  // ── Settings ──

  async getSettings(): Promise<Setting[]> {
    const { data } = await apiClient.get('/admin/settings');
    return data?.data || data || [];
  }

  async getSetting(key: string): Promise<Setting> {
    const { data } = await apiClient.get(`/admin/settings/${key}`);
    return data?.data || data;
  }

  async updateSetting(key: string, value: unknown): Promise<Setting> {
    const { data } = await apiClient.put(`/admin/settings/${key}`, { value });
    return data?.data || data;
  }

  async deleteSetting(key: string): Promise<void> {
    await apiClient.delete(`/admin/settings/${key}`);
  }

  // ── Analytics ──

  async getAnalyticsDashboard(): Promise<AnalyticsDashboard> {
    const { data } = await apiClient.get('/admin/analytics/dashboard');
    return data?.data || data;
  }

  async getAnalyticsTraffic(params?: Record<string, unknown>): Promise<unknown> {
    const { data } = await apiClient.get('/admin/analytics/traffic', { params });
    return data?.data || data;
  }

  async getAnalyticsContent(params?: Record<string, unknown>): Promise<unknown> {
    const { data } = await apiClient.get('/admin/analytics/content', { params });
    return data?.data || data;
  }

  async getRealtimeAnalytics(): Promise<unknown> {
    const { data } = await apiClient.get('/admin/analytics/realtime');
    return data?.data || data;
  }

  async getSearchAnalytics(): Promise<unknown> {
    const { data } = await apiClient.get('/admin/analytics/search');
    return data?.data || data;
  }

  // ── Content ──

  async bulkNewsOperation(action: string, ids: string[], value?: string): Promise<unknown> {
    const { data } = await apiClient.post('/admin/content/news/bulk', { action, ids, value });
    return data?.data || data;
  }

  // ── Health / Audit ──

  async getHealth(): Promise<SystemHealthData> {
    const { data } = await apiClient.get('/admin/health');
    return data?.data || data;
  }

  async getAuditLog(params?: Record<string, unknown>): Promise<{ data: AuditLogEntry[]; meta: Record<string, unknown> }> {
    const { data } = await apiClient.get('/admin/audit', { params });
    return { data: data?.data || [], meta: data?.meta || {} };
  }

  async getAuditStats(): Promise<unknown> {
    const { data } = await apiClient.get('/admin/audit/stats');
    return data?.data || data;
  }

  // ── Roles ──

  async getRoles(): Promise<string[]> {
    const { data } = await apiClient.get('/admin/roles');
    return data?.data || data || [];
  }

  async createRole(role: string, label: string, permissions: boolean[]): Promise<void> {
    await apiClient.post('/admin/roles', { role, label, permissions });
  }

  // ── System ──

  async clearCache(): Promise<void> {
    await apiClient.post('/admin/system/cache/clear');
  }

  async warmCache(): Promise<void> {
    await apiClient.post('/admin/system/cache/warm');
  }

  async reindexSearch(): Promise<void> {
    await apiClient.post('/search/sync');
  }

  async optimizeMedia(): Promise<void> {
    await apiClient.post('/admin/system/media/optimize');
  }

  async checkUpdates(): Promise<{ hasUpdates: boolean; version?: string }> {
    const { data } = await apiClient.get('/admin/system/updates');
    return data?.data || data || { hasUpdates: false };
  }

  // ── Files ──

  async uploadFile(file: File): Promise<{ url: string }> {
    const form = new FormData();
    form.append('file', file);
    const { data } = await apiClient.post('/admin/files/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data?.data || data;
  }

  // ── Backup ──

  async createBackup(): Promise<void> {
    await apiClient.post('/admin/backup');
  }

  // ── Billing ──

  async getTransactions(params?: Record<string, unknown>): Promise<{ data: Transaction[]; meta?: Record<string, unknown> }> {
    const { data } = await apiClient.get('/billing/admin/transactions', { params });
    return { data: data?.data || data || [], meta: data?.meta || {} };
  }

  async getTariffs(): Promise<Tariff[]> {
    const { data } = await apiClient.get('/billing/admin/tariffs');
    return data?.data || data || [];
  }

  async selectTariff(tariffId: string): Promise<void> {
    await apiClient.post(`/billing/admin/tariffs/${tariffId}/select`);
  }

  // ── Comments Management ──

  async getComments(params?: Record<string, unknown>): Promise<{ data: Comment[]; meta: Record<string, unknown> }> {
    const { data } = await apiClient.get('/comments', { params });
    return { data: data?.data || data || [], meta: data?.meta || {} };
  }

  async deleteComment(id: string): Promise<void> {
    await apiClient.delete(`/comments/${id}`);
  }

  async moderateComment(id: string, status: 'approved' | 'rejected'): Promise<void> {
    await apiClient.patch(`/comments/${id}/moderate`, { status });
  }

  async bulkModerateComments(dto: { ids: string[]; status: 'approved' | 'rejected' }): Promise<void> {
    await apiClient.post('/comments/bulk-moderate', dto);
  }

  async banCommentUser(userId: string): Promise<void> {
    await apiClient.post('/comments/ban', { userId });
  }

  async unbanCommentUser(userId: string): Promise<void> {
    await apiClient.delete(`/comments/ban/${userId}`);
  }

  async getCommentBlacklist(): Promise<{ word: string }[]> {
    const { data } = await apiClient.get('/comments/blacklist');
    return data?.data || data || [];
  }

  async addCommentBlacklistWord(word: string): Promise<void> {
    await apiClient.post('/comments/blacklist', { word });
  }

  async removeCommentBlacklistWord(word: string): Promise<void> {
    await apiClient.delete(`/comments/blacklist/${encodeURIComponent(word)}`);
  }

  // ── Media Library ──

  async getMediaList(): Promise<MediaFile[]> {
    const { data } = await apiClient.get('/admin/media');
    return data?.data || data || [];
  }

  async deleteMedia(filename: string): Promise<void> {
    await apiClient.delete(`/admin/media/${encodeURIComponent(filename)}`);
  }

  // ── Events ──

  async getEvents(params?: Record<string, unknown>): Promise<{ data: EventItem[]; meta?: Record<string, unknown> }> {
    const { data } = await apiClient.get('/events', { params });
    const items: EventItem[] = (data?.data || data || []).map((ev: Record<string, unknown>) => ({
      id: ev.id as string,
      title: ev.title as string,
      description: ev.description as string,
      shortDescription: ev.shortDescription as string,
      date: ev.startDate as string,
      time: ev.startDate ? new Date(ev.startDate as string).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : undefined,
      venue: ev.venueName as string,
      city: ev.city as string,
      price: ev.price != null ? Number(ev.price) : undefined,
      imageUrl: ev.imageUrl as string,
      ticketUrl: ev.ticketUrl as string,
      status: ev.status as string,
      category: ev.category as { id: string; name: string },
      organizer: ev.organizer as { id: string; name: string } | undefined,
      _count: ev._count as { subscribers: number },
      createdAt: ev.createdAt as string,
    }));
    return { data: items, meta: data?.meta || {} };
  }

  async getEvent(id: string): Promise<EventItem | null> {
    const { data } = await apiClient.get(`/events/${id}`);
    const ev = data?.data || data;
    if (!ev) return null;
    return {
      id: ev.id,
      title: ev.title,
      description: ev.description,
      shortDescription: ev.shortDescription,
      date: ev.startDate,
      time: ev.startDate ? new Date(ev.startDate).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : undefined,
      venue: ev.venueName,
      city: ev.city,
      price: ev.price != null ? Number(ev.price) : undefined,
      imageUrl: ev.imageUrl,
      ticketUrl: ev.ticketUrl,
      status: ev.status,
      category: ev.category,
      organizer: ev.organizer as { id: string; name: string } | undefined,
      _count: ev._count,
      createdAt: ev.createdAt,
    };
  }

  async createEvent(dto: Partial<EventItem>): Promise<EventItem> {
    const payload: Record<string, unknown> = {};
    if (dto.title) payload.title = dto.title;
    if (dto.description) payload.description = dto.description;
    if (dto.shortDescription) payload.shortDescription = dto.shortDescription;
    if (dto.date) {
      payload.startDate = dto.time
        ? new Date(`${dto.date}T${dto.time}:00`).toISOString()
        : new Date(`${dto.date}T00:00:00`).toISOString();
    }
    if (dto.venue) payload.venueName = dto.venue;
    if (dto.city) payload.city = dto.city;
    if (dto.price) payload.price = Number(dto.price);
    if (dto.ticketUrl) payload.ticketUrl = dto.ticketUrl;
    if (dto.imageUrl) payload.imageUrl = dto.imageUrl;
    const { data } = await apiClient.post('/events', payload);
    return data?.data || data;
  }

  async updateEvent(id: string, dto: Partial<EventItem>): Promise<EventItem> {
    const payload: Record<string, unknown> = {};
    if (dto.title) payload.title = dto.title;
    if (dto.description) payload.description = dto.description;
    if (dto.shortDescription) payload.shortDescription = dto.shortDescription;
    if (dto.date) {
      payload.startDate = dto.time
        ? new Date(`${dto.date}T${dto.time}:00`).toISOString()
        : new Date(`${dto.date}T00:00:00`).toISOString();
    }
    if (dto.venue) payload.venueName = dto.venue;
    if (dto.city) payload.city = dto.city;
    if (dto.price) payload.price = Number(dto.price);
    if (dto.ticketUrl) payload.ticketUrl = dto.ticketUrl;
    if (dto.imageUrl) payload.imageUrl = dto.imageUrl;
    const { data } = await apiClient.patch(`/events/${id}`, payload);
    return data?.data || data;
  }

  async deleteEvent(id: string): Promise<void> {
    await apiClient.delete(`/events/${id}`);
  }

  async updateEventStatus(id: string, status: string): Promise<void> {
    await apiClient.patch(`/events/${id}/status`, { status });
  }

  // ── Newsletters ──

  async getNewsletters(): Promise<Record<string, unknown>[]> {
    const { data } = await apiClient.get('/notifications/newsletter');
    return Array.isArray(data) ? data : data?.data || [];
  }

  async getNewsletter(id: string): Promise<Record<string, unknown>> {
    const { data } = await apiClient.get(`/notifications/newsletter/${id}`);
    return data?.data || data;
  }

  async createNewsletter(dto: { title: string; content: string; type?: string }): Promise<Record<string, unknown>> {
    const { data } = await apiClient.post('/notifications/newsletter', dto);
    return data?.data || data;
  }

  async sendNewsletter(id: string): Promise<void> {
    await apiClient.post(`/notifications/newsletter/${id}/send`);
  }

  async getNewsletterStats(id: string): Promise<Record<string, unknown>> {
    const { data } = await apiClient.get(`/notifications/newsletter/${id}/stats`);
    return data?.data || data;
  }

  // ── SEO ──

  async getRedirects(): Promise<Record<string, unknown>[]> {
    const { data } = await apiClient.get('/admin/seo/redirects');
    return Array.isArray(data) ? data : data?.data || [];
  }

  async createRedirect(dto: { source: string; target: string; type?: number }): Promise<Record<string, unknown>> {
    const { data } = await apiClient.post('/admin/seo/redirects', dto);
    return data?.data || data;
  }

  async deleteRedirect(id: string): Promise<void> {
    await apiClient.delete(`/admin/seo/redirects/${id}`);
  }

  async generateSitemap(): Promise<string> {
    const { data } = await apiClient.post('/admin/seo/sitemap/generate');
    return data?.url || '';
  }

  async checkBrokenLinks(): Promise<Record<string, unknown>[]> {
    const { data } = await apiClient.post('/admin/seo/broken-links/check');
    return data?.data || [];
  }

  async getBrokenLinks(): Promise<Record<string, unknown>[]> {
    const { data } = await apiClient.get('/admin/seo/broken-links');
    return Array.isArray(data) ? data : data?.data || [];
  }
}

const adminService = new AdminService();
export default adminService;
export { AdminService };
