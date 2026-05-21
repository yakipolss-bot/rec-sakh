import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { SupabaseService } from '../../common/supabase/supabase.service.js';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private supabase: SupabaseService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        avatarUrl: true,
        bio: true,
        karma: true,
        level: true,
        isPhoneVerified: true,
        isEmailVerified: true,
        createdAt: true,
        settings: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        avatarUrl: true,
        bio: true,
        updatedAt: true,
      },
    });
  }

  async findAll(query: any) {
    const { page, perPage, role, status, city, search } = query;
    const skip = (page - 1) * perPage;

    const where: any = { deletedAt: null };

    if (role) where.role = role;
    if (status) where.status = status;
    if (city) where.city = city;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: perPage,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          status: true,
          avatarUrl: true,
          karma: true,
          level: true,
          isPhoneVerified: true,
          isEmailVerified: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        settings: true,
        _count: {
          select: {
            newsArticles: true,
            comments: true,
            events: true,
            ads: true,
            jobs: true,
            realty: true,
          },
        },
      },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found');
    }

    const { _count, ...rest } = user;
    return {
      ...rest,
      stats: {
        adsCount: _count.ads,
        commentsCount: _count.comments,
        eventsCount: _count.events,
        newsCount: _count.newsArticles,
        jobsCount: _count.jobs,
        realtyCount: _count.realty,
      },
    };
  }

  async updateUser(id: string, dto: any) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        isPhoneVerified: true,
        isEmailVerified: true,
        updatedAt: true,
      },
    });
  }

  async blockUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id },
      data: {
        status: 'deleted',
        deletedAt: new Date(),
      },
    });
  }

  async impersonate(id: string, adminId: string) {
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target || target.deletedAt) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'impersonate',
        entityType: 'user',
        entityId: id,
        changes: { impersonatedUser: target.email },
      },
    });

    return {
      user: {
        id: target.id,
        email: target.email,
        name: target.name,
        role: target.role,
      },
    };
  }

  async getActivity(userId: string) {
    const logs = await this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return logs.map((log) => ({
      id: log.id,
      type: this.mapActionToActivityType(log.action),
      description: `${log.action} ${log.entityType}`,
      date: log.createdAt,
      link: log.entityId ? `/${log.entityType}/${log.entityId}` : undefined,
    }));
  }

  private mapActionToActivityType(action: string): string {
    const map: Record<string, string> = {
      create: 'comment',
      comment: 'comment',
      login: 'login',
      subscribe: 'subscription',
      favorite: 'favorite',
      ad_create: 'ad',
    };
    return map[action] || 'comment';
  }

  async getBilling(userId: string) {
    const transactions = await this.prisma.billingTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return transactions.map((tx) => ({
      id: tx.id,
      type: tx.type,
      method: tx.method || 'card',
      amount: Number(tx.amount),
      status: tx.status,
      date: tx.createdAt,
      description: tx.description || `${tx.type} transaction`,
    }));
  }

  async getSubscriptions(userId: string) {
    return this.prisma.userContentSubscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addSubscription(userId: string, type: string, value: string) {
    const existing = await this.prisma.userContentSubscription.findUnique({
      where: { userId_type_value: { userId, type, value } },
    });
    if (existing) {
      throw new BadRequestException('Subscription already exists');
    }
    return this.prisma.userContentSubscription.create({
      data: { userId, type, value },
    });
  }

  async removeSubscription(userId: string, subscriptionId: string) {
    const sub = await this.prisma.userContentSubscription.findFirst({
      where: { id: subscriptionId, userId },
    });
    if (!sub) {
      throw new NotFoundException('Subscription not found');
    }
    await this.prisma.userContentSubscription.delete({
      where: { id: subscriptionId },
    });
  }

  async changePassword(userId: string, accessToken: string, oldPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    try {
      await this.supabase.updatePassword(accessToken, newPassword);
    } catch {
      throw new BadRequestException('Failed to change password');
    }
  }

  async uploadAvatar(userId: string, fileBuffer: Buffer, mimeType: string, extension: string): Promise<string> {
    const filename = `${randomUUID()}${extension}`;
    const filepath = join(process.cwd(), 'uploads', 'avatars', filename);
    await writeFile(filepath, fileBuffer);
    const url = `/uploads/avatars/${filename}`;
    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: url },
    });
    return url;
  }
}
