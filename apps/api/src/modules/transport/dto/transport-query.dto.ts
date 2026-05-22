import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

// --- Query DTOs ---

export class TransportScheduleQueryDto {
  @IsOptional() @IsString()
  @ApiPropertyOptional({ enum: ['bus', 'train'] })
  type?: string;

  @IsOptional() @IsString()
  @ApiPropertyOptional()
  city?: string;

  @IsOptional() @IsString()
  @ApiPropertyOptional()
  routeName?: string;
}

export class TransportFlightQueryDto {
  @IsOptional() @IsString()
  @ApiPropertyOptional()
  date?: string;

  @IsOptional() @IsString()
  @ApiPropertyOptional({ enum: ['arrival', 'departure'] })
  type?: string;
}

export class TransportFerryQueryDto {
  @IsOptional() @IsString()
  @ApiPropertyOptional()
  date?: string;

  @IsOptional() @IsString()
  @ApiPropertyOptional()
  route?: string;
}

// --- Admin DTOs ---

export class CreateFlightDto {
  @ApiProperty({ example: 'SU6284' })
  flightNumber: string;

  @ApiPropertyOptional({ example: 'Аэрофлот' })
  airline?: string;

  @ApiPropertyOptional({ example: 'Москва (SVO)' })
  departureCity?: string;

  @ApiPropertyOptional({ example: 'Южно-Сахалинск (UUS)' })
  arrivalCity?: string;

  @ApiProperty({ example: '2026-05-20T08:30:00+03:00' })
  departureTime: string;

  @ApiProperty({ example: '2026-05-20T22:30:00+11:00' })
  arrivalTime: string;

  @ApiPropertyOptional({ example: 'on-time' })
  status?: string;

  @ApiPropertyOptional({ example: 'B' })
  terminal?: string;

  @ApiPropertyOptional({ example: '12' })
  gate?: string;

  @ApiProperty({ example: '2026-05-20' })
  date: string;
}

export class UpdateFlightDto {
  @ApiPropertyOptional({ example: 'delayed' })
  status?: string;

  @ApiPropertyOptional({ example: 'C' })
  terminal?: string;

  @ApiPropertyOptional({ example: '15' })
  gate?: string;

  @ApiPropertyOptional({ example: '2026-05-20T09:00:00+03:00' })
  departureTime?: string;

  @ApiPropertyOptional({ example: '2026-05-20T23:00:00+11:00' })
  arrivalTime?: string;
}

export class CreateFerryDto {
  @ApiProperty({ example: 'Ванино-Холмск' })
  route: string;

  @ApiPropertyOptional({ example: 'Сахалин-8' })
  vesselName?: string;

  @ApiPropertyOptional({ example: 'Ванино' })
  departurePort?: string;

  @ApiPropertyOptional({ example: 'Холмск' })
  arrivalPort?: string;

  @ApiProperty({ example: '2026-05-20T08:00:00+10:00' })
  departureTime: string;

  @ApiProperty({ example: '2026-05-20T20:00:00+11:00' })
  arrivalTime: string;

  @ApiPropertyOptional({ example: 'scheduled' })
  status?: string;

  @ApiProperty({ example: '2026-05-20' })
  date: string;
}

export class UpdateRoadDto {
  @ApiPropertyOptional({ example: 'open' })
  status?: string;

  @ApiPropertyOptional({ example: 'Состояние удовлетворительное' })
  conditionDescription?: string;
}

export class CreateScheduleDto {
  @ApiProperty({ enum: ['bus', 'train'] })
  type: string;

  @ApiProperty({ example: '1' })
  routeName: string;

  @ApiPropertyOptional({ example: ['Ж/д вокзал', 'пл. Ленина'] })
  stops?: string[];

  @ApiPropertyOptional({ example: { weekday: '05:30–23:00', interval: '10–15 мин' } })
  schedule?: Record<string, any>;

  @ApiPropertyOptional({ example: 'Южно-Сахалинск' })
  city?: string;
}
