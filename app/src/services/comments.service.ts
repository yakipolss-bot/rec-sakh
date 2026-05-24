import apiClient from './api-client';
import { Comment } from '../models/comments/Comment';

class CommentsService {
  async getComments(newsId: string): Promise<Comment[]> {
    const { data } = await apiClient.get('/comments', { params: { newsId } });
    return (data.data || data) as Comment[];
  }

  async deleteComment(id: string): Promise<void> {
    await apiClient.delete(`/comments/${id}`);
  }
}

const commentsService = new CommentsService();
export default commentsService;
export { CommentsService };
