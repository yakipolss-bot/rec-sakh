import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { AdminQueryDto } from './dto/admin-query.dto.js';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: AdminQueryDto) {
    const page = query.page ?? 1;
    const perPage = Math.min(query.perPage ?? 50, 100);

    const where: Record<string, any> = {};

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.action) {
      where.action = { contains: query.action, mode: 'insensitive' };
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
      this.prisma.auditLog.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
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

  async getStats() {
    // Статистика аудита: действия за последние 24 часа
    const last24h = new Date(Date.now() - 86_400_000);

    const [total, byAction, byUser] = await Promise.all([
      this.prisma.auditLog.count({
        where: { createdAt: { gte: last24h } },
      }),
      this.prisma.auditLog.groupBy({
        by: ['action'],
        where: { createdAt: { gte: last24h } },
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } },
        take: 20,
      }),
      this.prisma.auditLog.groupBy({
        by: ['userId'],
        where: {
          createdAt: { gte: last24h },
          userId: { not: null },
        },
        _count: { userId: true },
        orderBy: { _count: { userId: 'desc' } },
        take: 10,
      }),
    ]);

    return { total, byAction, byUser };
  }
}
