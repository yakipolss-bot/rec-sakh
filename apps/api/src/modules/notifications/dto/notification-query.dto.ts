import { z } from 'zod';

export const NotificationQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  perPage: z.coerce.number().optional().default(20),
  type: z.string().optional(),
  isRead: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export type NotificationQueryDto = z.infer<typeof NotificationQuerySchema>;
