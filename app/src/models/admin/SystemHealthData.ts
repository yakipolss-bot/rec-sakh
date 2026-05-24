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
