import { Article } from './Article';

export interface NewsListResponse {
  data: Article[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}
