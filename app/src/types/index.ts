export interface NewsArticle {
  id: string;
  slug: string;
  title: string;
  lead: string;
  content: string;
  category: Category;
  author: Author;
  publishedAt: string;
  updatedAt: string;
  mainImageUrl: string | null;
  viewsCount: number;
  commentsCount: number;
  readingTimeMinutes: number;
  tags: string[];
  city: string;
  isUrgent?: boolean;
  isPremium?: boolean;
  hasVideo?: boolean;
  hasGallery?: boolean;
}

export interface Author {
  id: string;
  name: string;
  avatar?: string;
  role: string;
}

export interface CommentAuthor {
  name: string;
  avatar: string;
  karma: number;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
}

export interface Comment {
  id: string;
  newsId: string;
  userId: string;
  author: CommentAuthor;
  userLevel: 'новичок' | 'участник' | 'постоянный' | 'авторитет' | 'лидер мнений';
  parentId: string | null;
  content: string;
  createdAt: string;
  likes: number;
  dislikes: number;
  replies?: Comment[];
  isPinned?: boolean;
  isEdited?: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'deleted_by_user' | 'deleted_by_moderator';
}

export interface WeatherData {
  city: string;
  cityCode: string;
  temp: number;
  feelsLike: number;
  condition: 'sunny' | 'cloudy' | 'rain' | 'snow' | 'storm' | 'fog';
  humidity: number;
  windSpeed: number;
  windDirection: string;
  pressure: number;
}

export interface ForecastDay {
  day: string;
  date: string;
  tempMax: number;
  tempMin: number;
  condition: WeatherData['condition'];
  precipitation: number;
  windSpeed: number;
}

export interface CurrencyRate {
  code: string;
  name: string;
  rate: number;
  change: number;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  category: 'cinema' | 'theatre' | 'concert' | 'exhibition' | 'sport' | 'festival';
  date: string;
  time: string;
  venue: string;
  city: string;
  price: string;
  ageLimit: string;
  image: string;
}

export type ThemeMode = 'morning' | 'day' | 'evening' | 'focus' | 'night' | 'auto';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  city: string;
  registeredAt: string;
  karma: number;
  level: string;
  commentsCount: number;
  adsCount: number;
  subscriptions: string[];
}

export interface SearchFilters {
  category: string | null;
  city: string | null;
  dateRange: string | null;
  type: string | null;
  sortBy: 'relevance' | 'date' | 'popularity';
}
