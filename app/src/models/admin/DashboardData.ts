import { AdminStats } from './AdminStats';
import { SystemHealthData } from './SystemHealthData';

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
