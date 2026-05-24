export interface Transaction {
  id: string;
  date: string;
  user: string;
  type: 'payment' | 'refund' | 'withdrawal';
  amount: number;
  method: string;
  status: 'success' | 'pending' | 'failed';
}
