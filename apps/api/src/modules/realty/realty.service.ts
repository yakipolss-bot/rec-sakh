import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { CreateRealtyDto } from './dto/create-realty.dto.js';
import { UpdateRealtyDto } from './dto/update-realty.dto.js';
import { RealtyQueryDto } from './dto/realty-query.dto.js';
import { AdStatus, UserRole } from '@prisma/client';

const VALID_TRANSITIONS: Record<AdStatus, AdStatus[]> = {
  pending: [AdStatus.active, AdStatus.rejected],
  active: [AdStatus.archived],
  rejected: [],
  archived: [],
};

@Injectable()
export class RealtyService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: RealtyQueryDto) {
    const page = parseInt(query.page || '1', 10);
    const perPage = Math.min(parseInt(query.perPage || '20', 10), 100);
    const skip = (page - 1) * perPage;

    const where: any = { deletedAt: null };

    if (query.type) {
      where.type = query.type;
    }

    if (query.city) {
      where.city = query.city;
    }

    if (query.rooms) {
      where.rooms = parseInt(query.rooms, 10);
    }

    if (query.floor) {
      where.floor = parseInt(query.floor, 10);
    }

    if (query.houseType) {
      where.houseType = query.houseType;
    }

    if (query.priceMin) {
      where.price = { ...where.price, gte: parseFloat(query.priceMin) };
    }
    if (query.priceMax) {
      where.price = { ...where.price, lte: parseFloat(query.priceMax) };
    }

    let orderBy: any = { createdAt: 'desc' };
    if (query.sort === 'price_asc') {
      orderBy = { price: 'asc' };
    } else if (query.sort === 'price_desc') {
      orderBy = { price: 'desc' };
    } else if (query.sort === 'date') {
      orderBy = { createdAt: 'desc' };
    }

    const [data, total] = await Promise.all([
      this.prisma.realty.findMany({
        where,
        skip,
        take: perPage,
        orderBy,
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      }),
      this.prisma.realty.count({ where }),
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
    const realty = await this.prisma.realty.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    if (!realty || realty.deletedAt) {
      throw new NotFoundException('Realty not found');
    }

    return realty;
  }

  async create(dto: CreateRealtyDto, userId: string) {
    return this.prisma.realty.create({
      data: {
        type: dto.type,
        title: dto.title,
        description: dto.description,
        userId,
        city: dto.city,
        district: dto.district,
        address: dto.address,
        price: dto.price,
        currency: dto.currency || 'RUB',
        rooms: dto.rooms,
        areaTotal: dto.areaTotal,
        areaLiving: dto.areaLiving,
        floor: dto.floor,
        floorsTotal: dto.floorsTotal,
        houseType: dto.houseType,
        constructionYear: dto.constructionYear,
        condition: dto.condition,
        landArea: dto.landArea,
        images: dto.images || [],
        phone: dto.phone,
        status: 'pending',
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
  }

  async update(id: string, dto: UpdateRealtyDto, userId: string, userRole: UserRole) {
    const realty = await this.prisma.realty.findUnique({ where: { id } });

    if (!realty || realty.deletedAt) {
      throw new NotFoundException('Realty not found');
    }

    if (
      realty.userId !== userId &&
      !['editor', 'chief_editor', 'admin', 'superadmin'].includes(userRole)
    ) {
      throw new ForbiddenException('You can only edit your own realty listings');
    }

    return this.prisma.realty.update({
      where: { id },
      data: dto as any,
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
  }

  async remove(id: string, userId: string, userRole: UserRole) {
    const realty = await this.prisma.realty.findUnique({ where: { id } });

    if (!realty) {
      throw new NotFoundException('Realty not found');
    }

    if (
      realty.userId !== userId &&
      !['editor', 'chief_editor', 'admin', 'superadmin'].includes(userRole)
    ) {
      throw new ForbiddenException('You can only delete your own realty listings');
    }

    await this.prisma.realty.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async updateStatus(id: string, status: AdStatus) {
    const realty = await this.prisma.realty.findUnique({ where: { id } });

    if (!realty) {
      throw new NotFoundException('Realty not found');
    }

    const allowed = VALID_TRANSITIONS[realty.status as AdStatus];
    if (!allowed || !allowed.includes(status)) {
      throw new BadRequestException(
        `Cannot transition from ${realty.status} to ${status}`,
      );
    }

    return this.prisma.realty.update({
      where: { id },
      data: { status },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
  }

  async getStats() {
    const [total, byType, byCity] = await Promise.all([
      this.prisma.realty.count({ where: { deletedAt: null } }),
      this.prisma.realty.groupBy({
        by: ['type'],
        where: { deletedAt: null },
        _count: { id: true },
      }),
      this.prisma.realty.groupBy({
        by: ['city'],
        where: { deletedAt: null, city: { not: null } },
        _count: { id: true },
      }),
    ]);

    return {
      data: { total, byType, byCity },
    };
  }

  @Cron('0 0 * * *')
  async autoArchiveExpired() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    await this.prisma.realty.updateMany({
      where: {
        status: 'active',
        createdAt: { lt: thirtyDaysAgo },
      },
      data: { status: 'archived' },
    });
  }
}
