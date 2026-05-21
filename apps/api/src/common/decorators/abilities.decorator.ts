import { SetMetadata } from '@nestjs/common';
import type { Action, Subject } from '../../casl/casl-ability.factory.js';

export interface RequiredRule {
  action: Action;
  subject: Subject;
}

export const CHECK_ABILITY_KEY = 'check_ability';

export const CheckAbilities = (...requirements: RequiredRule[]) =>
  SetMetadata(CHECK_ABILITY_KEY, requirements);

export const Can = (action: Action, subject: Subject): RequiredRule => ({
  action,
  subject,
});
