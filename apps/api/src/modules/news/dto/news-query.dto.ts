import { z } from 'zod';
import { ApiPropertyOptional } from '@nestjs/swagger';

export const NewsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
  category: z.string().uuid().optional(),
  search: z.string().min(3).max(200).optional(),
  tags: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  status: z.string().optional(),
  sortBy: z.enum(['createdAt', 'viewsCount', 'publishedAt', 'title']).default('publishedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  // Legacy field aliases for backwards compatibility
  tag: z.string().optional(),
  tagIds: z.string().optional(),
  city: z.string().optional(),
  author: z.string().optional(),
  isUrgent: z.string().optional(),
  hasVideo: z.string().optional(),
  sort: z.string().optional(),
});

export class NewsQueryDto {
  @ApiPropertyOptional()
  page?: string;

  @ApiPropertyOptional()
  perPage?: string;

  @ApiPropertyOptional()
  category?: string;

  @ApiPropertyOptional()
  tag?: string;

  @ApiPropertyOptional()
  tagIds?: string;

  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional()
  author?: string;

  @ApiPropertyOptional()
  status?: string;

  @ApiPropertyOptional()
  search?: string;

  @ApiPropertyOptional()
  isUrgent?: string;

  @ApiPropertyOptional()
  hasVideo?: string;

  @ApiPropertyOptional()
  sort?: string;

  @ApiPropertyOptional()
  dateFrom?: string;

  @ApiPropertyOptional()
  dateTo?: string;
}
