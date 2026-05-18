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
import { EventsService } from './events.service.js';
import { CreateEventDto, CreateEventSchema } from './dto/create-event.dto.js';
import { UpdateEventDto, UpdateEventSchema } from './dto/update-event.dto.js';
import { EventsQueryDto } from './dto/events-query.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { EventStatus } from '@prisma/client';

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Список событий' })
  async findAll(@Query() query: EventsQueryDto) {
    return this.eventsService.findAll(query);
  }

  @Get('calendar/:year/:month')
  @Public()
  @ApiOperation({ summary: 'События за месяц, сгруппированные по дням' })
  async calendar(@Param('year') year: string, @Param('month') month: string) {
    return this.eventsService.getCalendar(parseInt(year, 10), parseInt(month, 10));
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Детальная информация о событии' })
  async findById(@Param('id') id: string) {
    return this.eventsService.findById(id);
  }

  @Get(':id/subscribers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('editor', 'chief_editor', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Список записавшихся на событие' })
  async subscribers(@Param('id') id: string) {
    return this.eventsService.getSubscribers(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('editor', 'chief_editor', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Создание события' })
  @UsePipes(new ZodValidationPipe(CreateEventSchema))
  async create(
    @Body() dto: CreateEventDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.eventsService.create(dto, userId);
  }

  @Post(':id/subscribe')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'journalist', 'proofreader', 'editor', 'chief_editor', 'moderator', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Записаться на событие' })
  async subscribe(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.eventsService.subscribe(id, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('editor', 'chief_editor', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Редактирование события' })
  @UsePipes(new ZodValidationPipe(UpdateEventSchema))
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
    @CurrentUser() user: any,
  ) {
    return this.eventsService.update(id, dto, user.id, user.role);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('editor', 'chief_editor', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Смена статуса события' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: EventStatus,
  ) {
    return this.eventsService.updateStatus(id, status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('chief_editor', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удаление события (soft)' })
  async remove(@Param('id') id: string) {
    await this.eventsService.remove(id);
  }

  @Delete(':id/subscribe')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'journalist', 'proofreader', 'editor', 'chief_editor', 'moderator', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Отменить запись на событие' })
  async unsubscribe(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.eventsService.unsubscribe(id, userId);
  }
}
