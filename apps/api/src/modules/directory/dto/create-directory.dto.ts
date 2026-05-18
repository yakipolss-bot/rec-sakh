import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const CreateDirectorySchema = z.object({
  name: z.string().min(2).max(255),
  description: z.string().max(2000).optional(),
  categoryId: z.string().uuid().optional(),
  city: z.string().max(100).optional(),
  address: z.string().max(500).optional(),
  phone: z.string().max(50).optional(),
  website: z.string().url().optional(),
  email: z.string().email().optional(),
  workingHours: z.record(z.any()).optional(),
  photos: z.array(z.string().url()).optional(),
});

export class CreateDirectoryDto {
  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional()
  address?: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  website?: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  workingHours?: Record<string, any>;

  @ApiPropertyOptional()
  photos?: string[];
}
