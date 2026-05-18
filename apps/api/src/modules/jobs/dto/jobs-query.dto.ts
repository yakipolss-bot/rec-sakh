import { ApiPropertyOptional } from '@nestjs/swagger';

export class JobsQueryDto {
  @ApiPropertyOptional()
  page?: string;

  @ApiPropertyOptional()
  perPage?: string;

  @ApiPropertyOptional()
  type?: string;

  @ApiPropertyOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional()
  salaryMin?: string;

  @ApiPropertyOptional()
  salaryMax?: string;

  @ApiPropertyOptional()
  schedule?: string;

  @ApiPropertyOptional()
  search?: string;

  @ApiPropertyOptional()
  sort?: string;
}
