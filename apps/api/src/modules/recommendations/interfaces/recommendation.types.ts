export interface ScoreComponents {
  contentScore: number;
  userScore: number;
  popularityScore: number;
  freshnessScore: number;
  diversityScore: number;
  editorialScore: number;
  contextScore: number;
  businessScore: number;
}

export interface ScoredItem {
  id: string;
  type: 'news' | 'events' | 'ads' | 'jobs' | 'directory';
  score: number;
  components: ScoreComponents;
  data: any;
}

export interface UserProfile {
  userId: string;
  viewedCategories: Record<string, number>;
  viewedTags: Record<string, number>;
  viewedAuthors: Record<string, number>;
  viewedItemIds: Set<string>;
  subscriptions: {
    categories: string[];
    tags: string[];
    authors: string[];
  };
  interactionHistory: { itemId: string; weight: number }[];
  avgReadTime: number;
  totalViews: number;
  isPremium: boolean;
}

export interface CandidateItem {
  id: string;
  type: 'news' | 'events' | 'ads' | 'jobs' | 'directory';
  categoryId?: string | null;
  authorId?: string | null;
  tagIds: string[];
  publishedAt?: Date | null;
  createdAt: Date;
  viewsCount: number;
  commentsCount: number;
  sharesCount: number;
  avgReadTime: number;
  isUrgent: boolean;
  isBreaking: boolean;
  isPremium: boolean;
  city?: string | null;
}

export interface EditorialPickRow {
  id: string;
  contentId: string;
  contentType: string;
  action: string;
  userId: string | null;
  expiresAt: Date | null;
}
