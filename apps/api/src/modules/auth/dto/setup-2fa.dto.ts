import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const Verify2faSchema = z.object({
  code: z.string().length(6),
});

export class Verify2faDto {
  @ApiProperty({ example: '123456' })
  code: string;
}
