import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CaslAbilityFactory } from '../../casl/casl-ability.factory.js';
import { CHECK_ABILITY_KEY, RequiredRule } from '../decorators/abilities.decorator.js';

@Injectable()
export class AbilitiesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rules = this.reflector.get<RequiredRule[]>(
      CHECK_ABILITY_KEY,
      context.getHandler(),
    ) || [];

    if (rules.length === 0) {
      return true;
    }

    const request: { user?: { id: string; role: string } } = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('Not authenticated');
    }

    const ability = await this.caslAbilityFactory.createForUser(user.id);

    for (const rule of rules) {
      const isAllowed = ability.can(rule.action, rule.subject);
      if (!isAllowed) {
        throw new ForbiddenException(
          `Cannot ${rule.action} ${rule.subject}`,
        );
      }
    }

    return true;
  }
}
