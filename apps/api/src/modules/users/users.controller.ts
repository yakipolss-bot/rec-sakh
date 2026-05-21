import {
  Controller,
  Get,
  Patch,
  Delete,
  Post,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { AdminUpdateUserSchema } from './dto/admin-update-user.dto.js';
import { UsersQuerySchema } from './dto/users-query.dto.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import type { FastifyRequest } from 'fastify';

@ApiTags('Users')
@Controller('users')
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Профиль текущего пользователя' })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Обновление профиля' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Список пользователей (админ)' })
  async findAll(@Query(new ZodValidationPipe(UsersQuerySchema)) query: any) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Карточка пользователя (админ)' })
  async findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Редактирование пользователя (админ)' })
  async updateUser(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(AdminUpdateUserSchema)) dto: any,
  ) {
    return this.usersService.updateUser(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('superadmin')
  @ApiOperation({ summary: 'Блокировка пользователя (soft delete)' })
  async blockUser(@Param('id') id: string) {
    await this.usersService.blockUser(id);
  }

  @Post(':id/impersonate')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Войти под пользователем' })
  async impersonate(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
  ) {
    console.log(`[IMPERSONATE] Admin ${adminId} → User ${id} at ${new Date().toISOString()}`);
    return this.usersService.impersonate(id, adminId);
  }

  // ---- User profile sub-endpoints ----

  @Get('me/activity')
  @ApiOperation({ summary: 'История активности' })
  async getActivity(@CurrentUser('id') userId: string) {
    return this.usersService.getActivity(userId);
  }

  @Get('me/billing')
  @ApiOperation({ summary: 'История платежей' })
  async getBilling(@CurrentUser('id') userId: string) {
    return this.usersService.getBilling(userId);
  }

  @Get('me/subscriptions')
  @ApiOperation({ summary: 'Мои подписки (контент)' })
  async getSubscriptions(@CurrentUser('id') userId: string) {
    return this.usersService.getSubscriptions(userId);
  }

  @Post('me/subscriptions')
  @ApiOperation({ summary: 'Добавить подписку на контент' })
  async addSubscription(
    @CurrentUser('id') userId: string,
    @Body('type') type: string,
    @Body('value') value: string,
  ) {
    return this.usersService.addSubscription(userId, type, value);
  }

  @Delete('me/subscriptions/:id')
  @ApiOperation({ summary: 'Удалить подписку на контент' })
  async removeSubscription(
    @CurrentUser('id') userId: string,
    @Param('id') subscriptionId: string,
  ) {
    await this.usersService.removeSubscription(userId, subscriptionId);
  }

  @Post('me/change-password')
  @ApiOperation({ summary: 'Сменить пароль' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Req() req: FastifyRequest,
    @Body('oldPassword') oldPassword: string,
    @Body('newPassword') newPassword: string,
  ) {
    const token = req.headers.authorization?.replace('Bearer ', '') || '';
    await this.usersService.changePassword(userId, token, oldPassword, newPassword);
  }

  @Post('me/avatar')
  @ApiOperation({ summary: 'Загрузить аватар' })
  async uploadAvatar(
    @CurrentUser('id') userId: string,
    @Req() req: FastifyRequest,
  ) {
    const file = await req.file();
    if (!file) throw new Error('No file uploaded');
    const chunks: Buffer[] = [];
    for await (const chunk of file.file) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    const ext = file.filename.includes('.') ? '.' + file.filename.split('.').pop() : '.jpg';
    const url = await this.usersService.uploadAvatar(userId, buffer, file.mimetype, ext);
    return { data: { url } };
  }
}
