"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Restaurant = {
  id: number;
  name: string;
  cuisine: string;
  price: number;
  distance: number;
  description: string;
};

type Preferences = {
  minPrice: number;
  maxPrice: number;
  minDistance: number;
  maxDistance: number;
  cuisines: string[];
  dietaryRestrictions: string[];
  startTime: string;
  endTime: string;
  needsRide: boolean;
};

const sampleRestaurants: Restaurant[] = [
  {
    id: 1,
    name: "Restaurant A",
    cuisine: "Indian",
    price: 20,
    distance: 2.4,
    description: "A variety of traditional Indian dishes.",
  },
  {
    id: 2,
    name: "Restaurant B",
    cuisine: "Mexican",
    price: 15,
    distance: 4.1,
    description: "Mexican favorites and casual dining.",
  },
  {
    id: 3,
    name: "Restaurant C",
    cuisine: "Italian",
    price: 25,
    distance: 5.2,
    description: "Pasta, pizza, and classic Italian dishes.",
  },
  {
    id: 4,
    name: "Restaurant D",
    cuisine: "Japanese",
    price: 30,
    distance: 6.3,
    description: "Japanese-inspired dishes and specialties.",
  },
];

export default function RestaurantSearchPage() {
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("where2eat-preferences");

      if (saved) {
        setPreferences(JSON.parse(saved));
      }
    } catch {
      setError("We couldn't load your preferences. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const matchingRestaurants = sampleRestaurants.filter((restaurant) => {
    if (!preferences) return false;

    const matchesPrice =
      restaurant.price >= preferences.minPrice &&
      restaurant.price <= preferences.maxPrice;

    const matchesDistance =
      restaurant.distance >= preferences.minDistance &&
      restaurant.distance <= preferences.maxDistance;

    const matchesCuisine =
      preferences.cuisines.length === 0 ||
      preferences.cuisines.some(
        (cuisine) =>
          cuisine.toLowerCase() === restaurant.cuisine.toLowerCase()
      );

    return matchesPrice && matchesDistance && matchesCuisine;
  });

  return (
    <main className="min-h-screen bg-orange-50 px-6 py-12 text-neutral-900">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/preferences"
          className="mb-8 inline-flex items-center gap-2 font-medium text-orange-700 transition hover:text-orange-900"
        >
          <span aria-hidden="true">←</span>
          Back to Preferences
        </Link>

        <header className="mb-10">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-orange-600">
            WHERE2EAT / PREFERENCE MODE
          </p>

          <h1 className="mb-3 text-4xl font-bold tracking-tight">
            Let&apos;s find your next bite!
          </h1>

          <p className="text-lg text-neutral-600">
            Explore restaurants based on your selected preferences.
          </p>
        </header>

        {loading ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-lg font-medium">
              Loading your preferences...
            </p>
          </div>
        ) : error ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-white p-10 text-center"
          >
            <h2 className="mb-3 text-xl font-semibold">
              Something went wrong
            </h2>
            <p className="text-neutral-600">{error}</p>
          </div>
        ) : !preferences ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <h2 className="mb-3 text-2xl font-semibold">
              No preferences saved yet
            </h2>
            <p className="mb-6 text-neutral-600">
              Complete the Preferences page to see restaurant suggestions.
            </p>
            <Link
              href="/preferences"
              className="inline-block rounded-xl bg-orange-600 px-6 py-3 font-semibold text-white hover:bg-orange-700"
            >
              Set Preferences
            </Link>
          </div>
        ) : (
          <>
            <section className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold">
                Your Preferences
              </h2>

              <div className="flex flex-wrap gap-3">
                <span className="rounded-full bg-orange-100 px-4 py-2 text-sm font-medium text-orange-800">
                  Budget: ${preferences.minPrice}–${preferences.maxPrice}
                </span>

                <span className="rounded-full bg-orange-100 px-4 py-2 text-sm font-medium text-orange-800">
                  Distance: {preferences.minDistance}–{preferences.maxDistance} miles
                </span>

                <span className="rounded-full bg-orange-100 px-4 py-2 text-sm font-medium text-orange-800">
                  Cuisine: {preferences.cuisines.length > 0
                    ? preferences.cuisines.join(", ")
                    : "Any"}
                </span>

                <span className="rounded-full bg-orange-100 px-4 py-2 text-sm font-medium text-orange-800">
                  Time: {preferences.startTime}–{preferences.endTime}
                </span>
              </div>
            </section>

            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold">
                  Restaurant Suggestions
                </h2>
                <p className="mt-1 text-neutral-600">
                  Sample restaurants matching your budget, distance, and cuisine.
                </p>
              </div>

              <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-orange-700 shadow-sm">
                {matchingRestaurants.length} results
              </span>
            </div>

            {matchingRestaurants.length === 0 ? (
              <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
                <h3 className="mb-3 text-xl font-bold">
                  No matching restaurants found
                </h3>

                <p className="mb-6 text-neutral-600">
                  Try adjusting your budget, distance, or cuisine selections.
                </p>

                <Link
                  href="/preferences"
                  className="inline-block rounded-xl bg-orange-600 px-6 py-3 font-semibold text-white hover:bg-orange-700"
                >
                  Edit Preferences
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {matchingRestaurants.map((restaurant) => (
                  <article
                    key={restaurant.id}
                    className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm transition hover:shadow-md"
                  >
                    <div className="mb-5 flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-2xl font-bold">
                          {restaurant.name}
                        </h3>
                        <p className="mt-1 font-medium text-orange-700">
                          {restaurant.cuisine} Cuisine
                        </p>
                      </div>

                      <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-800">
                        ${restaurant.price}
                      </span>
                    </div>

                    <p className="mb-5 text-neutral-600">
                      {restaurant.description}
                    </p>

                    <div className="mb-6 flex flex-wrap gap-3">
                      <span className="rounded-lg bg-orange-50 px-3 py-2 text-sm text-neutral-700">
                        📍 {restaurant.distance} miles away
                      </span>

                      <span className="rounded-lg bg-orange-50 px-3 py-2 text-sm text-neutral-700">
                        Estimated ${restaurant.price} per person
                      </span>
                    </div>

                    <div className="rounded-xl bg-orange-50 px-4 py-3 text-center text-sm font-medium text-orange-800">
                      Restaurant details coming soon
                    </div>
                  </article>
                ))}
              </div>
            )}

            <p className="mt-8 text-center text-sm text-neutral-500">
              These are sample restaurants for testing the interface.
              Live restaurant search and group matching will be added during integration.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
