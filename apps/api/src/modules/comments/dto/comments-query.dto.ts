import { ApiPropertyOptional } from '@nestjs/swagger';

export class CommentsQueryDto {
  @ApiPropertyOptional()
  page?: string;

  @ApiPropertyOptional()
  perPage?: string;

  @ApiPropertyOptional()
  newsId?: string;

  @ApiPropertyOptional()
  authorId?: string;

  @ApiPropertyOptional()
  status?: string;

  @ApiPropertyOptional({ enum: ['date', 'karma'] })
  sort?: 'date' | 'karma';
}
