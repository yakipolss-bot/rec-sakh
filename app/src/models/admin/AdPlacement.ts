export interface AdPlacement {
  id: string;
  name: string;
  code: string;
  description: string | null;
  zone: string;
  width: number;
  height: number;
  pricePerDay: number;
  isActive: boolean;
}
