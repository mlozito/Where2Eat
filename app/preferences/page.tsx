"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const popularCuisines = [
  "Italian",
  "Indian",
  "Mexican",
  "Japanese",
  "Chinese",
  "Thai",
  "American",
  "Mediterranean",
  "Korean",
  "Greek",
  "Vietnamese",
  "Middle Eastern",
];

const dietaryOptions = [
  "Vegetarian",
  "Vegan",
  "Halal",
  "Kosher",
  "Gluten-Free",
  "Dairy-Free",
  "Nut Allergy",
  "Shellfish Allergy",
  "Other",
];

export default function PreferencesPage() {
  const router = useRouter();
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(50);

  const [minDistance, setMinDistance] = useState(0);
  const [maxDistance, setMaxDistance] = useState(15);

  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("21:00");

  const [cuisines, setCuisines] = useState<string[]>([]);
  const [customCuisine, setCustomCuisine] = useState("");

  const [dietaryRestrictions, setDietaryRestrictions] =
    useState<string[]>([]);
  const [otherDietary, setOtherDietary] = useState("");

  const [needsRide, setNeedsRide] = useState(false);
  const [message, setMessage] = useState("");

  function toggleCuisine(cuisine: string) {
    setCuisines((current) =>
      current.includes(cuisine)
        ? current.filter((item) => item !== cuisine)
        : [...current, cuisine]
    );
    setMessage("");
  }

  function addCuisine() {
    const cuisine = customCuisine.trim();

    if (
      cuisine &&
      !cuisines.some(
        (item) => item.toLowerCase() === cuisine.toLowerCase()
      )
    ) {
      setCuisines((current) => [...current, cuisine]);
    }

    setCustomCuisine("");
    setMessage("");
  }

  function toggleDietaryRestriction(restriction: string) {
    setDietaryRestrictions((current) =>
      current.includes(restriction)
        ? current.filter((item) => item !== restriction)
        : [...current, restriction]
    );
    setMessage("");
  }

  function savePreferences() {
    if (startTime >= endTime) {
      setMessage(
        "Please select an end time after your start time."
      );
      return;
    }

    if (
      dietaryRestrictions.includes("Other") &&
      !otherDietary.trim()
    ) {
      setMessage(
        "Please specify your dietary restriction under Other."
      );
      return;
    }

    const preferences = {
      minPrice,
      maxPrice,
      minDistance,
      maxDistance,
      startTime,
      endTime,
      cuisines,
      dietaryRestrictions,
      otherDietary: dietaryRestrictions.includes("Other")
        ? otherDietary.trim()
        : "",
      needsRide,
    };

    sessionStorage.setItem(
      "where2eat-preferences",
      JSON.stringify(preferences)
    );

    setMessage("Preferences saved successfully!");
    router.push("/suggest");
  }

  return (
    <main className="min-h-screen bg-orange-50 px-4 py-10 text-stone-900">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-orange-600">
            Where2Eat / Preference Mode
          </p>

          <h1 className="mt-3 text-4xl font-bold">
            What&apos;s your food mood?
          </h1>

          <p className="mt-3 text-stone-600">
            Set your preferences to help your group find
            the perfect place to eat.
          </p>
        </header>

        <div className="space-y-6">
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-xl font-semibold">
              Your Budget
            </h2>

            <p className="mb-5 text-sm text-stone-500">
              Estimated price per person
            </p>

            <div className="mb-4 flex justify-between font-semibold text-orange-700">
              <span>Minimum: ${minPrice}</span>
              <span>Maximum: ${maxPrice}</span>
            </div>

            <label
              htmlFor="min-price"
              className="mb-2 block text-sm"
            >
              Minimum price
            </label>

            <input
              id="min-price"
              type="range"
              min="0"
              max="100"
              step="5"
              value={minPrice}
              onChange={(event) => {
                setMinPrice(
                  Math.min(
                    Number(event.target.value),
                    maxPrice
                  )
                );
                setMessage("");
              }}
              className="mb-5 w-full accent-orange-600"
            />

            <label
              htmlFor="max-price"
              className="mb-2 block text-sm"
            >
              Maximum price
            </label>

            <input
              id="max-price"
              type="range"
              min="0"
              max="100"
              step="5"
              value={maxPrice}
              onChange={(event) => {
                setMaxPrice(
                  Math.max(
                    Number(event.target.value),
                    minPrice
                  )
                );
                setMessage("");
              }}
              className="w-full accent-orange-600"
            />

            <div className="mt-2 flex justify-between text-sm text-stone-500">
              <span>$0</span>
              <span>$100</span>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-xl font-semibold">
              How far are you willing to go?
            </h2>

            <p className="mb-5 text-sm text-stone-500">
              Choose your preferred distance range.
            </p>

            <div className="mb-4 flex justify-between font-semibold text-orange-700">
              <span>Minimum: {minDistance} miles</span>
              <span>Maximum: {maxDistance} miles</span>
            </div>

            <label
              htmlFor="min-distance"
              className="mb-2 block text-sm"
            >
              Minimum distance
            </label>

            <input
              id="min-distance"
              type="range"
              min="0"
              max="50"
              step="1"
              value={minDistance}
              onChange={(event) => {
                setMinDistance(
                  Math.min(
                    Number(event.target.value),
                    maxDistance
                  )
                );
                setMessage("");
              }}
              className="mb-5 w-full accent-orange-600"
            />

            <label
              htmlFor="max-distance"
              className="mb-2 block text-sm"
            >
              Maximum distance
            </label>

            <input
              id="max-distance"
              type="range"
              min="0"
              max="50"
              step="1"
              value={maxDistance}
              onChange={(event) => {
                setMaxDistance(
                  Math.max(
                    Number(event.target.value),
                    minDistance
                  )
                );
                setMessage("");
              }}
              className="w-full accent-orange-600"
            />

            <div className="mt-2 flex justify-between text-sm text-stone-500">
              <span>0 miles</span>
              <span>50 miles</span>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">
              When are we eating?
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm">
                  Earliest time
                </span>

                <input
                  type="time"
                  value={startTime}
                  onChange={(event) => {
                    setStartTime(event.target.value);
                    setMessage("");
                  }}
                  className="w-full rounded-lg border border-stone-300 p-3"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm">
                  Latest time
                </span>

                <input
                  type="time"
                  value={endTime}
                  onChange={(event) => {
                    setEndTime(event.target.value);
                    setMessage("");
                  }}
                  className="w-full rounded-lg border border-stone-300 p-3"
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">
              What sounds good?
            </h2>

            <p className="mb-5 mt-2 text-sm text-stone-500">
              Select cuisines or add your own.
              Leave empty if you&apos;re open to anything.
            </p>

            <div className="flex flex-wrap gap-2">
              {popularCuisines.map((cuisine) => (
                <button
                  key={cuisine}
                  type="button"
                  onClick={() => toggleCuisine(cuisine)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    cuisines.includes(cuisine)
                      ? "border-orange-600 bg-orange-600 text-white"
                      : "border-stone-300 bg-white hover:bg-orange-50"
                  }`}
                >
                  {cuisine}
                </button>
              ))}
            </div>

            <div className="mt-6 flex gap-2">
              <input
                type="text"
                value={customCuisine}
                onChange={(event) =>
                  setCustomCuisine(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addCuisine();
                  }
                }}
                placeholder="Add another cuisine..."
                className="min-w-0 flex-1 rounded-lg border border-stone-300 p-3"
              />

              <button
                type="button"
                onClick={addCuisine}
                className="rounded-lg bg-orange-600 px-5 text-white hover:bg-orange-700"
              >
                Add
              </button>
            </div>

            {cuisines.length > 0 && (
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

            <div className="grid gap-3 sm:grid-cols-2">
              {dietaryOptions.map((restriction) => (
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
            </div>

            {dietaryRestrictions.includes("Other") && (
              <div className="mt-5">
                <label
                  htmlFor="other-dietary"
                  className="mb-2 block text-sm font-medium"
                >
                  Please specify your dietary restriction
                </label>

                <input
                  id="other-dietary"
                  type="text"
                  value={otherDietary}
                  onChange={(event) => {
                    setOtherDietary(event.target.value);
                    setMessage("");
                  }}
                  placeholder="e.g. Soy allergy, Jain diet, low sodium..."
                  className="w-full rounded-lg border border-stone-300 p-3 focus:border-orange-500 focus:outline-none"
                />
              </div>
            )}
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={needsRide}
                onChange={(event) => {
                  setNeedsRide(event.target.checked);
                  setMessage("");
                }}
                className="h-5 w-5 accent-orange-600"
              />

              <span className="font-medium">
                I&apos;ll need a ride
              </span>
            </label>
          </section>

          <section className="rounded-2xl bg-orange-100 p-6">
            <h2 className="mb-4 text-xl font-semibold">
              Your Preferences
            </h2>

            <div className="space-y-2">
              <p>
                Budget: ${minPrice}–${maxPrice} per person
              </p>

              <p>
                Distance: {minDistance}–{maxDistance} miles
              </p>

              <p>
                Time: {startTime}–{endTime}
              </p>

              <p>
                Cuisines:{" "}
                {cuisines.length > 0
                  ? cuisines.join(", ")
                  : "Any cuisine"}
              </p>

              <p>
                Dietary restrictions:{" "}
                {dietaryRestrictions.length > 0
                  ? dietaryRestrictions
                      .map((restriction) =>
                        restriction === "Other" &&
                        otherDietary.trim()
                          ? `Other: ${otherDietary.trim()}`
                          : restriction
                      )
                      .join(", ")
                  : "None selected"}
              </p>

              <p>
                Transportation:{" "}
                {needsRide
                  ? "Ride needed"
                  : "No ride needed"}
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
            className="w-full rounded-xl bg-orange-600 px-6 py-4 text-lg font-semibold text-white transition hover:bg-orange-700"
          >
            Save Preferences →
          </button>
        </div>
      </div>
    </main>
  );
}
