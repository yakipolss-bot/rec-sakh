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
import { JobsService } from './jobs.service.js';
import { CreateJobDto, CreateJobSchema } from './dto/create-job.dto.js';
import { UpdateJobDto, UpdateJobSchema } from './dto/update-job.dto.js';
import { JobsQueryDto } from './dto/jobs-query.dto.js';
import { JobResponseDto, JobResponseSchema } from './dto/job-response.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { AdStatus } from '@prisma/client';

@ApiTags('Jobs')
@Controller('jobs')
export class JobsController {
  constructor(private jobsService: JobsService) {}

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('editor', 'chief_editor', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Статистика вакансий' })
  async getStats() {
    return this.jobsService.getStats();
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Список вакансий' })
  async findAll(@Query() query: JobsQueryDto) {
    return this.jobsService.findAll(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Детальная информация о вакансии' })
  async findById(@Param('id') id: string) {
    return this.jobsService.findById(id);
  }

  @Get(':id/responses')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'journalist', 'proofreader', 'editor', 'chief_editor', 'moderator', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Отклики на вакансию' })
  async getResponses(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.jobsService.getResponses(id, user.id, user.role);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'journalist', 'proofreader', 'editor', 'chief_editor', 'moderator', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Создание вакансии' })
  @UsePipes(new ZodValidationPipe(CreateJobSchema))
  async create(
    @Body() dto: CreateJobDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.jobsService.create(dto, userId);
  }

  @Post(':id/respond')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'journalist', 'proofreader', 'editor', 'chief_editor', 'moderator', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Откликнуться на вакансию' })
  @UsePipes(new ZodValidationPipe(JobResponseSchema))
  async respond(
    @Param('id') id: string,
    @Body() dto: JobResponseDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.jobsService.respond(id, dto, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'journalist', 'proofreader', 'editor', 'chief_editor', 'moderator', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Редактирование вакансии' })
  @UsePipes(new ZodValidationPipe(UpdateJobSchema))
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateJobDto,
    @CurrentUser() user: any,
  ) {
    return this.jobsService.update(id, dto, user.id, user.role);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('editor', 'chief_editor', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Смена статуса вакансии' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: AdStatus,
  ) {
    return this.jobsService.updateStatus(id, status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'journalist', 'proofreader', 'editor', 'chief_editor', 'moderator', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удаление вакансии (soft)' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    await this.jobsService.remove(id, user.id, user.role);
  }
}
