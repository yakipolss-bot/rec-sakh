import { Injectable, BadRequestException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { AuditService } from './audit.service.js';
import { ModerationService } from './moderation.service.js';
import { AnalyticsService } from './analytics.service.js';
import { SettingsService } from './settings.service.js';
import { StaffService } from './staff.service.js';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private moderationService: ModerationService,
    private analyticsService: AnalyticsService,
    private settingsService: SettingsService,
    private staffService: StaffService,
  ) {}

  async getDashboard() {
    const [health, analytics] = await Promise.all([
      this.getSystemHealth(),
      this.analyticsService.getDashboard(),
    ]);

    return {
      ...health,
      ...analytics,
      generatedAt: new Date().toISOString(),
    };
  }

  async getSystemHealth() {
    let databaseStatus = 'connected';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      databaseStatus = 'disconnected';
    }

    return {
      uptime: process.uptime(),
      memoryUsage: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        unit: 'MB',
      },
      apiStatus: 'healthy',
      databaseStatus,
      cacheStatus: 'not_configured',
      lastBackup: null,
      nodeVersion: process.version,
      platform: process.platform,
    };
  }

  async changeUserRole(userId: string, role: UserRole) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        updatedAt: true,
      },
    });
    return user;
  }

  async bulkNewsAction(
    action: string,
    ids: string[],
    value?: string,
  ) {
    switch (action) {
      case 'publish':
        await this.prisma.newsArticle.updateMany({
          where: { id: { in: ids } },
          data: { status: 'published', publishedAt: new Date() },
        });
        break;
      case 'archive':
        await this.prisma.newsArticle.updateMany({
          where: { id: { in: ids } },
          data: { status: 'archived' },
        });
        break;
      case 'delete':
        await this.prisma.newsArticle.updateMany({
          where: { id: { in: ids } },
          data: { deletedAt: new Date() },
        });
        break;
      case 'set_category':
        if (value) {
          await this.prisma.newsArticle.updateMany({
            where: { id: { in: ids } },
            data: { categoryId: value },
          });
        }
        break;
      default:
        throw new BadRequestException(`Unknown action: ${action}`);
    }

    return { message: `Bulk ${action} completed for ${ids.length} articles` };
  }
}
