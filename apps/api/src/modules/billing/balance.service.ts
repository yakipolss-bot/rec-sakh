import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { BillingQueryDto } from './dto/billing-query.dto.js';
import { TransactionType } from '@prisma/client';

@Injectable()
export class BalanceService {
  private readonly logger = new Logger(BalanceService.name);

  constructor(private prisma: PrismaService) {}

  async getBalance(userId: string): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    });
    return user?.balance?.toNumber() ?? 0;
  }

  async addBalance(
    userId: string,
    amount: number,
    transactionId: string,
    description: string,
  ): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    });

    const balanceBefore = user?.balance?.toNumber() ?? 0;
    const balanceAfter = balanceBefore + amount;

    this.logger.log(
      `addBalance: userId=${userId}, amount=${amount}, balanceBefore=${balanceBefore}, balanceAfter=${balanceAfter}`,
    );

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { balance: balanceAfter },
      }),
      this.prisma.userBalanceLog.create({
        data: {
          userId,
          amount,
          type: 'payment' as TransactionType,
          balanceBefore,
          balanceAfter,
          description,
          transactionId,
        },
      }),
    ]);

    return balanceAfter;
  }

  async deductBalance(
    userId: string,
    amount: number,
    description: string,
    transactionId?: string,
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    });

    const balanceBefore = user?.balance?.toNumber() ?? 0;

    if (balanceBefore < amount) {
      throw new BadRequestException('Недостаточно средств на балансе');
    }

    const balanceAfter = balanceBefore - amount;

    this.logger.log(
      `deductBalance: userId=${userId}, amount=${amount}, balanceBefore=${balanceBefore}, balanceAfter=${balanceAfter}`,
    );

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { balance: balanceAfter },
      }),
      this.prisma.userBalanceLog.create({
        data: {
          userId,
          amount: -amount,
          type: 'payment' as TransactionType,
          balanceBefore,
          balanceAfter,
          description,
          transactionId,
        },
      }),
    ]);

    return true;
  }

  async getBalanceLog(userId: string, query: BillingQueryDto) {
    const { page = 1, perPage = 20, type, dateFrom, dateTo } = query;

    const where: any = { userId };
    if (type) where.type = type;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [logs, total] = await Promise.all([
      this.prisma.userBalanceLog.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.userBalanceLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }
}
