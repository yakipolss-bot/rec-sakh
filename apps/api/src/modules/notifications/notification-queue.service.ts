import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { NotificationChannelService } from './notification-channel.service.js';
import { EnqueueParams } from './interfaces/notification.types.js';

@Injectable()
export class NotificationQueueService {
  private readonly logger = new Logger(NotificationQueueService.name);

  constructor(
    private prisma: PrismaService,
    private channelService: NotificationChannelService,
  ) {}

  async enqueue(params: EnqueueParams): Promise<void> {
    await this.prisma.notificationQueue.create({
      data: {
        userId: params.userId,
        type: params.type,
        channel: params.channel,
        title: params.title,
        body: params.body,
        data: (params.data as any) || {},
        scheduledAt: params.scheduledAt || undefined,
      },
    });

    this.logger.log(
      `Enqueued notification: ${params.type}/${params.channel} for user ${params.userId}`,
    );
  }

  async processQueue(batchSize = 50): Promise<void> {
    // 1. Взять pending записи (с scheduledAt <= now или без scheduledAt)
    const pending = await this.prisma.notificationQueue.findMany({
      where: {
        status: 'pending',
        AND: [
          {
            OR: [
              { scheduledAt: null },
              { scheduledAt: { lte: new Date() } },
            ],
          },
        ],
      },
      take: batchSize,
      orderBy: { createdAt: 'asc' },
    });

    if (pending.length === 0) {
      return;
    }

    this.logger.log(`Processing ${pending.length} queued notifications`);

    for (const item of pending) {
      try {
        // Пометить как processing
        await this.prisma.notificationQueue.update({
          where: { id: item.id },
          data: { status: 'processing' },
        });

        // Отправить через channelService
        const success = await this.channelService.send({
          userId: item.userId,
          type: item.type,
          channel: item.channel,
          context: (item.data as Record<string, any>) || {},
        });

        if (success) {
          await this.prisma.notificationQueue.update({
            where: { id: item.id },
            data: {
              status: 'sent',
              sentAt: new Date(),
            },
          });
        } else {
          throw new Error('Send failed');
        }
      } catch (error: any) {
        const newRetryCount = item.retryCount + 1;
        const isFailed = newRetryCount >= item.maxRetries;

        await this.prisma.notificationQueue.update({
          where: { id: item.id },
          data: {
            status: isFailed ? 'failed' : 'pending',
            retryCount: newRetryCount,
            errorMessage: error?.message || 'Unknown error',
          },
        });

        if (isFailed) {
          this.logger.error(
            `Notification ${item.id} failed after ${newRetryCount} retries: ${error?.message}`,
          );
        } else {
          this.logger.warn(
            `Notification ${item.id} will retry (${newRetryCount}/${item.maxRetries}): ${error?.message}`,
          );
        }
      }
    }
  }

  async retryFailed(): Promise<void> {
    const result = await this.prisma.notificationQueue.updateMany({
      where: {
        status: 'failed',
      },
      data: {
        status: 'pending',
        retryCount: 0,
        errorMessage: null,
      },
    });

    this.logger.log(`Reset ${result.count} failed notifications to pending`);
  }
}
