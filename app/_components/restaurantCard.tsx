import type { RestaurantSnapshot } from "@/src/prisma/shared/restaurant";

// choice mode: each user suggests a restaurant as a candidate
  // users input name and address (opt)
// candidate is stored as a json snapshot

// preference mode: each user enters preferences that correspond with the yelp api

export type Snapshot = Partial<RestaurantSnapshot> & { name?: string; address?: string | null };

export function asSnapshot(value: unknown): Snapshot {
  return value && typeof value === "object" ? (value as Snapshot) : {};
}

const METERS_PER_MILE = 1609.34;

export function restaurantDetails(s: Snapshot): string[] {
  return [
    s.categories?.length ? s.categories.map((c) => c.title).join(", ") : null,
    s.priceLevel ? "$".repeat(s.priceLevel) : null,
    s.rating ? `★ ${s.rating}${s.reviewCount ? ` (${s.reviewCount})` : ""}` : null,
    s.distanceMeters ? `${(s.distanceMeters / METERS_PER_MILE).toFixed(1)} mi` : null,
  ].filter((d): d is string => !!d);
}

export function mapsUrl(s: Snapshot) {
  const query = [s.name, s.address].filter(Boolean).join(" ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export default function RestaurantCard({ snapshot }: { snapshot: Snapshot }) {
  const details = restaurantDetails(snapshot);
  return (
    <div>
      <p className="text-lg font-semibold">{snapshot.name ?? "Unnamed restaurant"}</p>
      {snapshot.address && <p className="text-sm text-stone-500">{snapshot.address}</p>}
      {details.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {details.map((d) => (
            <span key={d} className="rounded-lg bg-orange-50 px-3 py-1 text-sm text-stone-700">{d}</span>
          ))}
        </div>
      )}
    </div>
  );
}