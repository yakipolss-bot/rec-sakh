import { RealtyItem } from './RealtyItem';

export interface RealtyListResponse {
  data: RealtyItem[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}
