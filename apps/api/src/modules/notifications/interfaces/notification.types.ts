import { NotificationType, ChannelType } from '@prisma/client';

export interface NotifyParams {
  userId: string;
  type: NotificationType;
  channel?: ChannelType;
  context?: Record<string, any>;
}

export interface EnqueueParams {
  userId: string;
  type: NotificationType;
  channel: ChannelType;
  title: string;
  body?: string;
  data?: Record<string, any>;
  scheduledAt?: Date;
}

export interface ChannelSendParams {
  userId: string;
  type: NotificationType;
  channel: ChannelType;
  context: Record<string, any>;
}
