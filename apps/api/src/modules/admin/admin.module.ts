import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';
import { AuditService } from './audit.service.js';
import { ModerationService } from './moderation.service.js';
import { SettingsService } from './settings.service.js';
import { StaffService } from './staff.service.js';
import { AnalyticsService } from './analytics.service.js';
import { AuditInterceptor } from './audit.interceptor.js';
import { AdminSchedulerService } from './schedules/admin-scheduler.service.js';

@Module({
  controllers: [AdminController],
  providers: [
    AdminService,
    AuditService,
    ModerationService,
    SettingsService,
    StaffService,
    AnalyticsService,
    AdminSchedulerService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
  exports: [AuditInterceptor],
})
export class AdminModule {}
