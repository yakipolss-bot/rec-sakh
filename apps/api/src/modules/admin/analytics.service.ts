import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { AdminQueryDto } from './dto/admin-query.dto.js';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const last15min = new Date(Date.now() - 15 * 60 * 1000);

    const [
      onlineUsers,
      usersToday,
      publishedToday,
      commentsToday,
      pendingModeration,
      totalNews,
      totalUsers,
      totalComments,
    ] = await Promise.all([
      // Пользователи онлайн (сессии в последние 15 минут)
      this.prisma.session.count({
        where: { expiresAt: { gte: last15min } },
      }),
      // Новые пользователи сегодня
      this.prisma.user.count({
        where: { createdAt: { gte: today } },
      }),
      // Опубликованные новости сегодня
      this.prisma.newsArticle.count({
        where: {
          status: 'published',
          publishedAt: { gte: today },
        },
      }),
      // Комментарии сегодня
      this.prisma.comment.count({
        where: { createdAt: { gte: today } },
      }),
      // Ожидают модерации
      this.prisma.moderationQueue.count({
        where: { status: 'pending' },
      }),
      // Всего новостей
      this.prisma.newsArticle.count(),
      // Всего пользователей
      this.prisma.user.count({
        where: { deletedAt: null },
      }),
      // Всего комментариев
      this.prisma.comment.count(),
    ]);

    return {
      onlineUsers,
      usersToday,
      publishedToday,
      commentsToday,
      pendingModeration,
      totalNews,
      totalUsers,
      totalComments,
    };
  }

  async getTraffic(query: AdminQueryDto) {
    const dateFrom = query.dateFrom
      ? new Date(query.dateFrom)
      : new Date(Date.now() - 30 * 86_400_000); // 30 дней по умолчанию
    const dateTo = query.dateTo ? new Date(query.dateTo) : new Date();

    // Трафик на основе просмотров новостей (с группировкой по дням)
    const newsByPeriod = await this.prisma.newsArticle.findMany({
      where: {
        publishedAt: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
      select: {
        publishedAt: true,
        viewsCount: true,
        categoryId: true,
      },
      orderBy: { publishedAt: 'asc' },
    });

    // Суммарные просмотры
    const totalViews = newsByPeriod.reduce(
      (sum, n) => sum + n.viewsCount,
      0,
    );

    // Группировка по дням для графика
    const dailyViews = this.groupByDate(newsByPeriod);

    // Топ категорий по просмотрам
    const topCategoryIds = this.getTopCategories(newsByPeriod);

    // Получаем названия категорий
    const categoryNames = await this.getCategoryNames(topCategoryIds);

    return {
      period: {
        from: dateFrom,
        to: dateTo,
      },
      totalViews,
      totalArticles: newsByPeriod.length,
      dailyViews,
      topCategories: categoryNames,
    };
  }

  async getContent(query: AdminQueryDto) {
    const page = query.page ?? 1;
    const perPage = Math.min(query.perPage ?? 20, 50);

    const where: Record<string, any> = {};

    if (query.dateFrom || query.dateTo) {
      where.publishedAt = {};
      if (query.dateFrom) where.publishedAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.publishedAt.lte = new Date(query.dateTo);
    }

    const [articles, total] = await Promise.all([
      this.prisma.newsArticle.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { viewsCount: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          viewsCount: true,
          commentsCount: true,
          readingTimeMinutes: true,
          publishedAt: true,
          status: true,
          author: {
            select: { id: true, name: true },
          },
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
      }),
      this.prisma.newsArticle.count({ where }),
    ]);

    // Среднее время чтения и bounce rate (оценочно)
    const avgReadingTime =
      articles.length > 0
        ? articles.reduce(
            (sum, a) => sum + (a.readingTimeMinutes ?? 0),
            0,
          ) / articles.length
        : 0;

    return {
      data: articles,
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
        avgReadingTime: Math.round(avgReadingTime * 10) / 10,
      },
    };
  }

  async getRealtime() {
    const last15min = new Date(Date.now() - 15 * 60 * 1000);
    const last5min = new Date(Date.now() - 5 * 60 * 1000);

    const [onlineUsers, recentComments, recentSearches] = await Promise.all([
      // Онлайн пользователи
      this.prisma.session.count({
        where: { expiresAt: { gte: last15min } },
      }),
      // Последние комментарии
      this.prisma.comment.findMany({
        where: { createdAt: { gte: last5min } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          content: true,
          createdAt: true,
          author: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      }),
      // Последние действия в audit логе
      this.prisma.auditLog.findMany({
        where: { createdAt: { gte: last5min } },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          action: true,
          entityType: true,
          createdAt: true,
          user: {
            select: { id: true, name: true },
          },
        },
      }),
    ]);

    return {
      onlineUsers,
      recentComments,
      recentActivity: recentSearches,
      timestamp: new Date().toISOString(),
    };
  }

  // ====== Вспомогательные методы ======

  private groupByDate(
    articles: Array<{ publishedAt: Date | null; viewsCount: number }>,
  ): Array<{ date: string; views: number; articles: number }> {
    const grouped: Record<string, { views: number; articles: number }> = {};

    for (const article of articles) {
      if (!article.publishedAt) continue;
      const dateKey = article.publishedAt.toISOString().split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = { views: 0, articles: 0 };
      }
      grouped[dateKey].views += article.viewsCount;
      grouped[dateKey].articles += 1;
    }

    return Object.entries(grouped)
      .map(([date, data]) => ({
        date,
        views: data.views,
        articles: data.articles,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private getTopCategories(
    articles: Array<{ categoryId: string | null; viewsCount: number }>,
  ): Array<{ id: string; views: number }> {
    const grouped: Record<string, number> = {};

    for (const article of articles) {
      if (!article.categoryId) continue;
      grouped[article.categoryId] =
        (grouped[article.categoryId] ?? 0) + article.viewsCount;
    }

    return Object.entries(grouped)
      .map(([id, views]) => ({ id, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);
  }

  private async getCategoryNames(
    categories: Array<{ id: string; views: number }>,
  ): Promise<Array<{ id: string; name: string; views: number }>> {
    if (categories.length === 0) return [];

    const dbCategories = await this.prisma.category.findMany({
      where: { id: { in: categories.map((c) => c.id) } },
      select: { id: true, name: true },
    });

    const nameMap = new Map(dbCategories.map((c) => [c.id, c.name]));

    return categories.map((c) => ({
      id: c.id,
      name: nameMap.get(c.id) ?? 'Unknown',
      views: c.views,
    }));
  }
}
