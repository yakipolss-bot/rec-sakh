import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PromoteLevel } from '@prisma/client';

export class PromotionPaymentDto {
  @ApiProperty({
    description: 'Тип сущности (ad, event, job)',
  })
  @IsString()
  entityType: string;

  @ApiProperty({ description: 'ID сущности (объявления, события, вакансии)' })
  @IsString()
  entityId: string;

  @ApiProperty({ enum: PromoteLevel, description: 'Уровень продвижения' })
  @IsEnum(PromoteLevel)
  level: PromoteLevel;

  @ApiProperty({
    enum: ['yookassa', 'sbp', 'crypto', 'balance'],
    description: 'Способ оплаты',
  })
  @IsString()
  method: 'yookassa' | 'sbp' | 'crypto' | 'balance';
}

export class GetPromotionPriceDto {
  @ApiProperty({ description: 'Тип сущности (ad, event, job)' })
  @IsString()
  entityType: string;

  @ApiPropertyOptional({ description: 'ID сущности (опционально)' })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiProperty({ enum: PromoteLevel, description: 'Уровень продвижения' })
  @IsEnum(PromoteLevel)
  level: PromoteLevel;
}

export class CreatePricingRuleDto {
  @ApiProperty({ description: 'Тип сущности (ad_promotion, event_promotion, job_promotion)' })
  @IsString()
  entityType: string;

  @ApiPropertyOptional({ description: 'ID сущности (null = для всех)' })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({ description: 'Уровень продвижения (raise, highlight, urgent, vip)' })
  @IsOptional()
  @IsString()
  level?: string;

  @ApiProperty({ example: 299, description: 'Цена в рублях' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 7, description: 'Длительность в днях' })
  @IsNumber()
  @Min(1)
  durationDays: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePricingRuleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  level?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  durationDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
