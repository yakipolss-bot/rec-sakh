import apiClient from './api-client';

// ── Interfaces ──

export interface AdminStats {
  uptime: string;
  cpuLoad: number;
  errors500: number;
  apiResponseTime: number;
  usersOnline: number;
}

export interface DashboardData {
  stats: AdminStats;
  analytics: {
    onlineUsers: number;
    usersToday: number;
    publishedToday: number;
    commentsToday: number;
    pendingModeration: number;
    totalNews: number;
    totalUsers: number;
    totalComments: number;
  };
  health: SystemHealthData;
}

export interface RecentAction {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
}

export interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  city?: string;
  registeredAt: string;
  adsCount?: number;
  commentsCount?: number;
  avatarUrl?: string;
  karma?: number;
  level?: number;
  createdAt?: string;
  phone?: string;
}

export interface StaffMember {
  id: string;
  userId: string;
  position: string;
  department: string | null;
  hireDate: string;
  isActive: boolean;
  kpiScore: number | null;
  schedule: Record<string, unknown>;
  permissions: string[];
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    role: string;
    status?: string;
    karma?: number;
    level?: number;
    phone?: string;
    bio?: string;
    createdAt?: string;
  };
}

export interface StaffScheduleItem {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  shift: 'morning' | 'day' | 'night';
}

export interface ModerationQueueItem {
  id: string;
  contentType: string;
  contentId: string;
  reason: string | null;
  reportedBy: string | null;
  reviewedBy: string | null;
  status: 'pending' | 'approved' | 'rejected';
  actionTaken: string | null;
  createdAt: string;
  reporter?: { id: string; name: string; email: string } | null;
  reviewer?: { id: string; name: string; email: string } | null;
}

export interface ModerationRule {
  id: string;
  ruleType: string;
  pattern: string;
  action: string;
  priority: number;
  isActive: boolean;
  createdAt: string;
  creator?: { id: string; name: string } | null;
}

export interface ModerationStats {
  pending: number;
  approvedToday: number;
  total: number;
  avgResponseTimeHours: number | null;
}

export interface AdPlacement {
  id: string;
  name: string;
  code: string;
  description: string | null;
  zone: string;
  width: number;
  height: number;
  pricePerDay: number;
  isActive: boolean;
}

export interface AdCampaign {
  id: string;
  name: string;
  placementId: string;
  advertiserName: string;
  advertiserContact: string;
  imageUrl: string;
  targetUrl: string;
  startsAt: string;
  endsAt: string;
  budget: number;
  spent: number;
  impressionsTarget: number | null;
  clicksTarget: number | null;
  isActive: boolean;
  placement?: AdPlacement;
}

export interface Transaction {
  id: string;
  date: string;
  user: string;
  type: 'payment' | 'refund' | 'withdrawal';
  amount: number;
  method: string;
  status: 'success' | 'pending' | 'failed';
}

export interface Tariff {
  id: string;
  name: string;
  price: number;
  interval: string;
  features: string[];
  description?: string;
  currency?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface SystemHealthData {
  uptime: number;
  memoryUsage: { heapUsed: number; heapTotal: number; rss: number; unit: string };
  apiStatus: string;
  databaseStatus: string;
  cacheStatus: string;
  lastBackup: string | null;
  nodeVersion: string;
  platform: string;
}

export interface AuditLogEntry {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
}

export interface ServerLog {
  id: string;
  level: string;
  message: string;
  timestamp: string;
}

export interface Setting {
  key: string;
  value: unknown;
  updatedBy: string | null;
  updatedAt: string;
}

export interface AnalyticsDashboard {
  onlineUsers: number;
  usersToday: number;
  publishedToday: number;
  commentsToday: number;
  pendingModeration: number;
  totalNews: number;
  totalUsers: number;
  totalComments: number;
}

// ── Service ──

export const adminService = {
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
  },

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
  },

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
  },

  // ── Users ──
  async getUsers(params?: { page?: number; perPage?: number; search?: string; role?: string; status?: string }): Promise<{ data: AdminUser[]; meta: Record<string, unknown> }> {
    const { data } = await apiClient.get('/users', { params });
    return { data: data?.data || [], meta: data?.meta || {} };
  },

  async getUserById(id: string): Promise<AdminUser> {
    const { data } = await apiClient.get(`/users/${id}`);
    return data?.data || data;
  },

  async updateUser(userId: string, dto: Record<string, unknown>): Promise<AdminUser> {
    const { data } = await apiClient.patch(`/users/${userId}`, dto);
    return data?.data || data;
  },

  async blockUser(userId: string): Promise<void> {
    await apiClient.delete(`/users/${userId}`);
  },

  async changeUserRole(userId: string, role: string): Promise<void> {
    await apiClient.patch(`/admin/users/${userId}/role`, { role });
  },

  // ── Staff ──
  async getStaff(params?: Record<string, unknown>): Promise<{ data: StaffMember[]; meta: Record<string, unknown> }> {
    const { data } = await apiClient.get('/admin/staff', { params });
    return { data: data?.data || [], meta: data?.meta || {} };
  },

  async getStaffById(id: string): Promise<StaffMember> {
    const { data } = await apiClient.get(`/admin/staff/${id}`);
    return data?.data || data;
  },

  async getStaffSchedule(): Promise<StaffScheduleItem[]> {
    const { data } = await apiClient.get('/admin/staff/schedule');
    return data?.data || data || [];
  },

  async createStaffSchedule(dto: { staffId: string; date: string; shift: string }): Promise<StaffScheduleItem> {
    const { data } = await apiClient.post('/admin/staff/schedule', dto);
    return data?.data || data;
  },

  // ── Moderation ──
  async getModerationQueue(params?: Record<string, unknown>): Promise<{ data: ModerationQueueItem[]; meta: Record<string, unknown> }> {
    const { data } = await apiClient.get('/admin/moderation/queue', { params });
    return { data: data?.data || [], meta: data?.meta || {} };
  },

  async reviewModeration(id: string, dto: { status: 'approved' | 'rejected'; reason?: string }): Promise<void> {
    await apiClient.post(`/admin/moderation/queue/${id}/review`, dto);
  },

  async getModerationRules(): Promise<ModerationRule[]> {
    const { data } = await apiClient.get('/admin/moderation/rules');
    return data?.data || data || [];
  },

  async createModerationRule(dto: Record<string, unknown>): Promise<ModerationRule> {
    const { data } = await apiClient.post('/admin/moderation/rules', dto);
    return data?.data || data;
  },

  async updateModerationRule(id: string, dto: Partial<ModerationRule>): Promise<ModerationRule> {
    const { data } = await apiClient.patch(`/admin/moderation/rules/${id}`, dto);
    return data?.data || data;
  },

  async deleteModerationRule(id: string): Promise<void> {
    await apiClient.delete(`/admin/moderation/rules/${id}`);
  },

  async getModerationStats(): Promise<ModerationStats> {
    const { data } = await apiClient.get('/admin/moderation/stats');
    return data?.data || data;
  },

  // ── Settings ──
  async getSettings(): Promise<Setting[]> {
    const { data } = await apiClient.get('/admin/settings');
    return data?.data || data || [];
  },

  async getSetting(key: string): Promise<Setting> {
    const { data } = await apiClient.get(`/admin/settings/${key}`);
    return data?.data || data;
  },

  async updateSetting(key: string, value: unknown): Promise<Setting> {
    const { data } = await apiClient.put(`/admin/settings/${key}`, { value });
    return data?.data || data;
  },

  async deleteSetting(key: string): Promise<void> {
    await apiClient.delete(`/admin/settings/${key}`);
  },

  // ── Analytics ──
  async getAnalyticsDashboard(): Promise<AnalyticsDashboard> {
    const { data } = await apiClient.get('/admin/analytics/dashboard');
    return data?.data || data;
  },

  async getAnalyticsTraffic(params?: Record<string, unknown>): Promise<unknown> {
    const { data } = await apiClient.get('/admin/analytics/traffic', { params });
    return data?.data || data;
  },

  async getAnalyticsContent(params?: Record<string, unknown>): Promise<unknown> {
    const { data } = await apiClient.get('/admin/analytics/content', { params });
    return data?.data || data;
  },

  async getRealtimeAnalytics(): Promise<unknown> {
    const { data } = await apiClient.get('/admin/analytics/realtime');
    return data?.data || data;
  },

  // ── Content ──
  async bulkNewsOperation(action: string, ids: string[], value?: string): Promise<unknown> {
    const { data } = await apiClient.post('/admin/content/news/bulk', { action, ids, value });
    return data?.data || data;
  },

  // ── Health / Audit ──
  async getHealth(): Promise<SystemHealthData> {
    const { data } = await apiClient.get('/admin/health');
    return data?.data || data;
  },

  async getAuditLog(params?: Record<string, unknown>): Promise<{ data: AuditLogEntry[]; meta: Record<string, unknown> }> {
    const { data } = await apiClient.get('/admin/audit', { params });
    return { data: data?.data || [], meta: data?.meta || {} };
  },

  async getAuditStats(): Promise<unknown> {
    const { data } = await apiClient.get('/admin/audit/stats');
    return data?.data || data;
  },

  // ── Roles ──
  async getRoles(): Promise<string[]> {
    const { data } = await apiClient.get('/admin/roles');
    return data?.data || data || [];
  },

  // ── System — implemented on backend ──
  async clearCache(): Promise<void> {
    await apiClient.post('/admin/system/cache/clear');
  },

  async warmCache(): Promise<void> {
    await apiClient.post('/admin/system/cache/warm');
  },

  async reindexSearch(): Promise<void> {
    await apiClient.post('/search/sync');
  },

  async optimizeMedia(): Promise<void> {
    await apiClient.post('/admin/system/media/optimize');
  },

  async checkUpdates(): Promise<{ hasUpdates: boolean; version?: string }> {
    const { data } = await apiClient.get('/admin/system/updates');
    return data?.data || data || { hasUpdates: false };
  },

  // ── Files ──
  async uploadFile(file: File): Promise<{ url: string }> {
    const form = new FormData();
    form.append('file', file);
    const { data } = await apiClient.post('/admin/files/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data?.data || data;
  },

  // ── Backup ──
  async createBackup(): Promise<void> {
    await apiClient.post('/admin/backup');
  },

  // ── Billing (admin routes) ──
  async getTransactions(params?: Record<string, unknown>): Promise<{ data: Transaction[]; meta?: Record<string, unknown> }> {
    const { data } = await apiClient.get('/billing/admin/transactions', { params });
    return { data: data?.data || data || [], meta: data?.meta || {} };
  },

  async getTariffs(): Promise<Tariff[]> {
    const { data } = await apiClient.get('/billing/admin/tariffs');
    return data?.data || data || [];
  },

  async selectTariff(tariffId: string): Promise<void> {
    await apiClient.post(`/billing/admin/tariffs/${tariffId}/select`);
  },

  // ── Comments Management ──
  async getComments(params?: Record<string, unknown>): Promise<{ data: Comment[]; meta: Record<string, unknown> }> {
    const { data } = await apiClient.get('/comments', { params });
    return { data: data?.data || data || [], meta: data?.meta || {} };
  },

  async deleteComment(id: string): Promise<void> {
    await apiClient.delete(`/comments/${id}`);
  },

  async moderateComment(id: string, status: 'approved' | 'rejected'): Promise<void> {
    await apiClient.patch(`/comments/${id}/moderate`, { status });
  },

  async bulkModerateComments(dto: { ids: string[]; status: 'approved' | 'rejected' }): Promise<void> {
    await apiClient.post('/comments/bulk-moderate', dto);
  },

  async banCommentUser(userId: string): Promise<void> {
    await apiClient.post('/comments/ban', { userId });
  },

  async unbanCommentUser(userId: string): Promise<void> {
    await apiClient.delete(`/comments/ban/${userId}`);
  },

  async getCommentBlacklist(): Promise<{ word: string }[]> {
    const { data } = await apiClient.get('/comments/blacklist');
    return data?.data || data || [];
  },

  async addCommentBlacklistWord(word: string): Promise<void> {
    await apiClient.post('/comments/blacklist', { word });
  },

  async removeCommentBlacklistWord(word: string): Promise<void> {
    await apiClient.delete(`/comments/blacklist/${encodeURIComponent(word)}`);
  },

  // ── Media Library ──
  async getMediaList(): Promise<MediaFile[]> {
    const { data } = await apiClient.get('/admin/media');
    return data?.data || data || [];
  },

  async deleteMedia(filename: string): Promise<void> {
    await apiClient.delete(`/admin/media/${encodeURIComponent(filename)}`);
  },
};

export interface MediaFile {
  filename: string;
  url: string;
  size: number;
  createdAt: string;
  isImage: boolean;
}

export interface Comment {
  id: string;
  text: string;
  author: { id: string; name: string };
  articleId?: string;
  articleTitle?: string;
  status: string;
  createdAt: string;
  likes?: number;
  dislikes?: number;
}
