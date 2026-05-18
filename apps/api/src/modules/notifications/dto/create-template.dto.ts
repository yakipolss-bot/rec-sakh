import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType, ChannelType } from '@prisma/client';

export class CreateTemplateDto {
  @ApiProperty({ enum: NotificationType })
  type: NotificationType;

  @ApiProperty({ enum: ChannelType })
  channel: ChannelType;

  @ApiPropertyOptional()
  subject?: string;

  @ApiProperty()
  template: string;
}
