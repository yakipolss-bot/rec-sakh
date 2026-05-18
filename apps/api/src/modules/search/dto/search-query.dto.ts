import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchQueryDto {
  @ApiPropertyOptional()
  q?: string;

  @ApiPropertyOptional()
  type?: string;

  @ApiPropertyOptional()
  category?: string;

  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional()
  dateFrom?: string;

  @ApiPropertyOptional()
  dateTo?: string;

  @ApiPropertyOptional()
  page?: string;

  @ApiPropertyOptional()
  perPage?: string;
}

export class SuggestionsQueryDto {
  @ApiPropertyOptional()
  q?: string;

  @ApiPropertyOptional()
  limit?: string;
}

export class FacetsQueryDto {
  @ApiPropertyOptional()
  q?: string;

  @ApiPropertyOptional()
  type?: string;

  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional()
  dateFrom?: string;

  @ApiPropertyOptional()
  dateTo?: string;
}

export class RelatedQueryDto {
  @ApiPropertyOptional()
  q?: string;
}
