import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator.js';

@ApiExcludeController()
@Controller('notifications/telegram/webhook')
export class TelegramWebhookController {
  private readonly logger = new Logger(TelegramWebhookController.name);

  @Post()
  @Public()
  async handleWebhook(@Body() body: any): Promise<{ ok: boolean }> {
    this.logger.log(`Telegram webhook received: ${JSON.stringify(body).substring(0, 200)}...`);

    // Обработка входящих сообщений от Telegram
    if (body.message) {
      const { chat, text, from } = body.message;

      this.logger.log(
        `Message from ${from?.username || from?.first_name} (chat: ${chat?.id}): ${text}`,
      );

      // TODO: Обработка команд
      // /start — привязать Telegram к аккаунту
      // /subscribe — подписаться на уведомления
      // /unsubscribe — отписаться
      // /help — справка
    }

    return { ok: true };
  }
}
