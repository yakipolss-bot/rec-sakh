import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { SearchIndexService } from '../../common/search/search-index.service.js';
import {
  SearchQueryDto,
  SuggestionsQueryDto,
  FacetsQueryDto,
  RelatedQueryDto,
} from './dto/search-query.dto.js';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private prisma: PrismaService,
    private searchIndex: SearchIndexService,
  ) {}

  async syncAll() {
    return this.searchIndex.syncAll();
  }

  async searchAll(query: SearchQueryDto) {
    if (this.searchIndex.isEnabled && query.q) {
      return this.searchTypesense(query);
    }
    return this.searchPrisma(query);
  }

  private async searchTypesense(query: SearchQueryDto) {
    const page = parseInt(query.page || '1', 10);
    const perPage = Math.min(parseInt(query.perPage || '20', 10), 100);
    const type = query.type || 'all';
    const types = type === 'all' ? ['news', 'events', 'ads', 'jobs'] : [type];

    const queryByMap: Record<string, string> = {
      news: 'title,lead,content',
      events: 'title,description',
      ads: 'title,description',
      jobs: 'title,description',
    };

    const dateFieldMap: Record<string, string> = {
      news: 'publishedAt',
      events: 'startDate',
    };

    const results: any = {};
    for (const t of types) {
      const filters: string[] = [];
      if (query.category) filters.push(`categoryId:${query.category}`);
      if (query.city) filters.push(`city:${query.city}`);

      const dateField = dateFieldMap[t];
      if (dateField) {
        if (query.dateFrom) filters.push(`${dateField}:>=${Math.floor(new Date(query.dateFrom).getTime() / 1000)}`);
        if (query.dateTo) filters.push(`${dateField}:<=${Math.floor(new Date(query.dateTo).getTime() / 1000)}`);
      }

      const searchParams: any = {
        q: query.q,
        query_by: queryByMap[t] || 'title',
        per_page: perPage,
        page,
      };
      if (filters.length > 0) searchParams.filter_by = filters.join(' && ');

      try {
        const client = this.searchIndex.searchClient;
        if (!client) {
          results[t] = { data: [], total: 0 };
          continue;
        }
        const res = await client
          .collections(t)
          .documents()
          .search(searchParams, {});

        results[t] = { data: res.hits?.map((h: any) => h.document) || [], total: res.found || 0 };
      } catch (e) {
        this.logger.warn(`Typesense search failed for ${t}: ${(e as Error).message}`);
        results[t] = { data: [], total: 0 };
      }
    }
    return { data: results };
  }

  private async searchPrisma(query: SearchQueryDto) {
    const page = parseInt(query.page || '1', 10);
    const perPage = Math.min(parseInt(query.perPage || '20', 10), 100);
    const skip = (page - 1) * perPage;
    const type = query.type || 'all';

    const textFilter = query.q
      ? { contains: query.q, mode: 'insensitive' as const }
      : undefined;

    const searchableTypes = type === 'all' ? ['news', 'events', 'ads', 'jobs'] : [type];
    const results: any = {};

    const orFilterMap: Record<string, any[]> = {
      news: [{ title: textFilter }, { lead: textFilter }],
      events: [{ title: textFilter }, { shortDescription: textFilter }],
      ads: [{ title: textFilter }, { description: textFilter }],
      jobs: [{ title: textFilter }, { description: textFilter }],
    };

    for (const t of searchableTypes) {
      const where: any = { deletedAt: null };
      if (t === 'news' || t === 'events') where.status = 'published';
      if (query.category) where.categoryId = query.category;
      if (query.city) where.city = query.city;
      if (textFilter) {
        where.OR = orFilterMap[t] || [{ title: textFilter }];
      }

      let model: any;
      let select: any;
      let orderBy: any;

      if (t === 'news') {
        model = this.prisma.newsArticle;
        select = { id: true, title: true, lead: true, slug: true, mainImageUrl: true, city: true, publishedAt: true, category: { select: { id: true, name: true, slug: true } } };
        orderBy = { publishedAt: 'desc' };
        if (query.dateFrom || query.dateTo) where.publishedAt = { ...(query.dateFrom && { gte: new Date(query.dateFrom) }), ...(query.dateTo && { lte: new Date(query.dateTo) }) };
      } else if (t === 'events') {
        model = this.prisma.event;
        select = { id: true, title: true, shortDescription: true, imageUrl: true, city: true, startDate: true, venueName: true, category: { select: { id: true, name: true, slug: true } } };
        orderBy = { startDate: 'asc' };
        if (query.dateFrom || query.dateTo) where.startDate = { ...(query.dateFrom && { gte: new Date(query.dateFrom) }), ...(query.dateTo && { lte: new Date(query.dateTo) }) };
      } else if (t === 'ads') {
        model = this.prisma.ad;
        select = { id: true, title: true, description: true, price: true, city: true, images: true, createdAt: true, category: { select: { id: true, name: true, slug: true } } };
        orderBy = { createdAt: 'desc' };
      } else if (t === 'jobs') {
        model = this.prisma.job;
        select = { id: true, title: true, description: true, type: true, salaryMin: true, salaryMax: true, city: true, companyName: true, category: { select: { id: true, name: true, slug: true } } };
        orderBy = { createdAt: 'desc' };
      }

      if (model) {
        const [data, total] = await Promise.all([
          model.findMany({ where, skip, take: perPage, orderBy, select }),
          model.count({ where }),
        ]);
        results[t] = { data, total };
      }
    }
    return { data: results };
  }

  async getFacets(query: FacetsQueryDto) {
    if (this.searchIndex.isEnabled && query.q) {
      return this.facetsTypesense(query);
    }
    return this.facetsPrisma(query);
  }

  private async facetsTypesense(query: FacetsQueryDto) {
    const type = query.type || 'all';
    const types = type === 'all' ? ['news', 'events', 'ads', 'jobs'] : [type];
    const results: any = { categories: [], cities: [], types: [] };

    for (const t of types) {
      try {
        const res = await this.searchIndex.searchClient!
          .collections(t)
          .documents()
          .search({ q: query.q || '*', query_by: 'title', max_facet_values: 50, facet_by: 'categoryId,city' }, {});
        if (res.facet_counts) {
          for (const facet of res.facet_counts) {
            if (facet.field_name === 'categoryId') {
              for (const c of facet.counts) {
                const existing = results.categories.find((x: any) => x.value === c.value);
                if (existing) existing.count += c.count;
                else results.categories.push({ value: c.value, count: c.count });
              }
            }
            if (facet.field_name === 'city') {
              for (const c of facet.counts) {
                const existing = results.cities.find((x: any) => x.value === c.value);
                if (existing) existing.count += c.count;
                else results.cities.push({ value: c.value, count: c.count });
              }
            }
          }
        }
        results.types.push({ value: t, count: res.found || 0 });
      } catch (e) {
        this.logger.warn(`Typesense facets failed for ${t}: ${(e as Error).message}`);
        results.types.push({ value: t, count: 0 });
      }
    }
    return results;
  }

  private async facetsPrisma(query: FacetsQueryDto) {
    const textFilter = query.q ? { contains: query.q, mode: 'insensitive' as const } : undefined;
    const typeFilter = query.type || 'all';
    const searchTypes = typeFilter === 'all' ? ['news', 'events', 'ads', 'jobs'] : [typeFilter];
    const facetResults: any = { categories: [], cities: [], types: [] };

    for (const t of searchTypes) {
      const baseFilter: any = { deletedAt: null };
      if (t === 'news' || t === 'events') baseFilter.status = 'published';
      if (textFilter) baseFilter.OR = [{ title: textFilter }, { description: textFilter }];

      let model: any;
      if (t === 'news') model = this.prisma.newsArticle;
      else if (t === 'events') model = this.prisma.event;
      else if (t === 'ads') model = this.prisma.ad;
      else if (t === 'jobs') model = this.prisma.job;

      if (model) {
        const [cityCounts, catCounts, total] = await Promise.all([
          model.groupBy({ by: ['city'], where: baseFilter, _count: true }),
          model.groupBy({ by: ['categoryId'], where: baseFilter, _count: true }),
          model.count({ where: baseFilter }),
        ]);

        for (const c of cityCounts) {
          if (c.city) {
            const existing = facetResults.cities.find((x: any) => x.value === c.city);
            if (existing) existing.count += c._count;
            else facetResults.cities.push({ value: c.city, count: c._count });
          }
        }
        for (const c of catCounts) {
          if (c.categoryId) {
            const existing = facetResults.categories.find((x: any) => x.value === c.categoryId);
            if (existing) existing.count += c._count;
            else facetResults.categories.push({ value: c.categoryId, count: c._count });
          }
        }
        facetResults.types.push({ value: t, count: total });
      }
    }
    return facetResults;
  }

  async getSuggestions(query: SuggestionsQueryDto) {
    if (this.searchIndex.isEnabled && query.q) {
      return this.suggestTypesense(query);
    }
    return this.suggestPrisma(query);
  }

  private async suggestTypesense(query: SuggestionsQueryDto) {
    const q = query.q || '';
    const limit = Math.min(parseInt(query.limit || '5', 10), 10);
    const results: any = { suggestions: [] };

    const types = ['news', 'events', 'ads', 'jobs'];
    for (const t of types) {
      try {
        const res = await this.searchIndex.searchClient!
          .collections(t)
          .documents()
          .search({ q, query_by: 'title', per_page: limit }, {});
        if (res.hits?.length) {
          results.suggestions.push({
            type: t,
            label: t === 'news' ? 'Новости' : t === 'events' ? 'События' : t === 'ads' ? 'Объявления' : 'Вакансии',
            items: res.hits.map((h: any) => ({ id: h.document.id, title: h.document.title })),
          });
        }
      } catch (e) {
        this.logger.warn(`Typesense suggest failed for ${t}: ${(e as Error).message}`);
      }
    }
    return results;
  }

  private async suggestPrisma(query: SuggestionsQueryDto) {
    const q = query.q || '';
    const limit = Math.min(parseInt(query.limit || '5', 10), 10);
    if (!q) return { suggestions: [] };

    const textFilter = { contains: q, mode: 'insensitive' as const };
    const [news, events, ads, jobs] = await Promise.all([
      this.prisma.newsArticle.findMany({ where: { title: textFilter, status: 'published', deletedAt: null }, take: limit, select: { id: true, title: true } }),
      this.prisma.event.findMany({ where: { title: textFilter, status: 'published' }, take: limit, select: { id: true, title: true } }),
      this.prisma.ad.findMany({ where: { title: textFilter, deletedAt: null }, take: limit, select: { id: true, title: true } }),
      this.prisma.job.findMany({ where: { title: textFilter, deletedAt: null }, take: limit, select: { id: true, title: true } }),
    ]);

    return {
      suggestions: [
        ...(news.length ? [{ type: 'news', label: 'Новости', items: news }] : []),
        ...(events.length ? [{ type: 'events', label: 'События', items: events }] : []),
        ...(ads.length ? [{ type: 'ads', label: 'Объявления', items: ads }] : []),
        ...(jobs.length ? [{ type: 'jobs', label: 'Вакансии', items: jobs }] : []),
      ],
    };
  }

  async getRelated(query: RelatedQueryDto) {
    if (!query.q) return { queries: [] };
    const related = await this.prisma.auditLog.findMany({
      where: { action: 'search', entityId: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: 10, distinct: ['entityId'],
      select: { entityId: true },
    });
    return { queries: related.filter((r): r is { entityId: string } => r.entityId !== null).map(r => r.entityId) };
  }
}
