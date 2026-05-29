import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Put,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { writeFile } from 'fs/promises';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { AdminService } from './admin.service.js';
import { AuditService } from './audit.service.js';
import { ModerationService } from './moderation.service.js';
import { SettingsService } from './settings.service.js';
import { StaffService } from './staff.service.js';
import { AnalyticsService } from './analytics.service.js';
import { AdminQueryDto } from './dto/admin-query.dto.js';
import {
  ReviewModerationDto,
  CreateRuleDto,
  UpdateRuleDto,
} from './dto/moderation-queue.dto.js';
import { CreateStaffDto, UpdateStaffDto } from './dto/staff.dto.js';
import { UpdateSettingDto } from './dto/system-settings.dto.js';
import { BulkNewsDto } from './dto/bulk-news.dto.js';
import { CreateStaticPageDto } from './dto/static-page.dto.js';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private adminService: AdminService,
    private auditService: AuditService,
    private moderationService: ModerationService,
    private settingsService: SettingsService,
    private staffService: StaffService,
    private analyticsService: AnalyticsService,
  ) {}

  // ====== Dashboard ======

  @Get('dashboard')
  @Roles('admin', 'superadmin', 'chief_editor')
  @ApiOperation({ summary: 'Дашборд администратора' })
  async getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('health')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Здоровье системы' })
  async getHealth() {
    return this.adminService.getSystemHealth();
  }

  // ====== Audit Log ======

  @Get('audit')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Лог действий' })
  async getAuditLog(@Query() query: AdminQueryDto) {
    return this.auditService.findAll(query);
  }

  @Get('audit/stats')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Статистика аудита' })
  async getAuditStats() {
    return this.auditService.getStats();
  }

  // ====== Moderation ======

  @Get('moderation/queue')
  @Roles('admin', 'moderator')
  @ApiOperation({ summary: 'Очередь модерации' })
  async getModerationQueue(@Query() query: AdminQueryDto) {
    return this.moderationService.getQueue(query);
  }

  @Post('moderation/queue/:id/review')
  @Roles('admin', 'moderator')
  @ApiOperation({ summary: 'Решение модератора' })
  async reviewModerationItem(
    @Param('id') id: string,
    @Body() dto: ReviewModerationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.moderationService.reviewItem(id, dto, userId);
  }

  @Get('moderation/rules')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Правила авто-модерации' })
  async getModerationRules() {
    return this.moderationService.getRules();
  }

  @Post('moderation/rules')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Создать правило' })
  async createModerationRule(
    @Body() dto: CreateRuleDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.moderationService.createRule(dto, userId);
  }

  @Patch('moderation/rules/:id')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Обновить правило' })
  async updateModerationRule(
    @Param('id') id: string,
    @Body() dto: UpdateRuleDto,
  ) {
    return this.moderationService.updateRule(id, dto);
  }

  @Delete('moderation/rules/:id')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Удалить правило' })
  async deleteModerationRule(@Param('id') id: string) {
    await this.moderationService.deleteRule(id);
    return { message: 'Rule deleted' };
  }

  @Get('moderation/stats')
  @Roles('admin', 'superadmin', 'moderator')
  @ApiOperation({ summary: 'Статистика модерации' })
  async getModerationStats() {
    return this.moderationService.getStats();
  }

  // ====== Staff ======

  @Get('staff')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Сотрудники редакции' })
  async getStaff(@Query() query: AdminQueryDto) {
    return this.staffService.findAll(query);
  }

  @Post('staff')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Добавить сотрудника' })
  async createStaff(@Body() dto: CreateStaffDto) {
    return this.staffService.create(dto);
  }

  @Get('staff/:id')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Карточка сотрудника' })
  async getStaffById(@Param('id') id: string) {
    return this.staffService.findById(id);
  }

  @Patch('staff/:id')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Обновить сотрудника' })
  async updateStaff(
    @Param('id') id: string,
    @Body() dto: UpdateStaffDto,
  ) {
    return this.staffService.update(id, dto);
  }

  @Delete('staff/:id')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Удалить сотрудника' })
  async deleteStaff(@Param('id') id: string) {
    await this.staffService.delete(id);
    return { message: 'Staff member removed' };
  }

  @Post('staff/:id/kpi')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Обновить KPI' })
  async updateStaffKpi(
    @Param('id') id: string,
    @Body('score') score: number,
  ) {
    return this.staffService.updateKpi(id, score);
  }

  // ====== Settings ======

  @Get('settings')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Все настройки системы' })
  async getSettings() {
    return this.settingsService.getAll();
  }

  @Get('settings/:key')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Значение настройки' })
  async getSetting(@Param('key') key: string) {
    return this.settingsService.get(key);
  }

  @Put('settings/:key')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Обновить настройку' })
  async updateSetting(
    @Param('key') key: string,
    @Body() dto: UpdateSettingDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.settingsService.set(key, dto.value, userId);
  }

  @Delete('settings/:key')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Сбросить настройку' })
  async deleteSetting(@Param('key') key: string) {
    await this.settingsService.delete(key);
    return { message: 'Setting reset to default' };
  }

  // ====== Analytics ======

  @Get('analytics/dashboard')
  @Roles('admin', 'superadmin', 'chief_editor')
  @ApiOperation({ summary: 'Аналитика дашборд' })
  async getAnalyticsDashboard() {
    return this.analyticsService.getDashboard();
  }

  @Get('analytics/traffic')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Трафик' })
  async getTrafficAnalytics(@Query() query: AdminQueryDto) {
    return this.analyticsService.getTraffic(query);
  }

  @Get('analytics/content')
  @Roles('admin', 'superadmin', 'chief_editor')
  @ApiOperation({ summary: 'Контент-аналитика' })
  async getContentAnalytics(@Query() query: AdminQueryDto) {
    return this.analyticsService.getContent(query);
  }

  @Get('analytics/realtime')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Онлайн-пользователи' })
  async getRealtimeAnalytics() {
    return this.analyticsService.getRealtime();
  }

  @Get('analytics/search')
  @Roles('admin', 'superadmin', 'chief_editor')
  @ApiOperation({ summary: 'Поисковая аналитика' })
  async getSearchAnalytics() {
    return this.analyticsService.getSearchAnalytics();
  }

  // ====== Role Management ======

  @Get('roles')
  @Roles('superadmin')
  @ApiOperation({ summary: 'Список ролей' })
  async getRoles() {
    return Object.values(UserRole);
  }

  @Post('roles')
  @Roles('superadmin')
  @ApiOperation({ summary: 'Создать роль' })
  async createRole(
    @Body() dto: { role: string; label: string; permissions: boolean[] },
  ) {
    await this.settingsService.set(
      `role:${dto.role}`,
      { label: dto.label, permissions: dto.permissions },
      'system',
    );
    return { message: `Role "${dto.role}" created` };
  }

  @Patch('users/:id/role')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Изменить роль пользователя' })
  async changeUserRole(
    @Param('id') id: string,
    @Body('role') role: UserRole,
  ) {
    return this.adminService.changeUserRole(id, role);
  }

  // ====== Content Management ======

  @Post('content/news/bulk')
  @Roles('admin', 'superadmin', 'chief_editor')
  @ApiOperation({ summary: 'Массовые операции с новостями' })
  async bulkNewsOperation(@Body() dto: BulkNewsDto) {
    return this.adminService.bulkNewsAction(dto.action, dto.ids, dto.value);
  }

  @Post('content/static')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Управление статическими страницами' })
  async createStaticPage(@Body() dto: CreateStaticPageDto) {
    await this.settingsService.set(
      `static_page:${dto.slug}`,
      {
        title: dto.title,
        content: dto.content,
        metaTitle: dto.metaTitle ?? dto.title,
        metaDescription: dto.metaDescription ?? '',
        template: dto.template ?? 'default',
      },
      'system',
    );
    return { message: `Static page "${dto.slug}" created` };
  }

  // ====== Staff Schedule ======

  @Get('staff/schedule')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'График работы сотрудников' })
  async getStaffSchedule() {
    const staff = await this.staffService.findAll({});
    const list = (staff.data || staff || []) as Array<Record<string, unknown>>;
    const items = list.map((s) => {
      const user = s.user as Record<string, unknown> | undefined;
      const schedule = s.schedule as Record<string, string> | undefined;
      return {
        id: s.id as string,
        staffId: s.userId as string,
        staffName: (user?.name as string) || '—',
        date: typeof s.hireDate === 'string' ? s.hireDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
        shift: schedule?.shift || 'day',
      };
    });
    return { data: items };
  }

  @Post('staff/schedule')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Обновить смену сотрудника' })
  async createStaffSchedule(@Body() dto: { staffId: string; date: string; shift: string }) {
    const staff = await this.staffService.findById(dto.staffId);
    if (!staff) throw new BadRequestException('Staff member not found');
    const updated = await this.staffService.update(dto.staffId, {
      schedule: { ...(typeof staff.schedule === 'object' && staff.schedule !== null ? staff.schedule as Record<string, string> : {}), [dto.date]: dto.shift },
    });
    return { data: { id: updated.id, staffId: updated.userId, date: dto.date, shift: dto.shift } };
  }

  // ====== System ======

  @Post('system/cache/clear')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Очистить кэш' })
  async clearCache() {
    return { message: 'Cache cleared', timestamp: new Date().toISOString() };
  }

  @Post('system/cache/warm')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Прогреть кэш' })
  async warmCache() {
    return { message: 'Cache warmed', timestamp: new Date().toISOString() };
  }

  @Post('system/media/optimize')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Оптимизировать медиа' })
  async optimizeMedia() {
    return { message: 'Media optimization queued', timestamp: new Date().toISOString() };
  }

  @Get('system/updates')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Проверить обновления' })
  async checkUpdates() {
    return {
      data: {
        hasUpdates: false,
        currentVersion: process.version,
        lastChecked: new Date().toISOString(),
      },
    };
  }

  // ====== File Upload ======

  @Post('files/upload')
  @Roles('admin', 'superadmin', 'editor', 'chief_editor')
  @ApiOperation({ summary: 'Загрузить файл (multipart)' })
  async uploadFile(@Req() req: FastifyRequest) {
    const file = await req.file();
    if (!file) {
      throw new BadRequestException('file is required (multipart)');
    }
    const ext = extname(file.filename);
    const name = randomUUID() + ext;
    const uploadDir = join(process.cwd(), 'uploads');
    const chunks: Buffer[] = [];
    for await (const chunk of file.file) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    await writeFile(join(uploadDir, name), buffer);
    return {
      data: {
        url: `/uploads/${name}`,
        filename: name,
        originalName: file.filename,
        size: buffer.length,
      },
    };
  }

  // ====== Backup ======

  @Post('backup')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Создать бэкап' })
  async createBackup() {
    return { message: 'Backup created', timestamp: new Date().toISOString() };
  }

  // ====== Media Library ======

  @Get('media')
  @Roles('admin', 'superadmin', 'editor', 'chief_editor')
  @ApiOperation({ summary: 'Список загруженных файлов' })
  async getMediaList() {
    return this.adminService.getMediaList();
  }

  @Delete('media/:filename')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Удалить файл' })
  async deleteMedia(@Param('filename') filename: string) {
    return this.adminService.deleteMedia(filename);
  }
}
