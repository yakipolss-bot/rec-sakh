import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const RecoverSchema = z.object({
  email: z.string().email('Некорректный email'),
});

export class RecoverDto {
  @ApiProperty({ example: 'user@example.com' })
  email: string;
}
