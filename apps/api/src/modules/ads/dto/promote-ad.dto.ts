import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const PromoteAdSchema = z.object({
  level: z.enum(['raise', 'highlight', 'urgent', 'vip']),
  durationDays: z.number().int().positive().max(30).default(7),
});

export class PromoteAdDto {
  @ApiProperty({ enum: ['raise', 'highlight', 'urgent', 'vip'] })
  level: 'raise' | 'highlight' | 'urgent' | 'vip';

  @ApiProperty({ default: 7 })
  durationDays: number;
}
