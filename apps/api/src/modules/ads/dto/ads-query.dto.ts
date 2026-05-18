import { ApiPropertyOptional } from '@nestjs/swagger';

export class AdsQueryDto {
  @ApiPropertyOptional()
  page?: string;

  @ApiPropertyOptional()
  perPage?: string;

  @ApiPropertyOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional()
  priceMin?: string;

  @ApiPropertyOptional()
  priceMax?: string;

  @ApiPropertyOptional()
  search?: string;

  @ApiPropertyOptional()
  sort?: string;

  @ApiPropertyOptional()
  status?: string;
}
