import { z } from 'zod';

export const UsersQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  perPage: z.coerce.number().optional().default(20),
  role: z.string().optional(),
  status: z.string().optional(),
  city: z.string().optional(),
  search: z.string().optional(),
});

export type UsersQueryDto = z.infer<typeof UsersQuerySchema>;
