import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const MergeTagsSchema = z.object({
  sourceId: z.string().uuid(),
  targetId: z.string().uuid(),
});

export class MergeTagsDto {
  @ApiProperty()
  sourceId: string;

  @ApiProperty()
  targetId: string;
}
