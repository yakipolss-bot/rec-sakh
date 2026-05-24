import apiClient from './api-client';
import { AdsListResponse } from '../models/ads/AdsListResponse';
import { AdsQueryParams } from '../models/ads/AdsQueryParams';
import { CreateAdPayload } from '../models/ads/CreateAdPayload';
import { Ad } from '../models/ads/Ad';

class AdsService {
  async getAll(params?: AdsQueryParams): Promise<AdsListResponse> {
    const { data } = await apiClient.get('/ads', { params });
    return data;
  }

  async getById(id: string): Promise<Ad> {
    const { data } = await apiClient.get(`/ads/${id}`);
    return data?.data || data;
  }

  async create(payload: CreateAdPayload): Promise<Ad> {
    const { data } = await apiClient.post('/ads', payload);
    return data?.data || data;
  }
}

const adsService = new AdsService();
export default adsService;
export { AdsService };
