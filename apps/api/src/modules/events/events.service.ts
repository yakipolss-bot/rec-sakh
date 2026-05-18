import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { CreateEventDto } from './dto/create-event.dto.js';
import { UpdateEventDto } from './dto/update-event.dto.js';
import { EventsQueryDto } from './dto/events-query.dto.js';
import { EventStatus, UserRole } from '@prisma/client';

const VALID_TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  draft: [EventStatus.published],
  published: [EventStatus.cancelled, EventStatus.completed, EventStatus.archived],
  cancelled: [EventStatus.archived],
  completed: [],
  archived: [],
};

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: EventsQueryDto) {
    const page = parseInt(query.page || '1', 10);
    const perPage = Math.min(parseInt(query.perPage || '20', 10), 100);
    const skip = (page - 1) * perPage;

    const where: any = { deletedAt: null };

    if (query.status) {
      where.status = query.status;
    } else {
      where.status = 'published';
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.city) {
      where.city = query.city;
    }

    if (query.isFree === 'true') {
      where.isFree = true;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.dateFrom) {
      where.startDate = { ...where.startDate, gte: new Date(query.dateFrom) };
    }
    if (query.dateTo) {
      where.endDate = { ...where.endDate, lte: new Date(query.dateTo) };
    }

    let orderBy: any = { startDate: 'asc' };
    if (query.sort === 'created') {
      orderBy = { createdAt: 'desc' };
    } else if (query.sort === 'title') {
      orderBy = { title: 'asc' };
    }

    const [data, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        skip,
        take: perPage,
        orderBy,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          organizer: { select: { id: true, name: true, avatarUrl: true } },
        },
      }),
      this.prisma.event.count({ where }),
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
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        organizer: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    if (!event || event.deletedAt) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  async create(dto: CreateEventDto, userId: string) {
    return this.prisma.event.create({
      data: {
        title: dto.title,
        description: dto.description,
        shortDescription: dto.shortDescription,
        categoryId: dto.categoryId,
        organizerId: userId,
        city: dto.city,
        venueName: dto.venueName,
        venueAddress: dto.venueAddress,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        isFree: dto.isFree ?? true,
        price: dto.price,
        currency: dto.currency || 'RUB',
        imageUrl: dto.imageUrl,
        status: 'draft',
        isRecurring: dto.isRecurring,
        recurrenceRule: dto.recurrenceRule,
        maxParticipants: dto.maxParticipants,
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        organizer: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
  }

  async update(id: string, dto: UpdateEventDto, userId: string, userRole: UserRole) {
    const event = await this.prisma.event.findUnique({ where: { id } });

    if (!event || event.deletedAt) {
      throw new NotFoundException('Event not found');
    }

    if (
      event.organizerId !== userId &&
      !['editor', 'chief_editor', 'admin', 'superadmin'].includes(userRole)
    ) {
      throw new ForbiddenException('You can only edit your own events');
    }

    const data: any = { ...dto };
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    if (dto.endDate) data.endDate = new Date(dto.endDate);

    return this.prisma.event.update({
      where: { id },
      data,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        organizer: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
  }

  async remove(id: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    await this.prisma.event.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async updateStatus(id: string, status: EventStatus) {
    const event = await this.prisma.event.findUnique({ where: { id } });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const allowed = VALID_TRANSITIONS[event.status as EventStatus];
    if (!allowed || !allowed.includes(status)) {
      throw new BadRequestException(
        `Cannot transition from ${event.status} to ${status}`,
      );
    }

    return this.prisma.event.update({
      where: { id },
      data: { status },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        organizer: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
  }

  async getCalendar(year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    const events = await this.prisma.event.findMany({
      where: {
        status: 'published',
        startDate: { gte: start, lte: end },
        deletedAt: null,
      },
      orderBy: { startDate: 'asc' },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        organizer: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    const grouped: Record<number, typeof events> = {};
    for (const event of events) {
      const day = event.startDate.getDate();
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(event);
    }

    return { data: grouped };
  }

  async subscribe(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });

    if (!event || event.deletedAt) {
      throw new NotFoundException('Event not found');
    }

    if (event.maxParticipants) {
      const count = await this.prisma.eventSubscription.count({
        where: { eventId },
      });
      if (count >= event.maxParticipants) {
        throw new BadRequestException('Event is full');
      }
    }

    const existing = await this.prisma.eventSubscription.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });

    if (existing) {
      throw new ConflictException('Already subscribed to this event');
    }

    const subscription = await this.prisma.eventSubscription.create({
      data: { eventId, userId },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    return { data: subscription };
  }

  async unsubscribe(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });

    if (!event || event.deletedAt) {
      throw new NotFoundException('Event not found');
    }

    const existing = await this.prisma.eventSubscription.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });

    if (!existing) {
      throw new NotFoundException('Subscription not found');
    }

    await this.prisma.eventSubscription.delete({
      where: { eventId_userId: { eventId, userId } },
    });

    return { data: { message: 'Unsubscribed successfully' } };
  }

  async getSubscribers(eventId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });

    if (!event || event.deletedAt) {
      throw new NotFoundException('Event not found');
    }

    const subscribers = await this.prisma.eventSubscription.findMany({
      where: { eventId },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { data: subscribers };
  }

  @Cron('0 0 * * *')
  async autoArchiveExpired() {
    await this.prisma.event.updateMany({
      where: {
        status: 'published',
        endDate: { lt: new Date() },
      },
      data: { status: 'archived' },
    });
  }
}
