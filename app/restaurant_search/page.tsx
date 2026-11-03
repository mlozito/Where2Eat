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
    startTime: string;
    endTime: string;
    cuisines: string[];
    dietaryRestrictions: string[];
    otherDietary?: string;
    needsRide: boolean;
};

const sampleRestaurants: Restaurant[] = [
    {
        id: 1,
        name: "Olive Garden",
        cuisine: "Italian",
        price: 22,
        distance: 3.2,
        description: "Italian-inspired pasta, soups, and salads.",
    },
    {
        id: 2,
        name: "Chipotle Mexican Grill",
        cuisine: "Mexican",
        price: 14,
        distance: 2.1,
        description: "Customizable burritos, bowls, and tacos.",
    },
    {
        id: 3,
        name: "Taziki's Mediterranean Cafe",
        cuisine: "Mediterranean",
        price: 18,
        distance: 4.5,
        description: "Mediterranean-inspired meals and fresh sides.",
    },
    {
        id: 4,
        name: "P.F. Chang's",
        cuisine: "Chinese",
        price: 25,
        distance: 5.3,
        description: "Asian-inspired dishes and shareable plates.",
    },
    {
        id: 5,
        name: "Panera Bread",
        cuisine: "American",
        price: 16,
        distance: 2.8,
        description: "Sandwiches, soups, and salads.",
    },
    {
        id: 6,
        name: "Blaze Pizza",
        cuisine: "Italian",
        price: 13,
        distance: 3.7,
        description: "Customizable pizzas with a variety of toppings.",
    },
    {
        id: 7,
        name: "Moe's Southwest Grill",
        cuisine: "Mexican",
        price: 15,
        distance: 4.1,
        description: "Burritos, quesadillas, tacos, and bowls.",
    },
    {
        id: 8,
        name: "Pei Wei Asian Kitchen",
        cuisine: "Chinese",
        price: 17,
        distance: 6.2,
        description: "Asian-inspired rice and noodle dishes.",
    },
];

export default function RestaurantSearchPage() {
    const [preferences, setPreferences] = useState<Preferences | null>(null);
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedPreferences = sessionStorage.getItem(
            "where2eat-preferences"
        );

        if (savedPreferences) {
            try {
                const parsedPreferences: Preferences = JSON.parse(
                    savedPreferences
                );

                setPreferences(parsedPreferences);

                const matchingRestaurants = sampleRestaurants.filter(
                    (restaurant) => {
                        const matchesPrice =
                            restaurant.price >= parsedPreferences.minPrice &&
                            restaurant.price <= parsedPreferences.maxPrice;

                        const matchesDistance =
                            restaurant.distance >= parsedPreferences.minDistance &&
                            restaurant.distance <= parsedPreferences.maxDistance;

                        const matchesCuisine =
                            parsedPreferences.cuisines.length === 0 ||
                            parsedPreferences.cuisines.some(
                                (cuisine) =>
                                    cuisine.toLowerCase() ===
                                    restaurant.cuisine.toLowerCase()
                            );

                        return (
                            matchesPrice &&
                            matchesDistance &&
                            matchesCuisine
                        );
                    }
                );

                setRestaurants(matchingRestaurants);
            } catch {
                setPreferences(null);
                setRestaurants([]);
            }
        }

        setLoading(false);
    }, []);

    if (loading) {
        return (
            <main className="min-h-screen bg-orange-50 px-6 py-12">
                <div className="mx-auto max-w-6xl">
                    <p className="text-lg text-neutral-600">
                        Loading your restaurant suggestions...
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-orange-50 px-6 py-10 text-neutral-900">
            <div className="mx-auto max-w-6xl">

                <Link
                    href="/preferences"
                    className="mb-10 inline-block text-sm font-semibold text-orange-700 hover:underline"
                >
                    ← Back to Preferences
                </Link>

                <header className="mb-10">
                    <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-orange-600">
                        Where2Eat / Preference Mode
                    </p>

                    <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
                        Let's find your next bite!
                    </h1>

                    <p className="max-w-3xl text-lg text-neutral-600">
                        Explore restaurants based on your selected preferences.
                    </p>
                </header>

                {!preferences ? (
                    <section className="rounded-3xl border border-orange-100 bg-white p-8 text-center shadow-sm">
                        <h2 className="mb-4 text-2xl font-bold">
                            No Preferences Set
                        </h2>

                        <p className="mb-6 text-neutral-600">
                            Please select and save your dining preferences
                            before viewing restaurant suggestions.
                        </p>

                        <Link
                            href="/preferences"
                            className="inline-block rounded-xl bg-orange-600 px-7 py-3 font-bold text-white hover:bg-orange-700"
                        >
                            Set Preferences
                        </Link>
                    </section>
                ) : (
                    <>
                        <section className="mb-12 rounded-3xl border border-orange-100 bg-white p-8 shadow-sm">
                            <h2 className="mb-6 text-2xl font-bold">
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

                                {preferences.dietaryRestrictions.length > 0 && (
                                    <span className="rounded-full bg-orange-100 px-4 py-2 text-sm font-medium text-orange-800">
                                        Dietary: {preferences.dietaryRestrictions.join(", ")}
                                        {preferences.otherDietary
                                            ? ` (${preferences.otherDietary})`
                                            : ""}
                                    </span>
                                )}

                                {preferences.needsRide && (
                                    <span className="rounded-full bg-orange-100 px-4 py-2 text-sm font-medium text-orange-800">
                                        Ride Needed
                                    </span>
                                )}
                            </div>
                        </section>

                        <section className="mb-10">
                            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <h2 className="mb-2 text-2xl font-bold">
                                        Restaurant Suggestions
                                    </h2>

                                    <p className="text-neutral-600">
                                        Sample restaurants matching your budget,
                                        distance, and cuisine.
                                    </p>
                                </div>

                                <span className="rounded-full bg-white px-5 py-3 text-sm font-bold text-orange-700 shadow-sm">
                                    {restaurants.length} results
                                </span>
                            </div>

                            {restaurants.length === 0 ? (
                                <div className="rounded-3xl border border-orange-100 bg-white p-10 text-center shadow-sm">
                                    <h3 className="mb-4 text-2xl font-bold">
                                        No matching restaurants found
                                    </h3>

                                    <p className="mb-7 text-neutral-600">
                                        Try adjusting your budget, distance,
                                        or cuisine selections.
                                    </p>

                                    <Link
                                        href="/preferences"
                                        className="inline-block rounded-xl bg-orange-600 px-7 py-3 font-bold text-white hover:bg-orange-700"
                                    >
                                        Edit Preferences
                                    </Link>
                                </div>
                            ) : (
                                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                                    {restaurants.map((restaurant) => (
                                        <article
                                            key={restaurant.id}
                                            className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm"
                                        >
                                            <div className="mb-4">
                                                <span className="rounded-full bg-orange-100 px-4 py-2 text-xs font-bold text-orange-800">
                                                    {restaurant.cuisine}
                                                </span>
                                            </div>

                                            <h3 className="mb-3 text-xl font-bold">
                                                {restaurant.name}
                                            </h3>

                                            <p className="mb-6 min-h-12 text-sm text-neutral-600">
                                                {restaurant.description}
                                            </p>

                                            <div className="flex flex-wrap gap-3 text-sm text-neutral-700">
                                                <span className="rounded-lg bg-orange-50 px-3 py-2">
                                                    ${restaurant.price} estimated
                                                </span>

                                                <span className="rounded-lg bg-orange-50 px-3 py-2">
                                                    {restaurant.distance} miles away
                                                </span>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className="rounded-3xl border border-orange-100 bg-white p-8 text-center shadow-sm">
                            <h2 className="mb-3 text-2xl font-bold">
                                Ready to see your best matches?
                            </h2>

                            <p className="mb-7 text-neutral-600">
                                Continue to see the top six restaurant rankings
                                and explore your group's decision options.
                            </p>

                            <button
                              type="button"
                              onClick={() => {
                                  sessionStorage.setItem(
                                      "where2eat-matches",
                                      JSON.stringify(restaurants)
                                  );

                                  window.location.href = "/best_match";
                              }}
                              disabled={restaurants.length === 0}
                              className="inline-block rounded-xl bg-orange-600 px-8 py-4 text-lg font-bold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
                          >
                              Continue to Best Match →
                          </button>
                          
                        </section>

                        <p className="mt-7 text-center text-sm text-neutral-500">
                            Restaurant suggestions currently use sample data.
                            Group preferences and live restaurant matching
                            will be connected later.
                        </p>
                    </>
                )}
            </div>
        </main>
    );
}
