import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const RefreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token обязателен'),
});

export class RefreshDto {
  @ApiProperty()
  refreshToken: string;
}
