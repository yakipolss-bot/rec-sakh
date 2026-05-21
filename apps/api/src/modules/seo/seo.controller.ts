import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { SeoService } from './seo.service.js';

@ApiTags('SEO')
@Controller('admin/seo')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SeoController {
  constructor(private seoService: SeoService) {}

  @Get('redirects')
  @Roles('admin', 'superadmin', 'chief_editor')
  @ApiOperation({ summary: 'Список редиректов' })
  async getRedirects() {
    return this.seoService.getRedirects();
  }

  @Post('redirects')
  @Roles('admin', 'superadmin', 'chief_editor')
  @ApiOperation({ summary: 'Создать редирект' })
  async createRedirect(@Body() dto: { source: string; target: string; type?: number }) {
    return this.seoService.createRedirect(dto);
  }

  @Delete('redirects/:id')
  @Roles('admin', 'superadmin', 'chief_editor')
  @ApiOperation({ summary: 'Удалить редирект' })
  async deleteRedirect(@Param('id') id: string) {
    await this.seoService.deleteRedirect(id);
    return { success: true };
  }

  @Post('sitemap/generate')
  @Roles('admin', 'superadmin', 'chief_editor')
  @ApiOperation({ summary: 'Сгенерировать sitemap.xml' })
  async generateSitemap() {
    const url = await this.seoService.generateSitemap();
    return { url };
  }

  @Post('broken-links/check')
  @Roles('admin', 'superadmin', 'chief_editor')
  @ApiOperation({ summary: 'Проверить битые ссылки' })
  async checkBrokenLinks() {
    const results = await this.seoService.checkBrokenLinks();
    return { data: results };
  }

  @Get('broken-links')
  @Roles('admin', 'superadmin', 'chief_editor')
  @ApiOperation({ summary: 'Результаты проверки битых ссылок' })
  async getBrokenLinks() {
    return this.seoService.getBrokenLinks();
  }
}
