export interface SendParams {
  userId: string;
  to: string;
  subject?: string;
  body: string;
  data?: Record<string, any>;
}

export interface NotificationChannel {
  readonly name: string;
  send(params: SendParams): Promise<boolean>;
  sendBulk?(params: SendParams[]): Promise<boolean[]>;
}

export interface RenderedNotification {
  subject: string;
  body: string;
  html?: string;
}
