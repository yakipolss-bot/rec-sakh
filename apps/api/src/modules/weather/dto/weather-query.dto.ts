import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WeatherQueryDto {
  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional()
  cityCode?: string;
}

export class CreateAlertDto {
  @ApiProperty({ description: 'Код города' })
  city: string;

  @ApiProperty({ enum: ['storm', 'flood', 'snow', 'earthquake', 'tsunami', 'fog', 'heat'] })
  alertType: string;

  @ApiProperty({ enum: ['green', 'yellow', 'orange', 'red'] })
  severity: string;

  @ApiProperty({ description: 'Заголовок предупреждения' })
  title: string;

  @ApiPropertyOptional({ description: 'Описание' })
  description?: string;

  @ApiProperty({ description: 'Дата и время начала (ISO)' })
  startsAt: string;

  @ApiProperty({ description: 'Дата и время окончания (ISO)' })
  endsAt: string;
}
