import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotificationQueueService } from '../notification-queue.service.js';
import { DigestService } from '../digest.service.js';

@Injectable()
export class NotificationSchedulerService {
  private readonly logger = new Logger(NotificationSchedulerService.name);

  constructor(
    private queueService: NotificationQueueService,
    private digestService: DigestService,
  ) {}

  @Cron('*/10 * * * * *')
  async processQueue() {
    await this.queueService.processQueue();
  }

  @Cron('0 */5 * * * *')
  async retryFailedNotifications() {
    await this.queueService.retryFailed();
  }

  @Cron('0 0 8 * * *')
  async generateDailyDigests() {
    this.logger.log('Starting daily digest generation...');
    await this.digestService.generateDigests('daily');
    this.logger.log('Daily digest generation completed');
  }

  @Cron('0 0 10 * * 1')
  async generateWeeklyDigests() {
    this.logger.log('Starting weekly digest generation...');
    await this.digestService.generateDigests('weekly');
    this.logger.log('Weekly digest generation completed');
  }
}
