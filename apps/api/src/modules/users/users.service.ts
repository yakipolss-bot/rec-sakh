import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
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

    const { passwordHash, ...rest } = user;
    return {
      ...rest,
      stats: {
        adsCount: rest._count.ads,
        commentsCount: rest._count.comments,
        eventsCount: rest._count.events,
        newsCount: rest._count.newsArticles,
        jobsCount: rest._count.jobs,
        realtyCount: rest._count.realty,
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

    const payload = { sub: target.id, role: target.role };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '1h',
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '1d',
    });

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
      accessToken,
      refreshToken,
      user: {
        id: target.id,
        email: target.email,
        name: target.name,
        role: target.role,
      },
    };
  }

  async getSessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId },
      orderBy: { expiresAt: 'desc' },
      select: {
        id: true,
        expiresAt: true,
      },
    });
  }

  async deleteSession(userId: string, sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });
    if (!session || session.userId !== userId) {
      throw new NotFoundException('Session not found');
    }
    await this.prisma.session.delete({ where: { id: sessionId } });
  }

  async deleteAllSessions(userId: string) {
    await this.prisma.session.deleteMany({ where: { userId } });
  }
}
