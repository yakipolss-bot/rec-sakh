import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const SendSmsSchema = z.object({
  phone: z.string().min(10).max(15),
});

export class SendSmsDto {
  @ApiProperty({ example: '+79991234567' })
  phone: string;
}

export const VerifySmsSchema = z.object({
  phone: z.string().min(10).max(15),
  code: z.string().length(6),
});

export class VerifySmsDto {
  @ApiProperty({ example: '+79991234567' })
  phone: string;

  @ApiProperty({ example: '123456' })
  code: string;
}
