export interface StaffMember {
  id: string;
  userId: string;
  position: string;
  department: string | null;
  hireDate: string;
  isActive: boolean;
  kpiScore: number | null;
  schedule: Record<string, unknown>;
  permissions: string[];
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    role: string;
    status?: string;
    karma?: number;
    level?: number;
    phone?: string;
    bio?: string;
    createdAt?: string;
  };
}
