export interface Article {
  id: string;
  slug: string;
  title: string;
  lead: string | null;
  content: string;
  mainImageUrl: string | null;
  categoryId: string | null;
  category?: { id: string; name: string; slug: string } | null;
  authorId: string | null;
  author?: { id: string; name: string; avatarUrl: string | null; role?: string } | null;
  city: string | null;
  status: string;
  isUrgent: boolean;
  isPremium: boolean;
  isBreaking: boolean;
  hasVideo?: boolean;
  hasGallery?: boolean;
  publishedAt: string | null;
  scheduledAt?: string | null;
  viewsCount: number;
  commentsCount: number;
  readingTimeMinutes: number | null;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}
