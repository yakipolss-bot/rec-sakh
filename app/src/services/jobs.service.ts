import apiClient from './api-client';

export interface Job {
  id: string;
  type: 'vacancy' | 'resume';
  title: string;
  description: string;
  categoryId: string | null;
  category: { id: string; name: string; slug: string } | null;
  userId: string;
  user: { id: string; name: string; avatarUrl: string | null } | null;
  city: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  schedule: string | null;
  experience: string | null;
  companyName: string | null;
  status: string;
  _count: { responses: number };
  createdAt: string;
  updatedAt: string;
}

export interface JobsListResponse {
  data: Job[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export interface JobsQueryParams {
  page?: number;
  perPage?: number;
  type?: string;
  categoryId?: string;
  city?: string;
  search?: string;
  schedule?: string;
  salaryMin?: string;
  salaryMax?: string;
  sort?: string;
}

function apiResponse<T>(data: unknown): T {
  if (data && typeof data === 'object' && 'data' in (data as object)) {
    return (data as { data: T }).data;
  }
  return data as T;
}

export const jobsService = {
  async getAll(params?: JobsQueryParams) {
    const { data } = await apiClient.get('/jobs', { params });
    const body = data as { data: Job[]; meta: JobsListResponse['meta'] };
    return body as JobsListResponse;
  },

  async getById(id: string) {
    const { data } = await apiClient.get(`/jobs/${id}`);
    return apiResponse<Job>(data);
  },
};
