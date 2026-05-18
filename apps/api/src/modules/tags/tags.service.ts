import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { CreateTagDto } from './dto/create-tag.dto.js';
import { UpdateTagDto } from './dto/update-tag.dto.js';
import { MergeTagsDto } from './dto/merge-tags.dto.js';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  private translitMap: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e',
    ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
    н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
    ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch',
    ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  };

  private generateSlug(name: string): string {
    const translit = name
      .toLowerCase()
      .replace(/[а-яё]/g, (c) => this.translitMap[c] || c)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return translit;
  }

  async findAll(query: { search?: string }) {
    const where: any = {};

    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    const tags = await this.prisma.tag.findMany({
      where,
      include: {
        _count: { select: { newsTags: true } },
      },
      orderBy: { name: 'asc' },
    });

    return tags.map(({ _count, ...tag }) => ({
      ...tag,
      newsCount: _count.newsTags,
    }));
  }

  async findById(id: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
      include: {
        _count: { select: { newsTags: true } },
      },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    const { _count, ...rest } = tag;
    return { ...rest, newsCount: _count.newsTags };
  }

  async create(dto: CreateTagDto) {
    const slug = this.generateSlug(dto.name) || `tag-${Date.now().toString(36)}`;

    const existing = await this.prisma.tag.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException('Tag with this name already exists');
    }

    return this.prisma.tag.create({
      data: { name: dto.name, slug },
    });
  }

  async update(id: string, dto: UpdateTagDto) {
    const tag = await this.prisma.tag.findUnique({ where: { id } });
    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    const slug = this.generateSlug(dto.name) || `tag-${Date.now().toString(36)}`;
    const existing = await this.prisma.tag.findUnique({ where: { slug } });
    if (existing && existing.id !== id) {
      throw new ConflictException('Tag with this name already exists');
    }

    return this.prisma.tag.update({
      where: { id },
      data: { name: dto.name, slug },
    });
  }

  async remove(id: string) {
    const tag = await this.prisma.tag.findUnique({ where: { id } });
    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    await this.prisma.tag.delete({ where: { id } });
  }

  async merge(dto: MergeTagsDto) {
    const [source, target] = await Promise.all([
      this.prisma.tag.findUnique({ where: { id: dto.sourceId } }),
      this.prisma.tag.findUnique({ where: { id: dto.targetId } }),
    ]);

    if (!source) {
      throw new NotFoundException('Source tag not found');
    }
    if (!target) {
      throw new NotFoundException('Target tag not found');
    }

    if (source.id === target.id) {
      throw new ConflictException('Cannot merge a tag into itself');
    }

    const sourceLinks = await this.prisma.newsTag.findMany({
      where: { tagId: source.id },
    });

    for (const link of sourceLinks) {
      const existing = await this.prisma.newsTag.findUnique({
        where: { newsId_tagId: { newsId: link.newsId, tagId: target.id } },
      });
      if (!existing) {
        await this.prisma.newsTag.create({
          data: { newsId: link.newsId, tagId: target.id },
        });
      }
    }

    await this.prisma.newsTag.deleteMany({ where: { tagId: source.id } });
    await this.prisma.tag.delete({ where: { id: source.id } });

    return this.prisma.tag.findUnique({
      where: { id: target.id },
      include: {
        _count: { select: { newsTags: true } },
      },
    });
  }
}
