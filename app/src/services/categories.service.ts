import apiClient from './api-client';
import { Category } from '../models/categories/Category';

class CategoriesService {
  async getCategories(type?: string): Promise<Category[]> {
    const { data } = await apiClient.get('/categories', {
      params: type ? { type } : undefined,
    });
    return (data.data || data) as Category[];
  }

  async createCategory(dto: { name: string; slug: string; description?: string; icon?: string; parentId?: string; sortOrder?: number; type?: string }): Promise<Category> {
    const { data } = await apiClient.post('/categories', dto);
    return data?.data || data;
  }

  async updateCategory(id: string, dto: { name?: string; slug?: string; description?: string; icon?: string; parentId?: string; sortOrder?: number }): Promise<Category> {
    const { data } = await apiClient.patch(`/categories/${id}`, dto);
    return data?.data || data;
  }

  async deleteCategory(id: string): Promise<void> {
    await apiClient.delete(`/categories/${id}`);
  }
}

const categoriesService = new CategoriesService();
export default categoriesService;
export { CategoriesService };
