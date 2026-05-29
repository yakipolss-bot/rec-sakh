import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import * as cheerio from 'cheerio';

interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
}

const ASTV_CAT_MAP: Record<string, string> = {
  society: 'obshchestvo',
  criminal: 'proisshestviya',
  politics: 'politika',
  culture: 'kultura',
  sport: 'sport',
  conflict: 'obshchestvo',
  'nash-den': 'obshchestvo',
  mir: 'obshchestvo',
  razgruzka: 'obshchestvo',
  goroskop: 'obshchestvo',
};

@Injectable()
export class AstvNewsScannerService implements OnModuleInit {
  private readonly logger = new Logger(AstvNewsScannerService.name);
  private catCache = new Map<string, string>();

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.loadCategories();
    this.scanAll().catch(err =>
      this.logger.warn(`Initial ASTV scan failed: ${(err as Error).message}`),
    );
  }

  private async loadCategories() {
    const cats = await this.prisma.category.findMany();
    for (const c of cats) {
      this.catCache.set(c.slug, c.id);
    }
    this.logger.log(`Loaded ${this.catCache.size} categories for ASTV scanner`);
  }

  @Cron('*/15 * * * *')
  async scanAll() {
    this.logger.log('Starting ASTV RSS scan...');
    try {
      const xml = await this.fetchWithRetry('https://astv.ru/rss/lenta/');
      const items = this.parseRss(xml);
      if (!items.length) {
        this.logger.warn('No items found in ASTV RSS feed');
        return;
      }
      this.logger.log(`Found ${items.length} items in ASTV RSS feed`);
      await this.processItems(items);
    } catch (err) {
      this.logger.warn(`ASTV scan failed: ${(err as Error).message}`);
    }
  }

  private parseRss(xml: string): RssItem[] {
    const $ = cheerio.load(xml, { xmlMode: true });
    const items: RssItem[] = [];
    $('item').each((_, el) => {
      items.push({
        title: $(el).find('title').text().trim(),
        link: $(el).find('link').text().trim(),
        description: $(el).find('description').text().trim(),
        pubDate: $(el).find('pubDate').text().trim(),
      });
    });
    return items;
  }

  private extractImage(desc: string): string | null {
    const m = desc.match(/<img[^>]+src="([^"]+)"/);
    return m ? m[1] : null;
  }

  private extractLead(desc: string): string {
    return desc.replace(/<[^>]+>/g, '').trim();
  }

  private resolveCategoryId(link: string): string | undefined {
    const m = link.match(/astv\.ru\/news\/([^/]+)/);
    if (!m) return undefined;
    const slug = ASTV_CAT_MAP[m[1]];
    return slug ? this.catCache.get(slug) : undefined;
  }

  private async processItems(items: RssItem[]) {
    let created = 0;
    let skipped = 0;

    for (const item of items) {
      try {
        const exists = await this.prisma.newsArticle.findFirst({
          where: { sourceUrl: item.link },
          select: { id: true },
        });
        if (exists) {
          skipped++;
          continue;
        }

        const imageUrl = this.extractImage(item.description);
        const lead = this.extractLead(item.description);
        const categoryId = this.resolveCategoryId(item.link);
        const publishedAt = new Date(item.pubDate);

        await this.prisma.newsArticle.create({
          data: {
            slug: this.makeSlug(item.title),
            title: item.title,
            lead,
            content: lead || item.title,
            mainImageUrl: imageUrl,
            sourceName: 'ASTV',
            sourceUrl: item.link,
            categoryId,
            status: 'published',
            publishedAt,
            city: 'Южно-Сахалинск',
            readingTimeMinutes: Math.max(1, Math.ceil(item.title.split(/\s+/).length / 200)),
          },
        });
        created++;
        await this.sleep(200);
      } catch (err) {
        this.logger.warn(`Item failed: ${item.title.slice(0, 50)} — ${(err as Error).message}`);
      }
    }

    this.logger.log(`ASTV scan done: ${created} created, ${skipped} skipped`);
  }

  private makeSlug(title: string): string {
    const t: Record<string, string> = {
      а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e',
      ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
      н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
      ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch',
      ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
    };
    const lat = title.toLowerCase().replace(/[а-яё]/g, c => t[c] || c).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return `${lat.slice(0, 80)}-${Date.now().toString(36)}`;
  }

  private async fetchWithRetry(url: string, retries = 2): Promise<string> {
    for (let i = 0; i <= retries; i++) {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SakhcomBot/1.0; +https://sakh.com)' },
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) return res.text();
      if (i < retries) await this.sleep(1000 * (i + 1));
    }
    throw new Error(`Fetch failed after ${retries + 1} attempts: ${url}`);
  }

  private sleep(ms: number) {
    return new Promise(r => setTimeout(r, ms));
  }
}
