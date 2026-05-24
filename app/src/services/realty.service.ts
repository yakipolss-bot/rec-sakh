import apiClient from './api-client';

export interface RealtyItem {
  id: string;
  type: 'sale' | 'rent' | 'newbuild' | 'commercial';
  title: string;
  description: string;
  city: string | null;
  district: string | null;
  address: string | null;
  price: number | null;
  currency: string;
  rooms: number | null;
  areaTotal: number | null;
  areaLiving: number | null;
  floor: number | null;
  floorsTotal: number | null;
  houseType: string | null;
  condition: string | null;
  images: string[];
  phone: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string; avatarUrl: string | null } | null;
}

export interface RealtyListResponse {
  data: RealtyItem[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export interface RealtyQueryParams {
  page?: number;
  perPage?: number;
  type?: string;
  city?: string;
  rooms?: string;
  priceMin?: string;
  priceMax?: string;
  sort?: string;
}

export const realtyService = {
  async getAll(params?: RealtyQueryParams) {
    const { data } = await apiClient.get('/realty', { params });
    return data as RealtyListResponse;
  },

  async getById(id: string) {
    const { data } = await apiClient.get(`/realty/${id}`);
    return data?.data || data as RealtyItem;
  },
};
