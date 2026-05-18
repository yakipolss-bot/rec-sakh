import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { BillingQueryDto } from './dto/billing-query.dto.js';

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(private prisma: PrismaService) {}

  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const lastInvoice = await this.prisma.invoice.findFirst({
      where: {
        invoiceNumber: { startsWith: `INV-${year}-` },
      },
      orderBy: { invoiceNumber: 'desc' },
    });

    let nextNumber = 1;
    if (lastInvoice) {
      const parts = lastInvoice.invoiceNumber.split('-');
      nextNumber = parseInt(parts[parts.length - 1], 10) + 1;
    }

    return `INV-${year}-${String(nextNumber).padStart(6, '0')}`;
  }

  async generateInvoice(transactionId: string): Promise<any> {
    const transaction = await this.prisma.billingTransaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException('Транзакция не найдена');
    }

    const existingInvoice = await this.prisma.invoice.findUnique({
      where: { transactionId },
    });

    if (existingInvoice) {
      return existingInvoice;
    }

    const invoiceNumber = await this.generateInvoiceNumber();

    this.logger.log(
      `Generating invoice ${invoiceNumber} for transaction ${transactionId}`,
    );

    const invoice = await this.prisma.invoice.create({
      data: {
        transactionId,
        invoiceNumber,
        status: transaction.status === 'succeeded' ? 'paid' : 'issued',
        paidAt: transaction.status === 'succeeded' ? transaction.createdAt : null,
      },
    });

    await this.prisma.billingTransaction.update({
      where: { id: transactionId },
      data: { receiptUrl: `/api/billing/invoices/${invoice.id}/pdf` },
    });

    return invoice;
  }

  async getUserInvoices(userId: string, query: BillingQueryDto) {
    const { page = 1, perPage = 20, status, dateFrom, dateTo } = query;

    const where: any = {
      transaction: { userId },
    };
    if (status) where.status = status;
    if (dateFrom || dateTo) {
      where.issuedAt = {};
      if (dateFrom) where.issuedAt.gte = new Date(dateFrom);
      if (dateTo) where.issuedAt.lte = new Date(dateTo);
    }

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { issuedAt: 'desc' },
        include: {
          transaction: {
            select: { amount: true, description: true, type: true, createdAt: true },
          },
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      data: invoices,
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async getInvoiceById(invoiceId: string): Promise<any> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        transaction: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Инвойс не найден');
    }

    return invoice;
  }

  async getInvoicePdf(invoiceId: string): Promise<Buffer | null> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new NotFoundException('Инвойс не найден');
    }

    // TODO: Generate actual PDF
    this.logger.log(`PDF generation requested for invoice ${invoiceId} — not implemented yet`);
    return null;
  }
}
