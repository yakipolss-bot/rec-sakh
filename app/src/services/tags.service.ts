import apiClient from './api-client';
import { Tag } from '../models/tags/Tag';

class TagsService {
  async getTags(): Promise<Tag[]> {
    const { data } = await apiClient.get('/tags');
    return (data.data || data) as Tag[];
  }

  async createTag(name: string): Promise<Tag> {
    const { data } = await apiClient.post('/tags', { name });
    return data?.data || data;
  }

  async deleteTag(id: string): Promise<void> {
    await apiClient.delete(`/tags/${id}`);
  }

  async mergeTags(sourceId: string, targetId: string): Promise<Tag> {
    const { data } = await apiClient.post('/tags/merge', { sourceId, targetId });
    return data?.data || data;
  }
}

const tagsService = new TagsService();
export default tagsService;
export { TagsService };
