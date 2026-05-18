import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubscribePushDto {
  @ApiProperty()
  endpoint: string;

  @ApiProperty()
  p256dhKey: string;

  @ApiProperty()
  authKey: string;

  @ApiPropertyOptional()
  userAgent?: string;
}
