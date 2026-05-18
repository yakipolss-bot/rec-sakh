import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { RegisterDto, RegisterSchema } from './dto/register.dto.js';
import { LoginDto, LoginSchema } from './dto/login.dto.js';
import { RefreshDto, RefreshSchema } from './dto/refresh.dto.js';
import { RecoverDto, RecoverSchema } from './dto/recover.dto.js';
import { ResetPasswordDto, ResetPasswordSchema } from './dto/reset-password.dto.js';
import { SendSmsDto, SendSmsSchema } from './dto/verify-sms.dto.js';
import { VerifySmsDto, VerifySmsSchema } from './dto/verify-sms.dto.js';
import { Verify2faDto, Verify2faSchema } from './dto/setup-2fa.dto.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Регистрация нового пользователя' })
  @UsePipes(new ZodValidationPipe(RegisterSchema))
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Вход по email/password' })
  @UsePipes(new ZodValidationPipe(LoginSchema))
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Обновление токенов' })
  @UsePipes(new ZodValidationPipe(RefreshSchema))
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Выход (отзыв токенов)' })
  async logout(@CurrentUser('id') userId: string) {
    await this.authService.logout(userId);
  }

  @Post('recover')
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Восстановление пароля' })
  @UsePipes(new ZodValidationPipe(RecoverSchema))
  async recover(@Body() dto: RecoverDto) {
    return this.authService.recover(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Сброс пароля по токену' })
  @UsePipes(new ZodValidationPipe(ResetPasswordSchema))
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.password);
  }

  @Get('oauth/:provider')
  @Public()
  @ApiOperation({ summary: 'Вход через OAuth (Telegram/VK/Яндекс)' })
  async oauthRedirect(
    @Param('provider') provider: string,
    @Query('code') code: string,
  ) {
    return this.authService.oauthLogin(provider, code);
  }

  @Post('sms/send')
  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Отправка SMS кода' })
  @UsePipes(new ZodValidationPipe(SendSmsSchema))
  async sendSms(@Body() dto: SendSmsDto) {
    return this.authService.sendSmsCode(dto.phone);
  }

  @Post('sms/verify')
  @HttpCode(HttpStatus.OK)
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Верификация SMS кода' })
  @UsePipes(new ZodValidationPipe(VerifySmsSchema))
  async verifySms(@Body() dto: VerifySmsDto) {
    return this.authService.verifySmsCode(dto.phone, dto.code);
  }

  @Post('2fa/setup')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Настройка 2FA (генерация секрета)' })
  async setup2fa(@CurrentUser('id') userId: string) {
    return this.authService.setup2fa(userId);
  }

  @Post('2fa/verify')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Верификация 2FA кода' })
  @UsePipes(new ZodValidationPipe(Verify2faSchema))
  async verify2fa(@CurrentUser('id') userId: string, @Body() dto: Verify2faDto) {
    return this.authService.verify2fa(userId, dto.code);
  }

  @Post('2fa/disable')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Отключение 2FA' })
  async disable2fa(@CurrentUser('id') userId: string) {
    await this.authService.disable2fa(userId);
  }

  @Post('2fa/recovery')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Генерация recovery кодов' })
  async recoveryCodes(@CurrentUser('id') userId: string) {
    return this.authService.generateRecoveryCodes(userId);
  }
}
