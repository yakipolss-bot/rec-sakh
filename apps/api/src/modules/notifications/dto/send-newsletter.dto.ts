import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendNewsletterDto {
  @ApiProperty()
  title: string;

  @ApiProperty()
  content: string;

  @ApiPropertyOptional()
  scheduledAt?: string;

  @ApiPropertyOptional()
  type?: string;

  @ApiPropertyOptional()
  targetAudience?: Record<string, any>;
}
