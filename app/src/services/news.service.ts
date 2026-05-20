import apiClient from './api-client';

function normalizeTags(article: Record<string, unknown>): Record<string, unknown> {
  if (Array.isArray(article.tags)) {
    article.tags = article.tags.map((t: unknown) => {
      if (typeof t === 'object' && t && 'tag' in (t as object)) {
        return ((t as { tag: { name: string } }).tag?.name || '') as string;
      }
      return t as string;
    }).filter(Boolean);
  }
  return article;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeArticle(a: any): NewsArticle {
  return normalizeTags(a) as unknown as NewsArticle;
}

export interface NewsArticle {
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
  publishedAt: string | null;
  scheduledAt?: string | null;
  viewsCount: number;
  commentsCount: number;
  readingTimeMinutes: number | null;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface NewsListResponse {
  data: NewsArticle[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export interface NewsQueryParams {
  page?: number;
  perPage?: number;
  category?: string;
  city?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  sort?: string;
  status?: string;
  isUrgent?: string;
  author?: string;
}

function apiResponse(data: unknown): unknown {
  if (data && typeof data === 'object' && 'data' in (data as object)) {
    return (data as { data: unknown }).data;
  }
  return data;
}

export const newsService = {
  async getNews(params?: NewsQueryParams) {
    const { data } = await apiClient.get('/news', { params });
    const result: { data: NewsArticle[] } = apiResponse(data) as { data: NewsArticle[] };
    return { ...result, data: (result.data || []).map(normalizeArticle) };
  },

  async getNewsById(id: string) {
    const { data } = await apiClient.get(`/news/${id}`);
    const article = apiResponse(data) as NewsArticle;
    return normalizeArticle(article);
  },

  async createNews(dto: Record<string, unknown>) {
    const { data } = await apiClient.post('/news', dto);
    const article = apiResponse(data) as NewsArticle;
    return normalizeArticle(article);
  },

  async updateNews(id: string, dto: Record<string, unknown>) {
    const { data } = await apiClient.patch(`/news/${id}`, dto);
    const article = apiResponse(data) as NewsArticle;
    return normalizeArticle(article);
  },

  async deleteNews(id: string) {
    await apiClient.delete(`/news/${id}`);
  },

  async updateStatus(id: string, status: string, rejectionReason?: string) {
    const body: Record<string, string> = { status };
    if (rejectionReason) body.rejectionReason = rejectionReason;
    const { data } = await apiClient.patch(`/news/${id}/status`, body);
    const article = apiResponse(data) as NewsArticle;
    return normalizeArticle(article);
  },

  async getRelatedNews(id: string, limit = 5) {
    const { data } = await apiClient.get(`/news/${id}/related`, { params: { limit } });
    const articles = apiResponse(data) as NewsArticle[];
    return (articles || []).map(normalizeArticle);
  },
};
