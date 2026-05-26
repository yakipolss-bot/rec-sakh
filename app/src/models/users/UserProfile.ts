export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  bio?: string;
  role: string;
  avatarUrl: string | null;
  avatar?: string;
  karma: number;
  level: string;
  registeredAt: string;
  createdAt?: string;
  commentsCount?: number;
  adsCount?: number;
  subscriptions?: string[];
}
