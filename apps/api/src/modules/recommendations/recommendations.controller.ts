import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RecommendationsService } from './recommendations.service.js';
import { RecommendationsQueryDto, CreateEditorialPickDto } from './dto/index.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { UserRole } from '@prisma/client';

@ApiTags('Recommendations')
@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Get('feed')
  @Public()
  @ApiOperation({ summary: 'Персональная лента рекомендаций' })
  async getFeed(
    @Query() query: RecommendationsQueryDto,
    @CurrentUser('id') userId?: string,
  ) {
    const items = await this.recommendationsService.getFeed(userId || null, query);
    return {
      data: items,
      meta: {
        total: items.length,
        limit: parseInt(query.limit || '10', 10),
        requestId: '',
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get('similar/:contentType/:id')
  @Public()
  @ApiOperation({ summary: 'Похожие материалы' })
  async getSimilar(
    @Param('contentType') contentType: string,
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    const items = await this.recommendationsService.getSimilar(
      contentType,
      id,
      limit ? parseInt(limit, 10) : 6,
    );
    return {
      data: items,
      meta: {
        total: items.length,
        limit: limit ? parseInt(limit, 10) : 6,
        requestId: '',
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get('trending')
  @Public()
  @ApiOperation({ summary: 'Тренды (популярное за 24ч)' })
  async getTrending(@Query('limit') limit?: string) {
    const items = await this.recommendationsService.getTrending(
      limit ? parseInt(limit, 10) : 20,
    );
    return {
      data: items,
      meta: {
        total: items.length,
        limit: limit ? parseInt(limit, 10) : 20,
        requestId: '',
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Post('editorial-pick')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.editor, UserRole.chief_editor, UserRole.admin, UserRole.superadmin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Установить редакторский пик' })
  async setPick(
    @Body() dto: CreateEditorialPickDto,
    @CurrentUser('id') userId: string,
  ) {
    await this.recommendationsService.setEditorialPick(dto, userId);
    return {
      data: null,
      meta: {
        requestId: '',
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Delete('editorial-pick/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.editor, UserRole.chief_editor, UserRole.admin, UserRole.superadmin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить редакторский пик' })
  async removePick(@Param('id') id: string) {
    await this.recommendationsService.removeEditorialPick(id);
    return {
      data: null,
      meta: {
        requestId: '',
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Post('sync')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.superadmin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Пересчитать векторы взаимодействий' })
  async syncInteractions() {
    await this.recommendationsService.syncInteractionLog();
    return {
      data: null,
      meta: {
        requestId: '',
        timestamp: new Date().toISOString(),
      },
    };
  }
}
