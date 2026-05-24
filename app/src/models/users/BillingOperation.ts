export interface BillingOperation {
  id: string;
  type: 'payment' | 'withdrawal' | 'subscription';
  method: string;
  amount: number;
  status: 'success' | 'pending' | 'failed';
  date: string;
  description: string;
}
