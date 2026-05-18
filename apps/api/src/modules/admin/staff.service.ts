import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { AdminQueryDto } from './dto/admin-query.dto.js';
import { CreateStaffDto, UpdateStaffDto } from './dto/staff.dto.js';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: AdminQueryDto) {
    const page = query.page ?? 1;
    const perPage = Math.min(query.perPage ?? 50, 100);

    const where: Record<string, any> = {
      isActive: query.status !== 'inactive',
    };

    if (query.status === 'inactive') {
      where.isActive = false;
    } else if (query.status && query.status !== 'active') {
      where.position = query.status;
    }

    if (query.search) {
      where.OR = [
        { user: { name: { contains: query.search, mode: 'insensitive' } } },
        {
          user: { email: { contains: query.search, mode: 'insensitive' } },
        },
        { position: { contains: query.search, mode: 'insensitive' } },
        { department: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.staffMember.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
              role: true,
              status: true,
              karma: true,
              level: true,
            },
          },
        },
      }),
      this.prisma.staffMember.count({ where }),
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

  async findById(id: string) {
    const staff = await this.prisma.staffMember.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
            bio: true,
            role: true,
            status: true,
            karma: true,
            level: true,
            createdAt: true,
          },
        },
      },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    return staff;
  }

  async create(dto: CreateStaffDto) {
    // Проверяем, что пользователь существует
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Проверяем, что пользователь ещё не в штате
    const existing = await this.prisma.staffMember.findUnique({
      where: { userId: dto.userId },
    });

    if (existing) {
      throw new ConflictException('User is already a staff member');
    }

    return this.prisma.staffMember.create({
      data: {
        userId: dto.userId,
        position: dto.position,
        department: dto.department ?? null,
        schedule: (dto.schedule ?? {}) as any,
        permissions: (dto.permissions ?? []) as any,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    });
  }

  async update(id: string, dto: UpdateStaffDto) {
    const staff = await this.prisma.staffMember.findUnique({
      where: { id },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    const data: Record<string, any> = {};

    if (dto.position !== undefined) data.position = dto.position;
    if (dto.department !== undefined) data.department = dto.department;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.kpiScore !== undefined) data.kpiScore = dto.kpiScore;
    if (dto.schedule !== undefined) data.schedule = dto.schedule as any;
    if (dto.permissions !== undefined)
      data.permissions = dto.permissions as any;

    return this.prisma.staffMember.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    });
  }

  async delete(id: string) {
    const staff = await this.prisma.staffMember.findUnique({
      where: { id },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    // Удаляем из штата, пользователь остаётся
    await this.prisma.staffMember.delete({
      where: { id },
    });
  }

  async updateKpi(id: string, score: number) {
    const staff = await this.prisma.staffMember.findUnique({
      where: { id },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    return this.prisma.staffMember.update({
      where: { id },
      data: { kpiScore: score },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
  }
}
