import apiClient from './api-client';

export interface DirectoryOrg {
  id: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  category: { id: string; name: string; slug: string } | null;
  city: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  email: string | null;
  workingHours: Record<string, string>;
  photos: string[];
  avgRating: number;
  reviewsCount: number;
  status: string;
}

export interface DirectoryListResponse {
  data: DirectoryOrg[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export interface DirectoryQueryParams {
  page?: number;
  perPage?: number;
  categoryId?: string;
  city?: string;
  search?: string;
  sort?: string;
}

export const directoryService = {
  async getAll(params?: DirectoryQueryParams) {
    const { data } = await apiClient.get('/directory', { params });
    return data as DirectoryListResponse;
  },
};
