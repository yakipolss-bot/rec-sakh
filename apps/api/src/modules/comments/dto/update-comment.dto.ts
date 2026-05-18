import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const UpdateCommentSchema = z.object({
  content: z.string().min(1).max(5000),
});

export class UpdateCommentDto {
  @ApiProperty()
  content: string;
}
