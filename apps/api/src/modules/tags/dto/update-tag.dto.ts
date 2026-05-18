import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const UpdateTagSchema = z.object({
  name: z.string().min(1).max(100),
});

export class UpdateTagDto {
  @ApiProperty()
  name: string;
}
