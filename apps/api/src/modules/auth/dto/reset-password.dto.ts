import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, 'Пароль должен быть минимум 8 символов'),
});

export class ResetPasswordDto {
  @ApiProperty()
  token: string;

  @ApiProperty({ example: 'NewStrongPass123' })
  password: string;
}
