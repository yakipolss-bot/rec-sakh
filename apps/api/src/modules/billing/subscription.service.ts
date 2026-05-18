import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { SubscribeDto } from './dto/subscription.dto.js';
import { TariffService } from './tariff.service.js';
import { BillingService } from './billing.service.js';
import { BalanceService } from './balance.service.js';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    private prisma: PrismaService,
    private tariffService: TariffService,
    @Inject(forwardRef(() => BillingService))
    private billingService: BillingService,
    private balanceService: BalanceService,
  ) {}

  private calculatePeriodEnd(interval: string): Date {
    const now = new Date();
    switch (interval) {
      case 'month':
        return new Date(now.setMonth(now.getMonth() + 1));
      case 'quarter':
        return new Date(now.setMonth(now.getMonth() + 3));
      case 'year':
        return new Date(now.setFullYear(now.getFullYear() + 1));
      default:
        return new Date(now.setMonth(now.getMonth() + 1));
    }
  }

  async subscribe(userId: string, dto: SubscribeDto) {
    const tariff = await this.tariffService.getTariffById(dto.tariffId);
    const price = tariff.price.toNumber();

    // Check if already subscribed
    const existingSub = await this.getActiveSubscription(userId);
    if (existingSub) {
      throw new BadRequestException('У вас уже есть активная подписка');
    }

    if (dto.method === 'balance') {
      // Pay with internal balance
      const canDeduct = await this.balanceService.deductBalance(
        userId,
        price,
        `Подписка: ${tariff.name}`,
      );

      if (!canDeduct) {
        throw new BadRequestException('Недостаточно средств на балансе');
      }

      const transaction = await this.prisma.billingTransaction.create({
        data: {
          userId,
          type: 'subscription',
          amount: price,
          method: 'yookassa',
          status: 'succeeded',
          description: `Подписка: ${tariff.name}`,
        },
      });

      await this.activateSubscription(userId, tariff.id, transaction.id);
      return { success: true, transactionId: transaction.id };
    }

    // Pay through payment gateway
    const paymentResult = await this.billingService.createPayment(
      {
        method: dto.method as any,
        amount: price,
        description: `Подписка: ${tariff.name}`,
        metadata: {
          type: 'subscription',
          tariffId: tariff.id,
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

  async activateSubscription(
    userId: string,
    tariffId: string,
    transactionId: string,
  ): Promise<void> {
    const tariff = await this.tariffService.getTariffById(tariffId);
    const periodEnd = this.calculatePeriodEnd(tariff.interval);

    this.logger.log(
      `Activating subscription: userId=${userId}, tariffId=${tariffId}, periodEnd=${periodEnd}`,
    );

    // Create subscription
    await this.prisma.billingSubscription.create({
      data: {
        userId,
        tariffId,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
      },
    });

    // Update user
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isSubscribed: true,
        subscriptionExpiresAt: periodEnd,
      },
    });
  }

  async cancelSubscription(userId: string, subscriptionId: string): Promise<void> {
    const subscription = await this.prisma.billingSubscription.findFirst({
      where: { id: subscriptionId, userId },
    });

    if (!subscription) {
      throw new NotFoundException('Подписка не найдена');
    }

    if (subscription.status !== 'active') {
      throw new BadRequestException('Подписка уже отменена или неактивна');
    }

    this.logger.log(`Canceling subscription: ${subscriptionId} for user ${userId}`);

    await this.prisma.billingSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'canceled',
        canceledAt: new Date(),
      },
    });
  }

  async getActiveSubscription(userId: string) {
    return this.prisma.billingSubscription.findFirst({
      where: {
        userId,
        status: 'active',
        currentPeriodEnd: { gte: new Date() },
      },
      include: { tariff: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async checkExpiredSubscriptions(): Promise<void> {
    const now = new Date();
    this.logger.log('Checking expired subscriptions...');

    const expired = await this.prisma.billingSubscription.findMany({
      where: {
        status: 'active',
        currentPeriodEnd: { lt: now },
      },
    });

    for (const sub of expired) {
      this.logger.log(`Subscription expired: ${sub.id} for user ${sub.userId}`);
      await this.prisma.billingSubscription.update({
        where: { id: sub.id },
        data: { status: 'expired' },
      });

      // Check if user has other active subscriptions
      const otherActive = await this.prisma.billingSubscription.findFirst({
        where: {
          userId: sub.userId,
          status: 'active',
          currentPeriodEnd: { gte: now },
          id: { not: sub.id },
        },
      });

      if (!otherActive) {
        await this.prisma.user.update({
          where: { id: sub.userId },
          data: { isSubscribed: false, subscriptionExpiresAt: null },
        });
      }
    }

    this.logger.log(`Expired ${expired.length} subscriptions`);
  }

  async autoRenew(): Promise<void> {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    this.logger.log('Checking subscriptions for auto-renewal...');

    const dueForRenewal = await this.prisma.billingSubscription.findMany({
      where: {
        status: 'active',
        currentPeriodEnd: {
          gte: now,
          lte: tomorrow,
        },
      },
      include: { tariff: true },
    });

    for (const sub of dueForRenewal) {
      const price = sub.tariff.price.toNumber();
      this.logger.log(
        `Attempting auto-renewal for subscription ${sub.id}, user ${sub.userId}, price ${price}`,
      );

      try {
        await this.balanceService.deductBalance(
          sub.userId,
          price,
          `Автопродление подписки: ${sub.tariff.name}`,
        );

        const newPeriodEnd = this.calculatePeriodEnd(sub.tariff.interval);
        await this.prisma.billingSubscription.update({
          where: { id: sub.id },
          data: {
            currentPeriodStart: new Date(),
            currentPeriodEnd: newPeriodEnd,
          },
        });

        await this.prisma.user.update({
          where: { id: sub.userId },
          data: {
            isSubscribed: true,
            subscriptionExpiresAt: newPeriodEnd,
          },
        });

        await this.prisma.billingTransaction.create({
          data: {
            userId: sub.userId,
            type: 'subscription',
            amount: price,
            method: 'yookassa',
            status: 'succeeded',
            description: `Автопродление подписки: ${sub.tariff.name}`,
          },
        });

        this.logger.log(`Auto-renewal successful for subscription ${sub.id}`);
      } catch (error: any) {
        this.logger.warn(
          `Auto-renewal failed for subscription ${sub.id}: ${error.message}`,
        );
      }
    }
  }
}
