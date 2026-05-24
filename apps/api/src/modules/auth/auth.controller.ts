import {
  Controller, Get, Post, Body, Headers,
  UnauthorizedException, BadRequestException, HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator.js';
import { SupabaseService } from '../../common/supabase/supabase.service.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @Get('status')
  @Public()
  @ApiOperation({ summary: 'Проверка статуса Auth' })
  status() {
    return { auth: 'supabase', status: 'ok' };
  }

  @Post('login')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Вход по email + пароль' })
  async login(@Body() body: { email: string; password: string }) {
    if (!body.email || !body.password) {
      throw new BadRequestException('Email and password are required');
    }
    const result = await this.supabaseService.signInWithPassword(body.email, body.password);
    return {
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.user_metadata?.name || result.user.email?.split('@')[0] || 'User',
        role: result.user.app_metadata?.role || 'authenticated',
        avatarUrl: result.user.user_metadata?.avatar_url || null,
      },
    };
  }

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Регистрация нового пользователя' })
  async register(@Body() body: { email: string; password: string; name?: string; phone?: string }) {
    if (!body.email || !body.password) {
      throw new BadRequestException('Email and password are required');
    }
    const result = await this.supabaseService.signUp(body.email, body.password, {
      data: { name: body.name || body.email.split('@')[0], ...(body.phone ? { phone: body.phone } : {}) },
    });

    if ('access_token' in result && result.access_token) {
      return {
        accessToken: result.access_token,
        refreshToken: result.refresh_token,
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.user_metadata?.name || result.user.email?.split('@')[0] || 'User',
          role: 'authenticated',
          avatarUrl: null,
        },
      };
    }

    const created = result as { id: string; email: string };
    return { message: 'Registration successful. Check your email to confirm.', user: { id: created.id, email: created.email } };
  }

  @Post('logout')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Выход (инвалидация токена)' })
  async logout(@Body() body: { accessToken?: string }, @Headers('authorization') auth?: string) {
    const token = body.accessToken || auth?.replace('Bearer ', '');
    if (!token) {
      throw new UnauthorizedException('Access token is required');
    }
    await this.supabaseService.signOut(token);
    return { message: 'Logged out successfully' };
  }

  @Post('refresh')
  @Public()
  @ApiOperation({ summary: 'Обновление токена' })
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

  @Post('forgot-password')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Отправка ссылки для восстановления пароля' })
  async forgotPassword(@Body() body: { email: string }) {
    if (!body.email) {
      throw new BadRequestException('Email is required');
    }
    await this.supabaseService.resetPasswordForEmail(body.email);
    return { message: 'If the email exists, a recovery link has been sent.' };
  }

  @Post('reset-password')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Смена пароля (требуется access_token из recovery ссылки)' })
  async resetPassword(
    @Body() body: { password: string },
    @Headers('authorization') auth: string,
  ) {
    if (!body.password) {
      throw new BadRequestException('New password is required');
    }
    const token = auth?.replace('Bearer ', '');
    if (!token) {
      throw new UnauthorizedException('Access token is required (from recovery link)');
    }
    await this.supabaseService.updatePassword(token, body.password);
    return { message: 'Password updated successfully' };
  }

  @Post('send-sms')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Отправка SMS кода' })
  async sendSms(@Body() body: { phone: string }) {
    if (!body.phone) {
      throw new BadRequestException('Phone is required');
    }
    await this.supabaseService.sendOtp(body.phone);
    return { message: 'SMS code sent' };
  }

  @Post('verify-sms')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Подтверждение SMS кода' })
  async verifySms(@Body() body: { phone: string; token: string }) {
    if (!body.phone || !body.token) {
      throw new BadRequestException('Phone and token are required');
    }
    const result = await this.supabaseService.verifyOtp(body.phone, body.token);
    return {
      verified: true,
      ...(result?.access_token ? {
        accessToken: result.access_token,
        refreshToken: result.refresh_token,
        user: {
          id: result.user.id,
          email: result.user.email || '',
          name: result.user.user_metadata?.name || 'User',
          role: 'authenticated',
          avatarUrl: null,
        },
      } : {}),
    };
  }

  @Get('session')
  @Public()
  @ApiOperation({ summary: 'Проверка текущей сессии по Bearer токену' })
  async session(@Headers('authorization') auth: string) {
    if (!auth) {
      return { user: null };
    }
    const token = auth.replace('Bearer ', '');
    if (!token) {
      return { user: null };
    }
    try {
      const supabaseUser = await this.supabaseService.verifyToken(token);
      return {
        user: {
          id: supabaseUser.id,
          email: supabaseUser.email,
          name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
          role: supabaseUser.app_metadata?.role || 'authenticated',
          avatarUrl: supabaseUser.user_metadata?.avatar_url || null,
        },
      };
    } catch {
      return { user: null };
    }
  }
}
