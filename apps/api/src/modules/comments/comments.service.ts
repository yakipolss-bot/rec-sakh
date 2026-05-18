import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JSDOM } from 'jsdom';
import dompurify from 'dompurify';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';
import { UpdateCommentDto } from './dto/update-comment.dto.js';
import { CommentsQueryDto } from './dto/comments-query.dto.js';
import { BanUserDto } from './dto/ban-user.dto.js';
import { BulkModerateDto } from './dto/bulk-moderate.dto.js';

const window = new JSDOM('').window;
const purify = dompurify(window);

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: CommentsQueryDto) {
    const page = parseInt(query.page || '1', 10);
    const perPage = Math.min(parseInt(query.perPage || '20', 10), 100);
    const skip = (page - 1) * perPage;

    const where: any = { deletedAt: null };

    if (query.newsId) {
      where.newsId = query.newsId;
    }

    if (query.authorId) {
      where.authorId = query.authorId;
    }

    if (query.status) {
      where.status = query.status;
    }

    const [data, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        skip,
        take: perPage,
        orderBy: [
          { isPinned: 'desc' },
          query.sort === 'karma' ? { likesCount: 'desc' as const } : { createdAt: 'desc' as const },
        ],
        include: {
          author: { select: { id: true, name: true, avatarUrl: true } },
        },
      }),
      this.prisma.comment.count({ where }),
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

  async getReplies(id: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment || comment.deletedAt) {
      throw new NotFoundException('Comment not found');
    }

    return this.prisma.comment.findMany({
      where: { parentId: id, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
  }

  async create(dto: CreateCommentDto, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.status === 'blocked') {
      throw new ForbiddenException('Вы заблокированы за нарушение правил');
    }

    const news = await this.prisma.newsArticle.findUnique({
      where: { id: dto.newsId },
    });

    if (!news || news.deletedAt) {
      throw new NotFoundException('News article not found');
    }

    if (dto.parentId) {
      const parent = await this.prisma.comment.findUnique({
        where: { id: dto.parentId },
      });

      if (!parent || parent.deletedAt) {
        throw new NotFoundException('Parent comment not found');
      }

      if (parent.newsId !== dto.newsId) {
        throw new BadRequestException('Parent comment belongs to a different news article');
      }

      let depth = 1;
      let currentParentId = dto.parentId;
      while (currentParentId) {
        const p = await this.prisma.comment.findUnique({
          where: { id: currentParentId },
          select: { parentId: true },
        });
        if (!p) break;
        depth++;
        currentParentId = p.parentId ?? '';
        if (depth >= 3) {
          throw new BadRequestException('Максимальная глубина вложенности — 3 уровня');
        }
      }
    }

    // H9: Sanitize HTML to prevent XSS
    const sanitizedContent = purify.sanitize(dto.content);

    const blacklist = await this.prisma.commentBlacklist.findMany();
    const hasBlacklisted = blacklist.some((b) =>
      sanitizedContent.toLowerCase().includes(b.word.toLowerCase()),
    );

    const comment = await this.prisma.comment.create({
      data: {
        newsId: dto.newsId,
        authorId: userId,
        parentId: dto.parentId,
        content: sanitizedContent,
        status: hasBlacklisted ? 'pending' : 'approved',
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    if (!hasBlacklisted) {
      await this.prisma.newsArticle.update({
        where: { id: dto.newsId },
        data: { commentsCount: { increment: 1 } },
      });
    }

    return comment;
  }

  async update(id: string, dto: UpdateCommentDto, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment || comment.deletedAt) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    const sanitizedContent = purify.sanitize(dto.content);
    return this.prisma.comment.update({
      where: { id },
      data: {
        content: sanitizedContent,
        isEdited: true,
        editedAt: new Date(),
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
  }

  async remove(id: string, userId: string, userRole: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const isAuthor = comment.authorId === userId;
    const hasModPermissions = ['editor', 'chief_editor', 'admin', 'superadmin'].includes(userRole);

    if (!isAuthor && !hasModPermissions) {
      throw new ForbiddenException('Not allowed to delete this comment');
    }

    await this.prisma.comment.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'deleted' },
    });

    await this.prisma.newsArticle.update({
      where: { id: comment.newsId! },
      data: { commentsCount: { decrement: 1 } },
    });
  }

  async vote(id: string, userId: string, voteValue: number) {
    if (voteValue !== 1 && voteValue !== -1) {
      throw new BadRequestException('Vote must be 1 or -1');
    }

    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment || comment.deletedAt) {
      throw new NotFoundException('Comment not found');
    }

    const existing = await this.prisma.commentVote.findUnique({
      where: { commentId_userId: { commentId: id, userId } },
    });

    if (existing) {
      if (existing.vote === voteValue) {
        await this.prisma.commentVote.delete({
          where: { commentId_userId: { commentId: id, userId } },
        });
      } else {
        await this.prisma.commentVote.update({
          where: { commentId_userId: { commentId: id, userId } },
          data: { vote: voteValue },
        });
      }
    } else {
      await this.prisma.commentVote.create({
        data: { commentId: id, userId, vote: voteValue },
      });
    }

    const agg = await this.prisma.commentVote.aggregate({
      where: { commentId: id },
      _sum: { vote: true },
    });

    const likes = await this.prisma.commentVote.count({
      where: { commentId: id, vote: 1 },
    });
    const dislikes = await this.prisma.commentVote.count({
      where: { commentId: id, vote: -1 },
    });

    const updated = await this.prisma.comment.update({
      where: { id },
      data: {
        likesCount: likes,
        dislikesCount: dislikes,
      },
    });

    const totalKarma = await this.prisma.commentVote.aggregate({
      where: { comment: { authorId: comment.authorId } },
      _sum: { vote: true },
    });
    await this.prisma.user.update({
      where: { id: comment.authorId },
      data: { karma: totalKarma._sum.vote || 0 },
    });

    return updated;
  }

  async report(id: string, userId: string, reason: string, description?: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment || comment.deletedAt) {
      throw new NotFoundException('Comment not found');
    }

    return this.prisma.commentReport.create({
      data: {
        commentId: id,
        reporterId: userId,
        reason: reason as any,
        description,
      },
    });
  }

  async moderate(id: string, status: string) {
    if (!['approved', 'rejected'].includes(status)) {
      throw new BadRequestException('Status must be approved or rejected');
    }

    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const updated = await this.prisma.comment.update({
      where: { id },
      data: { status: status as any },
    });

    await this.prisma.commentReport.updateMany({
      where: { commentId: id, status: 'pending' },
      data: { status: status === 'approved' ? 'rejected' : 'approved' },
    });

    if (status === 'approved') {
      await this.prisma.newsArticle.update({
        where: { id: comment.newsId! },
        data: { commentsCount: { increment: 1 } },
      });
    }

    return updated;
  }

  async pin(id: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment || comment.deletedAt) {
      throw new NotFoundException('Comment not found');
    }

    return this.prisma.comment.update({
      where: { id },
      data: { isPinned: !comment.isPinned },
    });
  }

  async getModerationQueue() {
    const where: any = { status: 'pending', deletedAt: null };

    const [data, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        include: {
          author: { select: { id: true, name: true, avatarUrl: true } },
          news: { select: { id: true, title: true } },
        },
      }),
      this.prisma.comment.count({ where }),
    ]);

    return { data, total };
  }

  async banUser(dto: BanUserDto, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.update({
      where: { id: dto.userId },
      data: { status: 'blocked' },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'ban_user',
        entityType: 'user',
        entityId: dto.userId,
        changes: { reason: dto.reason, durationHours: dto.durationHours ?? null },
      },
    });

    return { message: 'User banned from commenting' };
  }

  async unbanUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'active' },
    });

    return { message: 'User unbanned' };
  }

  async getStats() {
    const [total, pending, approved, rejected, reported] = await Promise.all([
      this.prisma.comment.count({ where: { deletedAt: null } }),
      this.prisma.comment.count({ where: { status: 'pending', deletedAt: null } }),
      this.prisma.comment.count({ where: { status: 'approved', deletedAt: null } }),
      this.prisma.comment.count({ where: { status: 'rejected', deletedAt: null } }),
      this.prisma.commentReport.count({ where: { status: 'pending' } }),
    ]);
    return { data: { total, pending, approved, rejected, reported } };
  }

  async removeBlacklistWord(word: string) {
    try {
      await this.prisma.commentBlacklist.delete({ where: { word } });
    } catch {
      throw new NotFoundException('Word not found in blacklist');
    }
  }

  async bulkModerate(dto: BulkModerateDto) {
    const result = await this.prisma.comment.updateMany({
      where: { id: { in: dto.ids }, deletedAt: null },
      data: { status: dto.status },
    });

    if (dto.status === 'approved') {
      await this.prisma.newsArticle.updateMany({
        where: { comments: { some: { id: { in: dto.ids } } } },
        data: { commentsCount: { increment: result.count } },
      });
    }

    return { data: { updated: result.count } };
  }

  async addBlacklistWord(word: string, userId: string) {
    const existing = await this.prisma.commentBlacklist.findUnique({
      where: { word },
    });

    if (existing) {
      throw new BadRequestException('Word already in blacklist');
    }

    return this.prisma.commentBlacklist.create({
      data: { word, createdBy: userId },
    });
  }

  async getBlacklist() {
    return this.prisma.commentBlacklist.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}
