export interface Subscription {
  id: string;
  type: 'category' | 'author' | 'keyword';
  value: string;
  subscribedAt: string;
}
