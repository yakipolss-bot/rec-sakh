import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
  UsePipes,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NewsService } from './news.service.js';
import { CreateNewsDto, CreateNewsSchema } from './dto/create-news.dto.js';
import { UpdateNewsDto, UpdateNewsSchema } from './dto/update-news.dto.js';
import { NewsQueryDto, NewsQuerySchema } from './dto/news-query.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { ExternalNewsDto, ExternalNewsSchema } from './dto/external-news.dto.js';
import { NewsStatus } from '@prisma/client';

@ApiTags('News')
@Controller('news')
export class NewsController {
  constructor(private newsService: NewsService) {}

  @Get()
  @Public()
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Список новостей' })
  async findAll(@Query(new ZodValidationPipe(NewsQuerySchema)) query: NewsQueryDto) {
    return this.newsService.findAll(query);
  }

  @Get(':id')
  @Public()
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Полная новость' })
  async findById(@Param('id') id: string) {
    return this.newsService.findById(id);
  }

  @Get(':id/preview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('journalist', 'proofreader', 'editor', 'chief_editor', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Предпросмотр новости (без учёта просмотров)' })
  async preview(@Param('id') id: string) {
    return this.newsService.preview(id);
  }

  @Get(':id/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('editor', 'chief_editor', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Статистика статьи' })
  async stats(@Param('id') id: string) {
    return this.newsService.stats(id);
  }

  @Get(':id/related')
  @Public()
  @ApiOperation({ summary: 'Похожие новости' })
  async related(
    @Param('id') id: string,
    @Query('limit') limit: number,
  ) {
    return this.newsService.related(id, limit);
  }

  @Get(':id/history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('journalist', 'proofreader', 'editor', 'chief_editor', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'История версий статьи' })
  async history(@Param('id') id: string) {
    return this.newsService.history(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('journalist', 'proofreader', 'editor', 'chief_editor', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Создание новости' })
  @UsePipes(new ZodValidationPipe(CreateNewsSchema))
  async create(
    @Body() dto: CreateNewsDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.newsService.create(dto, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('journalist', 'proofreader', 'editor', 'chief_editor', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Редактирование новости' })
  @UsePipes(new ZodValidationPipe(UpdateNewsSchema))
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateNewsDto,
    @CurrentUser() user: any,
  ) {
    return this.newsService.update(id, dto, user.id, user.role);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('editor', 'chief_editor', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удаление новости (soft)' })
  async remove(@Param('id') id: string) {
    await this.newsService.remove(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('editor', 'chief_editor', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Смена статуса новости' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: NewsStatus,
    @Body('rejectionReason') rejectionReason?: string,
  ) {
    return this.newsService.updateStatus(id, status, rejectionReason);
  }

  @Get('external/check')
  @Public()
  @ApiOperation({ summary: 'Проверить, есть ли новость с sourceUrl' })
  async checkExternal(
    @Query('sourceUrl') sourceUrl: string,
    @Headers('x-api-key') apiKey: string,
  ) {
    if (!apiKey || apiKey !== process.env.NEWS_API_KEY) {
      throw new UnauthorizedException('Invalid API key');
    }
    return this.newsService.checkBySourceUrl(sourceUrl);
  }

  @Post('external')
  @Public()
  @ApiOperation({ summary: 'Внешняя новость от n8n (всегда создаёт)' })
  @UsePipes(new ZodValidationPipe(ExternalNewsSchema))
  async createExternal(
    @Body() dto: ExternalNewsDto,
    @Headers('x-api-key') apiKey: string,
  ) {
    if (!apiKey || apiKey !== process.env.NEWS_API_KEY) {
      throw new UnauthorizedException('Invalid API key');
    }
    return this.newsService.createExternal(dto);
  }
}
