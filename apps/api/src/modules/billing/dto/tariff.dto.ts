import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { TariffInterval } from '@prisma/client';

export class CreateTariffDto {
  @ApiProperty({ example: 'Sakhcom+ Monthly', description: 'Название тарифа' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Премиум подписка на месяц' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 299, description: 'Цена в рублях' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ enum: TariffInterval, description: 'Интервал тарифа' })
  @IsEnum(TariffInterval)
  interval: TariffInterval;

  @ApiPropertyOptional({ description: 'Список возможностей', example: ['Без рекламы', 'Эксклюзивные материалы'] })
  @IsOptional()
  features?: string[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Порядок сортировки' })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class UpdateTariffDto {
  @ApiPropertyOptional({ example: 'Sakhcom+ Monthly' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 299 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ enum: TariffInterval })
  @IsOptional()
  @IsEnum(TariffInterval)
  interval?: TariffInterval;

  @ApiPropertyOptional()
  @IsOptional()
  features?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
