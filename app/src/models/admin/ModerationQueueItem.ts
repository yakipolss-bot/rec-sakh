export interface ModerationQueueItem {
  id: string;
  contentType: string;
  contentId: string;
  reason: string | null;
  reportedBy: string | null;
  reviewedBy: string | null;
  status: 'pending' | 'approved' | 'rejected';
  actionTaken: string | null;
  createdAt: string;
  reporter?: { id: string; name: string; email: string } | null;
  reviewer?: { id: string; name: string; email: string } | null;
}
