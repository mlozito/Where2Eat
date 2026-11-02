export type RestaurantCategory = { alias: string; title: string };

export type RestaurantSnapshot = {
  yelpId?: string;
  name: string;
  rating?: number;
  reviewCount?: number;
  priceLevel?: number | null; // 1 to 4
  categories: RestaurantCategory[];
  address?: string;
  latitude?: number;
  longitude?: number;
  distanceMeters?: number;
  isClosed?: boolean;
  matchScore?: number; // set by preference mode
};