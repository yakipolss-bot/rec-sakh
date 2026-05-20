import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  @Get('status')
  @Public()
  @ApiOperation({ summary: 'Проверка статуса Auth (заменён на Supabase Auth)' })
  status() {
    return { auth: 'supabase', status: 'ok' };
  }
}
