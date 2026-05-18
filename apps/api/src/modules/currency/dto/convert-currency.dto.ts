import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConvertCurrencyDto {
  @ApiProperty({ example: 100 })
  amount: number;

  @ApiProperty({ example: 'USD' })
  from: string;

  @ApiProperty({ example: 'RUB' })
  to: string;
}

export class CurrencyHistoryDto {
  @ApiProperty({ example: 'USD' })
  code: string;

  @ApiPropertyOptional()
  from?: string;

  @ApiPropertyOptional()
  to?: string;
}
