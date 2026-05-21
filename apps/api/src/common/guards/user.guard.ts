import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class UserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request: {
      params: { id?: string };
      user?: { id: string; role: string };
    } = context.switchToHttp().getRequest();

    const user = request.user;
    const targetId = request.params.id;

    if (!user || !targetId) {
      throw new ForbiddenException('Access denied');
    }

    if (user.role === 'admin' || user.role === 'superadmin') {
      return true;
    }

    if (user.id === targetId) {
      return true;
    }

    throw new ForbiddenException('You can only access your own data');
  }
}
