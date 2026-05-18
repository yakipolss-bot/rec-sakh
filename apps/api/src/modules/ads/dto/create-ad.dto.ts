import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const CreateAdSchema = z.object({
  title: z.string().min(3, 'Заголовок должен быть минимум 3 символа').max(255),
  description: z.string().min(10, 'Описание должно быть минимум 10 символов'),
  categoryId: z.string().uuid('Некорректный ID категории').optional(),
  city: z.string().max(100).optional(),
  price: z.number().positive('Цена должна быть положительной').optional(),
  condition: z.string().max(20).optional(),
  phone: z.string().optional(),
  images: z.array(z.string().url()).optional(),
});

export class CreateAdDto {
  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

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
}
