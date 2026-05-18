import { Injectable, Logger } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import {
  PaymentGateway,
  CreatePaymentParams,
  PaymentResult,
} from './providers/payment-gateway.interface.js';

@Injectable()
export class SbpService implements PaymentGateway {
  readonly name = 'sbp';
  private readonly logger = new Logger(SbpService.name);

  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    this.logger.log(
      `[MOCK SBP] createPayment: amount=${params.amount}, currency=${params.currency}, description="${params.description}"`,
    );

    // Mock: generate QR code string
    const qrCodeId = randomUUID();
    const qrCodeUrl = `https://qr.nspk.ru/${qrCodeId}?amount=${params.amount}&currency=${params.currency}`;

    return {
      success: true,
      paymentId: `sbp_${qrCodeId}`,
      confirmationUrl: qrCodeUrl,
      status: 'pending' as PaymentStatus,
    };
  }

  async checkPayment(paymentId: string): Promise<PaymentStatus> {
    this.logger.log(`[MOCK SBP] checkPayment: paymentId=${paymentId}`);
    return 'succeeded' as PaymentStatus;
  }

  async refundPayment(paymentId: string, amount?: number): Promise<boolean> {
    this.logger.log(
      `[MOCK SBP] refundPayment: paymentId=${paymentId}, amount=${amount}`,
    );
    return true;
  }
}
