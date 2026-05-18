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
};
