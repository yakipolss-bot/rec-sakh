import { Injectable, Logger } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import {
  PaymentGateway,
  CreatePaymentParams,
  PaymentResult,
} from './providers/payment-gateway.interface.js';

@Injectable()
export class CryptoService implements PaymentGateway {
  readonly name = 'crypto';
  private readonly logger = new Logger(CryptoService.name);

  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    this.logger.log(
      `[MOCK Crypto] createPayment: amount=${params.amount}, currency=${params.currency}, description="${params.description}"`,
    );

    const walletAddress = `0x${randomUUID().replace(/-/g, '')}`;

    return {
      success: true,
      paymentId: `crypto_${randomUUID()}`,
      confirmationUrl: `crypto:${walletAddress}?amount=${params.amount}`,
      status: 'pending' as PaymentStatus,
    };
  }

  async checkPayment(paymentId: string): Promise<PaymentStatus> {
    this.logger.log(`[MOCK Crypto] checkPayment: paymentId=${paymentId}`);
    return 'succeeded' as PaymentStatus;
  }

  async refundPayment(paymentId: string, amount?: number): Promise<boolean> {
    this.logger.log(
      `[MOCK Crypto] refundPayment: paymentId=${paymentId}, amount=${amount}`,
    );
    return true;
  }
}
