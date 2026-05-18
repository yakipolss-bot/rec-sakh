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
import { RealtyService } from './realty.service.js';
import { CreateRealtyDto, CreateRealtySchema } from './dto/create-realty.dto.js';
import { UpdateRealtyDto, UpdateRealtySchema } from './dto/update-realty.dto.js';
import { RealtyQueryDto } from './dto/realty-query.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { AdStatus } from '@prisma/client';

@ApiTags('Realty')
@Controller('realty')
export class RealtyController {
  constructor(private realtyService: RealtyService) {}

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('editor', 'chief_editor', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Статистика недвижимости' })
  async getStats() {
    return this.realtyService.getStats();
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Список объявлений недвижимости' })
  async findAll(@Query() query: RealtyQueryDto) {
    return this.realtyService.findAll(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Детальная информация об объекте недвижимости' })
  async findById(@Param('id') id: string) {
    return this.realtyService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'journalist', 'proofreader', 'editor', 'chief_editor', 'moderator', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Создание объявления недвижимости' })
  @UsePipes(new ZodValidationPipe(CreateRealtySchema))
  async create(
    @Body() dto: CreateRealtyDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.realtyService.create(dto, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'journalist', 'proofreader', 'editor', 'chief_editor', 'moderator', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Редактирование объявления недвижимости' })
  @UsePipes(new ZodValidationPipe(UpdateRealtySchema))
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRealtyDto,
    @CurrentUser() user: any,
  ) {
    return this.realtyService.update(id, dto, user.id, user.role);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('editor', 'chief_editor', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Смена статуса объявления недвижимости' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: AdStatus,
  ) {
    return this.realtyService.updateStatus(id, status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'journalist', 'proofreader', 'editor', 'chief_editor', 'moderator', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удаление объявления недвижимости (soft)' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    await this.realtyService.remove(id, user.id, user.role);
  }
}
