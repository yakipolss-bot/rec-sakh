export interface CreateAdPayload {
  title: string;
  description: string;
  categoryId?: string;
  city?: string;
  price?: number;
  condition?: string;
  phone?: string;
  images?: string[];
}
