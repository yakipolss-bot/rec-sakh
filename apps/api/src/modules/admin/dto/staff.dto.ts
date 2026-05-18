import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStaffDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty({
    enum: [
      'journalist',
      'editor',
      'proofreader',
      'photo_editor',
      'video_editor',
      'moderator',
    ],
  })
  @IsString()
  position: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional()
  @IsOptional()
  schedule?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}

export class UpdateStaffDto {
  @ApiPropertyOptional({
    enum: [
      'journalist',
      'editor',
      'proofreader',
      'photo_editor',
      'video_editor',
      'moderator',
    ],
  })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  kpiScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  schedule?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}
