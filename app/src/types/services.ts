export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    avatarUrl: string | null;
  };
  accessToken: string;
  refreshToken: string;
}

export interface NewsArticle {
  id: string;
  slug: string;
  title: string;
  lead: string | null;
  content: string;
  mainImageUrl: string | null;
  mainImageThumbnail: string | null;
  gallery: unknown[];
  videoUrl: string | null;
  videoType: string | null;
  videoDuration: number | null;
  categoryId: string | null;
  authorId: string | null;
  city: string | null;
  status: string;
  isUrgent: boolean;
  isPremium: boolean;
  isBreaking: boolean;
  publishedAt: string | null;
  scheduledAt: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoOgImage: string | null;
  viewsCount: number;
  commentsCount: number;
  readingTimeMinutes: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  category?: { id: string; name: string; slug: string } | null;
  author?: { id: string; name: string; avatarUrl: string | null } | null;
  tags?: { tag: { id: string; name: string } }[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  parentId: string | null;
  sortOrder: number;
  type: string;
  children: Category[];
}

export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string; code: string }>;
  };
}
