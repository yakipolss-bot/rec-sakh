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
import { TagsService } from './tags.service.js';
import { CreateTagDto, CreateTagSchema } from './dto/create-tag.dto.js';
import { UpdateTagDto, UpdateTagSchema } from './dto/update-tag.dto.js';
import { MergeTagsDto, MergeTagsSchema } from './dto/merge-tags.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';

@ApiTags('Tags')
@Controller('tags')
export class TagsController {
  constructor(private tagsService: TagsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Список тегов' })
  async findAll(@Query('search') search?: string) {
    return this.tagsService.findAll({ search });
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Детально тег' })
  async findById(@Param('id') id: string) {
    return this.tagsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('editor', 'chief_editor', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Создание тега' })
  @UsePipes(new ZodValidationPipe(CreateTagSchema))
  async create(@Body() dto: CreateTagDto) {
    return this.tagsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('editor', 'chief_editor', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Редактирование тега' })
  @UsePipes(new ZodValidationPipe(UpdateTagSchema))
  async update(@Param('id') id: string, @Body() dto: UpdateTagDto) {
    return this.tagsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удаление тега' })
  async remove(@Param('id') id: string) {
    await this.tagsService.remove(id);
  }

  @Post('merge')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Слияние дублирующихся тегов' })
  @UsePipes(new ZodValidationPipe(MergeTagsSchema))
  async merge(@Body() dto: MergeTagsDto) {
    return this.tagsService.merge(dto);
  }
}
