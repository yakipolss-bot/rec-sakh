import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const CreateEventSchema = z.object({
  title: z.string().min(3, 'Заголовок должен быть минимум 3 символа').max(255),
  description: z.string().min(10, 'Описание должно быть минимум 10 символов'),
  shortDescription: z.string().max(500).optional(),
  categoryId: z.string().uuid('Некорректный ID категории').optional(),
  city: z.string().max(100).optional(),
  venueName: z.string().max(200).optional(),
  venueAddress: z.string().max(300).optional(),
  startDate: z.string().datetime('Некорректная дата начала'),
  endDate: z.string().datetime('Некорректная дата окончания').optional(),
  isFree: z.boolean().optional(),
  price: z.number().positive('Цена должна быть положительной').optional(),
  currency: z.string().max(3).optional(),
  imageUrl: z.string().url('Некорректный URL изображения').optional(),
  ticketUrl: z.string().url('Некорректный URL билетов').optional(),
  isRecurring: z.boolean().optional(),
  recurrenceRule: z.string().optional(),
  maxParticipants: z.number().int().positive().optional(),
});

export class CreateEventDto {
  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

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

  @ApiProperty()
  startDate: string;

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
  ticketUrl?: string;

  @ApiPropertyOptional()
  isRecurring?: boolean;

  @ApiPropertyOptional()
  recurrenceRule?: string;

  @ApiPropertyOptional()
  maxParticipants?: number;
}
