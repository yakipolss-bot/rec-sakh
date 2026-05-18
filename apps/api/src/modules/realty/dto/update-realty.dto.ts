import { z } from 'zod';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AdStatus, RealtyType } from '@prisma/client';

export const UpdateRealtySchema = z.object({
  type: z.nativeEnum(RealtyType).optional(),
  title: z.string().min(3).max(255).optional(),
  description: z.string().min(10).optional(),
  city: z.string().max(100).optional(),
  district: z.string().optional(),
  address: z.string().optional(),
  price: z.number().positive().optional(),
  currency: z.string().max(3).optional(),
  rooms: z.number().int().positive().optional(),
  areaTotal: z.number().positive().optional(),
  areaLiving: z.number().positive().optional(),
  floor: z.number().int().positive().optional(),
  floorsTotal: z.number().int().positive().optional(),
  houseType: z.string().optional(),
  constructionYear: z.number().int().min(1800).max(2100).optional(),
  condition: z.string().optional(),
  landArea: z.number().positive().optional(),
  images: z.array(z.string().url()).optional(),
  phone: z.string().optional(),
  status: z.nativeEnum(AdStatus).optional(),
});

export class UpdateRealtyDto {
  @ApiPropertyOptional()
  type?: RealtyType;

  @ApiPropertyOptional()
  title?: string;

  @ApiPropertyOptional()
  description?: string;

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

  @ApiPropertyOptional()
  status?: AdStatus;
}
