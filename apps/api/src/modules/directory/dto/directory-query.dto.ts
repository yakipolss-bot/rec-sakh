import { ApiPropertyOptional } from '@nestjs/swagger';

export class DirectoryQueryDto {
  @ApiPropertyOptional()
  page?: string;

  @ApiPropertyOptional()
  perPage?: string;

  @ApiPropertyOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional()
  search?: string;

  @ApiPropertyOptional()
  sort?: string;
}
