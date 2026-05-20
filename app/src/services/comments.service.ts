import apiClient from './api-client';
import type { Comment } from '@/types';

export const commentsService = {
  async getComments(newsId: string) {
    const { data } = await apiClient.get('/comments', { params: { newsId } });
    return (data.data || data) as Comment[];
  },
  async deleteComment(id: string) {
    await apiClient.delete(`/comments/${id}`);
  },
};
