import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const CreateNewsSchema = z.object({
  title: z.string().min(3, 'Заголовок должен быть минимум 3 символа').max(255),
  lead: z.string().max(500).optional(),
  content: z.string().min(10, 'Контент должен быть минимум 10 символов'),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug может содержать только латиницу, цифры и дефис').optional(),
  categoryId: z.string().uuid('Некорректный ID категории').optional(),
  city: z.string().max(100).optional(),
  isUrgent: z.boolean().optional(),
  isPremium: z.boolean().optional(),
  isBreaking: z.boolean().optional(),
  scheduledAt: z.string().datetime().optional(),
  sourceName: z.string().max(100).optional(),
  sourceUrl: z.string().url('Некорректный URL источника').optional(),
  mainImageUrl: z.string().url('Некорректный URL изображения').optional(),
  seoTitle: z.string().max(100).optional(),
  seoDescription: z.string().max(300).optional(),
  seoOgImage: z.string().url('Некорректный URL OG изображения').optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  gallery: z.array(z.string().url()).optional(),
  videoUrl: z.string().url().optional(),
  videoType: z.enum(['youtube', 'vk', 'rutube', 'upload']).optional(),
  videoDuration: z.number().int().positive().optional(),
});

export class CreateNewsDto {
  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  lead?: string;

  @ApiProperty()
  content: string;

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
