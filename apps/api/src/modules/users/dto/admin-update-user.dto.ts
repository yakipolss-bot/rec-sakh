import { z } from 'zod';

export const AdminUpdateUserSchema = z.object({
  role: z.string().optional(),
  status: z.string().optional(),
  name: z.string().optional(),
  isPhoneVerified: z.boolean().optional(),
  isEmailVerified: z.boolean().optional(),
});

export type AdminUpdateUserDto = z.infer<typeof AdminUpdateUserSchema>;
