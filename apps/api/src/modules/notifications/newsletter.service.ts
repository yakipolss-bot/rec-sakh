import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { NotificationQueueService } from './notification-queue.service.js';
import { SendNewsletterDto } from './dto/send-newsletter.dto.js';
import { Newsletter, NewsletterStats } from '@prisma/client';
import { ChannelType } from '@prisma/client';

@Injectable()
export class NewsletterService {
  private readonly logger = new Logger(NewsletterService.name);

  constructor(
    private prisma: PrismaService,
    private queueService: NotificationQueueService,
  ) {}

  async create(dto: SendNewsletterDto, createdBy?: string): Promise<Newsletter> {
    const newsletter = await this.prisma.newsletter.create({
      data: {
        type: dto.type || 'email',
        title: dto.title,
        content: dto.content,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        createdBy: createdBy || null,
        targetAudience: (dto.targetAudience as any) || {},
        status: dto.scheduledAt ? 'scheduled' : 'draft',
      },
    });

    // Создать пустую статистику
    await this.prisma.newsletterStats.create({
      data: {
        newsletterId: newsletter.id,
      },
    });

    this.logger.log(`Newsletter created: ${newsletter.id} - "${newsletter.title}"`);
    return newsletter;
  }

  async send(newsletterId: string): Promise<void> {
    const newsletter = await this.prisma.newsletter.findUnique({
      where: { id: newsletterId },
    });

    if (!newsletter) {
      throw new NotFoundException('Newsletter not found');
    }

    // Обновить статус
    await this.prisma.newsletter.update({
      where: { id: newsletterId },
      data: { status: 'sending' },
    });

    // 1. Собрать аудиторию
    const audience = await this.collectAudience(newsletter.targetAudience as Record<string, any>);

    this.logger.log(`Sending newsletter ${newsletterId} to ${audience.length} recipients`);

    // 2. Поставить в очередь для каждого пользователя
    let sentCount = 0;
    for (const user of audience) {
      try {
        await this.queueService.enqueue({
          userId: user.id,
          type: 'newsletter',
          channel: (newsletter.type as ChannelType) || 'email',
          title: newsletter.title,
          body: newsletter.content,
          data: {
            newsletterId: newsletter.id,
            userName: user.name,
            userEmail: user.email,
          },
        });
        sentCount++;
      } catch (error) {
        this.logger.error(`Failed to enqueue newsletter for user ${user.id}: ${error}`);
      }
    }

    // 3. Обновить статус
    const isScheduled = newsletter.scheduledAt && newsletter.scheduledAt > new Date();

    await this.prisma.newsletter.update({
      where: { id: newsletterId },
      data: {
        status: isScheduled ? 'scheduled' : 'sent',
        sentAt: isScheduled ? null : new Date(),
      },
    });

    // Обновить статистику
    await this.prisma.newsletterStats.update({
      where: { newsletterId },
      data: {
        sentCount: { increment: sentCount },
      },
    });

    this.logger.log(`Newsletter ${newsletterId} sent to ${sentCount} users`);
  }

  async getStats(newsletterId: string): Promise<NewsletterStats> {
    const stats = await this.prisma.newsletterStats.findUnique({
      where: { newsletterId },
    });

    if (!stats) {
      throw new NotFoundException('Newsletter stats not found');
    }

    return stats;
  }

  private async collectAudience(targetAudience: Record<string, any>): Promise<Array<{ id: string; name: string; email: string }>> {
    const {
      userIds,
      roles,
      cities,
      isSubscribed,
    } = targetAudience;

    const where: any = {
      deletedAt: null,
      status: 'active',
    };

    // Если указаны конкретные userIds
    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      where.id = { in: userIds };
      return this.prisma.user.findMany({
        where,
        select: { id: true, name: true, email: true },
      });
    }

    // Фильтр по ролям
    if (roles && Array.isArray(roles) && roles.length > 0) {
      where.role = { in: roles };
    }

    // Фильтр по городам
    if (cities && Array.isArray(cities) && cities.length > 0) {
      where.city = { in: cities };
    }

    // Подписанные на рассылки
    if (isSubscribed === true) {
      where.settings = {
        emailNotifications: true,
      };
    }

    return this.prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true },
    });
  }
}
