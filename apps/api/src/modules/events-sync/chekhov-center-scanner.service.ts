import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import * as cheerio from 'cheerio';

@Injectable()
export class ChekhovCenterScannerService implements OnModuleInit {
  private readonly logger = new Logger(ChekhovCenterScannerService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    this.scan().catch(err =>
      this.logger.warn(`Initial Chekhov Center scan failed: ${(err as Error).message}`),
    );
  }

  @Cron('0 */6 * * *')
  async scan() {
    this.logger.log('Starting Chekhov Center scan...');

    const cat = await this.prisma.category.findUnique({ where: { slug: 'teatr' } });
    if (!cat) {
      this.logger.warn('Category "teatr" not found, skipping');
      return;
    }

    try {
      const html = await this.fetchWithRetry('https://www.chekhov-center.ru/afisha');
      const events = this.parseHtml(html, cat.id);
      this.logger.log(`Parsed ${events.length} events from Chekhov Center`);

      let created = 0;
      let updated = 0;

      for (const evt of events) {
        const existing = await this.prisma.event.findFirst({
          where: { externalId: evt.externalId, externalSource: 'chekhov-center' },
        });

        if (existing) {
          await this.prisma.event.update({ where: { id: existing.id }, data: evt.data });
          updated++;
        } else {
          await this.prisma.event.create({ data: evt.data });
          created++;
        }
      }

      this.logger.log(`Chekhov Center: ${created} created, ${updated} updated`);
    } catch (err) {
      this.logger.error('Chekhov Center scan failed', err);
    }
  }

  private parseHtml(html: string, categoryId: string) {
    const $ = cheerio.load(html);
    const events: { externalId: string; data: any }[] = [];
    const seen = new Set<string>();

    $('.afisha-item.sp-hide').each((_, el) => {
      try {
        const container = $(el);

        const dayNumber = container.find('.item-afisha-date').text().trim();
        const monthText = container.find('.item-afisha-month').contents().filter((_, n) => n.type === 'text').text().trim();
        const timeText = container.find('.item-afisha-time').text().trim();
        const venueFull = container.find('.item-afisha-place').text().trim();
        const venueName = venueFull.replace(/\(.*\)/, '').trim();
        const venueAddress = (venueFull.match(/\(([^)]+)\)/) || [])[1] || undefined;

        const titleEl = container.find('.item-afisha-title-name a.link-white');
        const title = titleEl.text().trim();
        if (!title) return;

        const genre = container.find('.item-afisha-title-description').text().trim();
        const directorText = container.find('.item-afisha-title-director').text().trim()
          .replace(/^Режиссер\s*/i, '')
          .replace(/^Режиссер:\s*/i, '')
          .replace(/\n/g, ' ')
          .trim();

        const imageEl = container.find('.item-afisha-image img');
        const imageUrl = imageEl.attr('src');
        const fullImageUrl = imageUrl
          ? (imageUrl.startsWith('http') ? imageUrl : `https://www.chekhov-center.ru${imageUrl}`)
          : undefined;

        const ticketLink = container.find('.item-afisha-attr-bilet a[href]').attr('href');

        const description = [genre, directorText ? `Режиссёр: ${directorText}` : '']
          .filter(Boolean)
          .join('. ');

        const year = new Date().getFullYear();
        const month = this.monthNumber(monthText) - 1;
        const timeMatch = timeText.match(/(\d{1,2}):(\d{2})/);
        const hours = timeMatch ? parseInt(timeMatch[1], 10) : 19;
        const minutes = timeMatch ? parseInt(timeMatch[2], 10) : 0;

        const startDate = new Date(year, month, parseInt(dayNumber, 10), hours, minutes);

        const key = `${dayNumber}.${monthText}.${title}`;
        if (seen.has(key)) return;
        seen.add(key);

        const externalId = `chekhov-${this.slugify(title)}-${startDate.getTime()}`;

        events.push({
          externalId,
          data: {
            title,
            description,
            shortDescription: (genre || title).slice(0, 200),
            categoryId,
            city: 'Южно-Сахалинск',
            venueName: venueName || 'Чехов-центр',
            venueAddress: venueAddress || 'Коммунистический пр., 35',
            startDate,
            isFree: false,
            price: undefined,
            currency: 'RUB',
            imageUrl: fullImageUrl,
            ticketUrl: ticketLink || 'https://quicktickets.ru/yuzhno-sahalinsk-centr-chehova',
            status: 'published' as const,
            externalId,
            externalSource: 'chekhov-center',
          },
        });
      } catch {
        // skip malformed item
      }
    });

    return events;
  }

  private monthNumber(name: string): number {
    const map: Record<string, number> = {
      января: 1, февраля: 2, марта: 3, апреля: 4, мая: 5, июня: 6,
      июля: 7, августа: 8, сентября: 9, октября: 10, ноября: 11, декабря: 12,
    };
    return map[name.toLowerCase().trim()] || new Date().getMonth() + 1;
  }

  private slugify(text: string): string {
    return text.toLowerCase()
      .replace(/[^a-zа-яё0-9]/gi, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60);
  }

  private async fetchWithRetry(url: string, retries = 2): Promise<string> {
    for (let i = 0; i <= retries; i++) {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
        },
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
