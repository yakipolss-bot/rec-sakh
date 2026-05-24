import apiClient from './api-client';
import { DirectoryListResponse } from '../models/directory/DirectoryListResponse';
import { DirectoryQueryParams } from '../models/directory/DirectoryQueryParams';

class DirectoryService {
  async getAll(params?: DirectoryQueryParams): Promise<DirectoryListResponse> {
    const { data } = await apiClient.get('/directory', { params });
    return data;
  }
}

const directoryService = new DirectoryService();
export default directoryService;
export { DirectoryService };
