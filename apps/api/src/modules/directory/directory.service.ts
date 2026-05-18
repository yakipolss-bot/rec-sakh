import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { CreateDirectoryDto } from './dto/create-directory.dto.js';
import { UpdateDirectoryDto } from './dto/update-directory.dto.js';
import { DirectoryQueryDto } from './dto/directory-query.dto.js';
import { CreateReviewDto } from './dto/create-review.dto.js';

@Injectable()
export class DirectoryService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: DirectoryQueryDto) {
    const page = parseInt(query.page || '1', 10);
    const perPage = Math.min(parseInt(query.perPage || '20', 10), 100);
    const skip = (page - 1) * perPage;

    const where: any = { status: 'active' };

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.city) {
      where.city = query.city;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    let orderBy: any = { name: 'asc' };
    if (query.sort === 'rating') {
      orderBy = { avgRating: 'desc' };
    } else if (query.sort === 'reviews') {
      orderBy = { reviewsCount: 'desc' };
    }

    const [data, total] = await Promise.all([
      this.prisma.directoryOrganization.findMany({
        where,
        skip,
        take: perPage,
        orderBy,
        include: {
          category: { select: { id: true, name: true, slug: true } },
        },
      }),
      this.prisma.directoryOrganization.count({ where }),
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
    const org = await this.prisma.directoryOrganization.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        reviews: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!org || org.status === 'archived') {
      throw new NotFoundException('Organization not found');
    }

    return org;
  }

  async create(dto: CreateDirectoryDto, userId: string) {
    return this.prisma.directoryOrganization.create({
      data: {
        name: dto.name,
        description: dto.description,
        categoryId: dto.categoryId,
        city: dto.city,
        address: dto.address,
        phone: dto.phone,
        website: dto.website,
        email: dto.email,
        workingHours: (dto.workingHours || {}) as any,
        photos: (dto.photos || []) as any,
        status: 'pending',
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  async update(id: string, dto: UpdateDirectoryDto) {
    const org = await this.prisma.directoryOrganization.findUnique({
      where: { id },
    });

    if (!org || org.status === 'archived') {
      throw new NotFoundException('Organization not found');
    }

    return this.prisma.directoryOrganization.update({
      where: { id },
      data: dto as any,
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  async remove(id: string) {
    const org = await this.prisma.directoryOrganization.findUnique({
      where: { id },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    await this.prisma.directoryOrganization.update({
      where: { id },
      data: { status: 'archived' },
    });
  }

  async addReview(orgId: string, dto: CreateReviewDto, userId: string) {
    const org = await this.prisma.directoryOrganization.findUnique({
      where: { id: orgId },
    });

    if (!org || org.status === 'archived') {
      throw new NotFoundException('Organization not found');
    }

    const existing = await this.prisma.directoryReview.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId } },
    });

    if (existing) {
      throw new ConflictException('You have already reviewed this organization');
    }

    const review = await this.prisma.directoryReview.create({
      data: {
        organizationId: orgId,
        userId,
        rating: dto.rating,
        text: dto.text,
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    const agg = await this.prisma.directoryReview.aggregate({
      where: { organizationId: orgId },
      _avg: { rating: true },
      _count: true,
    });

    await this.prisma.directoryOrganization.update({
      where: { id: orgId },
      data: {
        avgRating: agg._avg.rating ?? 0,
        reviewsCount: agg._count,
      },
    });

    return review;
  }

  async getReviews(orgId: string) {
    const org = await this.prisma.directoryOrganization.findUnique({
      where: { id: orgId },
    });

    if (!org || org.status === 'archived') {
      throw new NotFoundException('Organization not found');
    }

    return this.prisma.directoryReview.findMany({
      where: { organizationId: orgId },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
