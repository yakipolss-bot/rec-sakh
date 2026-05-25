import apiClient from './api-client';

export interface Tariff {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  durationDays: number;
  features: string[];
  isActive: boolean;
}

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  method: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  createdAt: string;
  paidAt: string | null;
}

export interface ActiveSubscription {
  id: string;
  tariffId: string;
  tariffName: string;
  status: string;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
}

class BillingService {
  async getTariffs(): Promise<Tariff[]> {
    const { data } = await apiClient.get('/billing/tariffs');
    const body = data.data || data || [];
    return Array.isArray(body) ? body : [];
  }

  async getBalance(): Promise<{ balance: number; currency: string }> {
    const { data } = await apiClient.get('/billing/balance');
    return data.data || data;
  }

  async getTransactions(params?: { page?: number; perPage?: number }): Promise<{ data: Transaction[]; meta: any }> {
    const { data } = await apiClient.get('/billing/transactions', { params });
    return data;
  }

  async getInvoices(params?: { page?: number; perPage?: number }): Promise<{ data: Invoice[]; meta: any }> {
    const { data } = await apiClient.get('/billing/invoices', { params });
    return data;
  }

  async getActiveSubscription(): Promise<ActiveSubscription | null> {
    const { data } = await apiClient.get('/billing/subscriptions/active');
    return data.data || data || null;
  }

  async subscribe(tariffId: string, method: string = 'yookassa'): Promise<any> {
    const { data } = await apiClient.post('/billing/subscriptions', { tariffId, method });
    return data.data || data;
  }

  async cancelSubscription(id: string): Promise<void> {
    await apiClient.post(`/billing/subscriptions/${id}/cancel`);
  }

  async topUpBalance(amount: number, method: string = 'yookassa', returnUrl?: string): Promise<any> {
    const { data } = await apiClient.post('/billing/top-up', { amount, method, returnUrl });
    return data.data || data;
  }
}

const billingService = new BillingService();
export default billingService;
export { BillingService };
