import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const CreateCommentSchema = z.object({
  newsId: z.string().uuid(),
  parentId: z.string().uuid().optional(),
  content: z.string().min(1).max(5000),
});

export class CreateCommentDto {
  @ApiProperty()
  newsId: string;

  @ApiPropertyOptional()
  parentId?: string;

  @ApiProperty()
  content: string;
}
