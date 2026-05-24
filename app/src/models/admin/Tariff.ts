export interface Tariff {
  id: string;
  name: string;
  price: number;
  interval: string;
  features: string[];
  description?: string;
  currency?: string;
  isActive?: boolean;
  sortOrder?: number;
}
