import { ApiProperty } from '@nestjs/swagger';

class ErrorDetail {
  @ApiProperty()
  field: string;

  @ApiProperty()
  message: string;

  @ApiProperty()
  code: string;
}

export class ErrorResponseDto {
  @ApiProperty()
  code: string;

  @ApiProperty()
  message: string;

  @ApiProperty({ type: [ErrorDetail], required: false })
  details?: ErrorDetail[];

  @ApiProperty()
  requestId: string;

  @ApiProperty()
  timestamp: string;
}
