import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { NotificationChannel, SendParams } from '../interfaces/channel.interface.js';

@Injectable()
export class PushProviderService implements NotificationChannel {
  readonly name = 'push';
  private readonly logger = new Logger(PushProviderService.name);

  constructor(private prisma: PrismaService) {}

  async send(params: SendParams): Promise<boolean> {
    this.logger.log(
      `[PUSH] To user: ${params.userId} | Title: ${params.subject} | Body: ${params.body.substring(0, 80)}...`,
    );

    try {
      // Найти все push-подписки пользователя
      const subscriptions = await this.prisma.pushSubscription.findMany({
        where: { userId: params.userId },
      });

      if (subscriptions.length === 0) {
        this.logger.warn(`No push subscriptions found for user ${params.userId}`);
        return false;
      }

      // TODO: Реальная отправка через web-push
      // const webpush = await import('web-push');
      // webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
      //
      // for (const sub of subscriptions) {
      //   try {
      //     await webpush.sendNotification(
      //       {
      //         endpoint: sub.endpoint,
      //         keys: {
      //           p256dh: sub.p256dhKey,
      //           auth: sub.authKey,
      //         },
      //       },
      //       JSON.stringify({
      //         title: params.subject,
      //         body: params.body,
      //         data: params.data,
      //       }),
      //     );
      //   } catch (err: any) {
      //     if (err.statusCode === 404 || err.statusCode === 410) {
      //       // Подписка устарела — удаляем
      //       await this.prisma.pushSubscription.delete({
      //         where: { id: sub.id },
      //       });
      //     }
      //   }
      // }

      return true;
    } catch (error) {
      this.logger.error(`Push send error for user ${params.userId}: ${error}`);
      return false;
    }
  }
}
