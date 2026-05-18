import { z } from 'zod';
import { ApiPropertyOptional } from '@nestjs/swagger';

export const JobResponseSchema = z.object({
  message: z.string().max(1000).optional(),
  resumeUrl: z.string().url('Некорректный URL резюме').optional(),
});

export class JobResponseDto {
  @ApiPropertyOptional()
  message?: string;

  @ApiPropertyOptional()
  resumeUrl?: string;
}
