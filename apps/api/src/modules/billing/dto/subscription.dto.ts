import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class SubscribeDto {
  @ApiProperty({ description: 'ID тарифа' })
  @IsString()
  tariffId: string;

  @ApiProperty({
    enum: [...Object.values(PaymentMethod), 'balance'],
    description: 'Способ оплаты (yookassa, sbp, crypto, balance)',
  })
  @IsString()
  method: PaymentMethod | 'balance';
}
