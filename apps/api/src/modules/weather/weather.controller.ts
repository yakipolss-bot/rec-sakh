import { Controller, Get, Post, Delete, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { WeatherService } from './weather.service.js';
import { WeatherQueryDto, CreateAlertDto } from './dto/weather-query.dto.js';

@ApiTags('Weather')
@Controller('weather')
export class WeatherController {
  constructor(private weatherService: WeatherService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Текущая погода для всех городов' })
  async findAll(@Query() query: WeatherQueryDto) {
    return this.weatherService.findAll();
  }

  @Get('cities')
  @Public()
  @ApiOperation({ summary: 'Список городов с поддержкой погоды' })
  async getCities() {
    return this.weatherService.getCities();
  }

  @Get('alerts')
  @Public()
  @ApiOperation({ summary: 'Штормовые предупреждения' })
  async getAlerts() {
    return this.weatherService.getAlerts();
  }

  @Get(':cityCode')
  @Public()
  @ApiOperation({ summary: 'Прогноз на 10 дней для города' })
  async findByCityCode(@Param('cityCode') cityCode: string) {
    return this.weatherService.findByCityCode(cityCode);
  }

  @Get(':cityCode/forecast')
  @Public()
  @ApiOperation({ summary: 'Детальный прогноз (почасовой/10 дней)' })
  async getForecast(@Param('cityCode') cityCode: string) {
    return this.weatherService.getForecast(cityCode);
  }

  // --- Admin endpoints ---

  @Post('admin/alerts')
  @Roles('admin', 'editor')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Создать штормовое предупреждение' })
  async createAlert(@Body() dto: CreateAlertDto) {
    return this.weatherService.createAlert(dto);
  }

  @Delete('admin/alerts/:id')
  @Roles('admin', 'editor')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить предупреждение' })
  async deleteAlert(@Param('id') id: string) {
    return this.weatherService.deleteAlert(id);
  }
}
