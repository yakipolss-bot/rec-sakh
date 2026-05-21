import { Injectable } from '@nestjs/common';
import { AbilityBuilder, MongoAbility, createMongoAbility } from '@casl/ability';
import { PrismaService } from '../common/prisma/prisma.service.js';

export type Action = 'manage' | 'create' | 'read' | 'update' | 'delete';
export type Subject = 'all' | 'User' | 'News' | 'Comment' | 'Category' | 'Tag' | 'Event' | 'Ad' | 'Job' | 'Realty' | 'Media' | 'Billing' | 'Settings' | 'Staff';
export type AppAbility = MongoAbility<[Action, Subject]>;

@Injectable()
export class CaslAbilityFactory {
  constructor(private prisma: PrismaService) {}

  async createForUser(userId: string): Promise<AppAbility> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return createMongoAbility<[Action, Subject]>([]);
    }

    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { role: user.role },
      include: { permission: true },
    });

    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    for (const rp of rolePermissions) {
      can(rp.permission.action as Action, rp.permission.subject as Subject);
    }

    return build();
  }
}
