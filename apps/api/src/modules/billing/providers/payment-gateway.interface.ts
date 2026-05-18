import { PaymentStatus } from '@prisma/client';

export interface CreatePaymentParams {
  amount: number;
  currency: string;
  description: string;
  userId: string;
  metadata?: Record<string, any>;
  returnUrl?: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId: string;
  confirmationUrl?: string;
  status: PaymentStatus;
}

export interface PaymentGateway {
  readonly name: string;
  createPayment(params: CreatePaymentParams): Promise<PaymentResult>;
  checkPayment(paymentId: string): Promise<PaymentStatus>;
  refundPayment(paymentId: string, amount?: number): Promise<boolean>;
}
