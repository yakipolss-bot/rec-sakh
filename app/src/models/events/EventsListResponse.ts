import { Event } from './Event';

export interface EventsListResponse {
  data: Event[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}
