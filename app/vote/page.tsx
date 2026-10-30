"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import RestaurantDetails from "../_components/RestaurantDetails";
import { activeMembers, findRestaurant, fitCount, useDemoGroup } from "../_lib/demoGroup";

export default function VotePage() {
  const router = useRouter();
  const { group, loaded, update } = useDemoGroup();
  const [choice, setChoice] = useState<string | null>(null);

  if (!loaded) {
    return (
      <main className="min-h-screen bg-orange-50 px-4 py-10 text-stone-900">
        <p className="text-center text-lg font-medium">Loading...</p>
      </main>
    );
  }

  if (!group || group.stage !== "voting") {
    return (
      <main className="min-h-screen bg-orange-50 px-4 py-10 text-stone-900">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-10 text-center shadow-sm">
          <h1 className="mb-3 text-2xl font-semibold">Voting isn&apos;t open</h1>
          <p className="mb-6 text-stone-600">The host hasn&apos;t started a vote.</p>
          <Link
            href={group ? "/waiting" : "/preferences"}
            className="inline-block rounded-xl bg-orange-600 px-6 py-3 font-semibold text-white hover:bg-orange-700"
          >
            {group ? "Back to the waiting room" : "Set Preferences"}
          </Link>
        </div>
      </main>
    );
  }

  const me = group.members.find((member) => member.id === group.meId)!;
  const selected = choice ?? me.vote;
  const groupSize = activeMembers(group).length;

  function submitVote() {
    if (!selected) return;
    update((current) => ({
      ...current,
      members: current.members.map((member) =>
        member.id === current.meId ? { ...member, vote: selected } : member,
      ),
    }));
    router.push("/waiting");
  }

  return (
    <main className="min-h-screen bg-orange-50 px-4 py-10 text-stone-900">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-orange-600">
            Where2Eat / Vote
          </p>
          <h1 className="mt-3 text-4xl font-bold">Cast your vote</h1>
          <p className="mt-3 text-stone-600">{group.optionsNote}</p>
        </header>

        <fieldset className="space-y-3">
          <legend className="sr-only">Restaurants</legend>
          {group.options.map((id) => {
            const restaurant = findRestaurant(group, id)!;
            const fits = fitCount(group, restaurant);
            return (
              <label
                key={id}
                className={`flex cursor-pointer gap-4 rounded-2xl border-2 bg-white p-5 shadow-sm transition ${
                  selected === id ? "border-orange-600" : "border-transparent hover:border-orange-200"
                }`}
              >
                <input
                  type="radio"
                  name="vote"
                  value={id}
                  checked={selected === id}
                  onChange={() => setChoice(id)}
                  className="mt-1 h-5 w-5 accent-orange-600"
                />
                <span className="flex-1">
                  <span className="mb-1 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xl font-bold">{restaurant.name}</span>
                    <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-800">
                      {fits === groupSize ? "Fits everyone" : `Fits ${fits} of ${groupSize}`}
                    </span>
                  </span>
                  <RestaurantDetails restaurant={restaurant} />
                </span>
              </label>
            );
          })}
        </fieldset>

        <button
          type="button"
          disabled={!selected}
          onClick={submitVote}
          className="mt-6 w-full rounded-xl bg-orange-600 px-6 py-4 text-lg font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-stone-300"
        >
          Submit Vote →
        </button>
      </div>
    </main>
  );
}
