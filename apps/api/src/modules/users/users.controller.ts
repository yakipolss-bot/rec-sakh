import {
  Controller,
  Get,
  Patch,
  Delete,
  Post,
  Body,
  Param,
  Query,
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

  @Get('me/sessions')
  @ApiOperation({ summary: 'Список сессий текущего пользователя' })
  async getMySessions(@CurrentUser('id') userId: string) {
    return this.usersService.getSessions(userId);
  }

  @Delete('me/sessions/:id')
  @ApiOperation({ summary: 'Завершить сессию' })
  async deleteMySession(
    @CurrentUser('id') userId: string,
    @Param('id') sessionId: string,
  ) {
    await this.usersService.deleteSession(userId, sessionId);
  }

  @Delete('me/sessions')
  @ApiOperation({ summary: 'Завершить все сессии' })
  async deleteAllMySessions(@CurrentUser('id') userId: string) {
    await this.usersService.deleteAllSessions(userId);
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
}
