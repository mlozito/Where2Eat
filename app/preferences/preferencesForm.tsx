"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CUISINE_OPTIONS, DIETARY_OPTIONS } from "@/src/prisma/shared/preferenceSchemas";
import { Loading } from "../_components/shell";
import { withGroup } from "../_lib/groupRoutes";
import { useGroupStage } from "../_lib/useGroupStage";

// yelp's search radius maxes at about 25 miles
// constants for conversion
const METERS_PER_MILE = 1609.34;
const MAX_MILES = 25;

export default function PreferencesForm({ groupId }: { groupId: string }) {
  const router = useRouter();
  const { lobby, error, ready } = useGroupStage(groupId);
  const [saving, setSaving] = useState(false);
  const PRICE_LEVELS = [
  { level: 1, label: "$", hint: "Under $10" },
  { level: 2, label: "$$", hint: "$11 to $30" },
  { level: 3, label: "$$$", hint: "$31 to $60" },
  { level: 4, label: "$$$$", hint: "Over $61" },
  ] as const;
  const [maxPriceLevel, setMaxPriceLevel] = useState<number | null>(null);

  const [maxDistance, setMaxDistance] = useState(15);

  type Cuisine = (typeof CUISINE_OPTIONS)[number];
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const atLimit = cuisines.length >= 5;

  function toggleCuisine(cuisine: Cuisine) {
    setCuisines((current) => {
      if (current.includes(cuisine)) return current.filter((c) => c !== cuisine);
      if (current.length >= 5) return current; // at the limit: ignore
      return [...current, cuisine];
    });
  }

  type DietaryRestriction = (typeof DIETARY_OPTIONS)[number];
  const [dietaryRestrictions, setDietaryRestrictions] =
    useState<DietaryRestriction[]>([]);

  const [message, setMessage] = useState("");

  function toggleDietaryRestriction(restriction: DietaryRestriction) {
    setDietaryRestrictions((current) =>
      current.includes(restriction)
        ? current.filter((item) => item !== restriction)
        : [...current, restriction]
    );
    setMessage("");
  }

  async function savePreferences() {
    setSaving(true);
    setMessage("");

    const body = {
      cuisines,
      dietaryRestrictions,
      maxPriceLevel,
      maxDistanceMeters: Math.min(40000, Math.max(500, Math.round(maxDistance * METERS_PER_MILE))),
    };

    try {
      const response = await fetch(`/api/groups/${groupId}/preferences`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setMessage(data?.error?.message ?? "Couldn't save your preferences. Please try again.");
        setSaving(false);
        return;
      }
      router.push(withGroup("/waiting", groupId));
    } catch {
      setMessage("Couldn't reach the server. Please try again.");
      setSaving(false);
    }
  }

  if (error) return <p className="p-6">{error}</p>;
  if (!lobby || !ready) return <Loading />;

  return (
    <main className="min-h-screen bg-orange-50 px-4 py-10 text-stone-900">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-orange-600">
            Preference mode ·{" "}
            {lobby.decisionType === "BEST_FIT" ? "Best fit" : lobby.decisionType === "RANDOM" ? "Random pick" : "Anonymous vote"}
          </p>

          <h1 className="mt-3 text-4xl font-bold">
            What are you hungry for?
          </h1>

          <p className="mt-3 text-stone-600">
            Set your preferences to help your group find
            the perfect place to eat.
          </p>
        </header>

        <div className="space-y-6">
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-xl font-semibold">
              Budget
            </h2>

            <p className="mb-5 text-sm text-stone-500">
              How much are you willing to spend?
              Prices lower than the selected level will be automatically included.
            </p>

            <div role="group" aria-label="Maximum price" className="grid grid-cols-4 gap-2">
              {PRICE_LEVELS.map(({ level, label, hint }) => {
                const selected = maxPriceLevel === level;
                const included = maxPriceLevel !== null && level < maxPriceLevel;

                return (
                  <button
                    key={level}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      setMaxPriceLevel(selected ? null : level);
                      setMessage("");
                    }}
                    className={`rounded-xl border px-2 py-3 text-center transition ${
                      selected
                        ? "border-orange-500 bg-orange-500 text-white"
                        : included
                          ? "border-orange-300 bg-orange-100 text-orange-800"
                          : "border-stone-300 bg-white hover:bg-orange-50"
                    }`}
                  >
                    <span className="block text-lg font-semibold">{label}</span>
                    <span className="block text-xs">{hint}</span>
                  </button>
                );
              })}
            </div>

            <p className="mt-2 text-sm text-stone-600">
              {maxPriceLevel === null
                ? "No price limit"
                : `Up to ${"$".repeat(maxPriceLevel)}`}
            </p>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-xl font-semibold">
              Distance
            </h2>

            <p className="mb-5 text-sm text-stone-500">
              How far are you willing to travel?
            </p>

            <div className="mb-4 flex justify-between font-semibold text-orange-700">
              <span>{maxDistance} miles</span>
            </div>

            <input
              id="max-distance"
              type="range"
              min="1"
              max={MAX_MILES}
              step="1"
              value={maxDistance}
              onChange={(event) => {
                setMaxDistance(
                  Math.max(
                    Number(event.target.value),
                  )
                );
                setMessage("");
              }}
              className="w-full accent-orange-500"
            />

            <div className="mt-2 flex justify-between text-sm text-stone-500">
              <span>1 mile</span>
              <span>{MAX_MILES} miles</span>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">
              Cuisines
            </h2>

            <p className="mb-5 mt-2 text-sm text-stone-500">
              Select up to 5 cuisines.
              Leave empty if you&apos;re open to anything.
            </p>
            
            <div className="flex flex-wrap gap-2">
              {CUISINE_OPTIONS.map((cuisine) => {
                const selected = cuisines.includes(cuisine);
                const locked = atLimit && !selected;

                return (
                  <button
                    key={cuisine}
                    type="button"
                    onClick={() => toggleCuisine(cuisine)}
                    disabled={locked}
                    aria-pressed={selected}
                    className={`rounded-full border px-4 py-2 text-sm capitalize transition ${
                      selected
                        ? "border-orange-500 bg-orange-500 text-white"
                        : locked
                          ? "cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400"
                          : "border-stone-300 bg-white hover:bg-orange-50"
                    }`}
                  >
                    {cuisine.replace(/_/g, " ")}
                  </button>
                );
              })}
            </div>

            <p aria-live="polite" className="mt-2 min-h-5 text-sm text-stone-500">
              {atLimit ? "You've picked 5. Deselect one to choose another." : ""}
            </p>
                
            {cuisines.length > 0 &&(
              <div className="mt-5 rounded-xl bg-orange-50 p-4">
                <p className="mb-3 text-sm font-semibold">
                  Selected cuisines
                </p>

                <div className="flex flex-wrap gap-2">
                  {cuisines.map((cuisine) => (
                    <button
                      key={cuisine}
                      type="button"
                      onClick={() => toggleCuisine(cuisine)}
                      className="rounded-full bg-white px-3 py-2 text-sm text-orange-800"
                    >
                      {cuisine} ×
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">
              Dietary Restrictions
            </h2>

            <p className="mb-5 mt-2 text-sm text-stone-500">
              Select your dietary restrictions.
              Leave empty if you have none.
            </p>

            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map((restriction) => {
                const selected = dietaryRestrictions.includes(restriction);

                return (
                  <button
                    key={restriction}
                    type="button"
                    onClick={() => toggleDietaryRestriction(restriction)}
                    aria-pressed={selected}
                    className={`rounded-full border px-4 py-2 text-sm capitalize transition ${
                      selected
                        ? "border-orange-500 bg-orange-500 text-white"
                        : "border-stone-300 bg-white hover:bg-orange-50"
                    }`}
                  >
                    {restriction.replace(/_/g, " ")}
                  </button>
                );
              })}
            </div>
                
            {dietaryRestrictions.length > 0 &&(
              <div className="mt-5 rounded-xl bg-orange-50 p-4">
                <p className="mb-3 text-sm font-semibold">
                  Selected dietary restrictions
                </p>

                <div className="flex flex-wrap gap-2">
                  {dietaryRestrictions.map((restriction) => (
                    <button
                      key={restriction}
                      type="button"
                      onClick={() => toggleDietaryRestriction(restriction)}
                      className="rounded-full bg-white px-3 py-2 text-sm text-orange-800"
                    >
                      {restriction} ×
                    </button>
                  ))}
                </div>
              </div>
            )}

           
           
            {/* OLD DIETARY RESTRICTIONS
            <div className="grid gap-3 sm:grid-cols-2">
              {DIETARY_OPTIONS.map((restriction) => (
                <label
                  key={restriction}
                  className="flex items-center gap-3 rounded-lg border border-stone-200 p-3"
                >
                  <input
                    type="checkbox"
                    checked={dietaryRestrictions.includes(
                      restriction
                    )}
                    onChange={() =>
                      toggleDietaryRestriction(restriction)
                    }
                    className="accent-orange-600"
                  />

                  <span>{restriction}</span>
                </label>
              ))}
            </div> */}
          </section>

          <section className="rounded-2xl bg-orange-100 p-6">
            <h2 className="mb-4 text-xl font-semibold">
              Your Preferences
            </h2>

            <div className="space-y-2">
              <p>
                Budget: {maxPriceLevel ? "$".repeat(maxPriceLevel) : "No limit"}
              </p>

              <p>
                Distance: {maxDistance} miles
              </p>

              {/* <p>
                Time: {startTime}–{endTime}
              </p> */}

              <p>
                Cuisines:{" "}
                {cuisines.length > 0
                  ? cuisines.join(", ")
                  : "Any cuisine"}
              </p>

              <p>
                Dietary restrictions:{" "}
                {dietaryRestrictions.length > 0
                  ? dietaryRestrictions.join(", ")
                  : "None"}
              </p>
            </div>
          </section>

          {message && (
            <p
              role="status"
              className="rounded-lg bg-white p-4 text-center text-orange-700"
            >
              {message}
            </p>
          )}

          <button
            type="button"
            onClick={savePreferences}
            disabled={saving}
            className="w-full rounded-full bg-orange-500 px-6 py-4 text-lg font-semibold text-white transition hover:bg-orange-600 disabled:bg-stone-300"
          >
            {saving ? "Saving…" : "Submit Preferences"}
          </button>
        </div>
      </div>
    </main>
  );
}