import { z } from 'zod';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EventStatus } from '@prisma/client';

export const UpdateEventSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  description: z.string().min(10).optional(),
  shortDescription: z.string().max(500).optional(),
  categoryId: z.string().uuid().optional(),
  city: z.string().max(100).optional(),
  venueName: z.string().max(200).optional(),
  venueAddress: z.string().max(300).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isFree: z.boolean().optional(),
  price: z.number().positive().optional(),
  currency: z.string().max(3).optional(),
  imageUrl: z.string().url().optional(),
  status: z.nativeEnum(EventStatus).optional(),
  isRecurring: z.boolean().optional(),
  recurrenceRule: z.string().optional(),
  maxParticipants: z.number().int().positive().optional(),
});

export class UpdateEventDto {
  @ApiPropertyOptional()
  title?: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  shortDescription?: string;

  @ApiPropertyOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional()
  venueName?: string;

  @ApiPropertyOptional()
  venueAddress?: string;

  @ApiPropertyOptional()
  startDate?: string;

  @ApiPropertyOptional()
  endDate?: string;

  @ApiPropertyOptional()
  isFree?: boolean;

  @ApiPropertyOptional()
  price?: number;

  @ApiPropertyOptional()
  currency?: string;

  @ApiPropertyOptional()
  imageUrl?: string;

  @ApiPropertyOptional()
  status?: EventStatus;

  @ApiPropertyOptional()
  isRecurring?: boolean;

  @ApiPropertyOptional()
  recurrenceRule?: string;

  @ApiPropertyOptional()
  maxParticipants?: number;
}
