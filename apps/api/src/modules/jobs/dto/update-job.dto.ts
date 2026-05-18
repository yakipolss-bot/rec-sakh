import { z } from 'zod';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AdStatus, JobType } from '@prisma/client';

export const UpdateJobSchema = z.object({
  type: z.nativeEnum(JobType).optional(),
  title: z.string().min(3).max(255).optional(),
  description: z.string().min(10).optional(),
  categoryId: z.string().uuid().optional(),
  city: z.string().max(100).optional(),
  salaryMin: z.number().positive().optional(),
  salaryMax: z.number().positive().optional(),
  currency: z.string().max(3).optional(),
  schedule: z.string().max(50).optional(),
  experience: z.string().max(50).optional(),
  companyName: z.string().max(200).optional(),
  contacts: z.record(z.unknown()).optional(),
  status: z.nativeEnum(AdStatus).optional(),
});

export class UpdateJobDto {
  @ApiPropertyOptional()
  type?: JobType;

  @ApiPropertyOptional()
  title?: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional()
  salaryMin?: number;

  @ApiPropertyOptional()
  salaryMax?: number;

  @ApiPropertyOptional()
  currency?: string;

  @ApiPropertyOptional()
  schedule?: string;

  @ApiPropertyOptional()
  experience?: string;

  @ApiPropertyOptional()
  companyName?: string;

  @ApiPropertyOptional()
  contacts?: Record<string, unknown>;

  @ApiPropertyOptional()
  status?: AdStatus;
}
