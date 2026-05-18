import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChannelType } from '@prisma/client';

export class SubscribeDigestDto {
  @ApiProperty({ enum: ['daily', 'weekly'] })
  type: 'daily' | 'weekly';

  @ApiPropertyOptional({ enum: ChannelType, default: ChannelType.email })
  channel?: ChannelType;
}
