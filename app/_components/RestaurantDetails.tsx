import type { Restaurant } from "../_lib/demoGroup";

// The small detail pills shown under a restaurant's name.
// Details nobody filled in are left out.
export default function RestaurantDetails({ restaurant }: { restaurant: Restaurant }) {
  const details = [
    restaurant.cuisine && `${restaurant.cuisine} cuisine`,
    restaurant.price !== undefined && `~$${restaurant.price} per person`,
    restaurant.distance !== undefined && `📍 ${restaurant.distance} miles away`,
    restaurant.dietary && restaurant.dietary.length > 0 && restaurant.dietary.join(", "),
  ].filter(Boolean);

  if (details.length === 0) {
    return <p className="text-sm text-stone-500">No details given</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {details.map((detail) => (
        <span
          key={String(detail)}
          className="rounded-lg bg-orange-50 px-3 py-1 text-sm text-stone-700"
        >
          {detail}
        </span>
      ))}
    </div>
  );
}
