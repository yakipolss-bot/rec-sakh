import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BillingController } from './billing.controller.js';
import { YooKassaWebhookController } from './webhooks/yookassa-webhook.controller.js';
import { BillingService } from './billing.service.js';
import { TariffService } from './tariff.service.js';
import { SubscriptionService } from './subscription.service.js';
import { PromotionPaymentService } from './promotion-payment.service.js';
import { BalanceService } from './balance.service.js';
import { InvoiceService } from './invoice.service.js';
import { YooKassaService } from './yookassa.service.js';
import { SbpService } from './sbp.service.js';
import { CryptoService } from './crypto.service.js';
import { BillingSchedulerService } from './schedules/billing-scheduler.service.js';

@Module({
  imports: [ScheduleModule],
  controllers: [BillingController, YooKassaWebhookController],
  providers: [
    BillingService,
    TariffService,
    SubscriptionService,
    PromotionPaymentService,
    BalanceService,
    InvoiceService,
    YooKassaService,
    SbpService,
    CryptoService,
    BillingSchedulerService,
  ],
  exports: [BillingService, SubscriptionService, BalanceService],
})
export class BillingModule {}
