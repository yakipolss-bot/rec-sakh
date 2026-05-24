export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  city?: string;
  registeredAt: string;
  adsCount?: number;
  commentsCount?: number;
  avatarUrl?: string;
  karma?: number;
  level?: number;
  createdAt?: string;
  phone?: string;
}
