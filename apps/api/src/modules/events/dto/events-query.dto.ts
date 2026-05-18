import { ApiPropertyOptional } from '@nestjs/swagger';

export class EventsQueryDto {
  @ApiPropertyOptional()
  page?: string;

  @ApiPropertyOptional()
  perPage?: string;

  @ApiPropertyOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional()
  dateFrom?: string;

  @ApiPropertyOptional()
  dateTo?: string;

  @ApiPropertyOptional()
  isFree?: string;

  @ApiPropertyOptional()
  status?: string;

  @ApiPropertyOptional()
  search?: string;

  @ApiPropertyOptional()
  sort?: string;
}
