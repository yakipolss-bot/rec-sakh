import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class TopUpBalanceDto {
  @ApiProperty({ example: 500, description: 'Сумма пополнения' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiPropertyOptional({
    description: 'Метод оплаты (по умолчанию yookassa)',
    default: 'yookassa',
  })
  @IsOptional()
  @IsString()
  method?: 'yookassa' | 'sbp' | 'crypto';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  returnUrl?: string;
}
