import type { RestaurantSnapshot } from "../../shared/restaurant";
import { ExternalServiceError } from "../../lib/errors";

const SEARCH_URL = "https://api.yelp.com/v3/businesses/search";

// The parts of Yelp's response we use.
type YelpBusiness = {
  id: string;
  name: string;
  rating?: number;
  review_count?: number;
  price?: string; // "$", "$$", ...
  categories?: { alias: string; title: string }[];
  location?: { display_address?: string[] };
  coordinates?: { latitude?: number; longitude?: number };
  distance?: number;
  is_closed?: boolean;
};

export type YelpSearch = {
  location: string;
  categories: string[];
  radiusMeters: number;
  limit?: number;
};

export async function searchRestaurants(search: YelpSearch): Promise<RestaurantSnapshot[]> {
  const apiKey = process.env.YELP_API_KEY;
  if (!apiKey) throw new ExternalServiceError("Yelp is not configured on the server");

  const params = new URLSearchParams({
    location: search.location,
    categories: search.categories.join(","), // Yelp treats this as "any of these"
    radius: String(Math.min(Math.round(search.radiusMeters), 40000)), // 40,000 m is Yelp's documented max
    limit: String(search.limit ?? 50), // 50 is Yelp's per-request max
    sort_by: "best_match",
  });

  let response: Response;
  try {
    response = await fetch(`${SEARCH_URL}?${params}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
  } catch {
    throw new ExternalServiceError("Could not reach Yelp. Try again.");
  }

  if (!response.ok) {
    console.error("Yelp error:", response.status, await response.text());
    throw new ExternalServiceError(`Yelp returned an error (${response.status})`);
  }

  const data = (await response.json()) as { businesses?: YelpBusiness[] };
  return (data.businesses ?? []).map(toSnapshot);
}

function toSnapshot(b: YelpBusiness): RestaurantSnapshot {
  return {
    yelpId: b.id,
    name: b.name,
    rating: b.rating,
    reviewCount: b.review_count,
    priceLevel: b.price ? b.price.length : null,
    categories: (b.categories ?? []).map((c) => ({ alias: c.alias, title: c.title })),
    address: b.location?.display_address?.join(", "),
    latitude: b.coordinates?.latitude,
    longitude: b.coordinates?.longitude,
    distanceMeters: b.distance,
    isClosed: b.is_closed,
  };
}