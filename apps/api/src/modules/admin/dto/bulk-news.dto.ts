import { IsArray, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BulkNewsDto {
  @ApiProperty()
  @IsString()
  action: 'publish' | 'archive' | 'delete' | 'set_category' | 'add_tag';

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  ids: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  value?: string;
}
