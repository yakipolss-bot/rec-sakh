import apiClient from './api-client';

export interface NewsArticle {
  id: string;
  slug: string;
  title: string;
  lead: string | null;
  content: string;
  mainImageUrl: string | null;
  categoryId: string | null;
  authorId: string | null;
  city: string | null;
  status: string;
  isUrgent: boolean;
  isPremium: boolean;
  isBreaking: boolean;
  publishedAt: string | null;
  viewsCount: number;
  commentsCount: number;
  readingTimeMinutes: number | null;
  createdAt: string;
  updatedAt: string;
  category?: { id: string; name: string; slug: string } | null;
  author?: { id: string; name: string; avatarUrl: string | null } | null;
  tags?: { tag: { id: string; name: string } }[];
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
  sort?: string;
  isUrgent?: boolean;
}

export const newsService = {
  async getNews(params?: NewsQueryParams) {
    const { data } = await apiClient.get('/news', { params });
    return (data.data ? data : data) as NewsListResponse;
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
  }) {
    const { data } = await apiClient.post('/news', dto);
    return (data.data || data) as NewsArticle;
  },

  async updateNews(id: string, dto: Partial<NewsArticle>) {
    const { data } = await apiClient.patch(`/news/${id}`, dto);
    return (data.data || data) as NewsArticle;
  },

  async deleteNews(id: string) {
    await apiClient.delete(`/news/${id}`);
  },

  async updateStatus(id: string, status: string) {
    const { data } = await apiClient.patch(`/news/${id}/status`, { status });
    return (data.data || data) as NewsArticle;
  },
};
