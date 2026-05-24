export interface DirectoryOrg {
  id: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  category: { id: string; name: string; slug: string } | null;
  city: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  email: string | null;
  workingHours: Record<string, string>;
  photos: string[];
  avgRating: number;
  reviewsCount: number;
  status: string;
}
