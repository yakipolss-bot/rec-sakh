import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentType } from '@prisma/client';

export class CreateCategoryDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  icon?: string;

  @ApiPropertyOptional()
  parentId?: string;

  @ApiPropertyOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ enum: ContentType })
  type?: ContentType;
}
