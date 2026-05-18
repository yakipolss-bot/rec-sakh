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
import { DirectoryService } from './directory.service.js';
import { CreateDirectoryDto, CreateDirectorySchema } from './dto/create-directory.dto.js';
import { UpdateDirectoryDto, UpdateDirectorySchema } from './dto/update-directory.dto.js';
import { DirectoryQueryDto } from './dto/directory-query.dto.js';
import { CreateReviewDto, CreateReviewSchema } from './dto/create-review.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';

@ApiTags('Directory')
@Controller('directory')
export class DirectoryController {
  constructor(private directoryService: DirectoryService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Список организаций' })
  async findAll(@Query() query: DirectoryQueryDto) {
    return this.directoryService.findAll(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Детально организация' })
  async findById(@Param('id') id: string) {
    return this.directoryService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'journalist', 'proofreader', 'editor', 'chief_editor', 'moderator', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Создание организации' })
  @UsePipes(new ZodValidationPipe(CreateDirectorySchema))
  async create(
    @Body() dto: CreateDirectoryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.directoryService.create(dto, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('editor', 'chief_editor', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Редактирование организации' })
  @UsePipes(new ZodValidationPipe(UpdateDirectorySchema))
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDirectoryDto,
  ) {
    return this.directoryService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Архивирование организации (soft delete)' })
  async remove(@Param('id') id: string) {
    await this.directoryService.remove(id);
  }

  @Post(':id/reviews')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'journalist', 'proofreader', 'editor', 'chief_editor', 'moderator', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Добавить отзыв' })
  @UsePipes(new ZodValidationPipe(CreateReviewSchema))
  async addReview(
    @Param('id') id: string,
    @Body() dto: CreateReviewDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.directoryService.addReview(id, dto, userId);
  }

  @Get(':id/reviews')
  @Public()
  @ApiOperation({ summary: 'Отзывы организации' })
  async getReviews(@Param('id') id: string) {
    return this.directoryService.getReviews(id);
  }
}
