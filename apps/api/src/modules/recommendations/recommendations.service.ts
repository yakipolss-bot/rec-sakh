import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import {
  ScoredItem,
  ScoreComponents,
  UserProfile,
  CandidateItem,
  EditorialPickRow,
} from './interfaces/recommendation.types.js';
import { RecommendationsQueryDto, CreateEditorialPickDto } from './dto/index.js';

const DEFAULT_WEIGHTS = {
  contentScore: 0.25,
  userScore: 0.20,
  popularityScore: 0.15,
  freshnessScore: 0.15,
  diversityScore: 0.10,
  editorialScore: 0.10,
  contextScore: 0.03,
  businessScore: 0.02,
};

const INTERACTION_WEIGHTS: Record<string, number> = {
  view: 1,
  like: 3,
  share: 5,
  comment: 4,
  save: 4,
};

const FRESHNESS_THRESHOLDS = [
  { maxHours: 2, score: 1.0 },
  { maxHours: 6, score: 0.9 },
  { maxHours: 12, score: 0.75 },
  { maxHours: 24, score: 0.6 },
  { maxHours: 48, score: 0.45 },
  { maxHours: 72, score: 0.35 },
  { maxHours: 168, score: 0.25 },
  { maxHours: 720, score: 0.15 },
];

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  constructor(
    private prisma: PrismaService,
  ) {}

  // ─── Public API ───────────────────────────────────────────────────────────

  async getFeed(
    userId: string | null,
    query: RecommendationsQueryDto,
  ): Promise<ScoredItem[]> {
    const profile = await this.buildProfile(userId);
    const candidates = await this.generateCandidates(profile, query);
    const scored = await this.scoreCandidates(candidates, profile, query);
    const lambda = parseFloat(query.lambda || '0.7');
    const diversified = this.applyMMR(scored, lambda);
    const limit = Math.min(parseInt(query.limit || '10', 10), 50);
    return diversified.slice(0, limit);
  }

  async getSimilar(
    contentType: string,
    id: string,
    limit: number = 6,
  ): Promise<ScoredItem[]> {
    const clampedLimit = Math.max(3, Math.min(limit, 12));

    const sourceItem = await this.fetchSourceItem(contentType, id);
    if (!sourceItem) return [];

    const candidates = await this.generateSimilarCandidates(contentType, sourceItem, clampedLimit);
    const dummyProfile: UserProfile = {
      userId: '',
      viewedCategories: {},
      viewedTags: {},
      viewedAuthors: {},
      viewedItemIds: new Set(),
      subscriptions: { categories: [], tags: [], authors: [] },
      interactionHistory: [],
      avgReadTime: 0,
      totalViews: 0,
      isPremium: false,
    };
    const scored = await this.scoreCandidates(candidates, dummyProfile, { limit: String(clampedLimit) });
    const diversified = this.applyMMR(scored, 0.6);
    return diversified.slice(0, clampedLimit);
  }

  async getTrending(limit: number = 20): Promise<ScoredItem[]> {
    const clampedLimit = Math.min(limit, 50);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const articles = await this.prisma.newsArticle.findMany({
      where: {
        status: 'published',
        deletedAt: null,
        publishedAt: { gte: since },
      },
      orderBy: { viewsCount: 'desc' },
      take: clampedLimit * 2,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        author: { select: { id: true, name: true, avatarUrl: true } },
        tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
      },
    });

    const dummyProfile: UserProfile = {
      userId: '',
      viewedCategories: {},
      viewedTags: {},
      viewedAuthors: {},
      viewedItemIds: new Set(),
      subscriptions: { categories: [], tags: [], authors: [] },
      interactionHistory: [],
      avgReadTime: 0,
      totalViews: 0,
      isPremium: false,
    };

    const candidates = articles.map((a) => this.toCandidate(a, 'news'));
    const scored = await this.scoreCandidates(candidates, dummyProfile, {});
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, clampedLimit);
  }

  // ─── Editorial Picks ──────────────────────────────────────────────────────

  async setEditorialPick(dto: CreateEditorialPickDto, createdBy: string): Promise<void> {
    const existing = await this.prisma.editorialPick.findFirst({
      where: {
        contentId: dto.contentId,
        contentType: dto.contentType,
        OR: [
          { userId: dto.userId || null },
          { userId: null },
        ],
      },
    });

    if (existing) {
      await this.prisma.editorialPick.update({
        where: { id: existing.id },
        data: {
          action: dto.action,
          userId: dto.userId || null,
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
          createdBy,
        },
      });
    } else {
      await this.prisma.editorialPick.create({
        data: {
          contentId: dto.contentId,
          contentType: dto.contentType,
          action: dto.action,
          userId: dto.userId || null,
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
          createdBy,
        },
      });
    }
  }

  async removeEditorialPick(id: string): Promise<void> {
    await this.prisma.editorialPick.delete({ where: { id } });
  }

  async syncInteractionLog(): Promise<void> {
    this.logger.log('Interaction sync placeholder – full logic TBD');
  }

  // ─── Profile Building ─────────────────────────────────────────────────────

  private async buildProfile(userId: string | null): Promise<UserProfile> {
    if (!userId) {
      return {
        userId: '',
        viewedCategories: {},
        viewedTags: {},
        viewedAuthors: {},
        viewedItemIds: new Set(),
        subscriptions: { categories: [], tags: [], authors: [] },
        interactionHistory: [],
        avgReadTime: 0,
        totalViews: 0,
        isPremium: false,
      };
    }

    const profile: UserProfile = {
      userId,
      viewedCategories: {},
      viewedTags: {},
      viewedAuthors: {},
      viewedItemIds: new Set(),
      subscriptions: { categories: [], tags: [], authors: [] },
      interactionHistory: [],
      avgReadTime: 0,
      totalViews: 0,
      isPremium: false,
    };

    try {
      // Fetch user
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, karma: true, level: true },
      });
      if (!user) return profile;

      // Fetch interactions from AuditLog (last 90 days)
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const auditLogs = await this.prisma.auditLog.findMany({
        where: {
          userId,
          createdAt: { gte: ninetyDaysAgo },
          entityType: 'news',
          action: { in: ['view', 'like', 'share', 'comment', 'save'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 1000,
      });

      const viewedNewsIds = new Set<string>();
      for (const log of auditLogs) {
        if (log.entityId) {
          viewedNewsIds.add(log.entityId);
          profile.viewedItemIds.add(log.entityId);
          const weight = INTERACTION_WEIGHTS[log.action] || 1;
          profile.interactionHistory.push({ itemId: log.entityId, weight });
        }
      }

      profile.totalViews = auditLogs.filter((l) => l.action === 'view').length;

      // Fetch viewed articles details for category/tag/author aggregation
      if (viewedNewsIds.size > 0) {
        const viewedArticles = await this.prisma.newsArticle.findMany({
          where: { id: { in: Array.from(viewedNewsIds) } },
          select: {
            id: true,
            categoryId: true,
            authorId: true,
            readingTimeMinutes: true,
            tags: { select: { tagId: true } },
          },
        });

        let totalReadTime = 0;
        let readTimeCount = 0;
        for (const article of viewedArticles) {
          if (article.categoryId) {
            profile.viewedCategories[article.categoryId] =
              (profile.viewedCategories[article.categoryId] || 0) + 1;
          }
          if (article.authorId) {
            profile.viewedAuthors[article.authorId] =
              (profile.viewedAuthors[article.authorId] || 0) + 1;
          }
          for (const t of article.tags) {
            profile.viewedTags[t.tagId] =
              (profile.viewedTags[t.tagId] || 0) + 1;
          }
          if (article.readingTimeMinutes) {
            totalReadTime += article.readingTimeMinutes;
            readTimeCount++;
          }
        }
        profile.avgReadTime = readTimeCount > 0 ? totalReadTime / readTimeCount : 0;
      }

      // Check premium
      const subscription = await this.prisma.billingSubscription.findFirst({
        where: { userId, status: 'active' },
      });
      profile.isPremium = !!subscription;
    } catch (err) {
      this.logger.warn(`Failed to build profile for user ${userId}: ${(err as Error).message}`);
    }

    return profile;
  }

  // ─── Candidate Generation ─────────────────────────────────────────────────

  private async generateCandidates(
    profile: UserProfile,
    query: RecommendationsQueryDto,
  ): Promise<CandidateItem[]> {
    const candidates: CandidateItem[] = [];
    const seenIds = new Set<string>();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    try {
      // 1. News from last 7 days
      const newsFilter: any = {
        status: 'published',
        deletedAt: null,
        publishedAt: { gte: sevenDaysAgo },
      };
      if (query.category) {
        newsFilter.categoryId = query.category;
      }
      if (query.type && query.type !== 'all' && query.type !== 'news') {
        // skip news if type filter is not news
      } else {
        const articles = await this.prisma.newsArticle.findMany({
          where: newsFilter,
          orderBy: { publishedAt: 'desc' },
          take: 1000,
          include: {
            tags: { select: { tagId: true } },
            category: { select: { id: true, name: true, slug: true } },
            author: { select: { id: true, name: true, avatarUrl: true } },
          },
        });

        for (const a of articles) {
          if (seenIds.has(a.id)) continue;
          seenIds.add(a.id);
          candidates.push(this.toCandidate(a, 'news'));
        }
      }

      // 2. Events (upcoming)
      if (!query.type || query.type === 'all' || query.type === 'events') {
        const events = await this.prisma.event.findMany({
          where: {
            status: 'published',
            startDate: { gte: new Date() },
            deletedAt: null,
          },
          orderBy: { startDate: 'asc' },
          take: 200,
        });
        for (const e of events) {
          if (seenIds.has(e.id)) continue;
          seenIds.add(e.id);
          candidates.push(this.toCandidate(e, 'events'));
        }
      }

      // 3. MUST READ editorial picks
      const activePicks = await this.prisma.editorialPick.findMany({
        where: {
          action: 'must_read',
          OR: [
            { expiresAt: null },
            { expiresAt: { gte: new Date() } },
          ],
        },
      });
      for (const pick of activePicks) {
        if (seenIds.has(pick.contentId)) continue;
        const pickItem = await this.fetchCandidateById(pick.contentType, pick.contentId);
        if (pickItem) {
          seenIds.add(pickItem.id);
          candidates.push(pickItem);
        }
      }

      // 4. Subscribed authors' articles (last 30 days)
      const subscribedAuthors = Object.entries(profile.viewedAuthors)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([id]) => id);

      if (subscribedAuthors.length > 0) {
        const authorArticles = await this.prisma.newsArticle.findMany({
          where: {
            authorId: { in: subscribedAuthors },
            status: 'published',
            deletedAt: null,
            publishedAt: { gte: thirtyDaysAgo },
            id: { notIn: Array.from(seenIds) },
          },
          orderBy: { publishedAt: 'desc' },
          take: 100,
          include: {
            tags: { select: { tagId: true } },
            category: { select: { id: true, name: true, slug: true } },
            author: { select: { id: true, name: true, avatarUrl: true } },
          },
        });
        for (const a of authorArticles) {
          if (seenIds.has(a.id)) continue;
          seenIds.add(a.id);
          candidates.push(this.toCandidate(a, 'news'));
        }
      }

      // 5. Archive by top tags (for freshness)
      const topTags = Object.entries(profile.viewedTags)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([id]) => id);

      if (topTags.length > 0) {
        const tagArticles = await this.prisma.newsArticle.findMany({
          where: {
            tags: { some: { tagId: { in: topTags } } },
            status: 'published',
            deletedAt: null,
            id: { notIn: Array.from(seenIds) },
          },
          orderBy: { publishedAt: 'desc' },
          take: 100,
          include: {
            tags: { select: { tagId: true } },
            category: { select: { id: true, name: true, slug: true } },
            author: { select: { id: true, name: true, avatarUrl: true } },
          },
        });
        for (const a of tagArticles) {
          if (seenIds.has(a.id)) continue;
          seenIds.add(a.id);
          candidates.push(this.toCandidate(a, 'news'));
        }
      }
    } catch (err) {
      this.logger.error(`Candidate generation failed: ${(err as Error).message}`);
    }

    return candidates;
  }

  private async generateSimilarCandidates(
    contentType: string,
    sourceItem: CandidateItem,
    limit: number,
  ): Promise<CandidateItem[]> {
    const candidates: CandidateItem[] = [];

    try {
      if (contentType === 'news') {
        // Same category + tag overlap
        const where: any = {
          id: { not: sourceItem.id },
          status: 'published',
          deletedAt: null,
        };
        if (sourceItem.categoryId) {
          where.categoryId = sourceItem.categoryId;
        }
        if (sourceItem.tagIds.length > 0) {
          where.tags = { some: { tagId: { in: sourceItem.tagIds } } };
        }

        const articles = await this.prisma.newsArticle.findMany({
          where,
          orderBy: { publishedAt: 'desc' },
          take: limit * 3,
          include: {
            tags: { select: { tagId: true } },
            category: { select: { id: true, name: true, slug: true } },
            author: { select: { id: true, name: true, avatarUrl: true } },
          },
        });
        for (const a of articles) {
          candidates.push(this.toCandidate(a, 'news'));
        }
      }
    } catch (err) {
      this.logger.warn(`Similar candidates generation failed: ${(err as Error).message}`);
    }

    return candidates;
  }

  // ─── Scoring ──────────────────────────────────────────────────────────────

  private async scoreCandidates(
    candidates: CandidateItem[],
    profile: UserProfile,
    _query: any,
  ): Promise<ScoredItem[]> {
    if (candidates.length === 0) return [];

    // Pre-fetch editorial picks for batch scoring
    const editorialPicks = await this.fetchActiveEditorialPicks();

    const scored: ScoredItem[] = [];

    for (const item of candidates) {
      try {
        const components: ScoreComponents = {
          contentScore: this.computeContentScore(item, profile),
          userScore: this.computeUserScore(item, profile),
          popularityScore: this.computePopularityScore(item),
          freshnessScore: this.computeFreshnessScore(item, editorialPicks),
          diversityScore: 1.0, // neutral; actual diversity via MMR
          editorialScore: this.computeEditorialScore(item, editorialPicks),
          contextScore: this.computeContextScore(item),
          businessScore: this.computeBusinessScore(item, profile),
        };

        const score =
          DEFAULT_WEIGHTS.contentScore * components.contentScore +
          DEFAULT_WEIGHTS.userScore * components.userScore +
          DEFAULT_WEIGHTS.popularityScore * components.popularityScore +
          DEFAULT_WEIGHTS.freshnessScore * components.freshnessScore +
          DEFAULT_WEIGHTS.diversityScore * components.diversityScore +
          DEFAULT_WEIGHTS.editorialScore * components.editorialScore +
          DEFAULT_WEIGHTS.contextScore * components.contextScore +
          DEFAULT_WEIGHTS.businessScore * components.businessScore;

        scored.push({
          id: item.id,
          type: item.type,
          score,
          components,
          data: item,
        });
      } catch (err) {
        this.logger.warn(`Scoring failed for item ${item.id}: ${(err as Error).message}`);
      }
    }

    return scored;
  }

  // ─── Component Score: Content ─────────────────────────────────────────────

  private computeContentScore(item: CandidateItem, profile: UserProfile): number {
    let score = 0.0;

    // Tag overlap (simplified TF-IDF)
    if (item.tagIds.length > 0 && Object.keys(profile.viewedTags).length > 0) {
      let matchedTags = 0;
      for (const tagId of item.tagIds) {
        if (profile.viewedTags[tagId]) {
          matchedTags++;
        }
      }
      // Normalize by number of candidate tags
      score += matchedTags / Math.max(item.tagIds.length, 1);
    }

    // Subscribed category bonus
    if (item.categoryId && profile.subscriptions.categories.includes(item.categoryId)) {
      score += 0.15;
    } else if (item.categoryId && profile.viewedCategories[item.categoryId]) {
      // Inferred category affinity
      const categoryFreq = profile.viewedCategories[item.categoryId];
      const maxCatFreq = Math.max(...Object.values(profile.viewedCategories), 1);
      score += 0.05 * (categoryFreq / maxCatFreq);
    }

    // Subscribed tag bonuses (max 0.25)
    if (item.tagIds.length > 0 && profile.subscriptions.tags.length > 0) {
      let tagBonus = 0;
      for (const tagId of item.tagIds) {
        if (profile.subscriptions.tags.includes(tagId)) {
          tagBonus += 0.05;
        }
      }
      score += Math.min(tagBonus, 0.25);
    }

    // Subscribed author bonus
    if (item.authorId) {
      if (profile.subscriptions.authors.includes(item.authorId)) {
        score += 0.10;
      } else if (profile.viewedAuthors[item.authorId]) {
        const authorFreq = profile.viewedAuthors[item.authorId];
        const maxAuthFreq = Math.max(...Object.values(profile.viewedAuthors), 1);
        score += 0.03 * (authorFreq / maxAuthFreq);
      }
    }

    return Math.min(score, 1.0);
  }

  // ─── Component Score: User (Collaborative) ────────────────────────────────

  private computeUserScore(item: CandidateItem, profile: UserProfile): number {
    if (!profile.userId || profile.totalViews < 20) {
      return 0; // Fallback to other signals for anonymous / new users
    }

    // Simplified collaborative: use category + tag overlap as proxy for
    // "users like you also viewed this"
    let score = 0.0;

    // Category affinity
    if (item.categoryId && profile.viewedCategories[item.categoryId]) {
      const freq = profile.viewedCategories[item.categoryId];
      const maxFreq = Math.max(...Object.values(profile.viewedCategories), 1);
      score += 0.3 * (freq / maxFreq);
    }

    // Tag affinity
    if (item.tagIds.length > 0) {
      let matchedTags = 0;
      for (const tagId of item.tagIds) {
        if (profile.viewedTags[tagId]) {
          matchedTags++;
        }
      }
      score += 0.3 * (matchedTags / Math.max(item.tagIds.length, 1));
    }

    // Author affinity
    if (item.authorId && profile.viewedAuthors[item.authorId]) {
      const freq = profile.viewedAuthors[item.authorId];
      const maxFreq = Math.max(...Object.values(profile.viewedAuthors), 1);
      score += 0.2 * (freq / maxFreq);
    }

    // Already viewed penalty
    if (profile.viewedItemIds.has(item.id)) {
      score *= 0.3;
    }

    return Math.min(score, 1.0);
  }

  // ─── Component Score: Popularity ──────────────────────────────────────────

  private computePopularityScore(item: CandidateItem): number {
    // Use global stats – in production, max values should come from a cache/aggregation
    // For now we estimate using reasonable defaults
    const maxLogViews = Math.log(100000 + 1);
    const maxComments = 500;
    const maxShares = 200;
    const maxReadTime = 30;

    const logViews = Math.log(Math.max(item.viewsCount, 0) + 1);
    const viewsNorm = logViews / maxLogViews;

    const commentsNorm = Math.min(item.commentsCount / maxComments, 1);
    const sharesNorm = Math.min(item.sharesCount / maxShares, 1);
    const readTimeNorm = Math.min(item.avgReadTime / maxReadTime, 1);

    let score =
      0.4 * viewsNorm +
      0.3 * commentsNorm +
      0.2 * sharesNorm +
      0.1 * readTimeNorm;

    // Penalization: high views but low read time
    if (item.viewsCount > 100 && item.avgReadTime < 15) {
      score *= 0.3;
    }

    return Math.min(score, 1.0);
  }

  // ─── Component Score: Freshness ───────────────────────────────────────────

  private computeFreshnessScore(
    item: CandidateItem,
    picks: EditorialPickRow[],
  ): number {
    const now = Date.now();
    const published = item.publishedAt?.getTime() || item.createdAt.getTime();
    const ageHours = (now - published) / (1000 * 60 * 60);

    // Check for "topic of the day" editorial pick
    const isTopicOfDay = picks.some(
      (p) =>
        p.contentId === item.id &&
        p.action === 'pick' &&
        (!p.expiresAt || p.expiresAt.getTime() > now),
    );
    if (isTopicOfDay) return 1.0;

    // Breaking news
    if (item.isBreaking) return 1.0;

    // "Eternal" content
    if (item.type === 'directory') return 0.3;

    // Time decay
    for (const threshold of FRESHNESS_THRESHOLDS) {
      if (ageHours < threshold.maxHours) {
        return threshold.score;
      }
    }

    return 0.05;
  }

  // ─── Component Score: Editorial ──────────────────────────────────────────

  private computeEditorialScore(
    item: CandidateItem,
    picks: EditorialPickRow[],
  ): number {
    const itemPicks = picks.filter(
      (p) =>
        p.contentId === item.id &&
        p.contentType === item.type &&
        (!p.userId || p.userId === '') && // global picks
        (!p.expiresAt || p.expiresAt.getTime() > Date.now()),
    );

    if (itemPicks.length === 0) return 1.0;

    // Take the most significant action
    for (const pick of itemPicks) {
      if (pick.action === 'hide') return 0.0;
    }
    for (const pick of itemPicks) {
      if (pick.action === 'must_read') return 1.5;
    }
    for (const pick of itemPicks) {
      if (pick.action === 'pick') return 1.2;
    }
    for (const pick of itemPicks) {
      if (pick.action === 'boost50') return 1.5;
    }
    for (const pick of itemPicks) {
      if (pick.action === 'boost20') return 1.2;
    }

    return 1.0;
  }

  // ─── Component Score: Context ─────────────────────────────────────────────

  private computeContextScore(item: CandidateItem): number {
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();

    let score = 1.0;

    // Time of day bonuses
    if (hour >= 6 && hour < 10) {
      // Morning: digests, weather, transport
      if (item.type === 'news') score = 1.3;
    } else if (hour >= 10 && hour < 14) {
      // Midday: business, economics
      if (item.type === 'news') score = 1.2;
    } else if (hour >= 14 && hour < 18) {
      // Afternoon: culture, sports
      if (item.type === 'events') score = 1.2;
    } else if (hour >= 18 && hour < 23) {
      // Evening: long reads, video
      if (item.type === 'news') score = 1.3;
    } else {
      // Night: urgent only
      if (!item.isUrgent && !item.isBreaking) {
        score = 0.1;
      }
    }

    // Weekend adjustment
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // Weekends: events, long reads
      if (item.type === 'events') score = Math.max(score, 1.2);
    }

    return score;
  }

  // ─── Component Score: Business ────────────────────────────────────────────

  private computeBusinessScore(item: CandidateItem, profile: UserProfile): number {
    // Premium users get ad-free experience + exclusive boost
    if (profile.isPremium) {
      if (item.type === 'ads') return 0.0;
      if (item.isPremium) return 1.2;
      return 1.0;
    }

    // For non-premium, check if this is promoted content
    // Ads content type gets lower score unless it's boosted
    if (item.type === 'ads') {
      return 0.6;
    }

    // Premium content for non-premium users
    if (item.isPremium) {
      return 0.3;
    }

    return 1.0;
  }

  // ─── MMR (Maximal Marginal Relevance) ─────────────────────────────────────

  private applyMMR(items: ScoredItem[], lambda: number): ScoredItem[] {
    if (items.length === 0) return [];

    const selected: ScoredItem[] = [];
    const remaining = [...items];

    // Pick the highest scoring item first
    remaining.sort((a, b) => b.score - a.score);
    selected.push(remaining.shift()!);

    while (remaining.length > 0 && selected.length < 50) {
      let bestIdx = -1;
      let bestMMR = -Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const candidate = remaining[i];
        let maxSimilarity = 0;

        for (const sel of selected) {
          const sim = this.computeItemSimilarity(candidate, sel);
          if (sim > maxSimilarity) maxSimilarity = sim;
        }

        const mmr = lambda * candidate.score - (1 - lambda) * maxSimilarity;

        if (mmr > bestMMR) {
          bestMMR = mmr;
          bestIdx = i;
        }
      }

      if (bestIdx >= 0) {
        selected.push(remaining.splice(bestIdx, 1)[0]);
      } else {
        break;
      }
    }

    return selected;
  }

  private computeItemSimilarity(a: ScoredItem, b: ScoredItem): number {
    const dataA = a.data as CandidateItem | undefined;
    const dataB = b.data as CandidateItem | undefined;
    if (!dataA || !dataB) return 0;

    let similarity = 0;
    let factors = 0;

    // Same category
    if (dataA.categoryId && dataB.categoryId) {
      if (dataA.categoryId === dataB.categoryId) {
        similarity += 0.5;
      }
      factors++;
    }

    // Same author
    if (dataA.authorId && dataB.authorId) {
      if (dataA.authorId === dataB.authorId) {
        similarity += 0.3;
      }
      factors++;
    }

    // Tag Jaccard similarity
    if (dataA.tagIds.length > 0 && dataB.tagIds.length > 0) {
      const setA = new Set(dataA.tagIds);
      const setB = new Set(dataB.tagIds);
      let intersection = 0;
      let union = 0;
      for (const id of setA) {
        if (setB.has(id)) intersection++;
      }
      union = new Set([...setA, ...setB]).size;
      const jaccard = union > 0 ? intersection / union : 0;

      // If tags are too similar, increase similarity
      if (jaccard > 0.3) {
        similarity += jaccard * 0.4;
      }
      factors++;
    }

    // Same content type
    if (a.type === b.type) {
      similarity += 0.1;
    }
    factors++;

    return factors > 0 ? similarity / factors : 0;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private toCandidate(record: any, type: CandidateItem['type']): CandidateItem {
    const tagIds: string[] = [];
    if (record.tags) {
      for (const t of record.tags) {
        tagIds.push(t.tagId);
      }
    }

    return {
      id: record.id,
      type,
      categoryId: record.categoryId,
      authorId: record.authorId,
      tagIds,
      publishedAt: record.publishedAt || record.startDate || null,
      createdAt: record.createdAt || new Date(),
      viewsCount: record.viewsCount || 0,
      commentsCount: record.commentsCount || 0,
      sharesCount: 0, // not stored in DB yet
      avgReadTime: record.readingTimeMinutes || 0,
      isUrgent: record.isUrgent || false,
      isBreaking: record.isBreaking || false,
      isPremium: record.isPremium || false,
      city: record.city || null,
    };
  }

  private async fetchSourceItem(
    contentType: string,
    id: string,
  ): Promise<CandidateItem | null> {
    try {
      if (contentType === 'news') {
        const article = await this.prisma.newsArticle.findUnique({
          where: { id },
          include: {
            tags: { select: { tagId: true } },
          },
        });
        if (!article) return null;
        return this.toCandidate(article, 'news');
      }
      if (contentType === 'events') {
        const event = await this.prisma.event.findUnique({
          where: { id },
        });
        if (!event) return null;
        return this.toCandidate(event, 'events');
      }
    } catch (err) {
      this.logger.warn(`fetchSourceItem failed: ${(err as Error).message}`);
    }
    return null;
  }

  private async fetchCandidateById(
    contentType: string,
    id: string,
  ): Promise<CandidateItem | null> {
    try {
      if (contentType === 'news') {
        const article = await this.prisma.newsArticle.findUnique({
          where: { id },
          include: {
            tags: { select: { tagId: true } },
            category: { select: { id: true, name: true, slug: true } },
            author: { select: { id: true, name: true, avatarUrl: true } },
          },
        });
        if (!article || article.status !== 'published' || article.deletedAt) return null;
        return this.toCandidate(article, 'news');
      }
      if (contentType === 'events') {
        const event = await this.prisma.event.findUnique({
          where: { id },
        });
        if (!event || event.status !== 'published') return null;
        return this.toCandidate(event, 'events');
      }
    } catch (err) {
      this.logger.warn(`fetchCandidateById failed: ${(err as Error).message}`);
    }
    return null;
  }

  private async fetchActiveEditorialPicks(): Promise<EditorialPickRow[]> {
    try {
      const picks = await this.prisma.editorialPick.findMany({
        where: {
          OR: [
            { expiresAt: null },
            { expiresAt: { gte: new Date() } },
          ],
        },
      });
      return picks.map((p) => ({
        id: p.id,
        contentId: p.contentId,
        contentType: p.contentType,
        action: p.action,
        userId: p.userId,
        expiresAt: p.expiresAt,
      }));
    } catch (err) {
      this.logger.warn(`fetchActiveEditorialPicks failed: ${(err as Error).message}`);
      return [];
    }
  }
}
