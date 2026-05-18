import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { NotificationType, ChannelType } from '@prisma/client';
import { RenderedNotification } from './interfaces/channel.interface.js';
import * as Handlebars from 'handlebars';

interface DefaultTemplate {
  subject: string;
  template: string;
}

@Injectable()
export class NotificationRendererService {
  private readonly logger = new Logger(NotificationRendererService.name);

  constructor(private prisma: PrismaService) {}

  async render(
    type: NotificationType,
    channel: ChannelType,
    context: Record<string, any>,
  ): Promise<RenderedNotification | null> {
    try {
      // 1. Загрузить шаблон из БД
      const dbTemplate = await this.prisma.notificationTemplate.findUnique({
        where: {
          type_channel: { type, channel },
        },
      });

      let subject: string;
      let bodyTemplate: string;

      if (dbTemplate && dbTemplate.isActive) {
        subject = dbTemplate.subject || this.getDefaultTemplate(type, channel).subject;
        bodyTemplate = dbTemplate.template;
      } else {
        // 2. Fallback: встроенный шаблон по умолчанию
        const defaultTemplate = this.getDefaultTemplate(type, channel);
        subject = defaultTemplate.subject;
        bodyTemplate = defaultTemplate.template;
      }

      // 3. Компиляция Handlebars
      const compiledSubject = Handlebars.compile(subject, { noEscape: true });
      const compiledBody = Handlebars.compile(bodyTemplate, { noEscape: true });

      const renderedSubject = compiledSubject(context);
      const renderedBody = compiledBody(context);

      let html: string | undefined;
      if (channel === 'email') {
        html = renderedBody.replace(/\n/g, '<br>\n');
      }

      return {
        subject: renderedSubject,
        body: renderedBody,
        html,
      };
    } catch (error) {
      this.logger.error(`Template render error: ${error}`);
      return null;
    }
  }

  private getDefaultTemplate(type: NotificationType, channel: ChannelType): DefaultTemplate {
    const templates: Record<string, DefaultTemplate> = {
      [`comment_reply_${channel}`]: {
        subject: '{{authorName}} ответил(а) на ваш комментарий',
        template: '{{authorName}} ответил(а) на ваш комментарий в новости "{{newsTitle}}":\n\n{{replyPreview}}',
      },
      [`comment_vote_${channel}`]: {
        subject: 'Ваш комментарий оценили',
        template: 'Ваш комментарий получил {{voteType}} от {{authorName}} в новости "{{newsTitle}}".',
      },
      [`news_breaking_${channel}`]: {
        subject: '🚨 Срочная новость: {{title}}',
        template: '{{lead}}\n\nЧитать полностью: {{url}}',
      },
      [`news_urgent_${channel}`]: {
        subject: '📰 Важное: {{title}}',
        template: '{{lead}}\n\nЧитать полностью: {{url}}',
      },
      [`event_reminder_${channel}`]: {
        subject: '🔔 Напоминание: {{eventTitle}}',
        template: 'Мероприятие "{{eventTitle}}" начнётся {{eventDate}}.\n\nМесто: {{venue}}',
      },
      [`ad_status_${channel}`]: {
        subject: 'Статус объявления: {{adTitle}}',
        template: 'Ваше объявление "{{adTitle}}" получило статус: {{status}}.',
      },
      [`job_response_${channel}`]: {
        subject: 'Новый отклик на вакансию',
        template: 'Пользователь {{respondentName}} откликнулся на вакансию "{{jobTitle}}".',
      },
      [`moderation_result_${channel}`]: {
        subject: 'Результат модерации',
        template: 'Ваш контент "{{contentTitle}}" прошёл модерацию. Статус: {{status}}.\n\nКомментарий: {{comment}}',
      },
      [`newsletter_${channel}`]: {
        subject: '{{subject}}',
        template: '{{content}}',
      },
      [`billing_${channel}`]: {
        subject: '💳 Платёж: {{amount}} {{currency}}',
        template: '{{description}}\n\nСумма: {{amount}} {{currency}}\nСтатус: {{status}}',
      },
      [`system_${channel}`]: {
        subject: '{{subject}}',
        template: '{{body}}',
      },
    };

    const key = `${type}_${channel}`;
    return templates[key] || {
      subject: 'Уведомление с портала Sakhcom',
      template: '{{body}}',
    };
  }
}
