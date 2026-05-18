import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RealtyType } from '@prisma/client';

export const CreateRealtySchema = z.object({
  type: z.nativeEnum(RealtyType),
  title: z.string().min(3, 'Заголовок должен быть минимум 3 символа').max(255),
  description: z.string().min(10, 'Описание должно быть минимум 10 символов'),
  city: z.string().max(100).optional(),
  district: z.string().optional(),
  address: z.string().optional(),
  price: z.number().positive('Цена должна быть положительной').optional(),
  currency: z.string().max(3).optional(),
  rooms: z.number().int().positive().optional(),
  areaTotal: z.number().positive('Общая площадь должна быть положительной').optional(),
  areaLiving: z.number().positive().optional(),
  floor: z.number().int().positive().optional(),
  floorsTotal: z.number().int().positive().optional(),
  houseType: z.string().optional(),
  constructionYear: z.number().int().min(1800).max(2100).optional(),
  condition: z.string().optional(),
  landArea: z.number().positive().optional(),
  images: z.array(z.string().url()).optional(),
  phone: z.string().optional(),
});

export class CreateRealtyDto {
  @ApiProperty({ enum: RealtyType })
  type: RealtyType;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional()
  district?: string;

  @ApiPropertyOptional()
  address?: string;

  @ApiPropertyOptional()
  price?: number;

  @ApiPropertyOptional()
  currency?: string;

  @ApiPropertyOptional()
  rooms?: number;

  @ApiPropertyOptional()
  areaTotal?: number;

  @ApiPropertyOptional()
  areaLiving?: number;

  @ApiPropertyOptional()
  floor?: number;

  @ApiPropertyOptional()
  floorsTotal?: number;

  @ApiPropertyOptional()
  houseType?: string;

  @ApiPropertyOptional()
  constructionYear?: number;

  @ApiPropertyOptional()
  condition?: string;

  @ApiPropertyOptional()
  landArea?: number;

  @ApiPropertyOptional()
  images?: string[];

  @ApiPropertyOptional()
  phone?: string;
}
