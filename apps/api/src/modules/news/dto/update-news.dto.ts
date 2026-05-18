import { z } from 'zod';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { NewsStatus } from '@prisma/client';

export const UpdateNewsSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  lead: z.string().max(500).optional(),
  content: z.string().min(10).optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  categoryId: z.string().uuid().optional(),
  city: z.string().max(100).optional(),
  isUrgent: z.boolean().optional(),
  isPremium: z.boolean().optional(),
  isBreaking: z.boolean().optional(),
  status: z.nativeEnum(NewsStatus).optional(),
  scheduledAt: z.string().datetime().optional(),
  sourceName: z.string().max(100).optional(),
  sourceUrl: z.string().url().optional(),
  mainImageUrl: z.string().url().optional(),
  seoTitle: z.string().max(100).optional(),
  seoDescription: z.string().max(300).optional(),
  seoOgImage: z.string().url().optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  gallery: z.array(z.string().url()).optional(),
  videoUrl: z.string().url().optional(),
  videoType: z.enum(['youtube', 'vk', 'rutube', 'upload']).optional(),
  videoDuration: z.number().int().positive().optional(),
});

export class UpdateNewsDto {
  @ApiPropertyOptional()
  title?: string;

  @ApiPropertyOptional()
  lead?: string;

  @ApiPropertyOptional()
  content?: string;

  @ApiPropertyOptional()
  slug?: string;

  @ApiPropertyOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional()
  isUrgent?: boolean;

  @ApiPropertyOptional()
  isPremium?: boolean;

  @ApiPropertyOptional()
  isBreaking?: boolean;

  @ApiPropertyOptional()
  status?: NewsStatus;

  @ApiPropertyOptional()
  scheduledAt?: string;

  @ApiPropertyOptional()
  sourceName?: string;

  @ApiPropertyOptional()
  sourceUrl?: string;

  @ApiPropertyOptional()
  mainImageUrl?: string;

  @ApiPropertyOptional()
  seoTitle?: string;

  @ApiPropertyOptional()
  seoDescription?: string;

  @ApiPropertyOptional()
  seoOgImage?: string;

  @ApiPropertyOptional()
  tagIds?: string[];

  @ApiPropertyOptional()
  gallery?: string[];

  @ApiPropertyOptional()
  videoUrl?: string;

  @ApiPropertyOptional()
  videoType?: 'youtube' | 'vk' | 'rutube' | 'upload';

  @ApiPropertyOptional()
  videoDuration?: number;
}
