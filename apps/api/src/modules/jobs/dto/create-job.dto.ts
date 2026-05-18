import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JobType } from '@prisma/client';

export const CreateJobSchema = z.object({
  type: z.nativeEnum(JobType),
  title: z.string().min(3, 'Заголовок должен быть минимум 3 символа').max(255),
  description: z.string().min(10, 'Описание должно быть минимум 10 символов'),
  categoryId: z.string().uuid('Некорректный ID категории').optional(),
  city: z.string().max(100).optional(),
  salaryMin: z.number().positive('Минимальная зарплата должна быть положительной').optional(),
  salaryMax: z.number().positive('Максимальная зарплата должна быть положительной').optional(),
  currency: z.string().max(3).optional(),
  schedule: z.string().max(50).optional(),
  experience: z.string().max(50).optional(),
  companyName: z.string().max(200).optional(),
  contacts: z.record(z.unknown()).optional(),
});

export class CreateJobDto {
  @ApiProperty({ enum: JobType })
  type: JobType;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

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
}
