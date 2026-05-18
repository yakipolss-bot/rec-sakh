import { z } from 'zod';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AdStatus } from '@prisma/client';

export const UpdateAdSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  description: z.string().min(10).optional(),
  categoryId: z.string().uuid().optional(),
  city: z.string().max(100).optional(),
  price: z.number().positive().optional(),
  condition: z.string().max(20).optional(),
  phone: z.string().optional(),
  images: z.array(z.string().url()).optional(),
  status: z.nativeEnum(AdStatus).optional(),
});

export class UpdateAdDto {
  @ApiPropertyOptional()
  title?: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional()
  price?: number;

  @ApiPropertyOptional()
  condition?: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  images?: string[];

  @ApiPropertyOptional()
  status?: AdStatus;
}
