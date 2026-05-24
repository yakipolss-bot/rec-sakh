export interface Job {
  id: string;
  type: 'vacancy' | 'resume';
  title: string;
  description: string;
  categoryId: string | null;
  category: { id: string; name: string; slug: string } | null;
  userId: string;
  user: { id: string; name: string; avatarUrl: string | null } | null;
  city: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  schedule: string | null;
  experience: string | null;
  companyName: string | null;
  status: string;
  _count: { responses: number };
  createdAt: string;
  updatedAt: string;
}
