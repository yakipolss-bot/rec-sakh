import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { AdminQueryDto } from './dto/admin-query.dto.js';
import {
  ReviewModerationDto,
  CreateRuleDto,
  UpdateRuleDto,
} from './dto/moderation-queue.dto.js';

@Injectable()
export class ModerationService {
  constructor(private prisma: PrismaService) {}

  // ====== Moderation Queue ======

  async getQueue(query: AdminQueryDto) {
    const page = query.page ?? 1;
    const perPage = Math.min(query.perPage ?? 50, 100);

    const where: Record<string, any> = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.contentType) {
      where.contentType = query.contentType;
    }

    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) {
        where.createdAt.gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        where.createdAt.lte = new Date(query.dateTo);
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.moderationQueue.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: {
            select: { id: true, name: true, email: true },
          },
          reviewer: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      this.prisma.moderationQueue.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async reviewItem(id: string, dto: ReviewModerationDto, reviewerId: string) {
    const item = await this.prisma.moderationQueue.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Moderation queue item not found');
    }

    // Обновляем запись в очереди
    const updated = await this.prisma.moderationQueue.update({
      where: { id },
      data: {
        status: dto.status,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        actionTaken: dto.reason ?? null,
      },
    });

    // Если одобрено — обновляем статус контента в зависимости от типа
    if (dto.status === 'approved') {
      await this.applyContentApproval(item.contentType, item.contentId);
    }

    return updated;
  }

  private async applyContentApproval(contentType: string, contentId: string) {
    switch (contentType) {
      case 'comment':
        await this.prisma.comment
          .update({
            where: { id: contentId },
            data: { status: 'approved' },
          })
          .catch(() => {});
        break;

      case 'news':
        await this.prisma.newsArticle
          .update({
            where: { id: contentId },
            data: { status: 'published', publishedAt: new Date() },
          })
          .catch(() => {});
        break;

      case 'ad':
        await this.prisma.ad
          .update({
            where: { id: contentId },
            data: { status: 'active' },
          })
          .catch(() => {});
        break;

      case 'event':
        await this.prisma.event
          .update({
            where: { id: contentId },
            data: { status: 'published' },
          })
          .catch(() => {});
        break;

      default:
        // Неизвестный тип контента — ничего не делаем
        break;
    }
  }

  // ====== Moderation Rules ======

  async getRules() {
    return this.prisma.moderationRule.findMany({
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      include: {
        creator: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async createRule(dto: CreateRuleDto, userId: string) {
    return this.prisma.moderationRule.create({
      data: {
        ruleType: dto.ruleType,
        pattern: dto.pattern,
        action: dto.action,
        priority: dto.priority ?? 0,
        createdBy: userId,
      },
      include: {
        creator: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async updateRule(id: string, dto: UpdateRuleDto) {
    const rule = await this.prisma.moderationRule.findUnique({
      where: { id },
    });

    if (!rule) {
      throw new NotFoundException('Moderation rule not found');
    }

    return this.prisma.moderationRule.update({
      where: { id },
      data: {
        ...(dto.ruleType !== undefined && { ruleType: dto.ruleType }),
        ...(dto.pattern !== undefined && { pattern: dto.pattern }),
        ...(dto.action !== undefined && { action: dto.action }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: {
        creator: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async deleteRule(id: string) {
    const rule = await this.prisma.moderationRule.findUnique({
      where: { id },
    });

    if (!rule) {
      throw new NotFoundException('Moderation rule not found');
    }

    await this.prisma.moderationRule.delete({
      where: { id },
    });
  }

  // ====== Stats ======

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pending, approvedToday, total] = await Promise.all([
      this.prisma.moderationQueue.count({
        where: { status: 'pending' },
      }),
      this.prisma.moderationQueue.count({
        where: {
          status: 'approved',
          reviewedAt: { gte: today },
        },
      }),
      this.prisma.moderationQueue.count(),
    ]);

    return {
      pending,
      approvedToday,
      total,
      // Среднее время ответа (в часах) — на основе последних 100 обработанных
      avgResponseTimeHours: await this.calculateAvgResponseTime(),
    };
  }

  private async calculateAvgResponseTime(): Promise<number | null> {
    const reviewed = await this.prisma.moderationQueue.findMany({
      where: {
        reviewedAt: { not: null },
        status: { not: 'pending' },
      },
      orderBy: { reviewedAt: 'desc' },
      take: 100,
      select: {
        createdAt: true,
        reviewedAt: true,
      },
    });

    if (reviewed.length === 0) {
      return null;
    }

    const totalHours = reviewed.reduce((acc, item) => {
      const diffMs =
        (item.reviewedAt!.getTime() - item.createdAt.getTime());
      return acc + diffMs / 3_600_000;
    }, 0);

    return Math.round((totalHours / reviewed.length) * 100) / 100;
  }
}
