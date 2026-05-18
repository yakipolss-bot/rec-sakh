import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './notifications.service.js';
import { NotificationQueueService } from './notification-queue.service.js';
import { NotificationRendererService } from './notification-renderer.service.js';
import { NotificationChannelService } from './notification-channel.service.js';
import { DigestService } from './digest.service.js';
import { NewsletterService } from './newsletter.service.js';
import { EmailProviderService } from './providers/email-provider.service.js';
import { SmsProviderService } from './providers/sms-provider.service.js';
import { PushProviderService } from './providers/push-provider.service.js';
import { TelegramProviderService } from './providers/telegram-provider.service.js';
import { NotificationSchedulerService } from './schedules/notification-scheduler.service.js';
import { TelegramWebhookController } from './webhooks/telegram-webhook.controller.js';

@Module({
  imports: [ScheduleModule],
  controllers: [NotificationsController, TelegramWebhookController],
  providers: [
    NotificationsService,
    NotificationQueueService,
    NotificationRendererService,
    NotificationChannelService,
    DigestService,
    NewsletterService,
    EmailProviderService,
    SmsProviderService,
    PushProviderService,
    TelegramProviderService,
    NotificationSchedulerService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
