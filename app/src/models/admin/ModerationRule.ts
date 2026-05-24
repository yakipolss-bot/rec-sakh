export interface ModerationRule {
  id: string;
  ruleType: string;
  pattern: string;
  action: string;
  priority: number;
  isActive: boolean;
  createdAt: string;
  creator?: { id: string; name: string } | null;
}
