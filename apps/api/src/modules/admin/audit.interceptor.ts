import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator.js';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private prisma: PrismaService,
    private reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip, headers } = request;
    const user = request.user as { id?: string } | undefined;

    // H3: Sanitize sensitive fields from audit logs
    const sensitiveFields = ['password', 'passwordHash', 'token', 'secret', 'code', 'refreshToken', 'twoFactorSecret'];
    const sanitizedBody = Object.fromEntries(
      Object.entries(request.body || {}).filter(([k]) => !sensitiveFields.includes(k))
    ) as any;

    // Не логируем GET запросы
    if (method === 'GET') {
      return next.handle();
    }

    // Не логируем публичные эндпоинты
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        const entityType = context.getClass().name;
        const entityId = request.params?.id as string | undefined;

        // Асинхронно сохраняем audit log (не блокируем ответ)
        this.prisma.auditLog
          .create({
            data: {
              userId: user?.id,
              action: `${method} ${url.split('?')[0]}`,
              entityType,
              entityId,
              changes: method !== 'GET' ? { body: sanitizedBody } : {},
              ipAddress: ip,
              userAgent: headers?.['user-agent'] as string | undefined,
            },
          })
          .catch(() => {
            // silent fail для audit — не ломаем основной запрос
          });
      }),
    );
  }
}
