import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown) {
    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException(
          error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
            code: 'VALIDATION_ERROR',
          })),
        );
      }
      throw error;
    }
  }
}
