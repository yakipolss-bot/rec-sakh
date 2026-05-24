import { Ad } from './Ad';

export interface AdsListResponse {
  data: Ad[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}
