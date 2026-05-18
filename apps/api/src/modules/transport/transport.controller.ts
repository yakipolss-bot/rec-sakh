import { Controller, Get, Post, Patch, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { TransportService } from './transport.service.js';
import {
  TransportScheduleQueryDto,
  TransportFlightQueryDto,
  TransportFerryQueryDto,
  CreateFlightDto,
  UpdateFlightDto,
  CreateFerryDto,
  UpdateRoadDto,
  CreateScheduleDto,
} from './dto/transport-query.dto.js';

@ApiTags('Transport')
@Controller('transport')
export class TransportController {
  constructor(private transportService: TransportService) {}

  // --- Public Endpoints ---

  @Get('schedule')
  @Public()
  @ApiOperation({ summary: 'Расписания транспорта (bus/train)' })
  async getSchedule(@Query() query: TransportScheduleQueryDto) {
    return this.transportService.getSchedule(query.type, query.city, query.routeName);
  }

  @Get('flights')
  @Public()
  @ApiOperation({ summary: 'Табло аэропорта (arrival/departure)' })
  async getFlights(@Query() query: TransportFlightQueryDto) {
    return this.transportService.getFlights(query.date, query.type);
  }

  @Get('flights/:id')
  @Public()
  @ApiOperation({ summary: 'Детальная информация о рейсе' })
  async getFlightById(@Param('id') id: string) {
    return this.transportService.getFlightById(id);
  }

  @Get('ferry')
  @Public()
  @ApiOperation({ summary: 'Расписание паромов' })
  async getFerries(@Query() query: TransportFerryQueryDto) {
    return this.transportService.getFerries(query.date, query.route);
  }

  @Get('roads')
  @Public()
  @ApiOperation({ summary: 'Состояние дорог' })
  async getRoads() {
    return this.transportService.getRoads();
  }

  @Get('roads/:id')
  @Public()
  @ApiOperation({ summary: 'Конкретный участок дороги' })
  async getRoadById(@Param('id') id: string) {
    return this.transportService.getRoadById(id);
  }

  // --- Admin Endpoints ---

  @Post('admin/flights')
  @Roles('admin', 'moderator')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Добавить рейс' })
  async createFlight(@Body() dto: CreateFlightDto) {
    return this.transportService.createFlight(dto);
  }

  @Patch('admin/flights/:id')
  @Roles('admin', 'moderator')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить рейс' })
  async updateFlight(@Param('id') id: string, @Body() dto: UpdateFlightDto) {
    return this.transportService.updateFlight(id, dto);
  }

  @Post('admin/ferries')
  @Roles('admin', 'moderator')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Добавить паром' })
  async createFerry(@Body() dto: CreateFerryDto) {
    return this.transportService.createFerry(dto);
  }

  @Patch('admin/roads/:id')
  @Roles('admin', 'moderator')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить состояние дороги' })
  async updateRoad(@Param('id') id: string, @Body() dto: UpdateRoadDto) {
    return this.transportService.updateRoad(id, dto);
  }

  @Post('admin/schedules')
  @Roles('admin', 'moderator')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Добавить маршрут' })
  async createSchedule(@Body() dto: CreateScheduleDto) {
    return this.transportService.createSchedule(dto);
  }

  @Post('admin/seed')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Заполнить тестовыми данными' })
  async seedData() {
    return this.transportService.seedData();
  }
}
