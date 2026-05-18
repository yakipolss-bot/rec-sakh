import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export class RecommendationsQueryDto {
  @ApiPropertyOptional({ default: '10' })
  limit?: string;

  @ApiPropertyOptional({ default: 'news' })
  type?: 'news' | 'events' | 'ads' | 'all';

  @ApiPropertyOptional()
  category?: string;

  @ApiPropertyOptional({ default: '0.7' })
  lambda?: string;
}

export class CreateEditorialPickDto {
  @ApiProperty()
  contentId!: string;

  @ApiProperty({ enum: ['news', 'events', 'ads', 'directory'] })
  contentType!: 'news' | 'events' | 'ads' | 'directory';

  @ApiProperty({ enum: ['pick', 'boost50', 'boost20', 'hide', 'must_read'] })
  action!: 'pick' | 'boost50' | 'boost20' | 'hide' | 'must_read';

  @ApiPropertyOptional()
  userId?: string;

  @ApiPropertyOptional()
  expiresAt?: string;
}
