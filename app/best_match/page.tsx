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
    matchScore?: number;
};

export default function BestMatchPage() {
    const [matches, setMatches] = useState<Restaurant[]>([]);
    const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
    const [decisionMethod, setDecisionMethod] = useState("");
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const savedMatches = sessionStorage.getItem("where2eat-matches");

        if (savedMatches) {
            try {
                const parsedMatches: Restaurant[] = JSON.parse(savedMatches);

                if (Array.isArray(parsedMatches)) {
                    const rankedMatches = parsedMatches
                        .filter(
                            (restaurant) =>
                                restaurant !== null &&
                                typeof restaurant === "object" &&
                                typeof restaurant.name === "string"
                        )
                        .sort(
                            (a, b) =>
                                (b.matchScore ?? 0) - (a.matchScore ?? 0)
                        )
                        .slice(0, 6);

                    setMatches(rankedMatches);
                }
            } catch {
                setMatches([]);
            }
        }

        setIsLoaded(true);
    }, []);

    const bestRestaurant = matches[0];

    function selectBestMatch() {
        if (!bestRestaurant) {
            return;
        }

        setSelectedRestaurant(bestRestaurant);
        setDecisionMethod("Best Match");
        setShowConfirmation(true);
    }

    function chooseRandomly() {
        if (matches.length === 0) {
            return;
        }

        const randomIndex = Math.floor(Math.random() * matches.length);

        setSelectedRestaurant(matches[randomIndex]);
        setDecisionMethod("Random Selection");
        setShowConfirmation(true);
    }

    function startVoting() {
        if (matches.length === 0) {
            return;
        }

        setSelectedRestaurant(null);
        setDecisionMethod("Group Voting");
        setShowConfirmation(true);
    }

    return (
        <main className="min-h-screen bg-orange-50 px-6 py-10 text-neutral-900">
            <div className="mx-auto max-w-6xl">

                <Link
                    href="/restaurant_search"
                    className="mb-10 inline-block text-sm font-semibold text-orange-700 hover:underline"
                >
                    ← Back to Restaurant Suggestions
                </Link>

                <header className="mb-10">
                    <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-orange-600">
                        Where2Eat / Preference Mode
                    </p>

                    <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
                        Find your best match!
                    </h1>

                    <p className="max-w-3xl text-lg text-neutral-600">
                        Explore the top six restaurants ranked by how closely
                        they match your group's dining preferences.
                    </p>
                </header>

                {!isLoaded ? (
                    <section className="rounded-3xl border border-orange-100 bg-white p-10 text-center shadow-sm">
                        <p className="text-lg text-neutral-600">
                            Loading restaurant matches...
                        </p>
                    </section>
                ) : matches.length === 0 ? (
                    <section className="rounded-3xl border border-orange-100 bg-white p-10 text-center shadow-sm">
                        <h2 className="mb-4 text-2xl font-bold">
                            No Restaurant Matches Available
                        </h2>

                        <p className="mb-7 text-neutral-600">
                            No matching restaurants have been passed from
                            Restaurant Search. Go back and review your results.
                        </p>

                        <Link
                            href="/restaurant_search"
                            className="inline-block rounded-xl bg-orange-600 px-8 py-3 font-bold text-white transition hover:bg-orange-700"
                        >
                            Back to Restaurant Search
                        </Link>
                    </section>
                ) : (
                    <>
                        <section className="mb-10 rounded-3xl border border-orange-200 bg-white p-8 shadow-sm">
                            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <p className="mb-2 text-sm font-bold uppercase tracking-widest text-orange-600">
                                        Top Recommendation
                                    </p>

                                    <h2 className="text-3xl font-bold">
                                        {bestRestaurant.name}
                                    </h2>
                                </div>

                                {bestRestaurant.matchScore !== undefined && (
                                    <div className="rounded-full bg-orange-100 px-5 py-3 text-lg font-bold text-orange-800">
                                        {bestRestaurant.matchScore}% Match
                                    </div>
                                )}
                            </div>

                            <p className="mb-6 text-neutral-600">
                                {bestRestaurant.description}
                            </p>

                            <div className="mb-7 flex flex-wrap gap-3">
                                <span className="rounded-full bg-orange-50 px-4 py-2 text-sm font-medium text-orange-800">
                                    {bestRestaurant.cuisine}
                                </span>

                                <span className="rounded-full bg-orange-50 px-4 py-2 text-sm font-medium text-orange-800">
                                    ${bestRestaurant.price} estimated
                                </span>

                                <span className="rounded-full bg-orange-50 px-4 py-2 text-sm font-medium text-orange-800">
                                    {bestRestaurant.distance} miles away
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={selectBestMatch}
                                className="rounded-xl bg-orange-600 px-7 py-3 font-bold text-white transition hover:bg-orange-700"
                            >
                                Choose Best Match
                            </button>
                        </section>

                        <section className="mb-10">
                            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                                <div>
                                    <h2 className="mb-2 text-2xl font-bold">
                                        Top 6 Restaurant Matches
                                    </h2>

                                    <p className="text-neutral-600">
                                        Compare your group's highest-ranked options.
                                    </p>
                                </div>

                                <span className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-orange-700 shadow-sm">
                                    {matches.length} Restaurants
                                </span>
                            </div>

                            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                                {matches.map((restaurant, index) => (
                                    <article
                                        key={restaurant.id}
                                        className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm"
                                    >
                                        <div className="mb-5 flex items-center justify-between gap-3">
                                            <span className="rounded-full bg-orange-100 px-4 py-2 text-sm font-bold text-orange-800">
                                                Rank #{index + 1}
                                            </span>

                                            {restaurant.matchScore !== undefined && (
                                                <span className="font-bold text-orange-600">
                                                    {restaurant.matchScore}% Match
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="mb-2 text-xl font-bold">
                                            {restaurant.name}
                                        </h3>

                                        <p className="mb-5 min-h-12 text-sm text-neutral-600">
                                            {restaurant.description}
                                        </p>

                                        <div className="mb-5 space-y-2 text-sm text-neutral-700">
                                            <p>
                                                <strong>Cuisine:</strong>{" "}
                                                {restaurant.cuisine}
                                            </p>

                                            <p>
                                                <strong>Estimated price:</strong>{" "}
                                                ${restaurant.price}
                                            </p>

                                            <p>
                                                <strong>Distance:</strong>{" "}
                                                {restaurant.distance} miles
                                            </p>
                                        </div>

                                        {restaurant.matchScore !== undefined && (
                                            <div className="h-2 overflow-hidden rounded-full bg-orange-100">
                                                <div
                                                    className="h-full rounded-full bg-orange-500"
                                                    style={{
                                                        width: `${Math.min(
                                                            100,
                                                            Math.max(0, restaurant.matchScore)
                                                        )}%`
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </article>
                                ))}
                            </div>
                        </section>

                        <section className="rounded-3xl border border-orange-100 bg-white p-8 shadow-sm">
                            <h2 className="mb-3 text-2xl font-bold">
                                How should your group decide?
                            </h2>

                            <p className="mb-7 text-neutral-600">
                                The group host can choose the best-ranked
                                restaurant, start a group vote, or randomly
                                select from the available top matches.
                            </p>

                            <div className="grid gap-4 md:grid-cols-3">
                                <button
                                    type="button"
                                    onClick={selectBestMatch}
                                    className="rounded-xl bg-orange-600 px-6 py-4 font-bold text-white transition hover:bg-orange-700"
                                >
                                    Choose Best Match
                                </button>

                                <button
                                    type="button"
                                    onClick={startVoting}
                                    className="rounded-xl border-2 border-orange-500 bg-white px-6 py-4 font-bold text-orange-700 transition hover:bg-orange-50"
                                >
                                    Start Group Voting
                                </button>

                                <button
                                    type="button"
                                    onClick={chooseRandomly}
                                    className="rounded-xl border-2 border-orange-200 bg-orange-50 px-6 py-4 font-bold text-orange-800 transition hover:bg-orange-100"
                                >
                                    Choose Randomly
                                </button>
                            </div>
                        </section>
                    </>
                )}

                {showConfirmation && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                        <div
                            role="dialog"
                            aria-modal="true"
                            aria-label="Restaurant decision"
                            className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-xl"
                        >
                            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-orange-600">
                                {decisionMethod}
                            </p>

                            {decisionMethod === "Group Voting" ? (
                                <>
                                    <h2 className="mb-4 text-2xl font-bold">
                                        Ready for Group Voting
                                    </h2>

                                    <p className="mb-7 text-neutral-600">
                                        Your restaurant options are ready.
                                        Group voting will be connected when
                                        the voting functionality is available.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <h2 className="mb-4 text-2xl font-bold">
                                        {selectedRestaurant?.name}
                                    </h2>

                                    <p className="mb-7 text-neutral-600">
                                        This restaurant was selected using the{" "}
                                        {decisionMethod.toLowerCase()} option.
                                    </p>
                                </>
                            )}

                            <button
                                type="button"
                                onClick={() => setShowConfirmation(false)}
                                className="rounded-xl bg-orange-600 px-8 py-3 font-bold text-white transition hover:bg-orange-700"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}

                <p className="mt-8 text-center text-sm text-neutral-500">
                    Restaurant rankings currently use the results passed from
                    Restaurant Search. Group matching and voting will be
                    connected to the backend later.
                </p>
            </div>
        </main>
    );
}
