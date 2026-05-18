import { Injectable, Logger } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import {
  PaymentGateway,
  CreatePaymentParams,
  PaymentResult,
} from './providers/payment-gateway.interface.js';

@Injectable()
export class YooKassaService implements PaymentGateway {
  readonly name = 'yookassa';
  private readonly logger = new Logger(YooKassaService.name);

  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    this.logger.log(
      `[MOCK YooKassa] createPayment: amount=${params.amount}, currency=${params.currency}, description="${params.description}"`,
    );

    return {
      success: true,
      paymentId: `yk_${randomUUID()}`,
      confirmationUrl: `https://yookassa.ru/payment/${randomUUID()}`,
      status: 'pending' as PaymentStatus,
    };
  }

  async checkPayment(paymentId: string): Promise<PaymentStatus> {
    this.logger.log(`[MOCK YooKassa] checkPayment: paymentId=${paymentId}`);
    return 'succeeded' as PaymentStatus;
  }

  async refundPayment(paymentId: string, amount?: number): Promise<boolean> {
    this.logger.log(
      `[MOCK YooKassa] refundPayment: paymentId=${paymentId}, amount=${amount}`,
    );
    return true;
  }
}
