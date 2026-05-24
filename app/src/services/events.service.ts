import apiClient from './api-client';
import { Event } from '../models/events/Event';
import { EventsListResponse } from '../models/events/EventsListResponse';
import { EventsQueryParams } from '../models/events/EventsQueryParams';

function apiResponse<T>(data: unknown): T {
  if (data && typeof data === 'object' && 'data' in (data as object)) {
    return (data as { data: T }).data;
  }
  return data as T;
}

class EventsService {
  async getAll(params?: EventsQueryParams): Promise<EventsListResponse> {
    const { data } = await apiClient.get('/events', { params });
    const body = data as { data: Event[]; meta: EventsListResponse['meta'] };
    return body as EventsListResponse;
  }

  async getById(id: string): Promise<Event> {
    const { data } = await apiClient.get(`/events/${id}`);
    return apiResponse<Event>(data);
  }
}

const eventsService = new EventsService();
export default eventsService;
export { EventsService };
