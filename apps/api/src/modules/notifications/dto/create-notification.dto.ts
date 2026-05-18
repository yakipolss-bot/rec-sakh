import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType, ChannelType } from '@prisma/client';

export class CreateNotificationDto {
  @ApiProperty({ enum: NotificationType })
  type: NotificationType;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  body?: string;

  @ApiPropertyOptional({ enum: ChannelType })
  channel?: ChannelType;

  @ApiPropertyOptional()
  data?: Record<string, any>;
}
