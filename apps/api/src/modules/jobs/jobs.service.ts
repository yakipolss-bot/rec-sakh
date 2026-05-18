import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { CreateJobDto } from './dto/create-job.dto.js';
import { UpdateJobDto } from './dto/update-job.dto.js';
import { JobsQueryDto } from './dto/jobs-query.dto.js';
import { JobResponseDto } from './dto/job-response.dto.js';
import { AdStatus, UserRole } from '@prisma/client';

const VALID_TRANSITIONS: Record<AdStatus, AdStatus[]> = {
  pending: [AdStatus.active, AdStatus.rejected],
  active: [AdStatus.archived],
  rejected: [],
  archived: [],
};

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: JobsQueryDto) {
    const page = parseInt(query.page || '1', 10);
    const perPage = Math.min(parseInt(query.perPage || '20', 10), 100);
    const skip = (page - 1) * perPage;

    const where: any = { deletedAt: null };

    if (query.type) {
      where.type = query.type;
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.city) {
      where.city = query.city;
    }

    if (query.schedule) {
      where.schedule = query.schedule;
    }

    if (query.salaryMin) {
      where.salaryMin = { ...where.salaryMin, gte: parseFloat(query.salaryMin) };
    }
    if (query.salaryMax) {
      where.salaryMax = { ...where.salaryMax, lte: parseFloat(query.salaryMax) };
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    let orderBy: any = { createdAt: 'desc' };
    if (query.sort === 'salary_asc') {
      orderBy = { salaryMin: 'asc' };
    } else if (query.sort === 'salary_desc') {
      orderBy = { salaryMin: 'desc' };
    }

    const [data, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        skip,
        take: perPage,
        orderBy,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          user: { select: { id: true, name: true, avatarUrl: true } },
          _count: { select: { responses: true } },
        },
      }),
      this.prisma.job.count({ where }),
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
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { responses: true } },
      },
    });

    if (!job || job.deletedAt) {
      throw new NotFoundException('Job not found');
    }

    return job;
  }

  async create(dto: CreateJobDto, userId: string) {
    return this.prisma.job.create({
      data: {
        type: dto.type,
        title: dto.title,
        description: dto.description,
        categoryId: dto.categoryId,
        userId,
        city: dto.city,
        salaryMin: dto.salaryMin,
        salaryMax: dto.salaryMax,
        currency: dto.currency || 'RUB',
        schedule: dto.schedule,
        experience: dto.experience,
        companyName: dto.companyName,
        contacts: (dto.contacts || {}) as any,
        status: 'pending',
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
  }

  async update(id: string, dto: UpdateJobDto, userId: string, userRole: UserRole) {
    const job = await this.prisma.job.findUnique({ where: { id } });

    if (!job || job.deletedAt) {
      throw new NotFoundException('Job not found');
    }

    if (
      job.userId !== userId &&
      !['editor', 'chief_editor', 'admin', 'superadmin'].includes(userRole)
    ) {
      throw new ForbiddenException('You can only edit your own jobs');
    }

    return this.prisma.job.update({
      where: { id },
      data: dto as any,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { responses: true } },
      },
    });
  }

  async remove(id: string, userId: string, userRole: UserRole) {
    const job = await this.prisma.job.findUnique({ where: { id } });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (
      job.userId !== userId &&
      !['editor', 'chief_editor', 'admin', 'superadmin'].includes(userRole)
    ) {
      throw new ForbiddenException('You can only delete your own jobs');
    }

    await this.prisma.job.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getResponses(jobId: string, userId: string, userRole: UserRole) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });

    if (!job || job.deletedAt) {
      throw new NotFoundException('Job not found');
    }

    if (
      job.userId !== userId &&
      !['editor', 'chief_editor', 'admin', 'superadmin'].includes(userRole)
    ) {
      throw new ForbiddenException('You can only view responses to your own jobs');
    }

    return this.prisma.jobResponse.findMany({
      where: { jobId },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async respond(jobId: string, dto: JobResponseDto, userId: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });

    if (!job || job.deletedAt) {
      throw new NotFoundException('Job not found');
    }

    return this.prisma.jobResponse.create({
      data: {
        jobId,
        userId,
        message: dto.message,
        resumeUrl: dto.resumeUrl,
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
  }

  async updateStatus(id: string, status: AdStatus) {
    const job = await this.prisma.job.findUnique({ where: { id } });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const allowed = VALID_TRANSITIONS[job.status as AdStatus];
    if (!allowed || !allowed.includes(status)) {
      throw new BadRequestException(
        `Cannot transition from ${job.status} to ${status}`,
      );
    }

    return this.prisma.job.update({
      where: { id },
      data: { status },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
  }

  async getStats() {
    const [total, vacancy, resume, byCategory, byCity] = await Promise.all([
      this.prisma.job.count({ where: { deletedAt: null } }),
      this.prisma.job.count({ where: { deletedAt: null, type: 'vacancy' } }),
      this.prisma.job.count({ where: { deletedAt: null, type: 'resume' } }),
      this.prisma.job.groupBy({
        by: ['categoryId'],
        where: { deletedAt: null },
        _count: { id: true },
      }),
      this.prisma.job.groupBy({
        by: ['city'],
        where: { deletedAt: null, city: { not: null } },
        _count: { id: true },
      }),
    ]);

    return {
      data: { total, vacancy, resume, byCategory, byCity },
    };
  }

  @Cron('0 0 * * *')
  async autoArchiveExpired() {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    await this.prisma.job.updateMany({
      where: {
        status: 'active',
        createdAt: { lt: sixtyDaysAgo },
      },
      data: { status: 'archived' },
    });
  }
}
