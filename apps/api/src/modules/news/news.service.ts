import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { SearchIndexService } from '../../common/search/search-index.service.js';
import { CreateNewsDto } from './dto/create-news.dto.js';
import { UpdateNewsDto } from './dto/update-news.dto.js';
import { ExternalNewsDto } from './dto/external-news.dto.js';
import { NewsQueryDto } from './dto/news-query.dto.js';
import { NewsStatus, UserRole } from '@prisma/client';

const VALID_TRANSITIONS: Record<NewsStatus, NewsStatus[]> = {
  draft: ['review'],
  review: ['draft', 'published', 'rejected'],
  published: ['archived'],
  rejected: ['draft'],
  archived: ['draft'],
};

@Injectable()
export class NewsService {
  constructor(
    private prisma: PrismaService,
    private searchIndexService: SearchIndexService,
  ) {}

  async findAll(query: NewsQueryDto) {
    const page = parseInt(query.page || '1', 10);
    const perPage = Math.min(parseInt(query.perPage || '20', 10), 100);
    const skip = (page - 1) * perPage;

    const where: any = { deletedAt: null };

    if (query.status) {
      where.status = query.status;
    } else {
      where.status = 'published';
    }

    if (query.category) {
      where.categoryId = query.category;
    }

    if (query.city) {
      where.city = query.city;
    }

    if (query.author) {
      where.authorId = query.author;
    }

    if (query.isUrgent === 'true') {
      where.isUrgent = true;
    }

    if (query.search) {
      // H4: Если поисковый запрос короче 3 символов — игнорируем (contains insensitive медленный на больших данных)
      if (query.search.length < 3) {
        // Слишком короткий запрос — возвращаем пустой результат или игнорируем поиск
        // Здесь игнорируем поиск и не добавляем условие
      } else {
        // TODO: Использовать Typesense для полнотекстового поиска вместо contains
        where.OR = [
          { title: { contains: query.search, mode: 'insensitive' } },
          { lead: { contains: query.search, mode: 'insensitive' } },
        ];
      }
    }

    if (query.dateFrom) {
      where.publishedAt = { ...where.publishedAt, gte: new Date(query.dateFrom) };
    }
    if (query.dateTo) {
      where.publishedAt = { ...where.publishedAt, lte: new Date(query.dateTo) };
    }

    if (query.tagIds) {
      const tagIdArray = query.tagIds.split(',').filter(Boolean);
      if (tagIdArray.length > 0) {
        where.tags = { some: { tagId: { in: tagIdArray } } };
      }
    }

    let orderBy: any = { publishedAt: 'desc' };
    if (query.sort === 'views') {
      orderBy = { viewsCount: 'desc' };
    } else if (query.sort === 'created') {
      orderBy = { createdAt: 'desc' };
    }

    const [data, total] = await Promise.all([
      this.prisma.newsArticle.findMany({
        where,
        skip,
        take: perPage,
        orderBy,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          author: { select: { id: true, name: true, avatarUrl: true } },
          tags: { include: { tag: true } },
        },
      }),
      this.prisma.newsArticle.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
        requestId: '',
        timestamp: new Date().toISOString(),
      },
    };
  }

  async findById(id: string) {
    const article = await this.prisma.newsArticle.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        author: { select: { id: true, name: true, avatarUrl: true } },
        tags: { include: { tag: true } },
      },
    });

    if (!article || article.deletedAt) {
      throw new NotFoundException('News article not found');
    }

    // TODO (M6): Использовать Redis для отложенного инкремента viewsCount,
    // чтобы избежать N+1 прямых writes в БД при каждом просмотре.
    // Вариант: публиковать событие в очередь и агрегировать в фоне.
    await this.prisma.newsArticle.update({
      where: { id },
      data: { viewsCount: { increment: 1 } },
    });

    return article;
  }

  async preview(id: string) {
    const article = await this.prisma.newsArticle.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        author: { select: { id: true, name: true, avatarUrl: true } },
        tags: { include: { tag: true } },
      },
    });

    if (!article || article.deletedAt) {
      throw new NotFoundException('News article not found');
    }

    return article;
  }

  async stats(id: string) {
    const article = await this.prisma.newsArticle.findUnique({
      where: { id },
      select: {
        viewsCount: true,
        commentsCount: true,
        readingTimeMinutes: true,
      },
    });

    if (!article) {
      throw new NotFoundException('News article not found');
    }

    return {
      viewsCount: article.viewsCount,
      commentsCount: article.commentsCount,
      readingTimeMinutes: article.readingTimeMinutes,
    };
  }

  async related(id: string, limit: number = 4) {
    const article = await this.prisma.newsArticle.findUnique({
      where: { id },
      include: {
        tags: true,
      },
    });

    if (!article) {
      throw new NotFoundException('News article not found');
    }

    const tagIds = article.tags.map((t) => t.tagId);
    const clampedLimit = Math.max(3, Math.min(limit || 4, 6));

    const where: any = {
      id: { not: id },
      deletedAt: null,
      status: 'published',
    };

    if (tagIds.length > 0) {
      where.tags = { some: { tagId: { in: tagIds } } };
    }

    if (article.categoryId) {
      where.categoryId = article.categoryId;
    }

    const related = await this.prisma.newsArticle.findMany({
      where,
      take: clampedLimit,
      orderBy: { publishedAt: 'desc' },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        author: { select: { id: true, name: true, avatarUrl: true } },
        tags: { include: { tag: true } },
      },
    });

    return {
      data: related,
      meta: {
        total: related.length,
        limit: clampedLimit,
        requestId: '',
        timestamp: new Date().toISOString(),
      },
    };
  }

  async history(id: string) {
    const article = await this.prisma.newsArticle.findUnique({
      where: { id },
    });

    if (!article) {
      throw new NotFoundException('News article not found');
    }

    const versions = await this.prisma.newsVersion.findMany({
      where: { newsId: id },
      orderBy: { versionNumber: 'desc' },
      include: {
        changedByUser: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    return {
      data: versions,
      meta: {
        total: versions.length,
        requestId: '',
        timestamp: new Date().toISOString(),
      },
    };
  }

  async create(dto: CreateNewsDto, authorId: string) {
    const slug = dto.slug || this.generateSlug(dto.title);

    const article = await this.prisma.newsArticle.create({
      data: {
        slug,
        title: dto.title,
        lead: dto.lead,
        content: dto.content,
        categoryId: dto.categoryId,
        authorId,
        city: dto.city,
        isUrgent: dto.isUrgent || false,
        isPremium: dto.isPremium || false,
        isBreaking: dto.isBreaking || false,
        mainImageUrl: dto.mainImageUrl,
        sourceName: dto.sourceName,
        sourceUrl: dto.sourceUrl,
        seoTitle: dto.seoTitle,
        seoDescription: dto.seoDescription,
        seoOgImage: dto.seoOgImage,
        gallery: dto.gallery || [],
        videoUrl: dto.videoUrl,
        videoType: dto.videoType,
        videoDuration: dto.videoDuration,
        status: 'draft',
        readingTimeMinutes: this.calculateReadingTime(dto.content),
        ...(dto.tagIds?.length && {
          tags: {
            create: dto.tagIds.map((tagId) => ({ tagId })),
          },
        }),
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        author: { select: { id: true, name: true, avatarUrl: true } },
        tags: { include: { tag: true } },
      },
    });

    // M2: Создаём первую версию статьи
    await this.prisma.newsVersion.create({
      data: {
        newsId: article.id,
        versionNumber: 1,
        title: dto.title,
        lead: dto.lead || '',
        content: dto.content,
        changedBy: authorId,
      },
    }).catch(() => {
      // Версия не критична для ответа
    });

    // H10: Индексация в Typesense (не блокируем ответ)
    await this.searchIndexService.indexNews(article).catch(() => {
      // Ошибка логируется внутри searchIndexService
    });

    return article;
  }

  async checkBySourceUrl(sourceUrl: string) {
    const article = await this.prisma.newsArticle.findFirst({
      where: { sourceUrl, deletedAt: null },
      select: { id: true, title: true, content: true, sourceUrl: true, updatedAt: true },
    });
    return { exists: !!article, article };
  }

  async createExternal(dto: ExternalNewsDto) {
    const slug = this.generateSlug(dto.title);

    const article = await this.prisma.newsArticle.create({
      data: {
        slug,
        title: dto.title,
        lead: dto.lead || '',
        content: dto.content || '',
        sourceName: dto.sourceName,
        sourceUrl: dto.sourceUrl,
        mainImageUrl: dto.imageUrl,
        publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : new Date(),
        status: 'draft',
        readingTimeMinutes: this.calculateReadingTime(dto.content || ''),
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        author: { select: { id: true, name: true, avatarUrl: true } },
        tags: { include: { tag: true } },
      },
    });

    await this.searchIndexService.indexNews(article).catch(() => {});

    return article;
  }

  async update(id: string, dto: UpdateNewsDto, userId: string, userRole: UserRole) {
    const article = await this.prisma.newsArticle.findUnique({
      where: { id },
    });

    if (!article || article.deletedAt) {
      throw new NotFoundException('News article not found');
    }

    if (article.authorId !== userId && userRole === 'journalist') {
      throw new ForbiddenException('You can only edit your own articles');
    }

    const latestVersion = await this.prisma.newsVersion.findFirst({
      where: { newsId: id },
      orderBy: { versionNumber: 'desc' },
    });
    const versionNumber = (latestVersion?.versionNumber || 0) + 1;

    const data: any = { ...dto };
    delete data.tagIds;
    if (dto.content) {
      data.readingTimeMinutes = this.calculateReadingTime(dto.content);
    }

    const [updated] = await this.prisma.$transaction(async (tx) => {
      if (dto.tagIds) {
        await tx.newsTag.deleteMany({ where: { newsId: id } });
        if (dto.tagIds.length > 0) {
          await tx.newsTag.createMany({
            data: dto.tagIds.map((tagId) => ({ newsId: id, tagId })),
          });
        }
      }

      const result = await tx.newsArticle.update({
        where: { id },
        data,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          author: { select: { id: true, name: true, avatarUrl: true } },
          tags: { include: { tag: true } },
        },
      });

      await tx.newsVersion.create({
        data: {
          newsId: id,
          versionNumber,
          title: dto.title || article.title,
          lead: dto.lead || article.lead,
          content: dto.content || article.content,
          changedBy: userId,
        },
      });

      return [result];
    });

    // H10: Индексация в Typesense (не блокируем ответ)
    await this.searchIndexService.indexNews(updated).catch(() => {
      // Ошибка логируется внутри searchIndexService
    });

    return updated;
  }

  async remove(id: string) {
    const article = await this.prisma.newsArticle.findUnique({
      where: { id },
    });

    if (!article) {
      throw new NotFoundException('News article not found');
    }

    await this.prisma.newsArticle.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async updateStatus(
    id: string,
    status: NewsStatus,
    rejectionReason?: string,
  ) {
    const article = await this.prisma.newsArticle.findUnique({
      where: { id },
    });

    if (!article) {
      throw new NotFoundException('News article not found');
    }

    const allowed = VALID_TRANSITIONS[article.status as NewsStatus];
    if (!allowed || !allowed.includes(status)) {
      throw new BadRequestException(
        `Недопустимый переход статуса: ${article.status} → ${status}`,
      );
    }

    const data: any = { status };

    if (status === 'review' && article.scheduledAt) {
      data.scheduledAt = article.scheduledAt;
    }

    if (status === 'published') {
      data.publishedAt = new Date();
    }

    if (status === 'rejected' && rejectionReason) {
      data.seoDescription = rejectionReason;
    }

    return this.prisma.newsArticle.update({
      where: { id },
      data,
    });
  }

  @Cron('*/1 * * * *')
  async publishScheduled() {
    const now = new Date();
    const articles = await this.prisma.newsArticle.findMany({
      where: {
        status: 'review',
        scheduledAt: { lte: now },
        deletedAt: null,
      },
    });

    for (const article of articles) {
      // M3: Проверяем, что статья готова к публикации
      const missingFields: string[] = [];
      if (!article.title) missingFields.push('title');
      if (!article.lead) missingFields.push('lead');
      if (!article.content || article.content.length < 300) missingFields.push('content (min 300 chars)');
      if (!article.categoryId) missingFields.push('categoryId');

      if (missingFields.length > 0) {
        // Переводим обратно в draft при неполных данных
        await this.prisma.newsArticle.update({
          where: { id: article.id },
          data: { status: 'draft', scheduledAt: null },
        }).catch(() => {});
        continue;
      }

      await this.updateStatus(article.id, 'published' as NewsStatus);
    }
  }

  private generateSlug(title: string): string {
    const translit = title
      .toLowerCase()
      .replace(/[а-яё]/g, (c) => this.translitMap[c] || c)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return `${translit}-${Date.now().toString(36)}`;
  }

  private calculateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(words / wordsPerMinute));
  }

  private translitMap: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e',
    ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
    н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
    ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch',
    ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  };
}
