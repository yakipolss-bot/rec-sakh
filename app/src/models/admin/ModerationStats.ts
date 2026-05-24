export interface ModerationStats {
  pending: number;
  approvedToday: number;
  total: number;
  avgResponseTimeHours: number | null;
}
