import { Controller, Get, Post, Body, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator.js';
import { SupabaseService } from '../../common/supabase/supabase.service.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @Get('status')
  @Public()
  @ApiOperation({ summary: 'Проверка статуса Auth (заменён на Supabase Auth)' })
  status() {
    return { auth: 'supabase', status: 'ok' };
  }

  @Post('refresh')
  @Public()
  @ApiOperation({ summary: 'Обновление токена через Supabase' })
  async refresh(@Body() body: { refreshToken: string }) {
    if (!body.refreshToken) {
      throw new UnauthorizedException('refreshToken is required');
    }
    const result = await this.supabaseService.refreshToken(body.refreshToken);
    return {
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
    };
  }
}
