import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { NotificationQueueService } from './notification-queue.service.js';
import { ChannelType } from '@prisma/client';

@Injectable()
export class DigestService {
  private readonly logger = new Logger(DigestService.name);

  constructor(
    private prisma: PrismaService,
    private queueService: NotificationQueueService,
  ) {}

  async generateDigests(type: 'daily' | 'weekly'): Promise<void> {
    this.logger.log(`Generating ${type} digests...`);

    // 1. Найти всех подписанных на дайджест
    const subscriptions = await this.prisma.digestSubscription.findMany({
      where: {
        type,
        isActive: true,
      },
    });

    if (subscriptions.length === 0) {
      this.logger.log(`No ${type} digest subscriptions found`);
      return;
    }

    this.logger.log(`Found ${subscriptions.length} ${type} digest subscriptions`);

    // 2. Определить период
    const now = new Date();
    const periodStart = new Date(
      type === 'daily' ? now.getTime() - 24 * 60 * 60 * 1000 : now.getTime() - 7 * 24 * 60 * 60 * 1000,
    );

    for (const sub of subscriptions) {
      try {
        // Получить пользователя
        const user = await this.prisma.user.findUnique({
          where: { id: sub.userId },
          select: {
            id: true,
            name: true,
          },
        });

        if (!user) continue;

        // 3. Собрать топ новостей за период
        const topNews = await this.prisma.newsArticle.findMany({
          where: {
            publishedAt: { gte: periodStart },
            status: 'published',
          },
          orderBy: { viewsCount: 'desc' },
          take: 10,
          select: {
            id: true,
            title: true,
            slug: true,
            viewsCount: true,
            publishedAt: true,
          },
        });

        // 4. События за следующую неделю
        const upcomingEvents = await this.prisma.event.findMany({
          where: {
            startDate: {
              gte: now,
              ...(type === 'weekly'
                ? { lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) }
                : { lte: new Date(now.getTime() + 24 * 60 * 60 * 1000) }),
            },
            status: 'published',
          },
          orderBy: { startDate: 'asc' },
          take: 5,
          select: {
            id: true,
            title: true,
            startDate: true,
            venueName: true,
          },
        });

        // 5. Новые объявления
        const newAds = await this.prisma.ad.findMany({
          where: {
            createdAt: { gte: periodStart },
            status: 'active',
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            title: true,
            price: true,
            createdAt: true,
          },
        });

        // 6. Сформировать контент дайджеста
        const digestContent = this.buildDigestContent(type, user.name, {
          topNews,
          upcomingEvents,
          newAds,
        });

        // 7. Поставить в очередь на отправку
        await this.queueService.enqueue({
          userId: sub.userId,
          type: 'newsletter',
          channel: sub.channel,
          title: type === 'daily' ? '☀️ Ежедневный дайджест Sakhcom' : '📅 Еженедельный дайджест Sakhcom',
          body: digestContent,
          data: {
            digestType: type,
            periodStart: periodStart.toISOString(),
            generatedAt: now.toISOString(),
          },
        });

        this.logger.log(`Digest ${type} queued for user ${sub.userId}`);
      } catch (error) {
        this.logger.error(`Error generating digest for user ${sub.userId}: ${error}`);
      }
    }
  }

  private buildDigestContent(
    type: string,
    userName: string,
    data: {
      topNews: Array<{ id: string; title: string; slug: string; viewsCount: number; publishedAt: Date | null }>;
      upcomingEvents: Array<{ id: string; title: string; startDate: Date; venueName: string | null }>;
      newAds: Array<{ id: string; title: string; price: any; createdAt: Date }>;
    },
  ): string {
    const lines: string[] = [];
    const periodLabel = type === 'daily' ? 'за последние 24 часа' : 'за последнюю неделю';

    lines.push(`👋 Привет, ${userName}!`);
    lines.push(`Вот что произошло на Sakhcom ${periodLabel}:\n`);

    if (data.topNews.length > 0) {
      lines.push(`📰 **Топ новостей:**`);
      data.topNews.forEach((news, i) => {
        lines.push(`  ${i + 1}. ${news.title} (👁 ${news.viewsCount})`);
      });
      lines.push('');
    }

    if (data.upcomingEvents.length > 0) {
      lines.push(`📅 **Ближайшие события:**`);
      data.upcomingEvents.forEach((event) => {
        const dateStr = event.startDate.toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'long',
          hour: '2-digit',
          minute: '2-digit',
        });
        lines.push(`  • ${event.title} — ${dateStr}${event.venueName ? `, ${event.venueName}` : ''}`);
      });
      lines.push('');
    }

    if (data.newAds.length > 0) {
      lines.push(`🏪 **Новые объявления:**`);
      data.newAds.forEach((ad) => {
        const priceStr = ad.price ? `${ad.price} ₽` : 'Цена не указана';
        lines.push(`  • ${ad.title} — ${priceStr}`);
      });
      lines.push('');
    }

    lines.push('---');
    lines.push('Спасибо, что вы с нами!');
    lines.push('Отписаться от дайджеста можно в настройках профиля.');

    return lines.join('\n');
  }

  async subscribe(userId: string, type: string, channel: ChannelType): Promise<void> {
    await this.prisma.digestSubscription.upsert({
      where: {
        userId_type_channel: { userId, type, channel },
      },
      update: { isActive: true },
      create: { userId, type, channel },
    });
  }

  async unsubscribe(userId: string, type: string, channel: ChannelType): Promise<void> {
    try {
      await this.prisma.digestSubscription.update({
        where: {
          userId_type_channel: { userId, type, channel },
        },
        data: { isActive: false },
      });
    } catch {
      // Если подписки нет — ничего не делаем
      this.logger.warn(`No digest subscription found for user ${userId}, type=${type}, channel=${channel}`);
    }
  }
}
