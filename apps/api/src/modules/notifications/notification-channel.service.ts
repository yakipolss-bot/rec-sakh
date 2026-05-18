import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { NotificationType, ChannelType } from '@prisma/client';
import { EmailProviderService } from './providers/email-provider.service.js';
import { SmsProviderService } from './providers/sms-provider.service.js';
import { PushProviderService } from './providers/push-provider.service.js';
import { TelegramProviderService } from './providers/telegram-provider.service.js';
import { NotificationRendererService } from './notification-renderer.service.js';
import { NotificationChannel } from './interfaces/channel.interface.js';
import { ChannelSendParams } from './interfaces/notification.types.js';

@Injectable()
export class NotificationChannelService {
  private readonly logger = new Logger(NotificationChannelService.name);
  private readonly providers = new Map<string, NotificationChannel>();

  constructor(
    private emailProvider: EmailProviderService,
    private smsProvider: SmsProviderService,
    private pushProvider: PushProviderService,
    private telegramProvider: TelegramProviderService,
    private prisma: PrismaService,
    private renderer: NotificationRendererService,
  ) {
    this.providers.set('email', this.emailProvider);
    this.providers.set('sms', this.smsProvider);
    this.providers.set('push', this.pushProvider);
    this.providers.set('telegram', this.telegramProvider);
  }

  async send(params: ChannelSendParams): Promise<boolean> {
    const { userId, type, channel, context } = params;

    try {
      // 1. Проверить UserSetting — включён ли канал
      const userSettings = await this.prisma.userSetting.findUnique({
        where: { userId },
      });

      if (!userSettings) {
        this.logger.warn(`User settings not found for user ${userId}`);
        return false;
      }

      const channelEnabledMap: Record<string, boolean> = {
        email: userSettings.emailNotifications,
        push: userSettings.pushNotifications,
        sms: userSettings.smsNotifications,
        telegram: true, // Telegram не зависит от общих настроек
      };

      if (!channelEnabledMap[channel]) {
        this.logger.log(`Channel ${channel} is disabled for user ${userId}`);
        return false;
      }

      // 2. Получить контакт пользователя
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
          phone: true,
        },
      });

      if (!user) {
        this.logger.warn(`User ${userId} not found`);
        return false;
      }

      const contactMap: Record<string, string | undefined> = {
        email: user.email,
        push: userId, // Для push используем userId для поиска подписок
        sms: user.phone ?? undefined,
        telegram: context?.telegramChatId as string | undefined,
      };

      const to = contactMap[channel];
      if (!to) {
        this.logger.warn(`No contact info for user ${userId} on channel ${channel}`);
        return false;
      }

      // 3. Рендерить шаблон
      const rendered = await this.renderer.render(type, channel, context);
      if (!rendered) {
        this.logger.error(`Failed to render template for ${type}/${channel}`);
        return false;
      }

      // 4. Отправить через провайдер
      const provider = this.providers.get(channel);
      if (!provider) {
        this.logger.error(`No provider for channel ${channel}`);
        return false;
      }

      const sent = await provider.send({
        userId,
        to,
        subject: rendered.subject,
        body: rendered.body,
        data: { ...context, html: rendered.html },
      });

      // 5. Сохранить в Notification (для push канала — чтобы отображалось в центре уведомлений)
      if (sent) {
        await this.prisma.notification.create({
          data: {
            userId,
            type,
            title: rendered.subject,
            body: rendered.body,
            data: context || {},
            channel,
          },
        });
      }

      return sent;
    } catch (error) {
      this.logger.error(`Channel send error: ${error}`);
      return false;
    }
  }
}
