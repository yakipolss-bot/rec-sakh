import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdsService } from './ads.service.js';
import { CreateAdDto, CreateAdSchema } from './dto/create-ad.dto.js';
import { UpdateAdDto, UpdateAdSchema } from './dto/update-ad.dto.js';
import { AdsQueryDto } from './dto/ads-query.dto.js';
import { PromoteAdDto, PromoteAdSchema } from './dto/promote-ad.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { AdStatus } from '@prisma/client';

@ApiTags('Ads')
@Controller('ads')
export class AdsController {
  constructor(private adsService: AdsService) {}

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('editor', 'chief_editor', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Статистика объявлений' })
  async getStats() {
    return this.adsService.getStats();
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Список объявлений' })
  async findAll(@Query() query: AdsQueryDto) {
    return this.adsService.findAll(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Детальная информация об объявлении' })
  async findById(@Param('id') id: string) {
    return this.adsService.findById(id);
  }

  @Get(':id/promotions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Статус продвижения объявления' })
  async getPromotions(@Param('id') id: string) {
    return this.adsService.getPromotions(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'journalist', 'proofreader', 'editor', 'chief_editor', 'moderator', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Создание объявления' })
  @UsePipes(new ZodValidationPipe(CreateAdSchema))
  async create(
    @Body() dto: CreateAdDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.adsService.create(dto, userId);
  }

  @Post(':id/promote')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'journalist', 'editor', 'chief_editor', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Продвинуть объявление' })
  @UsePipes(new ZodValidationPipe(PromoteAdSchema))
  async promote(
    @Param('id') id: string,
    @Body() dto: PromoteAdDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.adsService.promote(id, dto, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'journalist', 'proofreader', 'editor', 'chief_editor', 'moderator', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Редактирование объявления' })
  @UsePipes(new ZodValidationPipe(UpdateAdSchema))
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAdDto,
    @CurrentUser() user: any,
  ) {
    return this.adsService.update(id, dto, user.id, user.role);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('editor', 'chief_editor', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Смена статуса объявления' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: AdStatus,
  ) {
    return this.adsService.updateStatus(id, status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'journalist', 'proofreader', 'editor', 'chief_editor', 'moderator', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удаление объявления (soft)' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    await this.adsService.remove(id, user.id, user.role);
  }
}
