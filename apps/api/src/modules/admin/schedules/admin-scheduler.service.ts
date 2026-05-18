import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AnalyticsService } from '../analytics.service.js';

@Injectable()
export class AdminSchedulerService {
  private readonly logger = new Logger(AdminSchedulerService.name);

  constructor(private analyticsService: AnalyticsService) {}

  @Cron('0 */5 * * * *')
  async collectMetrics() {
    this.logger.log('[Admin] Metrics collection tick');

    try {
      // Сбор метрик системы для дашборда
      const dashboard = await this.analyticsService.getDashboard();
      this.logger.log(
        `[Admin] Metrics: ${dashboard.onlineUsers} online, ${dashboard.publishedToday} published today`,
      );
    } catch (error) {
      this.logger.error('[Admin] Metrics collection failed', error);
    }
  }

  @Cron('0 0 * * * *')
  async hourlyHealthCheck() {
    this.logger.log('[Admin] Hourly health check tick');
    // Можно добавить отправку alert-ов при проблемах
  }
}
