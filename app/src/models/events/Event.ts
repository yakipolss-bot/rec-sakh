export interface Event {
  id: string;
  title: string;
  description: string;
  shortDescription: string | null;
  categoryId: string | null;
  category: { id: string; name: string; slug: string } | null;
  organizerId: string;
  organizer: { id: string; name: string; avatarUrl: string | null } | null;
  city: string | null;
  venueName: string | null;
  venueAddress: string | null;
  startDate: string;
  endDate: string | null;
  isFree: boolean;
  price: number | null;
  currency: string;
  imageUrl: string | null;
  ticketUrl: string | null;
  status: string;
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
}
