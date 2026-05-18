import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel, SendParams } from '../interfaces/channel.interface.js';

@Injectable()
export class SmsProviderService implements NotificationChannel {
  readonly name = 'sms';
  private readonly logger = new Logger(SmsProviderService.name);

  async send(params: SendParams): Promise<boolean> {
    this.logger.log(
      `[SMS] To: ${params.to} | Body: ${params.body.substring(0, 80)}...`,
    );

    // TODO: Подключить SMS-шлюз (Twilio / СМС-Центр / etc)
    // Пример:
    // await twilioClient.messages.create({
    //   body: params.body,
    //   from: process.env.SMS_FROM,
    //   to: params.to,
    // });

    return true;
  }
}
