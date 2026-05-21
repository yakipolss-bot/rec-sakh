import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { writeFile } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class SeoService {
  private readonly logger = new Logger(SeoService.name);

  constructor(private prisma: PrismaService) {}

  async getRedirects() {
    return this.prisma.seoRedirect.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async createRedirect(dto: { source: string; target: string; type?: number }) {
    return this.prisma.seoRedirect.create({
      data: {
        source: dto.source,
        target: dto.target,
        type: dto.type ?? 301,
      },
    });
  }

  async deleteRedirect(id: string) {
    await this.prisma.seoRedirect.delete({ where: { id } });
  }

  async generateSitemap(): Promise<string> {
    const baseUrl = 'https://rec-sakh.ru';

    const [articles, categories, events, ads] = await Promise.all([
      this.prisma.newsArticle.findMany({ where: { status: 'published' }, select: { slug: true, updatedAt: true } }),
      this.prisma.category.findMany({ select: { slug: true } }),
      this.prisma.event.findMany({ where: { status: 'published' }, select: { id: true, updatedAt: true } }),
      this.prisma.ad.findMany({ where: { status: 'active' }, select: { id: true, updatedAt: true } }),
    ]);

    const urls: { loc: string; lastmod?: string; priority: string }[] = [
      { loc: `${baseUrl}/`, priority: '1.0' },
      ...['/news', '/events', '/ads', '/jobs', '/realty', '/directory', '/transport', '/weather', '/currency', '/horoscope', '/tv', '/about', '/media']
        .map((p) => ({ loc: `${baseUrl}${p}`, priority: '0.8' })),
      ...articles.map((a: any) => ({
        loc: `${baseUrl}/article/${a.slug}`,
        lastmod: a.updatedAt?.toISOString?.()?.slice(0, 10),
        priority: '0.9',
      })),
      ...categories.map((c: any) => ({ loc: `${baseUrl}/category/${c.slug}`, priority: '0.7' })),
      ...events.map((e: any) => ({
        loc: `${baseUrl}/events/${e.id}`,
        lastmod: e.updatedAt?.toISOString?.()?.slice(0, 10),
        priority: '0.6',
      })),
      ...ads.map((a: any) => ({
        loc: `${baseUrl}/ads/${a.id}`,
        lastmod: a.updatedAt?.toISOString?.()?.slice(0, 10),
        priority: '0.5',
      })),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    ${u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>` : ''}
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    const publicDir = process.env.PUBLIC_DIR || join(process.cwd(), '..', '..', 'app', 'public');
    await writeFile(join(publicDir, 'sitemap.xml'), xml, 'utf-8');
    this.logger.log(`Sitemap generated with ${urls.length} URLs`);

    return `${baseUrl}/sitemap.xml`;
  }

  async checkBrokenLinks(): Promise<{ url: string; status: number | null; error: string | null }[]> {
    const paths = ['/', '/news', '/events', '/ads', '/jobs', '/realty', '/directory', '/transport', '/weather', '/currency'];
    const results: { url: string; status: number | null; error: string | null }[] = [];

    for (const path of paths) {
      try {
        const res = await fetch(`https://rec-sakh.ru${path}`, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
        results.push({ url: path, status: res.status, error: res.ok ? null : `HTTP ${res.status}` });
        await this.prisma.brokenLinkCheck.create({
          data: { url: path, status: res.status, error: res.ok ? null : `HTTP ${res.status}` },
        });
      } catch (err: any) {
        results.push({ url: path, status: null, error: err.message });
        await this.prisma.brokenLinkCheck.create({
          data: { url: path, status: null, error: err.message },
        });
      }
    }

    return results;
  }

  async getBrokenLinks() {
    return this.prisma.brokenLinkCheck.findMany({
      orderBy: { checkedAt: 'desc' },
      take: 100,
    });
  }
}
