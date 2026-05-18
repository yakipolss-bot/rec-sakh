import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { BalanceService } from './balance.service.js';
import { BillingService } from './billing.service.js';
import {
  PromotionPaymentDto,
  GetPromotionPriceDto,
  CreatePricingRuleDto,
  UpdatePricingRuleDto,
} from './dto/promotion-payment.dto.js';
import { PromoteLevel } from '@prisma/client';

@Injectable()
export class PromotionPaymentService {
  private readonly logger = new Logger(PromotionPaymentService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => BillingService))
    private billingService: BillingService,
    private balanceService: BalanceService,
  ) {}

  async getPromotionPrice(dto: GetPromotionPriceDto) {
    const rule = await this.prisma.pricingRule.findFirst({
      where: {
        entityType: dto.entityType,
        entityId: dto.entityId ?? null,
        level: dto.level,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!rule) {
      // Fallback: try to find a general rule without entityId
      const generalRule = await this.prisma.pricingRule.findFirst({
        where: {
          entityType: dto.entityType,
          entityId: null,
          level: dto.level,
          isActive: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!generalRule) {
        throw new NotFoundException('Правило ценообразования не найдено');
      }

      return {
        price: generalRule.price.toNumber(),
        durationDays: generalRule.durationDays,
        currency: generalRule.currency,
      };
    }

    return {
      price: rule.price.toNumber(),
      durationDays: rule.durationDays,
      currency: rule.currency,
    };
  }

  async payForPromotion(dto: PromotionPaymentDto, userId: string) {
    // Get price
    const priceInfo = await this.getPromotionPrice({
      entityType: dto.entityType,
      entityId: dto.entityId,
      level: dto.level,
    });

    // Validate entity exists
    await this.validateEntity(dto.entityType, dto.entityId, userId);

    if (dto.method === 'balance') {
      const canDeduct = await this.balanceService.deductBalance(
        userId,
        priceInfo.price,
        `Продвижение ${dto.entityType} #${dto.entityId}: ${dto.level}`,
      );

      if (!canDeduct) {
        throw new BadRequestException('Недостаточно средств на балансе');
      }

      const transaction = await this.prisma.billingTransaction.create({
        data: {
          userId,
          type: 'promotion',
          amount: priceInfo.price,
          method: 'yookassa',
          status: 'succeeded',
          description: `Продвижение ${dto.entityType} #${dto.entityId}: ${dto.level}`,
        },
      });

      await this.activatePromotion(dto, transaction.id);
      return { success: true, transactionId: transaction.id };
    }

    // Pay through gateway
    const paymentResult = await this.billingService.createPayment(
      {
        method: dto.method as any,
        amount: priceInfo.price,
        description: `Продвижение ${dto.entityType} #${dto.entityId}: ${dto.level}`,
        metadata: {
          type: 'promotion',
          entityType: dto.entityType,
          entityId: dto.entityId,
          level: dto.level,
          userId,
        },
      },
      userId,
    );

    return {
      success: true,
      paymentId: paymentResult.paymentId,
      confirmationUrl: paymentResult.confirmationUrl,
    };
  }

  private async validateEntity(
    entityType: string,
    entityId: string,
    userId: string,
  ): Promise<void> {
    switch (entityType) {
      case 'ad': {
        const ad = await this.prisma.ad.findUnique({ where: { id: entityId } });
        if (!ad) throw new NotFoundException('Объявление не найдено');
        if (ad.userId !== userId) throw new BadRequestException('Это не ваше объявление');
        break;
      }
      case 'event': {
        const event = await this.prisma.event.findUnique({ where: { id: entityId } });
        if (!event) throw new NotFoundException('Событие не найдено');
        if (event.organizerId !== userId) throw new BadRequestException('Это не ваше событие');
        break;
      }
      case 'job': {
        const job = await this.prisma.job.findUnique({ where: { id: entityId } });
        if (!job) throw new NotFoundException('Вакансия не найдена');
        if (job.userId !== userId) throw new BadRequestException('Это не ваша вакансия');
        break;
      }
      default:
        throw new BadRequestException(`Неизвестный тип сущности: ${entityType}`);
    }
  }

  async activatePromotion(dto: PromotionPaymentDto, transactionId: string): Promise<void> {
    const now = new Date();
    const durationDays = await this.getDurationDays(dto.entityType, dto.level);
    const endsAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    this.logger.log(
      `Activating promotion: ${dto.entityType} #${dto.entityId}, level=${dto.level}, endsAt=${endsAt}`,
    );

    switch (dto.entityType) {
      case 'ad':
        await this.prisma.adsPromotion.create({
          data: {
            adId: dto.entityId,
            level: dto.level as PromoteLevel,
            startsAt: now,
            endsAt,
            paymentId: transactionId,
          },
        });
        break;
      // TODO: EventPromotion and JobPromotion models when they are added to schema
      default:
        this.logger.warn(`Promotion activation for ${dto.entityType} not fully implemented`);
    }
  }

  private async getDurationDays(entityType: string, level: string): Promise<number> {
    const rule = await this.prisma.pricingRule.findFirst({
      where: {
        entityType,
        level,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return rule?.durationDays ?? 7;
  }

  // --- Admin: Pricing Rules ---

  async createPricingRule(dto: CreatePricingRuleDto) {
    this.logger.log(`Creating pricing rule: ${dto.entityType}/${dto.level} = ${dto.price} RUB`);
    return this.prisma.pricingRule.create({
      data: {
        entityType: dto.entityType,
        entityId: dto.entityId ?? null,
        level: dto.level ?? null,
        price: dto.price,
        durationDays: dto.durationDays,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updatePricingRule(id: string, dto: UpdatePricingRuleDto) {
    const rule = await this.prisma.pricingRule.findUnique({ where: { id } });
    if (!rule) {
      throw new NotFoundException('Правило ценообразования не найдено');
    }

    return this.prisma.pricingRule.update({
      where: { id },
      data: {
        ...(dto.entityType !== undefined && { entityType: dto.entityType }),
        ...(dto.entityId !== undefined && { entityId: dto.entityId }),
        ...(dto.level !== undefined && { level: dto.level }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.durationDays !== undefined && { durationDays: dto.durationDays }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async getPricingRules() {
    return this.prisma.pricingRule.findMany({
      orderBy: [{ entityType: 'asc' }, { level: 'asc' }],
    });
  }

  async deletePricingRule(id: string): Promise<void> {
    const rule = await this.prisma.pricingRule.findUnique({ where: { id } });
    if (!rule) {
      throw new NotFoundException('Правило ценообразования не найдено');
    }
    await this.prisma.pricingRule.delete({ where: { id } });
  }
}
