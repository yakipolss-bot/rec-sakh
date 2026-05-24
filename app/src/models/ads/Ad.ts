export interface Ad {
  id: string;
  title: string;
  description: string;
  categoryId: string | null;
  category: { id: string; name: string; slug: string } | null;
  userId: string;
  user: { id: string; name: string; avatarUrl: string | null } | null;
  city: string | null;
  price: number | null;
  condition: string | null;
  phone: string | null;
  images: string[];
  status: string;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
}
