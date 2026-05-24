import apiClient from './api-client';
import { RealtyListResponse } from '../models/realty/RealtyListResponse';
import { RealtyQueryParams } from '../models/realty/RealtyQueryParams';
import { RealtyItem } from '../models/realty/RealtyItem';

class RealtyService {
  async getAll(params?: RealtyQueryParams): Promise<RealtyListResponse> {
    const { data } = await apiClient.get('/realty', { params });
    return data;
  }

  async getById(id: string): Promise<RealtyItem> {
    const { data } = await apiClient.get(`/realty/${id}`);
    return data?.data || data;
  }
}

const realtyService = new RealtyService();
export default realtyService;
export { RealtyService };
