import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator.js';
import { CurrencyService } from './currency.service.js';
import { ConvertCurrencyDto, CurrencyHistoryDto } from './dto/convert-currency.dto.js';

@ApiTags('Currency')
@Controller('currency')
export class CurrencyController {
  constructor(private currencyService: CurrencyService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Текущие курсы валют' })
  async findAll() {
    return this.currencyService.findAll();
  }

  @Get('banks')
  @Public()
  @ApiOperation({ summary: 'Курсы коммерческих банков Сахалина' })
  async getBankRates() {
    return this.currencyService.getBankRates();
  }

  @Get(':code')
  @Public()
  @ApiOperation({ summary: 'Курс конкретной валюты' })
  async findByCode(@Param('code') code: string) {
    return this.currencyService.findByCode(code);
  }

  @Get('history')
  @Public()
  @ApiOperation({ summary: 'История курса за период' })
  async getHistory(@Query() query: CurrencyHistoryDto) {
    return this.currencyService.getHistory(query.code, query.from, query.to);
  }

  @Post('convert')
  @Public()
  @ApiOperation({ summary: 'Конвертер валют' })
  async convert(@Body() dto: ConvertCurrencyDto) {
    return this.currencyService.convert(dto.amount, dto.from, dto.to);
  }
}
