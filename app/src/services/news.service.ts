import apiClient from './api-client';

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
  tags?: string[] | { tag: { id: string; name: string } }[];
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

export const newsService = {
  async getNews(params?: NewsQueryParams) {
    const { data } = await apiClient.get('/news', { params });
    const result = data.data ? data : data;
    return result as NewsListResponse;
  },

  async getNewsById(id: string) {
    const { data } = await apiClient.get(`/news/${id}`);
    return (data.data || data) as NewsArticle;
  },

  async createNews(dto: {
    title: string;
    content: string;
    lead?: string;
    categoryId?: string;
    city?: string;
    mainImageUrl?: string;
    isUrgent?: boolean;
    isPremium?: boolean;
    isBreaking?: boolean;
    scheduledAt?: string;
    tags?: string[];
    seoTitle?: string;
    seoDescription?: string;
  }) {
    const { data } = await apiClient.post('/news', dto);
    return (data.data || data) as NewsArticle;
  },

  async updateNews(id: string, dto: Record<string, unknown>) {
    const { data } = await apiClient.patch(`/news/${id}`, dto);
    return (data.data || data) as NewsArticle;
  },

  async deleteNews(id: string) {
    await apiClient.delete(`/news/${id}`);
  },

  async updateStatus(id: string, status: string, rejectionReason?: string) {
    const body: Record<string, string> = { status };
    if (rejectionReason) body.rejectionReason = rejectionReason;
    const { data } = await apiClient.patch(`/news/${id}/status`, body);
    return (data.data || data) as NewsArticle;
  },

  async getRelatedNews(id: string, limit = 5) {
    const { data } = await apiClient.get(`/news/${id}/related`, { params: { limit } });
    return (data.data || data) as NewsArticle[];
  },
};
