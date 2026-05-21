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
import { NotificationsService } from './notifications.service.js';
import { DigestService } from './digest.service.js';
import { NewsletterService } from './newsletter.service.js';
import { NotificationRendererService } from './notification-renderer.service.js';
import { NotificationQuerySchema, NotificationQueryDto } from './dto/notification-query.dto.js';
import { CreateTemplateDto } from './dto/create-template.dto.js';
import { SubscribeDigestDto } from './dto/subscribe-digest.dto.js';
import { SendNewsletterDto } from './dto/send-newsletter.dto.js';
import { SubscribePushDto } from './dto/subscribe-push.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { UserRole } from '@prisma/client';

@ApiTags('Notifications')
@Controller('notifications')
@ApiBearerAuth()
export class NotificationsController {
  constructor(
    private notificationsService: NotificationsService,
    private digestService: DigestService,
    private newsletterService: NewsletterService,
    private renderer: NotificationRendererService,
    private prisma: PrismaService,
  ) {}

  // ====== Центр уведомлений (для пользователя) ======

  @Get()
  @ApiOperation({ summary: 'Мои уведомления' })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query(new ZodValidationPipe(NotificationQuerySchema)) query: NotificationQueryDto,
  ) {
    return this.notificationsService.getUserNotifications(userId, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Счётчик непрочитанных' })
  async getUnreadCount(@CurrentUser('id') userId: string) {
    const count = await this.notificationsService.getUnreadCount(userId);
    return { unreadCount: count };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Отметить прочитанным' })
  async markAsRead(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    await this.notificationsService.markAsRead(userId, [id]);
    return { success: true };
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Отметить всё прочитанным' })
  async markAllAsRead(@CurrentUser('id') userId: string) {
    await this.notificationsService.markAllAsRead(userId);
    return { success: true };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить уведомление' })
  async delete(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    await this.notificationsService.deleteNotification(userId, id);
    return { success: true };
  }

  // ====== Push-подписки ======

  @Post('push/subscribe')
  @ApiOperation({ summary: 'Подписаться на Push' })
  async subscribePush(
    @CurrentUser('id') userId: string,
    @Body() dto: SubscribePushDto,
  ) {
    await this.notificationsService.subscribePush(userId, dto);
    return { success: true };
  }

  @Delete('push/unsubscribe')
  @ApiOperation({ summary: 'Отписаться от Push' })
  async unsubscribePush(
    @CurrentUser('id') userId: string,
    @Body('endpoint') endpoint: string,
  ) {
    await this.notificationsService.unsubscribePush(userId, endpoint);
    return { success: true };
  }

  // ====== Дайджесты ======

  @Post('digest/subscribe')
  @ApiOperation({ summary: 'Подписаться на дайджест' })
  async subscribeDigest(
    @CurrentUser('id') userId: string,
    @Body() dto: SubscribeDigestDto,
  ) {
    await this.digestService.subscribe(userId, dto.type, dto.channel || ('email' as any));
    return { success: true };
  }

  @Delete('digest/unsubscribe')
  @ApiOperation({ summary: 'Отписаться от дайджеста' })
  async unsubscribeDigest(
    @CurrentUser('id') userId: string,
    @Query('type') type: string,
  ) {
    await this.digestService.unsubscribe(userId, type, 'email' as any);
    return { success: true };
  }

  // ====== Админ/Редакция: шаблоны ======

  @Get('templates')
  @UseGuards(RolesGuard)
  @Roles(UserRole.admin, UserRole.editor, UserRole.chief_editor)
  @ApiOperation({ summary: 'Шаблоны уведомлений' })
  async getTemplates() {
    return this.prisma.notificationTemplate.findMany({
      orderBy: { type: 'asc' },
    });
  }

  @Post('templates')
  @UseGuards(RolesGuard)
  @Roles(UserRole.admin, UserRole.editor, UserRole.chief_editor)
  @ApiOperation({ summary: 'Создать шаблон' })
  async createTemplate(@Body() dto: CreateTemplateDto) {
    return this.prisma.notificationTemplate.create({
      data: {
        type: dto.type,
        channel: dto.channel,
        subject: dto.subject,
        template: dto.template,
      },
    });
  }

  @Patch('templates/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.admin, UserRole.editor, UserRole.chief_editor)
  @ApiOperation({ summary: 'Обновить шаблон' })
  async updateTemplate(
    @Param('id') id: string,
    @Body() dto: Partial<CreateTemplateDto>,
  ) {
    return this.prisma.notificationTemplate.update({
      where: { id },
      data: {
        ...(dto.type && { type: dto.type }),
        ...(dto.channel && { channel: dto.channel }),
        ...(dto.subject !== undefined && { subject: dto.subject }),
        ...(dto.template && { template: dto.template }),
      },
    });
  }

  // ====== Админ: рассылки ======

  @Post('newsletter')
  @UseGuards(RolesGuard)
  @Roles(UserRole.admin, UserRole.editor, UserRole.chief_editor)
  @ApiOperation({ summary: 'Создать рассылку' })
  async createNewsletter(
    @CurrentUser('id') userId: string,
    @Body() dto: SendNewsletterDto,
  ) {
    return this.newsletterService.create(dto, userId);
  }

  @Get('newsletter')
  @UseGuards(RolesGuard)
  @Roles(UserRole.admin, UserRole.editor, UserRole.chief_editor)
  @ApiOperation({ summary: 'Список рассылок' })
  async getNewsletters() {
    return this.prisma.newsletter.findMany({
      orderBy: { createdAt: 'desc' },
      include: { stats: true },
    });
  }

  @Get('newsletter/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.admin, UserRole.editor, UserRole.chief_editor)
  @ApiOperation({ summary: 'Детали рассылки' })
  async getNewsletter(@Param('id') id: string) {
    return this.prisma.newsletter.findUniqueOrThrow({
      where: { id },
      include: { stats: true },
    });
  }

  @Post('newsletter/:id/send')
  @UseGuards(RolesGuard)
  @Roles(UserRole.admin, UserRole.editor, UserRole.chief_editor)
  @ApiOperation({ summary: 'Отправить рассылку' })
  async sendNewsletter(@Param('id') id: string) {
    await this.newsletterService.send(id);
    return { success: true };
  }

  @Get('newsletter/:id/stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.admin, UserRole.editor, UserRole.chief_editor)
  @ApiOperation({ summary: 'Статистика рассылки' })
  async getNewsletterStats(@Param('id') id: string) {
    return this.newsletterService.getStats(id);
  }

  // ====== Telegram webhook ======

}
