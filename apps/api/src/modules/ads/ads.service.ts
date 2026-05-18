import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { CreateAdDto } from './dto/create-ad.dto.js';
import { UpdateAdDto } from './dto/update-ad.dto.js';
import { AdsQueryDto } from './dto/ads-query.dto.js';
import { PromoteAdDto } from './dto/promote-ad.dto.js';
import { AdStatus, UserRole } from '@prisma/client';

const VALID_TRANSITIONS: Record<AdStatus, AdStatus[]> = {
  pending: [AdStatus.active, AdStatus.rejected],
  active: [AdStatus.archived],
  rejected: [AdStatus.pending],
  archived: [],
};

@Injectable()
export class AdsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: AdsQueryDto) {
    const page = parseInt(query.page || '1', 10);
    const perPage = Math.min(parseInt(query.perPage || '20', 10), 100);
    const skip = (page - 1) * perPage;

    const where: any = { deletedAt: null };

    if (query.status) {
      where.status = query.status;
    } else {
      where.status = 'active';
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.city) {
      where.city = query.city;
    }

    if (query.priceMin) {
      where.price = { ...where.price, gte: parseFloat(query.priceMin) };
    }
    if (query.priceMax) {
      where.price = { ...where.price, lte: parseFloat(query.priceMax) };
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    let orderBy: any = { createdAt: 'desc' };
    if (query.sort === 'price_asc') {
      orderBy = { price: 'asc' };
    } else if (query.sort === 'price_desc') {
      orderBy = { price: 'desc' };
    } else if (query.sort === 'views') {
      orderBy = { viewsCount: 'desc' };
    }

    const [data, total] = await Promise.all([
      this.prisma.ad.findMany({
        where,
        skip,
        take: perPage,
        orderBy,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      }),
      this.prisma.ad.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
        requestId: '',
        timestamp: new Date().toISOString(),
      },
    };
  }

  async findById(id: string) {
    const ad = await this.prisma.ad.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    if (!ad || ad.deletedAt) {
      throw new NotFoundException('Ad not found');
    }

    await this.prisma.ad.update({
      where: { id },
      data: { viewsCount: { increment: 1 } },
    });

    return ad;
  }

  async create(dto: CreateAdDto, userId: string) {
    return this.prisma.ad.create({
      data: {
        title: dto.title,
        description: dto.description,
        categoryId: dto.categoryId,
        userId,
        city: dto.city,
        price: dto.price,
        condition: dto.condition,
        phone: dto.phone,
        images: dto.images || [],
        status: 'pending',
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
  }

  async update(id: string, dto: UpdateAdDto, userId: string, userRole: UserRole) {
    const ad = await this.prisma.ad.findUnique({ where: { id } });

    if (!ad || ad.deletedAt) {
      throw new NotFoundException('Ad not found');
    }

    if (
      ad.userId !== userId &&
      !['editor', 'chief_editor', 'admin', 'superadmin'].includes(userRole)
    ) {
      throw new ForbiddenException('You can only edit your own ads');
    }

    return this.prisma.ad.update({
      where: { id },
      data: dto as any,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
  }

  async remove(id: string, userId: string, userRole: UserRole) {
    const ad = await this.prisma.ad.findUnique({ where: { id } });

    if (!ad) {
      throw new NotFoundException('Ad not found');
    }

    if (
      ad.userId !== userId &&
      !['editor', 'chief_editor', 'admin', 'superadmin'].includes(userRole)
    ) {
      throw new ForbiddenException('You can only delete your own ads');
    }

    await this.prisma.ad.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async updateStatus(id: string, status: AdStatus) {
    const ad = await this.prisma.ad.findUnique({ where: { id } });

    if (!ad) {
      throw new NotFoundException('Ad not found');
    }

    const allowed = VALID_TRANSITIONS[ad.status as AdStatus];
    if (!allowed || !allowed.includes(status)) {
      throw new BadRequestException(
        `Cannot transition from ${ad.status} to ${status}`,
      );
    }

    return this.prisma.ad.update({
      where: { id },
      data: { status },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
  }

  async getPromotions(id: string) {
    const ad = await this.prisma.ad.findUnique({ where: { id } });

    if (!ad || ad.deletedAt) {
      throw new NotFoundException('Ad not found');
    }

    const promotions = await this.prisma.adsPromotion.findMany({
      where: { adId: id },
      orderBy: { createdAt: 'desc' },
    });

    return { data: promotions };
  }

  async promote(id: string, dto: PromoteAdDto, userId: string) {
    const ad = await this.prisma.ad.findUnique({ where: { id } });

    if (!ad || ad.deletedAt) {
      throw new NotFoundException('Ad not found');
    }

    if (ad.userId !== userId) {
      throw new ForbiddenException('You can only promote your own ads');
    }

    const startsAt = new Date();
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + dto.durationDays);

    const promotion = await this.prisma.adsPromotion.create({
      data: {
        adId: id,
        level: dto.level,
        startsAt,
        endsAt,
      },
    });

    return { data: promotion };
  }

  async getStats() {
    const [total, active, pending, rejected, archived, byCategory] = await Promise.all([
      this.prisma.ad.count({ where: { deletedAt: null } }),
      this.prisma.ad.count({ where: { deletedAt: null, status: 'active' } }),
      this.prisma.ad.count({ where: { deletedAt: null, status: 'pending' } }),
      this.prisma.ad.count({ where: { deletedAt: null, status: 'rejected' } }),
      this.prisma.ad.count({ where: { deletedAt: null, status: 'archived' } }),
      this.prisma.ad.groupBy({
        by: ['categoryId'],
        where: { deletedAt: null },
        _count: { id: true },
      }),
    ]);

    return {
      data: { total, active, pending, rejected, archived, byCategory },
    };
  }

  @Cron('0 0 * * *')
  async autoArchiveExpired() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    await this.prisma.ad.updateMany({
      where: {
        status: 'active',
        createdAt: { lt: thirtyDaysAgo },
      },
      data: { status: 'archived' },
    });
  }
}
