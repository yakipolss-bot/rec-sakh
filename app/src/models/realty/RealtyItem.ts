export interface RealtyItem {
  id: string;
  type: 'sale' | 'rent' | 'newbuild' | 'commercial';
  title: string;
  description: string;
  city: string | null;
  district: string | null;
  address: string | null;
  price: number | null;
  currency: string;
  rooms: number | null;
  areaTotal: number | null;
  areaLiving: number | null;
  floor: number | null;
  floorsTotal: number | null;
  houseType: string | null;
  condition: string | null;
  images: string[];
  phone: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string; avatarUrl: string | null } | null;
}
