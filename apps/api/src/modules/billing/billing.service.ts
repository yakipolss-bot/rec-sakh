import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { YooKassaService } from './yookassa.service.js';
import { SbpService } from './sbp.service.js';
import { CryptoService } from './crypto.service.js';
import { BalanceService } from './balance.service.js';
import { InvoiceService } from './invoice.service.js';
import { SubscriptionService } from './subscription.service.js';
import { PromotionPaymentService } from './promotion-payment.service.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { BillingQueryDto } from './dto/billing-query.dto.js';
import { PaymentGateway } from './providers/payment-gateway.interface.js';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

export interface BillingStats {
  totalRevenue: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  revenueByType: Record<string, number>;
  recentTransactions: number;
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private gateways: Record<string, PaymentGateway>;

  constructor(
    private prisma: PrismaService,
    private yookassa: YooKassaService,
    private sbp: SbpService,
    private crypto: CryptoService,
    private balanceService: BalanceService,
    private invoiceService: InvoiceService,
    @Inject(forwardRef(() => SubscriptionService))
    private subscriptionService: SubscriptionService,
    private promotionPaymentService: PromotionPaymentService,
  ) {
    this.gateways = {
      yookassa: this.yookassa,
      sbp: this.sbp,
      crypto: this.crypto,
    };
  }

  private getGateway(method: string): PaymentGateway {
    const gateway = this.gateways[method];
    if (!gateway) {
      throw new BadRequestException(`Неподдерживаемый метод оплаты: ${method}`);
    }
    return gateway;
  }

  async createPayment(dto: CreatePaymentDto, userId: string) {
    const gateway = this.getGateway(dto.method);

    // Create pending transaction
    const transaction = await this.prisma.billingTransaction.create({
      data: {
        userId,
        type: 'payment',
        amount: dto.amount,
        method: dto.method as PaymentMethod,
        status: 'pending',
        description: dto.description,
      },
    });

    this.logger.log(
      `Created transaction ${transaction.id} for user ${userId}, amount=${dto.amount}, method=${dto.method}`,
    );

    // Call payment gateway
    const paymentResult = await gateway.createPayment({
      amount: dto.amount,
      currency: 'RUB',
      description: dto.description,
      userId,
      metadata: {
        transactionId: transaction.id,
        ...dto.metadata,
      },
      returnUrl: dto.returnUrl,
    });

    // Update transaction with external ID
    await this.prisma.billingTransaction.update({
      where: { id: transaction.id },
      data: { externalId: paymentResult.paymentId },
    });

    return {
      transactionId: transaction.id,
      paymentId: paymentResult.paymentId,
      confirmationUrl: paymentResult.confirmationUrl,
      status: paymentResult.status,
    };
  }

  async handleWebhook(event: any): Promise<void> {
    this.logger.log(`Received webhook event: ${JSON.stringify(event)}`);

    // Parse YooKassa webhook format
    const eventType = event?.event;
    const paymentId = event?.object?.id;

    if (!eventType || !paymentId) {
      this.logger.warn('Invalid webhook payload');
      return;
    }

    // Find transaction by external ID
    const transaction = await this.prisma.billingTransaction.findFirst({
      where: { externalId: paymentId },
    });

    if (!transaction) {
      this.logger.warn(`Transaction not found for externalId: ${paymentId}`);
      return;
    }

    if (eventType === 'payment.succeeded') {
      await this.handlePaymentSuccess(transaction.id);
    } else if (eventType === 'payment.canceled') {
      await this.prisma.billingTransaction.update({
        where: { id: transaction.id },
        data: { status: 'cancelled' },
      });
    } else if (eventType === 'refund.succeeded') {
      await this.prisma.billingTransaction.update({
        where: { id: transaction.id },
        data: { status: 'refunded' },
      });
    }

    this.logger.log(`Webhook processed: ${eventType} for transaction ${transaction.id}`);
  }

  async handlePaymentSuccess(transactionId: string): Promise<void> {
    const transaction = await this.prisma.billingTransaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException('Транзакция не найдена');
    }

    if (transaction.status === 'succeeded') {
      this.logger.warn(`Transaction ${transactionId} already succeeded, skipping`);
      return;
    }

    // Update transaction status
    await this.prisma.billingTransaction.update({
      where: { id: transactionId },
      data: { status: 'succeeded' },
    });

    // Top up balance
    await this.balanceService.addBalance(
      transaction.userId,
      transaction.amount.toNumber(),
      transactionId,
      transaction.description ?? 'Пополнение баланса',
    );

    // Generate invoice
    try {
      await this.invoiceService.generateInvoice(transactionId);
    } catch (error: any) {
      this.logger.warn(`Invoice generation failed: ${error.message}`);
    }

    // Handle metadata-based actions
    const metadata = transaction.description
      ? this.parseMetadata(transaction.description, transaction)
      : null;

    if (metadata?.type === 'subscription' && metadata.tariffId) {
      await this.subscriptionService.activateSubscription(
        transaction.userId,
        metadata.tariffId,
        transactionId,
      );
    } else if (metadata?.type === 'promotion') {
      await this.promotionPaymentService.activatePromotion(
        {
          entityType: metadata.entityType,
          entityId: metadata.entityId,
          level: metadata.level,
          method: 'balance',
        },
        transactionId,
      );
    }
  }

  private parseMetadata(description: string, transaction: any): any {
    // Try to extract metadata from description or from stored external data
    // For now, we rely on the transaction description pattern
    if (description.startsWith('Подписка:')) {
      return { type: 'subscription', tariffId: transaction.description?.split(':')[1]?.trim() };
    }
    return null;
  }

  // --- User-facing methods ---

  async getUserTransactions(userId: string, query: BillingQueryDto) {
    const { page = 1, perPage = 20, type, status, dateFrom, dateTo } = query;

    const where: any = { userId };
    if (type) where.type = type;
    if (status) where.status = status;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [transactions, total] = await Promise.all([
      this.prisma.billingTransaction.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.billingTransaction.count({ where }),
    ]);

    return {
      data: transactions,
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async getUserBalance(userId: string): Promise<{ balance: number; currency: string }> {
    const balance = await this.balanceService.getBalance(userId);
    return { balance, currency: 'RUB' };
  }

  // --- Admin methods ---

  async getAdminTransactions(query: BillingQueryDto) {
    const { page = 1, perPage = 20, type, status, dateFrom, dateTo } = query;

    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [transactions, total] = await Promise.all([
      this.prisma.billingTransaction.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.billingTransaction.count({ where }),
    ]);

    return {
      data: transactions,
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async refundTransaction(transactionId: string): Promise<void> {
    const transaction = await this.prisma.billingTransaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException('Транзакция не найдена');
    }

    if (transaction.status !== 'succeeded') {
      throw new BadRequestException('Можно вернуть только успешную транзакцию');
    }

    this.logger.log(`Refunding transaction ${transactionId}`);

    // If has external ID, try refund via gateway
    if (transaction.externalId && transaction.method) {
      try {
        const gateway = this.getGateway(transaction.method);
        await gateway.refundPayment(transaction.externalId, transaction.amount.toNumber());
      } catch (error: any) {
        this.logger.warn(`Gateway refund failed: ${error.message}`);
      }
    }

    // Deduct from balance
    await this.balanceService.deductBalance(
      transaction.userId,
      transaction.amount.toNumber(),
      `Возврат: ${transaction.description}`,
      transactionId,
    );

    // Update transaction status
    await this.prisma.billingTransaction.update({
      where: { id: transactionId },
      data: { status: 'refunded' },
    });
  }

  async getStats(): Promise<BillingStats> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalAgg, monthAgg, successfulCount, failedCount] = await Promise.all([
      this.prisma.billingTransaction.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { status: 'succeeded' },
      }),
      this.prisma.billingTransaction.aggregate({
        _sum: { amount: true },
        _count: true,
        where: {
          status: 'succeeded',
          createdAt: { gte: startOfMonth },
        },
      }),
      this.prisma.billingTransaction.count({
        where: { status: 'succeeded' },
      }),
      this.prisma.billingTransaction.count({
        where: { status: 'failed' },
      }),
    ]);

    // Revenue by type
    const types = ['payment', 'subscription', 'promotion', 'refund'] as const;
    const revenueByType: Record<string, number> = {};

    for (const type of types) {
      const agg = await this.prisma.billingTransaction.aggregate({
        _sum: { amount: true },
        where: { type: type as any, status: 'succeeded' },
      });
      revenueByType[type] = agg._sum.amount?.toNumber() ?? 0;
    }

    return {
      totalRevenue: totalAgg._sum.amount?.toNumber() ?? 0,
      totalTransactions: totalAgg._count,
      successfulTransactions: successfulCount,
      failedTransactions: failedCount,
      revenueByType,
      recentTransactions: monthAgg._count,
    };
  }
}
