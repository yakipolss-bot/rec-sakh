import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const CreateTagSchema = z.object({
  name: z.string().min(1).max(100),
});

export class CreateTagDto {
  @ApiProperty()
  name: string;
}
