import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const BanUserSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().min(1).max(500),
  durationHours: z.number().int().positive().optional(),
});

export class BanUserDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  reason: string;

  @ApiPropertyOptional()
  durationHours?: number;
}
