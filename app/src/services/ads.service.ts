import apiClient from './api-client';

export interface Ad {
  id: string;
  title: string;
  description: string;
  categoryId: string | null;
  category: { id: string; name: string; slug: string } | null;
  userId: string;
  user: { id: string; name: string; avatarUrl: string | null } | null;
  city: string | null;
  price: number | null;
  condition: string | null;
  phone: string | null;
  images: string[];
  status: string;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdPayload {
  title: string;
  description: string;
  categoryId?: string;
  city?: string;
  price?: number;
  condition?: string;
  phone?: string;
  images?: string[];
}

export interface AdsListResponse {
  data: Ad[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export interface AdsQueryParams {
  page?: number;
  perPage?: number;
  categoryId?: string;
  city?: string;
  search?: string;
  sort?: string;
}

export const adsService = {
  async getAll(params?: AdsQueryParams) {
    const { data } = await apiClient.get('/ads', { params });
    return data as AdsListResponse;
  },

  async getById(id: string) {
    const { data } = await apiClient.get(`/ads/${id}`);
    return data?.data || data;
  },

  async create(payload: CreateAdPayload) {
    const { data } = await apiClient.post('/ads', payload);
    return data?.data || data;
  },
};
