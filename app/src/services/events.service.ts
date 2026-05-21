import apiClient from './api-client';

export interface ArticleEvent {
  id: string;
  title: string;
  description: string;
  shortDescription: string | null;
  categoryId: string | null;
  category: { id: string; name: string; slug: string } | null;
  organizerId: string;
  organizer: { id: string; name: string; avatarUrl: string | null } | null;
  city: string | null;
  venueName: string | null;
  venueAddress: string | null;
  startDate: string;
  endDate: string | null;
  isFree: boolean;
  price: number | null;
  currency: string;
  imageUrl: string | null;
  ticketUrl: string | null;
  status: string;
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventsListResponse {
  data: ArticleEvent[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export interface EventsQueryParams {
  page?: number;
  perPage?: number;
  categoryId?: string;
  city?: string;
  search?: string;
  isFree?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: 'startDate' | 'created' | 'title';
}

function apiResponse<T>(data: unknown): T {
  if (data && typeof data === 'object' && 'data' in (data as object)) {
    return (data as { data: T }).data;
  }
  return data as T;
}

export const eventsService = {
  async getAll(params?: EventsQueryParams) {
    const { data } = await apiClient.get('/events', { params });
    const body = data as { data: ArticleEvent[]; meta: EventsListResponse['meta'] };
    return body as EventsListResponse;
  },

  async getById(id: string) {
    const { data } = await apiClient.get(`/events/${id}`);
    return apiResponse<ArticleEvent>(data);
  },
};
