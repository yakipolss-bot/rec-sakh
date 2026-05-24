export interface CommentAuthor {
  name: string;
  avatar: string;
  karma: number;
}

export interface Comment {
  id: string;
  newsId: string;
  userId: string;
  author: CommentAuthor;
  userLevel: 'новичок' | 'участник' | 'постоянный' | 'авторитет' | 'лидер мнений';
  parentId: string | null;
  content: string;
  createdAt: string;
  likes: number;
  dislikes: number;
  replies?: Comment[];
  isPinned?: boolean;
  isEdited?: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'deleted_by_user' | 'deleted_by_moderator';
}
