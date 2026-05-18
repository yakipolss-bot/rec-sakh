import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as bcrypt from 'bcryptjs';
import * as speakeasy from 'speakeasy';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private smsCodes = new Map<string, { codeHash: string; expiresAt: number }>();
  private recoveryCodes = new Map<string, string[]>();

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  cleanSmsCodes() {
    const now = Date.now();
    for (const [key, value] of this.smsCodes.entries()) {
      if (value.expiresAt < now) {
        this.smsCodes.delete(key);
      }
    }
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email уже зарегистрирован');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        phone: dto.phone,
        role: 'user',
      },
    });

    await this.prisma.userSetting.create({
      data: { userId: user.id },
    });

    const tokens = await this.generateTokens(user.id, user.role);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || user.status === 'deleted') {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    // M16: Если у пользователя указан телефон, он должен быть подтверждён
    if (user.phone && !user.isPhoneVerified) {
      throw new UnauthorizedException('Телефон не подтверждён. Подтвердите номер телефона.');
    }

    const tokens = await this.generateTokens(user.id, user.role);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        algorithms: ['HS256'],
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.status === 'deleted') {
        throw new UnauthorizedException();
      }

      // M5: Удаляем только ту сессию, которая соответствует данному refresh-токену (не все сессии пользователя)
      const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      const session = await this.prisma.session.findUnique({
        where: { refreshToken: refreshTokenHash },
      });
      if (session) {
        await this.prisma.session.delete({ where: { id: session.id } });
      }

      const tokens = await this.generateTokens(user.id, user.role);
      return {
        user: this.sanitizeUser(user),
        ...tokens,
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    await this.prisma.session.deleteMany({
      where: { userId },
    });
  }

  async recover(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { message: 'Если email зарегистрирован, ссылка для восстановления отправлена' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    await this.prisma.passwordResetToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    return { message: 'Если email зарегистрирован, ссылка для восстановления отправлена' };
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!resetToken || resetToken.expiresAt < new Date()) {
      throw new NotFoundException('Token is invalid or expired');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    });

    await this.prisma.passwordResetToken.delete({
      where: { tokenHash },
    });
  }

  // @TODO: Real OAuth integration. Currently mock.
  async oauthLogin(provider: string, code: string) {
    const mockEmails: Record<string, string> = {
      telegram: `telegram_${code}@oauth.mock`,
      vk: `vk_${code}@oauth.mock`,
      yandex: `yandex_${code}@oauth.mock`,
    };

    const email = mockEmails[provider];
    if (!email) {
      throw new BadRequestException('Unsupported OAuth provider');
    }

    let user = await this.prisma.user.findFirst({
      where: {
        oauthAccounts: {
          some: {
            provider: provider as any,
            providerAccountId: code,
          },
        },
      },
    });

    if (!user) {
      user = await this.prisma.user.findUnique({ where: { email } });

      if (!user) {
        user = await this.prisma.user.create({
          data: {
            email,
            name: `${provider} User`,
            passwordHash: await bcrypt.hash(crypto.randomUUID(), 12),
            role: 'user',
          },
        });

        await this.prisma.userSetting.create({
          data: { userId: user.id },
        });
      }

      await this.prisma.oAuthAccount.create({
        data: {
          userId: user.id,
          provider: provider as any,
          providerAccountId: code,
          providerData: {},
        },
      });
    }

    const tokens = await this.generateTokens(user.id, user.role);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async sendSmsCode(phone: string) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    this.smsCodes.set(phone, {
      codeHash,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });
    return { message: 'SMS код отправлен' };
  }

  async verifySmsCode(phone: string, code: string) {
    const stored = this.smsCodes.get(phone);
    if (!stored || stored.expiresAt < Date.now()) {
      throw new BadRequestException('Код не найден или истёк');
    }
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    if (stored.codeHash !== codeHash) {
      throw new BadRequestException('Неверный код');
    }
    this.smsCodes.delete(phone);

    const user = await this.prisma.user.findFirst({ where: { phone } });
    if (user) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { isPhoneVerified: true },
      });
    }

    return { message: 'Телефон подтверждён', verified: true };
  }

  async setup2fa(userId: string) {
    const secret = speakeasy.generateSecret({ length: 20 });
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret.base32 },
    });
    return { secret: secret.base32, qrUrl: secret.otpauth_url };
  }

  async verify2fa(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.twoFactorSecret) {
      throw new BadRequestException('2FA не настроен');
    }
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
    });
    if (!verified) {
      throw new BadRequestException('Неверный код');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });
    return { message: '2FA включена', enabled: true };
  }

  async disable2fa(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });
  }

  async generateRecoveryCodes(userId: string) {
    const codes = Array.from({ length: 8 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase(),
    );
    this.recoveryCodes.set(userId, codes);
    return { recoveryCodes: codes };
  }

  async generateTokens(userId: string, role: string) {
    const payload = { sub: userId, role };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: (this.configService.get('JWT_EXPIRES_IN', '1h')) as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: (this.configService.get('JWT_REFRESH_EXPIRES_IN', '30d')) as any,
    });

    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await this.prisma.session.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        refreshToken: refreshTokenHash,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  sanitizeUser(user: any) {
    const { passwordHash, ...rest } = user;
    return rest;
  }
}
