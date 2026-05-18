import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel, SendParams } from '../interfaces/channel.interface.js';

@Injectable()
export class TelegramProviderService implements NotificationChannel {
  readonly name = 'telegram';
  private readonly logger = new Logger(TelegramProviderService.name);

  async send(params: SendParams): Promise<boolean> {
    this.logger.log(
      `[TELEGRAM] ChatId: ${params.to} | Body: ${params.body.substring(0, 80)}...`,
    );

    // TODO: Настроить реального бота
    // const botToken = process.env.TELEGRAM_BOT_TOKEN;
    // if (!botToken) {
    //   this.logger.warn('TELEGRAM_BOT_TOKEN not configured');
    //   return false;
    // }
    //
    // const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    // await fetch(url, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     chat_id: params.to,
    //     text: params.body,
    //     parse_mode: 'HTML',
    //     disable_web_page_preview: true,
    //   }),
    // });

    return true;
  }
}
