import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from './billing.service.js';
import { TariffService } from './tariff.service.js';
import { SubscriptionService } from './subscription.service.js';
import { PromotionPaymentService } from './promotion-payment.service.js';
import { BalanceService } from './balance.service.js';
import { InvoiceService } from './invoice.service.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import {
  CreateTariffDto,
  UpdateTariffDto,
} from './dto/tariff.dto.js';
import { SubscribeDto } from './dto/subscription.dto.js';
import {
  PromotionPaymentDto,
  GetPromotionPriceDto,
  CreatePricingRuleDto,
  UpdatePricingRuleDto,
} from './dto/promotion-payment.dto.js';
import { TopUpBalanceDto } from './dto/balance.dto.js';
import { BillingQueryDto } from './dto/billing-query.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(
    private billingService: BillingService,
    private tariffService: TariffService,
    private subscriptionService: SubscriptionService,
    private promotionPaymentService: PromotionPaymentService,
    private balanceService: BalanceService,
    private invoiceService: InvoiceService,
  ) {}

  // ====== Тарифы (публичные) ======

  @Get('tariffs')
  @Public()
  @ApiOperation({ summary: 'Активные тарифы подписки' })
  async getTariffs() {
    return this.tariffService.getActiveTariffs();
  }

  // ====== Платежи ======

  @Post('pay')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Создать платёж' })
  async createPayment(
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.billingService.createPayment(dto, userId);
  }

  @Post('top-up')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Пополнить баланс' })
  async topUpBalance(
    @CurrentUser('id') userId: string,
    @Body() dto: TopUpBalanceDto,
  ) {
    return this.billingService.createPayment(
      {
        method: (dto.method ?? 'yookassa') as any,
        amount: dto.amount,
        description: 'Пополнение внутреннего баланса',
        returnUrl: dto.returnUrl,
      },
      userId,
    );
  }

  // ====== Транзакции ======

  @Get('transactions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Мои транзакции' })
  async getTransactions(
    @CurrentUser('id') userId: string,
    @Query() query: BillingQueryDto,
  ) {
    return this.billingService.getUserTransactions(userId, query);
  }

  // ====== Баланс ======

  @Get('balance')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Мой баланс' })
  async getBalance(@CurrentUser('id') userId: string) {
    return this.billingService.getUserBalance(userId);
  }

  @Get('balance/log')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'История изменения баланса' })
  async getBalanceLog(
    @CurrentUser('id') userId: string,
    @Query() query: BillingQueryDto,
  ) {
    return this.balanceService.getBalanceLog(userId, query);
  }

  // ====== Инвойсы ======

  @Get('invoices')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Мои инвойсы' })
  async getInvoices(
    @CurrentUser('id') userId: string,
    @Query() query: BillingQueryDto,
  ) {
    return this.invoiceService.getUserInvoices(userId, query);
  }

  @Get('invoices/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Детали инвойса' })
  async getInvoice(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.invoiceService.getInvoiceById(id);
  }

  @Get('invoices/:id/pdf')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'PDF инвойса' })
  async getInvoicePdf(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    const pdf = await this.invoiceService.getInvoicePdf(id);
    if (!pdf) {
      return { message: 'PDF генерация временно недоступна' };
    }
    return pdf;
  }

  // ====== Подписки ======

  @Post('subscriptions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Оформить подписку' })
  async subscribe(
    @CurrentUser('id') userId: string,
    @Body() dto: SubscribeDto,
  ) {
    return this.subscriptionService.subscribe(userId, dto);
  }

  @Get('subscriptions/active')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Моя активная подписка' })
  async getActiveSubscription(@CurrentUser('id') userId: string) {
    return this.subscriptionService.getActiveSubscription(userId);
  }

  @Post('subscriptions/:id/cancel')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Отменить подписку' })
  async cancelSubscription(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    await this.subscriptionService.cancelSubscription(userId, id);
    return { message: 'Подписка отменена. Действует до конца периода.' };
  }

  // ====== Продвижение ======

  @Post('promotions/price')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Узнать цену продвижения' })
  async getPromotionPrice(@Body() dto: GetPromotionPriceDto) {
    return this.promotionPaymentService.getPromotionPrice(dto);
  }

  @Post('promotions/pay')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Оплатить продвижение' })
  async payForPromotion(
    @CurrentUser('id') userId: string,
    @Body() dto: PromotionPaymentDto,
  ) {
    return this.promotionPaymentService.payForPromotion(dto, userId);
  }

  // ====== Админские ======

  @Get('admin/transactions')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Все транзакции (админ)' })
  async getAdminTransactions(@Query() query: BillingQueryDto) {
    return this.billingService.getAdminTransactions(query);
  }

  @Post('admin/transactions/:id/refund')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Возврат транзакции (админ)' })
  async refund(@Param('id') id: string) {
    await this.billingService.refundTransaction(id);
    return { message: 'Возврат выполнен' };
  }

  @Get('admin/stats')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Статистика биллинга (админ)' })
  async getStats() {
    return this.billingService.getStats();
  }

  @Get('admin/tariffs')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Все тарифы (админ)' })
  async getAllTariffs() {
    return this.tariffService.getAllTariffs();
  }

  @Post('admin/tariffs')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Создать тариф (админ)' })
  async createTariff(@Body() dto: CreateTariffDto) {
    return this.tariffService.create(dto);
  }

  @Patch('admin/tariffs/:id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить тариф (админ)' })
  async updateTariff(
    @Param('id') id: string,
    @Body() dto: UpdateTariffDto,
  ) {
    return this.tariffService.update(id, dto);
  }

  @Delete('admin/tariffs/:id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить тариф (админ)' })
  async deleteTariff(@Param('id') id: string) {
    await this.tariffService.delete(id);
    return { message: 'Тариф удалён' };
  }

  @Post('admin/pricing-rules')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Создать правило ценообразования (админ)' })
  async createPricingRule(@Body() dto: CreatePricingRuleDto) {
    return this.promotionPaymentService.createPricingRule(dto);
  }

  @Get('admin/pricing-rules')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Список правил ценообразования (админ)' })
  async getPricingRules() {
    return this.promotionPaymentService.getPricingRules();
  }

  @Patch('admin/pricing-rules/:id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить правило ценообразования (админ)' })
  async updatePricingRule(
    @Param('id') id: string,
    @Body() dto: UpdatePricingRuleDto,
  ) {
    return this.promotionPaymentService.updatePricingRule(id, dto);
  }

  @Delete('admin/pricing-rules/:id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить правило ценообразования (админ)' })
  async deletePricingRule(@Param('id') id: string) {
    await this.promotionPaymentService.deletePricingRule(id);
    return { message: 'Правило удалено' };
  }

  @Post('admin/seed-tariffs')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Заполнить тарифы по умолчанию (админ)' })
  async seedTariffs() {
    await this.tariffService.seedDefaults();
    return { message: 'Тарифы по умолчанию созданы' };
  }

  @Post('admin/tariffs/:id/select')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Активировать тариф для пользователя (админ)' })
  async selectTariff(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.subscriptionService.subscribe(userId, { tariffId: id, method: 'balance' });
  }
}
