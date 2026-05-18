import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const BulkModerateSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
  status: z.enum(['approved', 'rejected']),
});

export class BulkModerateDto {
  @ApiProperty()
  ids: string[];

  @ApiProperty()
  status: 'approved' | 'rejected';
}
