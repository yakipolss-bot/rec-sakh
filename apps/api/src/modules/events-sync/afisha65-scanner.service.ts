import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import * as cheerio from 'cheerio';

interface Afisha65Feed {
  url: string;
  catSlug: string;
}

const FEEDS: Afisha65Feed[] = [
  { url: 'https://afisha65.ru/rss/cinema/', catSlug: 'kino' },
  { url: 'https://afisha65.ru/rss/theatre/', catSlug: 'teatr' },
  { url: 'https://afisha65.ru/rss/concert/', catSlug: 'kontserty' },
  { url: 'https://afisha65.ru/rss/expo/', catSlug: 'vystavki' },
  { url: 'https://afisha65.ru/rss/action/', catSlug: 'festivali' },
  { url: 'https://afisha65.ru/rss/party/', catSlug: 'master-klassy' },
  { url: 'https://afisha65.ru/rss/sport/', catSlug: 'sport' },
  { url: 'https://afisha65.ru/rss/quiz/', catSlug: 'obuchenie' },
];

interface ParsedEvent {
  title: string;
  description: string;
  imageUrl?: string;
  startDate: Date;
  endDate?: Date;
  venueName?: string;
  venueAddress?: string;
  city?: string;
  ticketUrl?: string;
  ageRange?: string;
}

@Injectable()
export class Afisha65ScannerService implements OnModuleInit {
  private readonly logger = new Logger(Afisha65ScannerService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    this.scanAllFeeds().catch(err =>
      this.logger.warn(`Initial afisha65 scan failed: ${(err as Error).message}`),
    );
  }

  @Cron('0 */3 * * *')
  async scanAllFeeds() {
    this.logger.log('Starting afisha65.ru RSS scan...');

    const catMap = new Map<string, string>();
    for (const f of FEEDS) {
      const cat = await this.prisma.category.findUnique({ where: { slug: f.catSlug } });
      if (cat) catMap.set(f.catSlug, cat.id);
    }

    for (const feed of FEEDS) {
      try {
        await this.processFeed(feed, catMap);
      } catch (err) {
        this.logger.warn(`Feed ${feed.url} failed: ${(err as Error).message}`);
      }
    }
  }

  private async processFeed(feed: Afisha65Feed, catMap: Map<string, string>) {
    const xml = await this.fetchWithRetry(feed.url);
    const $ = cheerio.load(xml, { xmlMode: true });
    const items: { id: string; title: string; description: string }[] = [];

    $('item').each((_, el) => {
      const link = $(el).find('link').text().trim();
      const match = link.match(/\/event\/(\d+)/);
      if (!match) return;
      items.push({
        id: match[1],
        title: $(el).find('title').text().trim(),
        description: $(el).find('description').text().trim(),
      });
    });

    if (!items.length) return;

    const existingIds = new Set<string>();
    const rows = await this.prisma.event.findMany({
      where: { externalSource: 'afisha65', externalId: { in: items.map(i => i.id) } },
      select: { externalId: true },
    });
    for (const r of rows) {
      if (r.externalId) existingIds.add(r.externalId);
    }

    let created = 0;
    let updated = 0;

    for (const item of items) {
      try {
        const detail = await this.fetchEventDetail(item.id);
        if (!detail) continue;

        const categoryId = catMap.get(feed.catSlug) ?? undefined;
        const data: any = {
          title: detail.title || item.title,
          description: detail.description || item.description,
          shortDescription: detail.description ? detail.description.slice(0, 200) : undefined,
          categoryId,
          city: detail.city ?? 'Южно-Сахалинск',
          venueName: detail.venueName,
          venueAddress: detail.venueAddress,
          startDate: detail.startDate,
          endDate: detail.endDate,
          isFree: !detail.ticketUrl,
          imageUrl: detail.imageUrl,
          ticketUrl: detail.ticketUrl,
          status: 'published' as const,
          externalId: item.id,
          externalSource: 'afisha65',
        };

        if (existingIds.has(item.id)) {
          await this.prisma.event.updateMany({
            where: { externalId: item.id, externalSource: 'afisha65' },
            data,
          });
          updated++;
        } else {
          await this.prisma.event.create({ data });
          created++;
        }
      } catch (err) {
        this.logger.warn(`Event ${item.id} detail fetch failed: ${(err as Error).message}`);
      }

      await this.sleep(500);
    }

    this.logger.log(`afisha65 [${feed.catSlug}]: ${created} created, ${updated} updated from ${items.length} items`);
  }

  private async fetchEventDetail(eventId: string): Promise<ParsedEvent | null> {
    const html = await this.fetchWithRetry(`https://afisha65.ru/event/${eventId}`);
    const $ = cheerio.load(html);

    const jsonLdScript = $('script[type="application/ld+json"]').first().text().trim();
    if (!jsonLdScript) return null;

    let ld: any;
    try {
      ld = JSON.parse(jsonLdScript);
    } catch {
      return null;
    }

    const startStr: string | undefined = ld.startDate;
    if (!startStr) return null;

    let startDate: Date;
    let endDate: Date | undefined;

    if (startStr.includes('T')) {
      startDate = new Date(startStr);
    } else {
      const timeFromHtml = this.extractFirstTime($);
      if (timeFromHtml) {
        startDate = new Date(`${startStr}T${timeFromHtml}`);
      } else {
        startDate = new Date(`${startStr}T19:00:00`);
      }
    }

    if (ld.endDate) {
      if (ld.endDate.includes('T')) {
        endDate = new Date(ld.endDate);
      } else {
        endDate = new Date(`${ld.endDate}T23:59:00`);
      }
    }

    const imageUrl = Array.isArray(ld.image) ? ld.image[0] : (ld.image ?? undefined);
    const ticketUrl = ld.offers?.url ?? this.extractTicketUrl($) ?? undefined;

    const venueName = ld.location?.name ?? undefined;
    const venueAddress = ld.location?.address?.streetAddress ?? undefined;
    const city = ld.location?.address?.addressLocality ?? undefined;

    return {
      title: ld.name ?? '',
      description: ld.description ?? '',
      imageUrl,
      startDate,
      endDate,
      venueName,
      venueAddress,
      city: city || (venueAddress?.startsWith('Южно-Сахалинск') ? 'Южно-Сахалинск' : undefined),
      ticketUrl,
      ageRange: ld.typicalAgeRange,
    };
  }

  private extractFirstTime($: cheerio.CheerioAPI): string | null {
    const timeEl = $('.timetable-by-event-row-datetime-time').first().text().trim();
    const match = timeEl.match(/(\d{1,2}:\d{2})/);
    return match ? match[1] : null;
  }

  private extractTicketUrl($: cheerio.CheerioAPI): string | null {
    const btn = $('a.svg-buy-ticket-new').first().attr('href')
      ?? $('a.svg-buy-ticket').first().attr('href');
    return btn || null;
  }

  private async fetchWithRetry(url: string, retries = 2): Promise<string> {
    for (let i = 0; i <= retries; i++) {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SakhcomBot/1.0)' },
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
