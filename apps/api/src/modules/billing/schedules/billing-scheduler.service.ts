import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionService } from '../subscription.service.js';

@Injectable()
export class BillingSchedulerService {
  private readonly logger = new Logger(BillingSchedulerService.name);

  constructor(private subscriptionService: SubscriptionService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async checkExpiredSubscriptions() {
    this.logger.log('Running scheduled task: check expired subscriptions');
    try {
      await this.subscriptionService.checkExpiredSubscriptions();
    } catch (error: any) {
      this.logger.error(`Error checking expired subscriptions: ${error.message}`, error.stack);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async autoRenewSubscriptions() {
    this.logger.log('Running scheduled task: auto-renew subscriptions');
    try {
      await this.subscriptionService.autoRenew();
    } catch (error: any) {
      this.logger.error(`Error auto-renewing subscriptions: ${error.message}`, error.stack);
    }
  }
}
