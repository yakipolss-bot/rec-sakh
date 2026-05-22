import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import { SupabaseService } from '../supabase/supabase.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class JwtAuthGuard {
  private readonly adminEmails: string[] =
    (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

  constructor(
    private reflector: Reflector,
    private supabaseService: SupabaseService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    const supabaseUser = await this.supabaseService.verifyToken(token);
    const email = (supabaseUser.email || '').toLowerCase();
    const isAdmin = this.adminEmails.includes(email);

    let user = await this.prisma.user.findUnique({
      where: { id: supabaseUser.id },
    });

    if (!user) {
      user = await this.prisma.user.findUnique({
        where: { email: supabaseUser.email },
      });
    }

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          id: supabaseUser.id,
          email: supabaseUser.email,
          name: (supabaseUser.user_metadata?.name as string) || supabaseUser.email?.split('@')[0] || 'User',
          role: isAdmin ? 'superadmin' : 'user',
        },
      });
      await this.prisma.userSetting.create({
        data: { userId: user.id },
      }).catch(() => {});
    } else if (isAdmin && user.role !== 'superadmin') {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { role: 'superadmin' },
      });
    }

    request.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      avatarUrl: user.avatarUrl,
    };

    return true;
  }

  private extractToken(request: any): string | null {
    const auth = request.headers?.authorization;
    if (!auth) return null;
    const [type, token] = auth.split(' ');
    return type === 'Bearer' ? token : null;
  }
}
