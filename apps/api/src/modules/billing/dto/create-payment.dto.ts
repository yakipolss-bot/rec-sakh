import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class CreatePaymentDto {
  @ApiProperty({ enum: PaymentMethod, description: 'Способ оплаты' })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({ example: 299, description: 'Сумма в рублях' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ example: 'Пополнение баланса', description: 'Назначение платежа' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'URL возврата после оплаты' })
  @IsOptional()
  @IsString()
  returnUrl?: string;

  @ApiPropertyOptional({ description: 'Дополнительные метаданные' })
  @IsOptional()
  metadata?: Record<string, any>;
}
