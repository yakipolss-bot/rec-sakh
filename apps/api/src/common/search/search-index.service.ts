import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import Typesense from 'typesense';

@Injectable()
export class SearchIndexService implements OnModuleInit {
  private readonly logger = new Logger(SearchIndexService.name);
  private client: InstanceType<typeof Typesense.Client> | null = null;
  private enabled = false;

  constructor(private prisma: PrismaService) {
    if (process.env.TYPESENSE_API_KEY) {
      try {
        this.client = new Typesense.Client({
          nodes: [{
            host: process.env.TYPESENSE_HOST || 'localhost',
            port: parseInt(process.env.TYPESENSE_PORT || '8108', 10),
            protocol: (process.env.TYPESENSE_PROTOCOL || 'http') as 'http' | 'https',
          }],
          apiKey: process.env.TYPESENSE_API_KEY,
          connectionTimeoutSeconds: 2,
        });
        this.enabled = true;
      } catch {
        this.logger.warn('Typesense config invalid, using Prisma fallback');
      }
    }
  }

  get isEnabled() { return this.enabled; }
  get searchClient() { return this.client; }

  private getClient(): InstanceType<typeof Typesense.Client> {
    if (!this.client) {
      throw new Error('Typesense client is not initialized');
    }
    return this.client;
  }

  async checkHealth(): Promise<boolean> {
    if (!this.client) return false;
    try {
      await this.client.health.retrieve();
      if (!this.enabled) {
        this.enabled = true;
        this.logger.log('Typesense reconnected and enabled');
      }
      return true;
    } catch {
      if (this.enabled) {
        this.enabled = false;
        this.logger.warn('Typesense health check failed, disabling');
      }
      return false;
    }
  }

  async onModuleInit() {
    if (!this.enabled) return;
    try {
      await this.createCollections();
    } catch (e) {
      this.logger.warn('Typesense not available, using Prisma fallback');
      this.enabled = false;
    }
  }

  private async createCollections() {
    const schemas = [
      {
        name: 'news',
        fields: [
          { name: 'title', type: 'string' as const },
          { name: 'lead', type: 'string' as const },
          { name: 'content', type: 'string' as const },
          { name: 'categoryId', type: 'string' as const, facet: true },
          { name: 'city', type: 'string' as const, facet: true },
          { name: 'publishedAt', type: 'int64' as const },
          { name: 'slug', type: 'string' as const },
        ],
        default_sorting_field: 'publishedAt',
      },
      {
        name: 'events',
        fields: [
          { name: 'title', type: 'string' as const },
          { name: 'description', type: 'string' as const },
          { name: 'categoryId', type: 'string' as const, facet: true },
          { name: 'city', type: 'string' as const, facet: true },
          { name: 'startDate', type: 'int64' as const },
          { name: 'isFree', type: 'bool' as const, facet: true },
        ],
        default_sorting_field: 'startDate',
      },
      {
        name: 'ads',
        fields: [
          { name: 'title', type: 'string' as const },
          { name: 'description', type: 'string' as const },
          { name: 'categoryId', type: 'string' as const, facet: true },
          { name: 'city', type: 'string' as const, facet: true },
          { name: 'price', type: 'float' as const },
          { name: 'createdAt', type: 'int64' as const },
        ],
        default_sorting_field: 'createdAt',
      },
      {
        name: 'jobs',
        fields: [
          { name: 'title', type: 'string' as const },
          { name: 'description', type: 'string' as const },
          { name: 'categoryId', type: 'string' as const, facet: true },
          { name: 'city', type: 'string' as const, facet: true },
          { name: 'salaryMin', type: 'float' as const },
          { name: 'salaryMax', type: 'float' as const },
          { name: 'type', type: 'string' as const, facet: true },
        ],
      },
      {
        name: 'directory',
        fields: [
          { name: 'name', type: 'string' as const },
          { name: 'description', type: 'string' as const },
          { name: 'categoryId', type: 'string' as const, facet: true },
          { name: 'city', type: 'string' as const, facet: true },
          { name: 'avgRating', type: 'float' as const },
        ],
      },
    ];

    for (const schema of schemas) {
      try {
        await this.getClient().collections(schema.name).retrieve();
      } catch {
        await this.getClient().collections().create(schema);
        this.logger.log(`Created Typesense collection: ${schema.name}`);
      }
    }
  }

  async syncAll() {
    if (!this.enabled) {
      await this.checkHealth();
      if (!this.enabled) return;
    }
    const results = await Promise.allSettled([
      this.syncNews(),
      this.syncEvents(),
      this.syncAds(),
      this.syncJobs(),
      this.syncDirectory(),
    ]);
    const rejected = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
    if (rejected.length > 0) {
      for (const r of rejected) {
        this.logger.error(`Typesense syncAll sub-task failed: ${r.reason}`);
      }
    }
    this.logger.log('Typesense full sync completed');
  }

  async syncNews(ids?: string[]) {
    if (!this.enabled) { await this.checkHealth(); if (!this.enabled) return; }
    const where: any = { deletedAt: null, status: 'published' };
    if (ids) where.id = { in: ids };
    const items = await this.prisma.newsArticle.findMany({
      where,
      select: {
        id: true, title: true, lead: true, content: true,
        categoryId: true, city: true, publishedAt: true, slug: true,
      },
    });
    const docs = items.map(i => ({
      id: i.id,
      title: i.title,
      lead: i.lead || '',
      content: i.content,
      categoryId: i.categoryId || '',
      city: i.city || '',
      publishedAt: Math.floor((i.publishedAt?.getTime() || Date.now()) / 1000),
      slug: i.slug,
    }));
    await this.getClient().collections('news').documents().import(docs, { action: 'upsert' });
  }

  /** H10: Индексация одной статьи в Typesense (вызывается после create/update) */
  async indexNews(article: { id: string; title: string; lead?: string | null; content: string; categoryId?: string | null; city?: string | null; publishedAt?: Date | null; slug: string }): Promise<void> {
    if (!this.enabled) { await this.checkHealth(); if (!this.enabled) return; }
    try {
      await this.getClient().collections('news').documents().upsert({
        id: article.id,
        title: article.title,
        lead: article.lead || '',
        content: article.content,
        categoryId: article.categoryId || '',
        city: article.city || '',
        publishedAt: Math.floor((article.publishedAt?.getTime() || Date.now()) / 1000),
        slug: article.slug,
      });
    } catch (e) {
      this.logger.warn(`Typesense indexNews failed for article ${article.id}: ${(e as Error).message}`);
    }
  }

  async syncEvents(ids?: string[]) {
    if (!this.enabled) { await this.checkHealth(); if (!this.enabled) return; }
    const where: any = { status: 'published' };
    if (ids) where.id = { in: ids };
    const items = await this.prisma.event.findMany({ where, select: { id: true, title: true, description: true, categoryId: true, city: true, startDate: true, isFree: true } });
    const docs = items.map(i => ({
      id: i.id, title: i.title, description: i.description,
      categoryId: i.categoryId || '', city: i.city || '',
      startDate: Math.floor((i.startDate?.getTime() || Date.now()) / 1000),
      isFree: i.isFree,
    }));
    await this.getClient().collections('events').documents().import(docs, { action: 'upsert' });
  }

  async syncAds(ids?: string[]) {
    if (!this.enabled) { await this.checkHealth(); if (!this.enabled) return; }
    const where: any = { deletedAt: null };
    if (ids) where.id = { in: ids };
    const items = await this.prisma.ad.findMany({
      where, select: { id: true, title: true, description: true, categoryId: true, city: true, price: true, createdAt: true },
    });
    const docs = items.map(i => ({
      id: i.id, title: i.title, description: i.description,
      categoryId: i.categoryId || '', city: i.city || '',
      price: i.price ? Number(i.price) : 0,
      createdAt: Math.floor(i.createdAt.getTime() / 1000),
    }));
    await this.getClient().collections('ads').documents().import(docs, { action: 'upsert' });
  }

  async syncJobs(ids?: string[]) {
    if (!this.enabled) { await this.checkHealth(); if (!this.enabled) return; }
    const where: any = { deletedAt: null };
    if (ids) where.id = { in: ids };
    const items = await this.prisma.job.findMany({
      where, select: { id: true, title: true, description: true, categoryId: true, city: true, salaryMin: true, salaryMax: true, type: true },
    });
    const docs = items.map(i => ({
      id: i.id, title: i.title, description: i.description,
      categoryId: i.categoryId || '', city: i.city || '',
      salaryMin: i.salaryMin ? Number(i.salaryMin) : 0,
      salaryMax: i.salaryMax ? Number(i.salaryMax) : 0,
      type: i.type,
    }));
    await this.getClient().collections('jobs').documents().import(docs, { action: 'upsert' });
  }

  async syncDirectory(ids?: string[]) {
    if (!this.enabled) { await this.checkHealth(); if (!this.enabled) return; }
    const where: any = { status: 'active' };
    if (ids) where.id = { in: ids };
    const items = await this.prisma.directoryOrganization.findMany({
      where, select: { id: true, name: true, description: true, categoryId: true, city: true, avgRating: true },
    });
    const docs = items.map(i => ({
      id: i.id, name: i.name, description: i.description || '',
      categoryId: i.categoryId || '', city: i.city || '',
      avgRating: Number(i.avgRating),
    }));
    await this.getClient().collections('directory').documents().import(docs, { action: 'upsert' });
  }
}
