export interface Comment {
  id: string;
  text: string;
  author: { id: string; name: string };
  articleId?: string;
  articleTitle?: string;
  status: string;
  createdAt: string;
  likes?: number;
  dislikes?: number;
}
