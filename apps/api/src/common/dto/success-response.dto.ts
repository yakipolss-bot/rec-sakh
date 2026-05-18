import { ApiProperty } from '@nestjs/swagger';

export class SuccessResponseDto<T> {
  data: T;

  @ApiProperty()
  meta: {
    requestId: string;
    timestamp: string;
    page?: number;
    perPage?: number;
    total?: number;
    totalPages?: number;
  };
}
