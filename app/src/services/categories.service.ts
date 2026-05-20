import apiClient from './api-client';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  parentId: string | null;
  sortOrder: number;
  type: string;
  children: Category[];
}

export const categoriesService = {
  async getCategories(type?: string) {
    const { data } = await apiClient.get('/categories', {
      params: type ? { type } : undefined,
    });
    return (data.data || data) as Category[];
  },

  async createCategory(dto: { name: string; slug: string; description?: string; icon?: string; parentId?: string; sortOrder?: number; type?: string }) {
    const { data } = await apiClient.post('/categories', dto);
    return data?.data || data;
  },

  async updateCategory(id: string, dto: { name?: string; slug?: string; description?: string; icon?: string; parentId?: string; sortOrder?: number }) {
    const { data } = await apiClient.patch(`/categories/${id}`, dto);
    return data?.data || data;
  },

  async deleteCategory(id: string) {
    await apiClient.delete(`/categories/${id}`);
  },
};
