"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createGroup,
  dietaryOptions,
  popularCuisines,
  type Restaurant,
  useDemoGroup,
  useMyPreferences,
} from "../_lib/demoGroup";

// A few ready-made ideas, so you can choose one instead of typing.
const quickPicks: Omit<Restaurant, "id">[] = [
  {
    name: "Golden Curry House",
    cuisine: "Indian",
    price: 20,
    distance: 2.4,
    dietary: ["Vegetarian", "Vegan", "Halal"],
  },
  { name: "Pho Saigon", cuisine: "Vietnamese", price: 14, distance: 4.1 },
  {
    name: "Bella Napoli",
    cuisine: "Italian",
    price: 25,
    distance: 5.2,
    dietary: ["Vegetarian", "Gluten-Free"],
  },
];

// Number inputs come back as strings; blank means "not filled in".
function optionalNumber(value: string) {
  return value.trim() === "" ? undefined : Number(value);
}

export default function SuggestPage() {
  const router = useRouter();
  const { replace } = useDemoGroup();
  const { preferences, loaded } = useMyPreferences();

  const [name, setName] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [price, setPrice] = useState("");
  const [distance, setDistance] = useState("");
  const [dietary, setDietary] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  function choosePick(pick: Omit<Restaurant, "id">) {
    setName(pick.name);
    setCuisine(pick.cuisine ?? "");
    setPrice(pick.price?.toString() ?? "");
    setDistance(pick.distance?.toString() ?? "");
    setDietary(pick.dietary ?? []);
    setMessage("");
  }

  function toggleDietary(option: string) {
    setDietary((current) =>
      current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option],
    );
  }

  function submit() {
    if (!preferences) return;

    if (!name.trim()) {
      setMessage("Please enter the restaurant's name.");
      return;
    }

    const priceValue = optionalNumber(price);
    const distanceValue = optionalNumber(distance);
    if ((priceValue ?? 0) < 0 || (distanceValue ?? 0) < 0) {
      setMessage("Price and distance can't be negative.");
      return;
    }

    const restaurant: Restaurant = {
      id: "my-pick",
      name: name.trim(),
      cuisine: cuisine.trim() || undefined,
      price: priceValue,
      distance: distanceValue,
      dietary: dietary.length > 0 ? dietary : undefined,
    };

    // Each submit starts a fresh demo group with you as the host.
    replace(createGroup(preferences, restaurant));
    router.push("/waiting");
  }

  if (!loaded) {
    return (
      <main className="min-h-screen bg-orange-50 px-4 py-10 text-stone-900">
        <p className="text-center text-lg font-medium">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-orange-50 px-4 py-10 text-stone-900">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/preferences"
          className="mb-8 inline-flex items-center gap-2 font-medium text-orange-700 transition hover:text-orange-900"
        >
          <span aria-hidden="true">←</span>
          Back to Preferences
        </Link>

        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-orange-600">
            Where2Eat / Suggest a restaurant
          </p>
          <h1 className="mt-3 text-4xl font-bold">Where do you want to go?</h1>
          <p className="mt-3 text-stone-600">
            Pick an idea below or type in your own. Only the name is required.
            Anything you leave blank is skipped when we check everyone&apos;s
            preferences.
          </p>
        </header>

        {!preferences ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <h2 className="mb-3 text-2xl font-semibold">Set your preferences first</h2>
            <p className="mb-6 text-stone-600">
              We use them to find restaurants that work for the whole group.
            </p>
            <Link
              href="/preferences"
              className="inline-block rounded-xl bg-orange-600 px-6 py-3 font-semibold text-white hover:bg-orange-700"
            >
              Set Preferences
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold">Need an idea?</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {quickPicks.map((pick) => (
                  <button
                    key={pick.name}
                    type="button"
                    onClick={() => choosePick(pick)}
                    className={`rounded-xl border p-4 text-left transition ${
                      name === pick.name
                        ? "border-orange-600 bg-orange-50"
                        : "border-stone-200 hover:bg-orange-50"
                    }`}
                  >
                    <span className="block font-semibold">{pick.name}</span>
                    <span className="mt-1 block text-sm text-stone-500">
                      {pick.cuisine} · ${pick.price} · {pick.distance} mi
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-5 rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold">Your suggestion</h2>

              <label className="block">
                <span className="mb-2 block text-sm font-medium">
                  Restaurant name <span className="text-orange-600">*</span>
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setMessage("");
                  }}
                  placeholder="e.g. Joe's Pizza"
                  className="w-full rounded-lg border border-stone-300 p-3"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block">
                  <span className="mb-2 block text-sm">Cuisine</span>
                  <input
                    type="text"
                    list="cuisine-options"
                    value={cuisine}
                    onChange={(event) => setCuisine(event.target.value)}
                    placeholder="Optional"
                    className="w-full rounded-lg border border-stone-300 p-3"
                  />
                  <datalist id="cuisine-options">
                    {popularCuisines.map((option) => (
                      <option key={option} value={option} />
                    ))}
                  </datalist>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm">Price per person ($)</span>
                  <input
                    type="number"
                    min="0"
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                    placeholder="Optional"
                    className="w-full rounded-lg border border-stone-300 p-3"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm">Distance (miles)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={distance}
                    onChange={(event) => setDistance(event.target.value)}
                    placeholder="Optional"
                    className="w-full rounded-lg border border-stone-300 p-3"
                  />
                </label>
              </div>

              <div>
                <p className="mb-1 text-sm font-medium">Dietary needs it can handle</p>
                <p className="mb-3 text-sm text-stone-500">
                  Leave these blank if you&apos;re not sure.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {dietaryOptions.map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-3 rounded-lg border border-stone-200 p-3"
                    >
                      <input
                        type="checkbox"
                        checked={dietary.includes(option)}
                        onChange={() => toggleDietary(option)}
                        className="accent-orange-600"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
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
              onClick={submit}
              className="w-full rounded-xl bg-orange-600 px-6 py-4 text-lg font-semibold text-white transition hover:bg-orange-700"
            >
              Submit Suggestion →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
