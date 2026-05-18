import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { NotificationQueueService } from './notification-queue.service.js';
import { NotificationRendererService } from './notification-renderer.service.js';
import { NotificationType, ChannelType } from '@prisma/client';
import { NotifyParams } from './interfaces/notification.types.js';
import { NotificationQueryDto } from './dto/notification-query.dto.js';
import { SubscribePushDto } from './dto/subscribe-push.dto.js';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private queueService: NotificationQueueService,
    private renderer: NotificationRendererService,
  ) {}

  // Для немедленной отправки (через очередь)
  async notify(params: NotifyParams): Promise<void> {
    const { userId, type, channel, context } = params;

    // Проверить настройки пользователя
    const userSettings = await this.prisma.userSetting.findUnique({
      where: { userId },
    });

    if (!userSettings) {
      this.logger.warn(`User settings not found for ${userId}`);
      return;
    }

    const channels = this.resolveChannels(type, channel, userSettings);

    for (const ch of channels) {
      try {
        // Рендерить шаблон
        const rendered = await this.renderer.render(type, ch, context || {});
        if (!rendered) {
          this.logger.warn(`No template for ${type}/${ch}, skipping`);
          continue;
        }

        // Поставить в очередь
        await this.queueService.enqueue({
          userId,
          type,
          channel: ch,
          title: rendered.subject,
          body: rendered.body,
          data: context,
        });

        // Для канала 'push' — также сохранить в Notification сразу (для UI центра уведомлений)
        if (ch === 'push') {
          await this.prisma.notification.create({
            data: {
              userId,
              type,
              title: rendered.subject,
              body: rendered.body,
              data: context || {},
              channel: 'push',
            },
          });
        }

        this.logger.log(`Notification ${type}/${ch} queued for user ${userId}`);
      } catch (error) {
        this.logger.error(`Failed to queue notification for user ${userId}: ${error}`);
      }
    }
  }

  private resolveChannels(
    type: NotificationType,
    preferredChannel?: ChannelType,
    settings?: { emailNotifications: boolean; pushNotifications: boolean; smsNotifications: boolean },
  ): ChannelType[] {
    if (preferredChannel) {
      return [preferredChannel];
    }

    const channels: ChannelType[] = ['push']; // push по умолчанию

    if (settings?.emailNotifications) {
      channels.push('email');
    }

    // Для важных уведомлений добавляем SMS
    if (settings?.smsNotifications && ['news_breaking', 'news_urgent', 'billing'].includes(type)) {
      channels.push('sms');
    }

    return channels;
  }

  // ====== CRUD для центра уведомлений ======

  async getUserNotifications(userId: string, query: NotificationQueryDto) {
    const { page, perPage, type, isRead, dateFrom, dateTo } = query;
    const skip = (page - 1) * perPage;

    const where: any = { userId };

    if (type) where.type = type;
    if (isRead !== undefined) where.isRead = isRead;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data: notifications,
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async markAsRead(userId: string, notificationIds: string[]): Promise<void> {
    await this.prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId,
      },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async deleteNotification(userId: string, id: string): Promise<void> {
    await this.prisma.notification.deleteMany({
      where: { id, userId },
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  // ====== Push subscriptions ======

  async subscribePush(userId: string, dto: SubscribePushDto): Promise<void> {
    await this.prisma.pushSubscription.upsert({
      where: { endpoint: dto.endpoint },
      update: {
        userId,
        p256dhKey: dto.p256dhKey,
        authKey: dto.authKey,
        userAgent: dto.userAgent,
      },
      create: {
        userId,
        endpoint: dto.endpoint,
        p256dhKey: dto.p256dhKey,
        authKey: dto.authKey,
        userAgent: dto.userAgent,
      },
    });
  }

  async unsubscribePush(userId: string, endpoint: string): Promise<void> {
    await this.prisma.pushSubscription.deleteMany({
      where: { endpoint, userId },
    });
  }
}
