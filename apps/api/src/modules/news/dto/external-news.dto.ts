import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const ExternalNewsSchema = z.object({
  title: z.string().min(3).max(255),
  lead: z.string().max(1000).optional().default(''),
  content: z.string().optional().default(''),
  sourceUrl: z.string().url(),
  sourceName: z.string().max(100),
  imageUrl: z.string().url().optional(),
  publishedAt: z.string().optional(),
});

export class ExternalNewsDto {
  @ApiProperty() title: string;
  @ApiPropertyOptional() lead?: string;
  @ApiPropertyOptional() content?: string;
  @ApiProperty() sourceUrl: string;
  @ApiProperty() sourceName: string;
  @ApiPropertyOptional() imageUrl?: string;
  @ApiPropertyOptional() publishedAt?: string;
}
