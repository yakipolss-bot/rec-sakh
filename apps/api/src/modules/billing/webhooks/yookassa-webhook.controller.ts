import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Headers,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac } from 'crypto';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Public } from '../../../common/decorators/public.decorator.js';
import { BillingService } from '../billing.service.js';

@Controller('billing/webhook/yookassa')
export class YooKassaWebhookController {
  private readonly logger = new Logger(YooKassaWebhookController.name);

  constructor(
    private billingService: BillingService,
    private configService: ConfigService,
  ) {}

  @Post()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async handleWebhook(
    @Body() body: any,
    @Headers('authorization') authHeader?: string,
  ) {
    this.logger.log('Received YooKassa webhook');

    // C2: Verify webhook signature using HMAC-SHA256
    const webhookSecret = this.configService.get('YOOKASSA_WEBHOOK_SECRET');
    if (webhookSecret) {
      const rawBody = JSON.stringify(body);
      const expectedSignature = createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');
      const providedSignature = authHeader?.replace(/^Basic\s+/i, '') || '';
      if (expectedSignature !== providedSignature) {
        throw new UnauthorizedException('Invalid webhook signature');
      }
    }

    await this.billingService.handleWebhook(body);

    return { ok: true };
  }
}
