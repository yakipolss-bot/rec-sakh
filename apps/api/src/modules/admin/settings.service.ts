import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async get(key: string) {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      const defaults = await this.getDefaults();
      if (key in defaults) {
        return { key, value: defaults[key] };
      }
      throw new NotFoundException(`Setting "${key}" not found`);
    }

    return setting;
  }

  async set(key: string, value: any, userId: string) {
    return this.prisma.systemSetting.upsert({
      where: { key },
      create: {
        key,
        value,
        updatedBy: userId,
      },
      update: {
        value,
        updatedBy: userId,
      },
    });
  }

  async getAll() {
    const dbSettings = await this.prisma.systemSetting.findMany({
      orderBy: { key: 'asc' },
      include: {
        updater: {
          select: { id: true, name: true },
        },
      },
    });

    const defaults = await this.getDefaults();
    const dbMap = new Map(dbSettings.map((s) => [s.key, s]));

    // Объединяем настройки из БД с дефолтными
    const merged = Object.entries(defaults).map(([key, defaultValue]) => {
      const dbSetting = dbMap.get(key);
      return {
        key,
        value: dbSetting ? dbSetting.value : defaultValue,
        updatedBy: dbSetting?.updatedBy ?? null,
        updatedAt: dbSetting?.updatedAt ?? null,
        updater: dbSetting?.updater ?? null,
        isDefault: !dbSetting,
      };
    });

    // Добавляем настройки из БД, которых нет в defaults
    for (const dbSetting of dbSettings) {
      if (!(dbSetting.key in defaults)) {
        merged.push({
          key: dbSetting.key,
          value: dbSetting.value,
          updatedBy: dbSetting.updatedBy,
          updatedAt: dbSetting.updatedAt,
          updater: dbSetting.updater,
          isDefault: false,
        });
      }
    }

    return merged;
  }

  async delete(key: string) {
    try {
      await this.prisma.systemSetting.delete({
        where: { key },
      });
    } catch {
      throw new NotFoundException(`Setting "${key}" not found`);
    }
  }

  async getDefaults(): Promise<Record<string, any>> {
    return {
      site_name: 'Sakhcom',
      site_description: 'Новости Сахалина и Курильских островов',
      site_logo: '/logo.png',
      site_favicon: '/favicon.ico',
      maintenance_mode: false,
      comments_auto_approve: false,
      comments_karma_threshold: 50,
      ads_premoderation: true,
      events_premoderation: true,
      digest_morning_time: '07:00',
      digest_evening_time: '18:00',
    };
  }
}
