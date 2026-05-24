export interface ActivityEntry {
  id: string;
  type: 'comment' | 'ad' | 'favorite' | 'login' | 'subscription';
  description: string;
  date: string;
  link?: string;
}
