import { ApiPropertyOptional } from '@nestjs/swagger';

export class RealtyQueryDto {
  @ApiPropertyOptional()
  page?: string;

  @ApiPropertyOptional()
  perPage?: string;

  @ApiPropertyOptional()
  type?: string;

  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional()
  priceMin?: string;

  @ApiPropertyOptional()
  priceMax?: string;

  @ApiPropertyOptional()
  rooms?: string;

  @ApiPropertyOptional()
  floor?: string;

  @ApiPropertyOptional()
  houseType?: string;

  @ApiPropertyOptional()
  sort?: string;
}
