import apiClient from './api-client';
import { Article } from '../models/news/Article';
import { NewsListResponse } from '../models/news/NewsListResponse';
import { NewsQueryParams } from '../models/news/NewsQueryParams';

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

function normalizeArticle(a: Record<string, unknown>): Article {
  return normalizeTags(a) as unknown as Article;
}

function apiResponse(data: unknown): unknown {
  if (data && typeof data === 'object' && 'data' in (data as object)) {
    return (data as { data: unknown }).data;
  }
  return data;
}

class NewsService {
  async getNews(params?: NewsQueryParams): Promise<NewsListResponse> {
    const { data } = await apiClient.get('/news', { params });
    const result: { data: Article[] } = apiResponse(data) as { data: Article[] };
    return { ...result, data: (result.data || []).map(normalizeArticle) };
  }

  async getNewsById(id: string): Promise<Article> {
    const { data } = await apiClient.get(`/news/${id}`);
    const article = apiResponse(data) as Article;
    return normalizeArticle(article);
  }

  async createNews(dto: Record<string, unknown>): Promise<Article> {
    const { data } = await apiClient.post('/news', dto);
    const article = apiResponse(data) as Article;
    return normalizeArticle(article);
  }

  async updateNews(id: string, dto: Record<string, unknown>): Promise<Article> {
    const { data } = await apiClient.patch(`/news/${id}`, dto);
    const article = apiResponse(data) as Article;
    return normalizeArticle(article);
  }

  async deleteNews(id: string): Promise<void> {
    await apiClient.delete(`/news/${id}`);
  }

  async updateStatus(id: string, status: string, rejectionReason?: string): Promise<Article> {
    const body: Record<string, string> = { status };
    if (rejectionReason) body.rejectionReason = rejectionReason;
    const { data } = await apiClient.patch(`/news/${id}/status`, body);
    const article = apiResponse(data) as Article;
    return normalizeArticle(article);
  }

  async getRelatedNews(id: string, limit = 5): Promise<Article[]> {
    const { data } = await apiClient.get(`/news/${id}/related`, { params: { limit } });
    const articles = apiResponse(data) as Article[];
    return (articles || []).map(normalizeArticle);
  }
}

const newsService = new NewsService();
export default newsService;
export { NewsService };
