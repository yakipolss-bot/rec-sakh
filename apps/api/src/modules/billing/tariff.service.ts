import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { CreateTariffDto, UpdateTariffDto } from './dto/tariff.dto.js';
import { BillingTariff } from '@prisma/client';

@Injectable()
export class TariffService {
  private readonly logger = new Logger(TariffService.name);

  constructor(private prisma: PrismaService) {}

  async getActiveTariffs(): Promise<BillingTariff[]> {
    return this.prisma.billingTariff.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getAllTariffs(): Promise<BillingTariff[]> {
    return this.prisma.billingTariff.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getTariffById(id: string): Promise<BillingTariff> {
    const tariff = await this.prisma.billingTariff.findUnique({
      where: { id },
    });
    if (!tariff) {
      throw new NotFoundException('Тариф не найден');
    }
    return tariff;
  }

  async create(dto: CreateTariffDto): Promise<BillingTariff> {
    this.logger.log(`Creating tariff: ${dto.name} (${dto.price} RUB / ${dto.interval})`);
    return this.prisma.billingTariff.create({
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        interval: dto.interval,
        features: dto.features ?? [],
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async update(id: string, dto: UpdateTariffDto): Promise<BillingTariff> {
    await this.getTariffById(id);
    this.logger.log(`Updating tariff: ${id}`);
    return this.prisma.billingTariff.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.interval !== undefined && { interval: dto.interval }),
        ...(dto.features !== undefined && { features: dto.features }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.getTariffById(id);
    this.logger.log(`Deleting tariff: ${id}`);
    await this.prisma.billingTariff.delete({ where: { id } });
  }

  async seedDefaults(): Promise<void> {
    const count = await this.prisma.billingTariff.count();
    if (count > 0) {
      this.logger.log('Default tariffs already seeded, skipping');
      return;
    }

    this.logger.log('Seeding default tariffs');
    await this.prisma.billingTariff.createMany({
      data: [
        {
          name: 'Sakhcom+ Monthly',
          description: 'Премиум на месяц — без рекламы, эксклюзивные материалы, приоритетная поддержка',
          price: 299,
          currency: 'RUB',
          interval: 'month' as any,
          features: ['Без рекламы', 'Эксклюзивные материалы', 'Приоритетная поддержка', 'Ранний доступ к новым функциям', 'Специальный значок'],
          sortOrder: 1,
          isActive: true,
        },
        {
          name: 'Sakhcom+ Quarterly',
          description: 'Премиум на 3 месяца — без рекламы, эксклюзивные материалы, приоритетная поддержка',
          price: 699,
          currency: 'RUB',
          interval: 'quarter' as any,
          features: ['Без рекламы', 'Эксклюзивные материалы', 'Приоритетная поддержка', 'Ранний доступ к новым функциям', 'Специальный значок'],
          sortOrder: 2,
          isActive: true,
        },
        {
          name: 'Sakhcom+ Annual',
          description: 'Премиум на год — без рекламы, эксклюзивные материалы, приоритетная поддержка',
          price: 1999,
          currency: 'RUB',
          interval: 'year' as any,
          features: ['Без рекламы', 'Эксклюзивные материалы', 'Приоритетная поддержка', 'Ранний доступ к новым функциям', 'Специальный значок'],
          sortOrder: 3,
          isActive: true,
        },
      ],
      skipDuplicates: true,
    });
    this.logger.log('Default tariffs seeded successfully');
  }
}
