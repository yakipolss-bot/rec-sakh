export interface EventItem {
  id: string;
  title: string;
  description?: string;
  shortDescription?: string;
  date: string;
  time?: string;
  venue?: string;
  city?: string;
  price?: number | string;
  imageUrl?: string;
  ticketUrl?: string;
  status: string;
  category?: { id: string; name: string };
  organizer?: { id: string; name: string };
  _count?: { subscribers: number };
  createdAt?: string;
}
