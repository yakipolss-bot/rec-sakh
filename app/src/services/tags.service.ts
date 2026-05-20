import apiClient from './api-client';

export interface Tag {
  id: string;
  name: string;
  slug: string;
  count?: number;
}

export const tagsService = {
  async getTags() {
    const { data } = await apiClient.get('/tags');
    return (data.data || data) as Tag[];
  },
  async createTag(name: string) {
    const { data } = await apiClient.post('/tags', { name });
    return data?.data || data;
  },
  async deleteTag(id: string) {
    await apiClient.delete(`/tags/${id}`);
  },
  async mergeTags(sourceId: string, targetId: string) {
    const { data } = await apiClient.post('/tags/merge', { sourceId, targetId });
    return data?.data || data;
  },
};
