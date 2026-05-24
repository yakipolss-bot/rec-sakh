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
