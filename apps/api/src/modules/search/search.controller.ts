import {
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service.js';
import {
  SearchQueryDto,
  SuggestionsQueryDto,
  FacetsQueryDto,
  RelatedQueryDto,
} from './dto/search-query.dto.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(
    private searchService: SearchService,
  ) {}

  @Post('sync')
  @Roles('admin', 'editor')
  @ApiOperation({ summary: 'Переиндексация Typesense' })
  async syncIndex() {
    await this.searchService.syncAll();
    return { message: 'Sync completed' };
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Полнотекстовый поиск' })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'perPage', required: false })
  async search(@Query() query: SearchQueryDto) {
    return this.searchService.searchAll(query);
  }

  @Get('facets')
  @Public()
  @ApiOperation({ summary: 'Фасеты с counts' })
  async getFacets(@Query() query: FacetsQueryDto) {
    return this.searchService.getFacets(query);
  }

  @Get('suggestions')
  @Public()
  @ApiOperation({ summary: 'Автокомплит' })
  async getSuggestions(@Query() query: SuggestionsQueryDto) {
    return this.searchService.getSuggestions(query);
  }

  @Get('related')
  @Public()
  @ApiOperation({ summary: 'Похожие запросы' })
  async getRelated(@Query() query: RelatedQueryDto) {
    return this.searchService.getRelated(query);
  }
}
