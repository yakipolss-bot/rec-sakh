import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel, SendParams } from '../interfaces/channel.interface.js';

@Injectable()
export class EmailProviderService implements NotificationChannel {
  readonly name = 'email';
  private readonly logger = new Logger(EmailProviderService.name);

  async send(params: SendParams): Promise<boolean> {
    this.logger.log(
      `[EMAIL] To: ${params.to} | Subject: ${params.subject} | Body: ${params.body.substring(0, 100)}...`,
    );

    // TODO: Подключить nodemailer / SendGrid / etc
    // Пример реальной отправки:
    // await nodemailer.createTransport({...}).sendMail({
    //   from: '"Sakhcom" <noreply@sakh.com>',
    //   to: params.to,
    //   subject: params.subject,
    //   text: params.body,
    //   html: params.data?.html,
    // });

    return true;
  }
}
